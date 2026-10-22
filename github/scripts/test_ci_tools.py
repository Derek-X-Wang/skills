#!/usr/bin/env python3
"""Offline contract tests: python3 -m unittest discover -s github/scripts -p 'test_*.py'."""
from contextlib import redirect_stdout, redirect_stderr
import importlib.machinery
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch


HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))


def load(name, file):
    loader = importlib.machinery.SourceFileLoader(name, str(HERE / file))
    spec = importlib.util.spec_from_loader(name, loader)
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module


WAIT = load('ci_wait', 'ci-wait')
FAILURES = load('ci_failures', 'ci-failures')
FAKE_GH = '''#!/usr/bin/env python3
import json, os, pathlib, sys
root = pathlib.Path(os.environ['FAKE_GH_DIR'])
state = root / 'index'
i = int(state.read_text()) if state.exists() else 0
state.write_text(str(i + 1))
with (root / 'calls').open('a') as f:
    f.write(json.dumps(sys.argv[1:]) + '\\n')
plan = json.loads((root / 'plan').read_text())
if i >= len(plan):
    print('unexpected gh call', file=sys.stderr)
    sys.exit(99)
entry = plan[i]
print(entry.get('out', ''), end='')
print(entry.get('err', ''), end='', file=sys.stderr)
sys.exit(entry.get('code', 0))
'''


def response(value):
    return {'out': json.dumps(value)}


def run(conclusion='success', status='completed', identity=10):
    return {'id': identity, 'name': 'build', 'event': 'push', 'status': status,
            'conclusion': conclusion, 'html_url': 'https://example.test/run/' + str(identity)}


class Clock:
    def __init__(self):
        self.now = 0
        self.sleeps = []

    def monotonic(self):
        return self.now

    def sleep(self, duration):
        self.sleeps.append(duration)
        self.now += duration


