#!/usr/bin/env python3
"""Small, read-only gh helpers shared by the CI commands."""
import json
import re
import subprocess


class GhError(Exception):
    def __init__(self, message):
        super().__init__(message)
        self.backoff = bool(re.search(
            r'rate.?limit|secondary rate|HTTP\s+(?:429|5\d\d)|status(?: code)?[ :=]+(?:429|5\d\d)',
            message, re.I))


def gh(*args):
    try:
        result = subprocess.run(['gh', *args], capture_output=True, text=True, timeout=60)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise GhError(str(exc)) from exc
    if result.returncode:
        raise GhError(result.stderr.strip() or 'gh exited {}'.format(result.returncode))
    return result.stdout


def gh_json(*args):
    try:
        return json.loads(gh(*args))
    except (ValueError, TypeError) as exc:
        raise GhError('Invalid JSON from gh: {}'.format(exc)) from exc


def repository(value):
    if value:
        return value
    try:
        return gh_json('repo', 'view', '--json', 'nameWithOwner')['nameWithOwner']
    except (KeyError, TypeError) as exc:
        raise GhError('Missing repository name in gh response') from exc


def pages(repo, suffix, key, query=''):
    items = []
    page = 1
    while True:
        endpoint = 'repos/{}/actions/{}?{}per_page=100&page={}'.format(
            repo, suffix, query, page)
        response = gh_json('api', endpoint)
        if not isinstance(response, dict) or not isinstance(response.get(key), list):
            raise GhError('Missing {} array in gh response'.format(key))
        batch = response[key]
        items.extend(batch)
        if len(batch) < 100:
            return items
        page += 1


if __name__ == '__main__':
    import argparse
    argparse.ArgumentParser(description=__doc__).parse_args()
