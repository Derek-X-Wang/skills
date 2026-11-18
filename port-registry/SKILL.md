---
name: port-registry
description: Manages per-project dev-port blocks so local dev servers never collide. Use when starting dev servers, setting up a new project's dev environment, hitting a port conflict (EADDRINUSE), or when the user asks which ports a project uses. Also use when a project's dev config hardcodes a common port (3000, 3001, 8080).
---

# Port Registry

Each project owns one block of dev ports. The port numbers are committed in the project's dev scripts, so a block must hold on every machine. The table therefore lives in the owner's home repo, shared through git, and names projects by identity, never by a local path.

## The table

`ports.json` in the OS folder of the home repo. Find the OS folder in `os_repo_root` of `~/.local/share/dark-factory/machine.json`. If that binding is missing, report it; a second, machine-local table would let two machines assign the same block.

```json
{
  "block_size": 100,
  "next_available": 5200,
  "projects": [
    {
      "slug": "my-saas",
      "start": 5000,
      "end": 5099,
      "assignments": { "web": 5001, "api": 5050 },
      "notes": "Optional: what runs on each port"
    },
    {
      "repo": "some-org/some-repo",
      "tags": ["work"],
      "start": 5100,
      "end": 5199,
      "assignments": { "web": 5101 }
    }
  ],
  "reserved": [{ "start": 8900, "end": 9099, "reason": "..." }]
}
```

- **slug** names the project's page `wiki/<slug>.md` in the OS folder. The page's `resource:` field is the repository URL.
- **repo** (`owner/name`, lowercase) identifies a project that has no wiki page.
- **tags: ["work"]** marks a company project. Its notes follow the company-information rules in the home repo's root `AGENTS.md`: say what runs on a port, nothing about what is inside the project.
- **reserved** ranges are taken. Assign nothing inside them.

## Find the current project's entry

1. In the project, before you go anywhere else, note its root and read `git remote get-url origin`. Reduce the URL to `owner/name`, lowercase, without `.git`.
2. Read the published table without touching the home repo's working tree: `git -C <OS folder> fetch origin`, then `git -C <OS folder> show origin/HEAD:./ports.json`. The wiki identities come from the same snapshot: `git -C <OS folder> grep -i '^resource:' origin/HEAD -- wiki`. When you cannot or may not fetch, read the files in the checkout and say that the answer comes from a cached snapshot.
3. Match an entry whose `repo` equals the project's `owner/name` exactly, or whose slug's wiki page has a `resource:` URL that reduces to the same `owner/name`. Compare the whole identity, never a suffix.
4. With no remote or no match, match the project root from step 1 against `projects.<slug>.localPath` in `~/.config/kb.json`.

A worktree or a temporary preview of a project shares that project's block: give it a free port inside the block and record it in `assignments` under a name that says what it is.

Report the block and the named ports, and remind the user which ports the dev servers must use.

## Assign a block or a port

An assignment is a write to the home repo. It counts only when it is on the remote default branch of the home repo; until then, another machine can take the same block.

Write only when the home repo checkout is ready for it: it is on the default branch, it has no unpushed commits, nothing is staged, and `ports.json` is unmodified. When any of these fails, or you lack authority to commit or push there, leave everything as it is and report the assignment you propose as unconfirmed. Switching branches, stashing, or committing someone else's changes to make the checkout ready is outside this skill.

1. `git -C <OS folder> pull --ff-only`.
2. Find the project's entry again in the table you just pulled. If another machine added it, use that entry and stop.
3. For a new project, set `start` to `next_available` and `end` to `start + block_size - 1`, then add `block_size` to `next_available`. Key the entry by `slug` when the wiki page exists, otherwise by `repo`.
4. Name the ports the project needs. The usual layout, to adapt freely: `x001` primary web, `x002` second web service, `x050` backend or API, `x060` database or its admin UI, `x070` and up for the rest.
5. `git -C <OS folder> add ports.json` and commit `chore(os): assign ports for <slug or repo>`. Note the commit ID, confirm that `git -C <OS folder> show --stat HEAD` lists `ports.json` alone, then `git -C <OS folder> push`.
6. A push rejected as non-fast-forward means another machine wrote first. If `HEAD` is still your commit and `ports.json` has no change since it, take the commit back: `git -C <OS folder> reset --soft HEAD~1`, then `git -C <OS folder> restore --staged --worktree ports.json`. Start again at step 1.

On any other push failure, or when the checkout changed after your commit, leave everything in place and report it. Run every Git command of this section with `-C <OS folder>`: your shell is still in the project.

## Apply the ports to the project

After an assignment, the project's dev config must use the ports. Change it only when the user asks or agrees:

- **Next.js:** the `--port` flag or the `PORT` variable in the `package.json` scripts
- **Vite:** `server.port` in `vite.config.ts`
- **Payload CMS:** `serverURL` in the config, or `PORT`
- **Custom dev scripts:** find where the port is hardcoded

On `EADDRINUSE`, find the holder with `lsof -i :<port>`, then use the table to tell whose port it is: this project's own stale process, or another project running outside its block.
