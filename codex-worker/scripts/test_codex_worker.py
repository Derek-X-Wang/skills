#!/usr/bin/env python3
"""Offline tests: python3 -m unittest discover -s codex-worker/scripts -p 'test_*.py'."""
import importlib.machinery
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import signal
import time
import sys
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
SCRIPT = HERE / 'codex-worker'
loader = importlib.machinery.SourceFileLoader('codex_worker', str(SCRIPT))
spec = importlib.util.spec_from_loader('codex_worker', loader)
WORKER = importlib.util.module_from_spec(spec)
loader.exec_module(WORKER)
FAKE_CODEX = '''#!/usr/bin/env python3
import json, os, pathlib, sys
root = pathlib.Path(os.environ['FAKE_CODEX_DIR'])
record = {'argv': sys.argv[1:], 'cwd': os.getcwd(), 'stdin': sys.stdin.read(),
          'env': {key: os.environ.get(key) for key in ('GOCACHE', 'GOTMPDIR', 'GOLANGCI_LINT_CACHE')}}
with (root / 'calls').open('a') as f:
    f.write(json.dumps(record) + '\\n')
print('invalid json line', flush=True)
print(json.dumps({'type': 'thread.started', 'thread_id': 'thread-test'}), flush=True)
print(json.dumps({'type': 'thread.started', 'thread_id': 'ignore-second'}), flush=True)
print('diagnostic', file=sys.stderr)
if os.environ.get('FAKE_CODEX_HOLD'):
    import time
    while True:
        time.sleep(0.05)
pathlib.Path(sys.argv[sys.argv.index('-o') + 1]).write_text('worker result')
sys.exit(int(os.environ.get('FAKE_CODEX_EXIT', '0')))
'''
FAKE_PS = '''#!/usr/bin/env python3
import json, os, pathlib, sys
root = pathlib.Path(os.environ['FAKE_CODEX_DIR'])
with (root / 'ps-calls').open('a') as f:
    f.write(json.dumps(sys.argv[1:]) + '\\n')
if os.environ.get('FAKE_PS_FAIL'):
    print('ps blocked', file=sys.stderr)
    sys.exit(1)
print(os.environ.get('FAKE_PS_COMMAND' if '-p' in sys.argv else 'FAKE_PS_OUTPUT', ''))
'''


class WorkerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.state = self.root / 'state'
        self.state.mkdir()
        self.tree = self.root / 'tree'
        self.tree.mkdir()
        self.home = self.root / 'codex-home'
        self.home.mkdir()
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        for name, contents in [('codex', FAKE_CODEX), ('ps', FAKE_PS)]:
            binary = self.bin / name
            binary.write_text(contents)
            binary.chmod(0o755)
        self.environment = os.environ.copy()
        for key in ('GOCACHE', 'GOTMPDIR', 'GOLANGCI_LINT_CACHE'):
            self.environment.pop(key, None)
        self.environment.update({'PATH': str(self.bin) + os.pathsep + os.environ['PATH'],
                                 'CODEX_HOME': str(self.home), 'FAKE_CODEX_DIR': str(self.root)})
        (self.state / 'brief.md').write_text('do this task\n')
        self.message = self.root / 'message.md'
        self.message.write_text('continue task\n')

    def tearDown(self):
        self.temp.cleanup()


    def command(self, *args):
        return subprocess.run([sys.executable, str(SCRIPT), *args], env=self.environment,
                              capture_output=True, text=True)

    def start(self, *args):
        return self.command('start', '--dir', str(self.state), '--worktree', str(self.tree),
                            '--model', 'chosen-model', '--effort', 'high', *args)

    def resume(self, *args):
        return self.command('resume', '--dir', str(self.state), '--message', str(self.message), *args)

    def calls(self):
        calls = [json.loads(line) for line in (self.root / 'calls').read_text().splitlines()]
        for call in calls:
            self.assertFalse(any('writable_roots' in arg for arg in call['argv']))
        return calls

    def meta(self):
        return json.loads((self.state / 'meta.json').read_text())


    def test_add_dir_start_and_resume_exact_order_and_deduplication(self):
        extra = self.root / 'extra folder'
        result = self.start('--writable', str(extra), '--writable', str(extra), '--writable', str(self.state))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.calls()[0]['argv'], [
            'exec', '--add-dir', str(self.state), '--add-dir', str(extra),
            '-m', 'chosen-model', '-s', 'workspace-write', '-c', 'model_reasoning_effort=high',
            '-c', 'sandbox_workspace_write.network_access=false', '-C', str(self.tree),
            '--skip-git-repo-check', '--json', '-o', str(self.state / 'last.md'), '-'])
        result = self.resume('--tag', 'r1', '--writable', str(extra), '--writable', str(extra))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.calls()[1]['argv'], [
            'exec', '--add-dir', str(self.state), '--add-dir', str(extra), 'resume', 'thread-test',
            '-m', 'chosen-model', '-c', 'sandbox_mode=workspace-write', '-c', 'model_reasoning_effort=high',
            '-c', 'sandbox_workspace_write.network_access=false',
            '--skip-git-repo-check', '--json', '-o', str(self.state / 'last-r1.md'), '-'])

    def test_launcher_does_not_read_config(self):
        # Reading this as a file would fail. Codex alone owns config loading.
        (self.home / 'config.toml').mkdir()
        result = self.start()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.resume('--tag', 'r1').returncode, 0)
        self.assertEqual(self.meta()['runs'][0]['last'], str(self.state / 'last.md'))
        self.assertIsInstance(self.meta()['runs'][0]['pid'], int)
        self.assertNotEqual(self.meta()['runs'][0]['last'], self.meta()['runs'][1]['last'])

    def test_reused_pid_is_lost_and_resume_continues(self):
        self.assertEqual(self.start().returncode, 0)
        meta = self.meta()
        meta['runs'][0].update({'pid': os.getpid(), 'exit_code': None})
        (self.state / 'meta.json').write_text(json.dumps(meta))
        self.environment['FAKE_PS_COMMAND'] = 'python3 -m unittest'
        result = self.resume('--tag', 'after-reuse')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn('kill', result.stderr)
        self.assertEqual(self.meta()['runs'][0]['state'], 'lost')
        self.assertEqual(len(self.calls()), 2)
        self.assertIn('state=lost', self.command('status', '--dir', str(self.state)).stdout)

    def test_unreadable_identity_refuses_without_kill_advice(self):
        self.assertEqual(self.start().returncode, 0)
        meta = self.meta()
        meta['runs'][0].update({'pid': os.getpid(), 'exit_code': None, 'tag': 'orphan'})
        (self.state / 'meta.json').write_text(json.dumps(meta))
        self.environment['FAKE_PS_FAIL'] = '1'
        result = self.resume('--tag', 'blocked')
        self.assertEqual(result.returncode, 2)
        self.assertIn('cannot verify whether run orphan (PID {}) is still running; '
                      'check it before resuming'.format(os.getpid()), result.stderr)
        self.assertNotIn('kill', result.stderr)
        self.assertEqual(len(self.calls()), 1)
        self.assertNotIn('state', self.meta()['runs'][0])

    def test_killed_launcher_does_not_allow_resume_while_child_is_alive(self):
        environment = self.environment.copy()
        environment['FAKE_CODEX_HOLD'] = '1'
        process = subprocess.Popen([sys.executable, str(SCRIPT), 'start', '--dir', str(self.state),
                                   '--worktree', str(self.tree), '--model', 'chosen-model',
                                   '--effort', 'high'], env=environment,
                                  stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        child_pid = None
        try:
            deadline = time.monotonic() + 5
            while not (self.state / 'thread_id').exists() and time.monotonic() < deadline:
                if process.poll() is not None:
                    self.fail('fake launcher exited before thread.started: ' + process.communicate()[1])
                time.sleep(0.01)
            self.assertTrue((self.state / 'thread_id').exists())
            child_pid = self.meta()['runs'][0]['pid']
            self.assertIsNone(self.meta()['runs'][0]['exit_code'])
            process.kill()
            process.communicate(timeout=5)
            os.kill(child_pid, 0)
            self.environment['FAKE_PS_COMMAND'] = 'python3 fake-codex ' + ' '.join(self.calls()[0]['argv'])
            result = self.resume('--tag', 'after-death')
            self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
            self.assertIn('PID {}'.format(child_pid), result.stderr)
            self.assertIn('kill -TERM {}'.format(child_pid), result.stderr)
            self.assertIn('thread thread-test', result.stderr)
            ps_calls = [json.loads(line) for line in (self.root / 'ps-calls').read_text().splitlines()]
            self.assertEqual(ps_calls, [['-o', 'command=', '-p', str(child_pid)]])
            self.assertEqual(len(self.calls()), 1)
            self.assertEqual(len(self.meta()['runs']), 1)
        finally:
            if process.poll() is None:
                process.kill()
                process.communicate(timeout=5)
            if child_pid is not None:
                try:
                    os.kill(child_pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass


    def test_resume_allows_dead_pending_child(self):
        self.assertEqual(self.start().returncode, 0)
        meta = self.meta()
        # The fake child's exit has already been reaped by its launcher.
        meta['runs'][0]['exit_code'] = None
        (self.state / 'meta.json').write_text(json.dumps(meta))
        result = self.resume('--tag', 'after-exit')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(self.calls()), 2)
        self.assertEqual(self.meta()['runs'][0]['state'], 'lost')
        result = self.command('status', '--dir', str(self.state))
        self.assertIn('state=lost', result.stdout)

    def test_read_only_start_resume_flags_and_metadata(self):
        result = self.start('--sandbox', 'read-only', '--network', 'on', '--writable', str(self.tree))
        self.assertEqual(result.returncode, 0, result.stderr)
        call = self.calls()[0]
        self.assertEqual(call['argv'][call['argv'].index('-s') + 1], 'read-only')
        self.assertFalse(any(arg.startswith('sandbox_workspace_write.') for arg in call['argv']))
        self.assertNotIn('--add-dir', call['argv'])
        self.assertEqual(self.meta()['sandbox'], 'read-only')
        self.assertEqual(self.meta()['runs'][0]['sandbox'], 'read-only')
        result = self.resume('--tag', 'review')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('sandbox_mode=read-only', self.calls()[1]['argv'])
        self.assertFalse(any(arg.startswith('sandbox_workspace_write.') for arg in self.calls()[1]['argv']))
        self.assertNotIn('--add-dir', self.calls()[1]['argv'])
        self.assertEqual(self.meta()['runs'][1]['sandbox'], 'read-only')

    def test_resume_sandbox_override_in_both_directions(self):
        self.assertEqual(self.start('--sandbox', 'read-only').returncode, 0)
        result = self.resume('--tag', 'write', '--sandbox', 'workspace-write', '--network', 'on')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('sandbox_mode=workspace-write', self.calls()[1]['argv'])
        self.assertEqual(self.calls()[1]['argv'][:3], ['exec', '--add-dir', str(self.state)])
        self.assertEqual(self.meta()['runs'][1]['sandbox'], 'workspace-write')
        # Default still comes from start, not the preceding override.
        self.assertEqual(self.resume('--tag', 'review-again').returncode, 0)
        self.assertIn('sandbox_mode=read-only', self.calls()[2]['argv'])
        result = self.resume('--tag', 'explicit-review', '--sandbox', 'read-only')
        self.assertEqual(result.returncode, 0)
        self.assertFalse(any(arg.startswith('sandbox_workspace_write.') for arg in self.calls()[3]['argv']))


    def test_start_argv_environment_capture_files_and_meta(self):
        result = self.start()
        self.assertEqual(result.returncode, 0, result.stderr)
        call = self.calls()[0]
        self.assertEqual(call['argv'], ['exec', '--add-dir', str(self.state), '-m', 'chosen-model', '-s', 'workspace-write',
            '-c', 'model_reasoning_effort=high', '-c', 'sandbox_workspace_write.network_access=false',
            '-C', str(self.tree), '--skip-git-repo-check', '--json', '-o', str(self.state / 'last.md'), '-'])
        self.assertEqual(call['stdin'], 'do this task\n')
        self.assertEqual(call['cwd'], str(self.tree))
        for key, path in call['env'].items():
            self.assertTrue(Path(path).is_dir(), key)
            self.assertEqual(Path(path).parent, self.state)
        self.assertEqual((self.state / 'thread_id').read_text(), 'thread-test\n')
        self.assertIn('invalid json line', (self.state / 'events.jsonl').read_text())
        self.assertEqual((self.state / 'stderr.log').read_text(), 'diagnostic\n')
        self.assertEqual((self.state / 'last.md').read_text(), 'worker result')
        self.assertEqual(self.meta()['model'], 'chosen-model')
        self.assertEqual(self.meta()['effort'], 'high')
        self.assertEqual(self.meta()['worktree'], str(self.tree))
        self.assertEqual(self.meta()['network'], 'off')
        self.assertEqual(self.meta()['sandbox'], 'workspace-write')
        self.assertEqual(self.meta()['runs'][0]['exit_code'], 0)
        self.assertEqual(result.stdout.strip(), 'codex exit=0 thread=thread-test last=' + str(self.state / 'last.md'))

    def test_caller_environment_wins(self):
        supplied = {'GOCACHE': '/caller/go', 'GOTMPDIR': '/caller/tmp', 'GOLANGCI_LINT_CACHE': '/caller/lint'}
        self.environment.update(supplied)
        self.assertEqual(self.start().returncode, 0)
        self.assertEqual(self.calls()[0]['env'], supplied)
        self.assertFalse((self.state / 'gocache').exists())

    def test_resume_reuses_recorded_route_network_and_cwd(self):
        self.assertEqual(self.start('--network', 'on').returncode, 0)
        result = self.resume('--tag', 'r1')
        self.assertEqual(result.returncode, 0, result.stderr)
        call = self.calls()[1]
        self.assertEqual(call['argv'], ['exec', '--add-dir', str(self.state), 'resume', 'thread-test', '-m', 'chosen-model',
            '-c', 'sandbox_mode=workspace-write', '-c', 'model_reasoning_effort=high',
            '-c', 'sandbox_workspace_write.network_access=true',
            '--skip-git-repo-check', '--json', '-o', str(self.state / 'last-r1.md'), '-'])
        self.assertEqual(call['cwd'], str(self.tree))
        self.assertEqual(call['stdin'], 'continue task\n')
        self.assertEqual((self.state / 'thread_id').read_text(), 'thread-test\n')
        self.assertEqual([r['tag'] for r in self.meta()['runs']], [None, 'r1'])
        for file in ('events-r1.jsonl', 'stderr-r1.log', 'last-r1.md'):
            self.assertTrue((self.state / file).is_file())

    def test_resume_explicit_overrides_and_roots(self):
        self.assertEqual(self.start().returncode, 0)
        result = self.resume('--tag', 'retry', '--model', 'other-model', '--effort', 'medium',
                             '--network', 'on', '--writable', str(self.tree))
        self.assertEqual(result.returncode, 0, result.stderr)
        call = self.calls()[1]
        self.assertIn('other-model', call['argv'])
        self.assertIn('model_reasoning_effort=medium', call['argv'])
        self.assertIn('sandbox_workspace_write.network_access=true', call['argv'])
        self.assertEqual(call['argv'][:6], ['exec', '--add-dir', str(self.state), '--add-dir', str(self.tree), 'resume'])
        self.assertEqual(self.meta()['runs'][1]['model'], 'other-model')

    def test_workspace_write_start_can_resume_as_read_only(self):
        self.assertEqual(self.start().returncode, 0)
        result = self.resume('--tag', 'readonly', '--sandbox', 'read-only')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('sandbox_mode=read-only', self.calls()[1]['argv'])
        self.assertFalse(any(arg.startswith('sandbox_workspace_write.') for arg in self.calls()[1]['argv']))
        self.assertNotIn('--add-dir', self.calls()[1]['argv'])
        self.assertEqual(self.meta()['runs'][1]['sandbox'], 'read-only')

    def test_nonzero_exit_propagated_and_recorded(self):
        self.environment['FAKE_CODEX_EXIT'] = '7'
        result = self.start('--tag', 'attempt')
        self.assertEqual(result.returncode, 7)
        self.assertIn('codex exit=7 thread=thread-test', result.stdout)
        self.assertEqual(self.meta()['runs'][0]['exit_code'], 7)

    def test_existing_worker_and_tag_not_overwritten(self):
        self.assertEqual(self.start().returncode, 0)
        self.assertEqual(self.start().returncode, 2)
        self.assertEqual(self.resume().returncode, 2)
        self.assertEqual(len(self.calls()), 1)

    def test_status_running_and_newest_last(self):
        self.assertEqual(self.start().returncode, 0)
        self.assertEqual(self.resume('--tag', 'r1').returncode, 0)
        result = self.command('status', '--dir', str(self.state))
        self.assertEqual(result.returncode, 0)
        for value in ('thread=thread-test', 'tag=(untagged) exit=0', 'tag=r1 exit=0', 'running=no', 'last-r1.md'):
            self.assertIn(value, result.stdout)
        self.environment['FAKE_PS_OUTPUT'] = '123 /bin/codex exec resume thread-test --json\n'
        result = self.command('status', '--dir', str(self.state))
        self.assertIn('running=yes', result.stdout)
        self.environment['FAKE_PS_OUTPUT'] = '123 python wrapper codex-worker thread-test\n'
        result = self.command('status', '--dir', str(self.state))
        self.assertIn('running=no', result.stdout)

    def test_status_active_start_pid_before_thread_appears_in_command(self):
        self.assertEqual(self.start().returncode, 0)
        meta = self.meta()
        meta['runs'][0].update({'pid': 123, 'exit_code': None})
        (self.state / 'meta.json').write_text(json.dumps(meta))
        self.environment['FAKE_PS_OUTPUT'] = '123 /bin/codex exec -m model --json\n'
        result = self.command('status', '--dir', str(self.state))
        self.assertIn('running=yes', result.stdout)
        self.assertIn('exit=pending', result.stdout)

    def test_env_file_rejected_without_read_or_launch(self):
        brief = self.root / '.env.local'
        brief.write_text('SECRET=do-not-pass')
        result = self.start('--brief', str(brief))
        self.assertEqual(result.returncode, 2)
        self.assertNotIn('do-not-pass', result.stdout + result.stderr)
        self.assertFalse((self.root / 'calls').exists())

    def test_concurrent_start_cannot_write_same_state_directory(self):
        with WORKER.run_lock(self.state):
            result = self.start()
        self.assertEqual(result.returncode, 2)
        self.assertIn('another worker is running', result.stderr)
        self.assertFalse((self.root / 'calls').exists())

    def test_env_named_symlink_cannot_bypass_prompt_guard(self):
        link = self.root / '.env'
        link.symlink_to(self.message)
        result = self.start('--brief', str(link))
        self.assertEqual(result.returncode, 2)
        self.assertFalse((self.root / 'calls').exists())

    def test_help_and_required_model_effort_and_safe_tag(self):
        self.assertEqual(self.command('--help').returncode, 0)
        for name in ('start', 'resume', 'status'):
            self.assertEqual(self.command(name, '--help').returncode, 0)
        self.assertEqual(self.command('start', '--dir', str(self.state), '--worktree', str(self.tree)).returncode, 2)
        self.assertEqual(self.start('--tag', '../escape').returncode, 2)


if __name__ == '__main__':
    unittest.main()
