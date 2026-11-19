# Home repo: the owner's project list

The owner's **home repository** holds the list of projects, a pointer to each repository, the shared knowledge, and the global agent rules. It is the repository that contains the OS folder of the [shared Fleet](shared-fleet.md). Dark Factory reads it. Project authority, tasks, checkpoints and evidence stay in the project-private root ([records](records.md)); reading the home repo grants no authority over any project.

## Locate it

Read `os_repo_root` in `~/.local/share/dark-factory/machine.json`; the home repo is the repository that contains that folder. Read its root `AGENTS.md` first. That file is the map: where the project list is, where this machine's checkout paths are, and what company information the repo may hold. If the binding is absent, resolve it as [shared Fleet](shared-fleet.md) says, or report the missing home repo.

## Use it

- **Cross-project work starts there.** A factory manager, and any session whose task spans two or more projects, works from the home repo checkout. A project manager works in its own project's checkout.
- **Find a project through its pointer.** The repository URL is the portable identity. The checkout path is per-machine configuration that the home repo's `AGENTS.md` names. Use these; a disk search or a second list drifts. Project records refer to that identity and hold authority and state, not another inventory. Report a project that the list lacks, and add it only within authority to write the home repo, under its sync rules.
- **Open the work the host's way.** With the checkout located, identify the active host and create the workspace or the worker with that host's own mechanism, as [build the capability graph](orchestration.md#build-the-capability-graph) and its runtime references say. A route in the [experimental registry](experimental.md) keeps its registry limits.
- **Company projects.** The home repo records where company things are and how to work on them, under the line in its `AGENTS.md`. A company repository's own rules and skills come first inside it. Pull-request sweeps and review feedback follow the company workflow ([Bite workflow](bite-workflow.md)); other company work follows that repository's own instructions.
- **Write lessons back.** A lesson that other projects can reuse goes into the home repo's shared knowledge through its own skill, within existing authority. Project state does not.