class CITests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        binary = self.root / 'gh'
        binary.write_text(FAKE_GH)
        binary.chmod(0o755)
        self.env = patch.dict(os.environ, {'PATH': str(self.root) + os.pathsep + os.environ['PATH'],
                                          'FAKE_GH_DIR': str(self.root)})
        self.env.start()

    def tearDown(self):
        self.env.stop()
        self.temp.cleanup()

    def plan(self, entries):
        (self.root / 'plan').write_text(json.dumps(entries))

    def calls(self):
        return [json.loads(line) for line in (self.root / 'calls').read_text().splitlines()]

    def wait(self, entries, *flags):
        self.plan(entries)
        clock = Clock()
        out, err = io.StringIO(), io.StringIO()
        with patch.object(WAIT.time, 'monotonic', clock.monotonic), \
                patch.object(WAIT.time, 'sleep', clock.sleep), redirect_stdout(out), redirect_stderr(err):
            code = WAIT.main(['--repo', 'org/repo', '--sha', 'abc', *flags])
        return code, out.getvalue(), err.getvalue(), clock

    def failures(self, entries, *flags):
        self.plan(entries)
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = FAILURES.main(['10', '--repo', 'org/repo', *flags])
        return code, out.getvalue(), err.getvalue()

    def test_done_success_without_sleep(self):
        code, out, _, clock = self.wait([response({'workflow_runs': [run()]})])
        self.assertEqual(code, 0)
        self.assertIn('10\tbuild\tpush\tsuccess\thttps://', out)
        self.assertEqual(clock.sleeps, [])
        self.assertIn('head_sha=abc&per_page=100', self.calls()[0][1])

    def test_failure_job_and_first_failed_step(self):
        jobs = {'jobs': [{'name': 'test', 'conclusion': 'failure', 'steps': [
            {'name': 'setup', 'conclusion': 'success'}, {'name': 'unit', 'conclusion': 'failure'},
            {'name': 'cleanup', 'conclusion': 'failure'}]}]}
        code, out, _, _ = self.wait([response({'workflow_runs': [run('failure')]}), response(jobs)])
        self.assertEqual(code, 1)
        self.assertIn('test\tfailure\tunit', out)
        self.assertNotIn('cleanup', out)

    def test_cancelled_and_timed_out_are_failure(self):
        for conclusion in ('cancelled', 'timed_out'):
            with self.subTest(conclusion=conclusion):
                (self.root / 'index').unlink(missing_ok=True)
                code, _, _, _ = self.wait([response({'workflow_runs': [run(conclusion)]}),
                                           response({'jobs': []})])
                self.assertEqual(code, 1)

    def test_skipped_and_neutral_are_good(self):
        code, _, _, _ = self.wait([response({'workflow_runs': [run('neutral'), run('skipped', identity=11)]}),
                                   response({'jobs': []}), response({'jobs': []})])
        self.assertEqual(code, 0)

    def test_runs_appear_then_complete(self):
        code, _, _, clock = self.wait([response({'workflow_runs': []}),
                                      response({'workflow_runs': [run(None, 'in_progress')]}),
                                      response({'workflow_runs': [run()]})])
        self.assertEqual(code, 0)
        self.assertEqual(clock.sleeps, [120, 120])

    def test_minimum_runs_is_required(self):
        code, _, _, clock = self.wait([response({'workflow_runs': [run()]}),
                                      response({'workflow_runs': [run(), run(identity=11)]})], '--min-runs', '2')
        self.assertEqual((code, clock.sleeps), (0, [120]))

    def test_api_error_never_done(self):
        code, _, err, clock = self.wait([{'code': 1, 'err': 'connection failed'},
                                        response({'workflow_runs': [run()]})])
        self.assertEqual(code, 0)
        self.assertIn('connection failed', err)
        self.assertEqual(clock.sleeps, [120])

    def test_api_errors_until_timeout_never_report_success(self):
        code, out, err, clock = self.wait([{'code': 1, 'err': 'HTTP 503'}], '--timeout', '30')
        self.assertEqual(code, 3)
        self.assertEqual(out, '')
        self.assertIn('HTTP 503', err)
        self.assertEqual(clock.sleeps, [30])

    def test_slow_api_response_cannot_finish_after_appearance_deadline(self):
        self.plan([response({'workflow_runs': [run()]})])
        clock = Clock()
        original = WAIT.pages

        def slow_pages(*args, **kwargs):
            result = original(*args, **kwargs)
            clock.now += 901
            return result

        out = io.StringIO()
        with patch.object(WAIT.time, 'monotonic', clock.monotonic), \
                patch.object(WAIT.time, 'sleep', clock.sleep), patch.object(WAIT, 'pages', slow_pages), \
                redirect_stdout(out), redirect_stderr(io.StringIO()):
            self.assertEqual(WAIT.main(['--sha', 'abc', '--repo', 'org/repo']), 3)
        self.assertEqual(out.getvalue(), '')

    def test_missing_status_and_invalid_json_retry(self):
        code, _, err, clock = self.wait([{'out': 'oops'}, response({'workflow_runs': [{'id': 1}]}),
                                        response({'workflow_runs': [run()]})])
        self.assertEqual(code, 0)
        self.assertIn('Invalid JSON', err)
        self.assertEqual(clock.sleeps, [120, 120])

    def test_rate_limit_and_5xx_backoff_bounded(self):
        code, _, _, clock = self.wait([{'code': 1, 'err': message} for message in
                                      ('API rate limit exceeded', 'HTTP 503', 'HTTP 502', 'HTTP 429')]
                                     + [response({'workflow_runs': [run()]})], '--appear-timeout', '5000')
        self.assertEqual(code, 0)
        self.assertEqual(clock.sleeps, [240, 480, 600, 600])

    def test_appearance_timeout(self):
        code, _, err, clock = self.wait([response({'workflow_runs': []})], '--appear-timeout', '30')
        self.assertEqual(code, 3)
        self.assertIn('appear', err)
        self.assertEqual(clock.now, 30)

    def test_overall_timeout_after_runs_appear(self):
        code, _, err, clock = self.wait([response({'workflow_runs': [run(None, 'queued')]})],
                                        '--timeout', '40', '--appear-timeout', '10')
        self.assertEqual(code, 3)
        self.assertIn('completion', err)
        self.assertEqual(clock.now, 40)

    def test_failed_job_lookup_error_retries(self):
        code, out, err, _ = self.wait([response({'workflow_runs': [run('failure')]}),
                                       {'code': 1, 'err': 'HTTP 500'},
                                       response({'workflow_runs': [run('failure')]}), response({'jobs': []})])
        self.assertEqual(code, 1)
        self.assertEqual(out.count('10\tbuild'), 1)
        self.assertIn('HTTP 500', err)

    def test_pr_head_resolved_once_and_repo_default(self):
        self.plan([response({'nameWithOwner': 'org/repo'}), response({'headRefOid': 'frozen'}),
                   response({'workflow_runs': []}), response({'workflow_runs': [run()]})])
        clock = Clock()
        with patch.object(WAIT.time, 'monotonic', clock.monotonic), \
                patch.object(WAIT.time, 'sleep', clock.sleep), redirect_stdout(io.StringIO()):
            code = WAIT.main(['--pr', '7'])
        self.assertEqual(code, 0)
        self.assertEqual(sum(call[:2] == ['pr', 'view'] for call in self.calls()), 1)
        self.assertTrue(all('head_sha=frozen' in c[1] for c in self.calls() if c[0] == 'api'))

    def test_repeatable_run_ids(self):
        self.plan([response(run()), response(run(identity=11))])
        with redirect_stdout(io.StringIO()):
            self.assertEqual(WAIT.main(['--repo', 'org/repo', '--run', '10', '--run', '11']), 0)
        self.assertEqual([c[1] for c in self.calls()], ['repos/org/repo/actions/runs/10',
                                                       'repos/org/repo/actions/runs/11'])

    def test_all_run_pages_are_polled(self):
        first = [run(identity=i + 1) for i in range(100)]
        code, _, _, clock = self.wait([response({'workflow_runs': first}),
                                      response({'workflow_runs': [run(None, 'queued', 101)]}),
                                      response({'workflow_runs': [run()]})])
        self.assertEqual(code, 0)
        self.assertEqual(clock.sleeps, [120])
        self.assertIn('page=2', self.calls()[1][1])

    def test_usage_and_help(self):
        for file in ('ci-wait', 'ci-failures'):
            result = subprocess.run([sys.executable, str(HERE / file), '--help'], capture_output=True)
            self.assertEqual(result.returncode, 0)
        result = subprocess.run([sys.executable, str(HERE / 'ci-wait'), '--sha', 'abc', '--interval', '1'],
                                capture_output=True)
        self.assertEqual(result.returncode, 2)

    def test_group_patterns_and_tail_without_timestamps(self):
        log = '\n'.join('test\t{}\t2026-01-01T01:02:03.123Z {}'.format(step, line) for step, line in [
            ('unit', 'ordinary'), ('unit', '--- FAIL: TestA'), ('unit', 'details'),
            ('unit', 'last context'), ('lint', 'problem (golangci)'), ('lint', 'end')])
        code, out, _ = self.failures([{'out': log}], '--tail', '1')
        self.assertEqual(code, 0)
        for value in ('Job: test', 'Step: unit', 'Step: lint', '--- FAIL: TestA', 'last context', 'problem (golangci)'):
            self.assertIn(value, out)
        self.assertNotIn('ordinary', out)
        self.assertNotIn('2026-', out)
        self.assertEqual(len(self.calls()), 1)
        self.assertEqual(self.calls()[0], ['run', 'view', '10', '--repo', 'org/repo', '--log-failed'])

    def test_all_default_failure_families(self):
        signals = ['--- FAIL Test', 'FAIL package', 'panic: bad', 'Error Trace: a', 'Error: b',
                   'DATA RACE', 'x.go:12: broken', 'x: problem (staticcheck)', '##[error]failure',
                   'Traceback (most recent call last)', 'ValueError failure', 'not ok 3']
        log = '\n'.join('test\tunit\t2026-01-01T00:00:00Z ' + s for s in signals)
        _, out, _ = self.failures([{'out': log}], '--tail', '0')
        for signal in signals:
            self.assertIn(signal, out)

    def test_additional_pattern_job_filter_and_cap(self):
        log = '\n'.join(['a\ts\tCUSTOM {}'.format(i) for i in range(5)] + ['b\ts\tError other'])
        _, out, _ = self.failures([{'out': log}], '--job', 'a', '--pattern', '^CUSTOM',
                                  '--tail', '0', '--max-lines', '2')
        self.assertIn('CUSTOM 0', out)
        self.assertIn('CUSTOM 1', out)
        self.assertNotIn('CUSTOM 2', out)
        self.assertNotIn('Job: b', out)
        self.assertIn('3 selected lines omitted', out)

    def test_noisy_go_lines_cannot_hide_failure_or_tail(self):
        lines = ['file.go:12: routine {}'.format(i) for i in range(200)]
        lines += ['--- FAIL: TestActualFailure', 'file.go:42: expected ready, got false', 'final context']
        log = '\n'.join('test\tunit\t' + line for line in lines)
        code, out, _ = self.failures([{'out': log}], '--max-lines', '10', '--tail', '2')
        self.assertEqual(code, 0)
        self.assertIn('--- FAIL: TestActualFailure', out)
        self.assertIn('expected ready, got false', out)
        self.assertIn('final context', out)
        self.assertEqual(sum(line.startswith('    ') for line in out.splitlines()), 10)

    def test_empty_log_fetches_job_conclusions(self):
        code, out, _ = self.failures([{'out': ''}, response({'jobs': [
            {'name': 'cancelled job', 'conclusion': 'cancelled', 'html_url': 'url'},
            {'name': 'slow job', 'conclusion': 'timed_out'}]})])
        self.assertEqual(code, 0)
        self.assertIn('cancelled job\tcancelled\turl', out)
        self.assertIn('slow job\ttimed_out', out)
        self.assertEqual(len(self.calls()), 2)

    def test_log_api_error_is_failure(self):
        code, _, err = self.failures([{'code': 1, 'err': 'HTTP 503'}])
        self.assertEqual(code, 1)
        self.assertIn('HTTP 503', err)

    def test_bad_regex_usage_error(self):
        with redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as context:
            FAILURES.main(['10', '--pattern', '['])
        self.assertEqual(context.exception.code, 2)


if __name__ == '__main__':
    unittest.main()
