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
from unittest.mock import patch


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
import os
print(os.environ.get('FAKE_PS_OUTPUT', ''))
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

    def config(self, text):
        (self.home / 'config.toml').write_text(text)

    def command(self, *args):
        return subprocess.run([sys.executable, str(SCRIPT), *args], env=self.environment,
                              capture_output=True, text=True)

    def start(self, *args):
        return self.command('start', '--dir', str(self.state), '--worktree', str(self.tree),
                            '--model', 'chosen-model', '--effort', 'high', *args)

    def resume(self, *args):
        return self.command('resume', '--dir', str(self.state), '--message', str(self.message), *args)

    def calls(self):
        return [json.loads(line) for line in (self.root / 'calls').read_text().splitlines()]

    def meta(self):
        return json.loads((self.state / 'meta.json').read_text())

    def roots(self, call):
        value = next(arg for arg in call['argv'] if arg.startswith('sandbox_workspace_write.writable_roots='))
        return json.loads(value.split('=', 1)[1])

    def test_merge_single_double_quotes_multiline_comments_order_and_duplicates(self):
        self.config('''[other]
writable_roots = ["ignore"]
[sandbox_workspace_write] # comment
writable_roots = [
    '/configured/one', # root comment
    "/configured/two#literal", # keep hash
    "/configured/one",
]
network_access = true
[next]
writable_roots = ["also-ignore"]
''')
        extra = self.root / 'extra'
        result = self.start('--writable', str(extra), '--writable', str(extra), '--network', 'on')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.roots(self.calls()[0]), [str(self.state), str(extra),
                                                     '/configured/one', '/configured/two#literal'])
        self.assertIn('sandbox_workspace_write.network_access=true', self.calls()[0]['argv'])

    def test_config_quotes_escapes_and_unicode(self):
        self.config(r'''[sandbox_workspace_write]
writable_roots = ['literal\path', "/quote\"path", "/slash\\path", "/\u00e9/\U0001F600"]
''')
        self.assertEqual(self.start().returncode, 0)
        self.assertEqual(self.roots(self.calls()[0])[1:], ['literal\\path', '/quote"path', '/slash\\path', '/é/😀'])

    def test_empty_array_and_missing_key(self):
        for text in ('', '[sandbox_workspace_write]\nnetwork_access = true\n',
                     '[sandbox_workspace_write]\nwritable_roots = []\n'):
            with self.subTest(text=text), patch.dict(os.environ, self.environment, clear=True):
                self.config(text)
                self.assertEqual(WORKER.merged_roots(self.state, []), [str(self.state)])

    def test_unrelated_multiline_strings_cannot_hide_or_inject_roots(self):
        lines = ['[other]', 'prompt = """', '[sandbox_workspace_write]',
                 "writable_roots = ['/wrong']", '"""', '[sandbox_workspace_write]',
                 'note = ".env is only text here"', 'prompt = \'\'\'', '[other]',
                 "writable_roots = ['/also-wrong']", '\'\'\'',
                 "writable_roots = ['/correct']"]
        self.config('\n'.join(lines))
        self.assertEqual(self.start().returncode, 0)
        self.assertEqual(self.roots(self.calls()[0]), [str(self.state), '/correct'])

    def test_quoted_key(self):
        self.config('[sandbox_workspace_write]\n"writable_roots" = ["/root"]\n')
        self.assertEqual(self.start().returncode, 0)
        self.assertEqual(self.roots(self.calls()[0])[-1], '/root')

    def test_escaped_and_quoted_keys_and_tables_preserve_roots(self):
        headers = ['[sandbox_workspace_write]', '["sandbox_workspace_write"]',
                   "['sandbox_workspace_write']", r'["sandbox\u005fworkspace_write"]',
                   r'["sandbox_workspace_\U00000077rite"]']
        keys = ['writable_roots', '"writable_roots"', "'writable_roots'",
                r'"writable\u005froots"', r'"writable_\U00000072oots"']
        with patch.dict(os.environ, self.environment, clear=True):
            for header in headers:
                for key in keys:
                    with self.subTest(header=header, key=key):
                        self.config(header + '\n' + key + ' = ["/must-keep"]\n')
                        self.assertEqual(WORKER.configured_roots(), ['/must-keep'])

    def test_unresolvable_quoted_name_fails_before_launch(self):
        for text in (r'["sandbox\qworkspace_write"]',
                     '[sandbox_workspace_write]\n' + r'"writable\qroots" = ["/keep"]'):
            with self.subTest(text=text):
                self.config(text)
                result = self.start()
                self.assertEqual(result.returncode, 2)
                self.assertIn('writable_roots', result.stderr)
                self.assertFalse((self.root / 'calls').exists())

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
            result = self.resume('--tag', 'after-death')
            self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
            self.assertIn('PID {}'.format(child_pid), result.stderr)
            self.assertIn('kill -TERM {}'.format(child_pid), result.stderr)
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

    def test_resume_pending_child_probe_permission_denied_fails_closed(self):
        meta = {'runs': [{'pid': 123, 'exit_code': None}]}
        with patch.object(WORKER.os, 'kill', side_effect=PermissionError), \
                self.assertRaisesRegex(WORKER.WorkerError, 'still alive'):
            WORKER.refuse_pending_children(meta)

    def test_resume_allows_dead_pending_child(self):
        self.assertEqual(self.start().returncode, 0)
        meta = self.meta()
        # The fake child's exit has already been reaped by its launcher.
        meta['runs'][0]['exit_code'] = None
        (self.state / 'meta.json').write_text(json.dumps(meta))
        result = self.resume('--tag', 'after-exit')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(self.calls()), 2)

    def test_read_only_start_resume_flags_and_metadata(self):
        self.config('[sandbox_workspace_write]\nwritable_roots = ["/configured"]\n')
        result = self.start('--sandbox', 'read-only', '--network', 'on', '--writable', str(self.tree))
        self.assertEqual(result.returncode, 0, result.stderr)
        call = self.calls()[0]
        self.assertEqual(call['argv'][call['argv'].index('-s') + 1], 'read-only')
        self.assertFalse(any(arg.startswith('sandbox_workspace_write.') for arg in call['argv']))
        self.assertEqual(self.meta()['sandbox'], 'read-only')
        self.assertEqual(self.meta()['runs'][0]['sandbox'], 'read-only')
        result = self.resume('--tag', 'review')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('sandbox_mode=read-only', self.calls()[1]['argv'])
        self.assertFalse(any(arg.startswith('sandbox_workspace_write.') for arg in self.calls()[1]['argv']))
        self.assertEqual(self.meta()['runs'][1]['sandbox'], 'read-only')

    def test_resume_sandbox_override_in_both_directions(self):
        self.assertEqual(self.start('--sandbox', 'read-only').returncode, 0)
        result = self.resume('--tag', 'write', '--sandbox', 'workspace-write', '--network', 'on')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('sandbox_mode=workspace-write', self.calls()[1]['argv'])
        self.assertEqual(self.roots(self.calls()[1]), [str(self.state)])
        self.assertEqual(self.meta()['runs'][1]['sandbox'], 'workspace-write')
        # Default still comes from start, not the preceding override.
        self.assertEqual(self.resume('--tag', 'review-again').returncode, 0)
        self.assertIn('sandbox_mode=read-only', self.calls()[2]['argv'])
        result = self.resume('--tag', 'explicit-review', '--sandbox', 'read-only')
        self.assertEqual(result.returncode, 0)
        self.assertFalse(any(arg.startswith('sandbox_workspace_write.') for arg in self.calls()[3]['argv']))

    def test_broken_key_fails_without_codex(self):
        values = ['["/one"', 'not_an_array', '[123]', '["bad\\q"]', '["/one" "/two"]',
                  '["/one"] trailing', '["unterminated]', '["/one",\n[next]\na=1']
        for value in values:
            with self.subTest(value=value):
                self.config('[sandbox_workspace_write]\nwritable_roots = ' + value + '\n')
                result = self.start()
                self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
                self.assertIn('writable_roots', result.stderr)
                self.assertFalse((self.root / 'calls').exists())

    def test_broken_assignment_and_duplicate_key(self):
        for text in ('writable_roots', 'writable_roots ["/must-keep"]',
                     'writable_roots.child = []', 'writable_roots : []', '"writable_roots" : []', "'writable_roots' : []",
                     'writable_roots = []\nwritable_roots = []'):
            with self.subTest(text=text):
                self.config('[sandbox_workspace_write]\n' + text + '\n')
                result = self.start()
                self.assertEqual(result.returncode, 2)
                self.assertFalse((self.root / 'calls').exists())

    def test_start_argv_environment_capture_files_and_meta(self):
        result = self.start()
        self.assertEqual(result.returncode, 0, result.stderr)
        call = self.calls()[0]
        self.assertEqual(call['argv'], ['exec', '-m', 'chosen-model', '-s', 'workspace-write',
            '-c', 'model_reasoning_effort=high', '-c', 'sandbox_workspace_write.network_access=false',
            '-c', 'sandbox_workspace_write.writable_roots=' + json.dumps([str(self.state)]),
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
        self.assertEqual(call['argv'], ['exec', 'resume', 'thread-test', '-m', 'chosen-model',
            '-c', 'sandbox_mode=workspace-write', '-c', 'model_reasoning_effort=high',
            '-c', 'sandbox_workspace_write.network_access=true', '-c',
            'sandbox_workspace_write.writable_roots=' + json.dumps([str(self.state)]),
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
        self.assertEqual(self.roots(call), [str(self.state), str(self.tree)])
        self.assertEqual(self.meta()['runs'][1]['model'], 'other-model')

    def test_workspace_write_start_can_resume_as_read_only(self):
        self.assertEqual(self.start().returncode, 0)
        result = self.resume('--tag', 'readonly', '--sandbox', 'read-only')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('sandbox_mode=read-only', self.calls()[1]['argv'])
        self.assertFalse(any(arg.startswith('sandbox_workspace_write.') for arg in self.calls()[1]['argv']))
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

    def test_codex_home_respected_and_default_home(self):
        self.config('[sandbox_workspace_write]\nwritable_roots = ["/from-codex-home"]\n')
        with patch.dict(os.environ, self.environment, clear=True):
            self.assertEqual(WORKER.configured_roots(), ['/from-codex-home'])
        fallback = self.root / '.codex'
        fallback.mkdir()
        (fallback / 'config.toml').write_text('[sandbox_workspace_write]\nwritable_roots = ["/fallback"]\n')
        environment = self.environment.copy()
        environment.pop('CODEX_HOME')
        environment['HOME'] = str(self.root)
        with patch.dict(os.environ, environment, clear=True):
            self.assertEqual(WORKER.configured_roots(), ['/fallback'])


if __name__ == '__main__':
    unittest.main()
