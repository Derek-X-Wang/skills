# Shared Fleet: OS-owned records

Fleet inventory and current machine availability belong to the owner's shared **OS repository**, not a project or session. All Dark Factory roles reference that same source. The project-private root continues to hold project authority, tasks, checkpoints and evidence.

## Locate the source

Read `~/.local/share/dark-factory/machine.json` for the local OS-checkout binding, shared registry/observation references and this machine's verified ID. The [connection template](../assets/templates/machine.json) is disabled and contains no real machine data. If a binding is absent, an already verified OS checkout or the installed Life OS location can help resolve it under existing local-write authority. Confirm the repository identity and record the binding once. Do not create another project-local fleet as a fallback. If the source cannot be resolved, report missing shared inventory; retain existing authorized bounded local work using actual task-specific evidence rather than claiming fleet-wide capacity.

The canonical repository-relative defaults are `fleet/registry.json` and `fleet/observations.json` **inside the OS folder**. Write their resolved absolute references into the machine-local connection record; filesystem references otherwise follow [records](records.md). This machine's OS checkout path is local configuration, not portable fleet identity and not public skill content. An explicitly authorized existing OS fleet layout can be bound instead of duplicated.

## Ownership and data

- **OS `fleet/registry.json`:** stable machine IDs, capabilities, resource limits, permitted routes, shared entitlements and source/publisher ownership. Machine IDs do not derive from project names or session names.
- **OS `fleet/observations.json`:** source-attributed machine availability, load and readiness snapshots, plus applicable quota/consumption observations. Each dynamic record needs its subject ID, publisher/source, observation time and expiry. Missing/stale data is unknown, not available. Availability is not permission or a resource reservation.
- **Optional machine-local resources:** `~/.local/share/dark-factory/machines/<machine-id>/resources.json` can describe authorized local checkouts, caches, datasets and artifact locations. Reference that record from the machine binding where needed. These are local resource locations, not another capability/availability registry. Never copy credentials, cookies or company data into the shared OS records merely to make them discoverable.
- **Project records:** reference fleet machine/route/pool IDs and record only this project's assignments, commitments and task evidence. A copied quota response or task-specific tool check is evidence with provenance/age, not an independent fleet source of truth. Unpublished observations must be labelled as pending/private evidence.

The [fleet](../assets/templates/fleet.json) and [observation](../assets/templates/observations.json) examples describe shared-OS record shapes for an authorized fleet maintainer; project supervisors do not initialize separate copies. Use only data permitted in the OS repository and to its readers. Keep disallowed company metadata in its approved private store, with only an authorized opaque reference if appropriate.

## Publishing and freshness

Use a recorded authorized OS publisher and serialize shared changes. Preserve other machines/pools and reject conflicting updates; a JSON file or Git clone is not a distributed lock. Project supervisors may submit verified deltas through the supported OS update path within existing authority, or retain them as private evidence for the publisher. They do not overwrite another machine's state or widen their role.

Follow the OS repository's synchronization rules. Git pull/push moves snapshots; neither a recent commit nor a reachable checkout proves live availability, and another machine's clone may lag. Evaluate the record's observation/expiry/source and perform required target-specific checks before execution. If publication or freshness cannot be proven, do not call a local cached snapshot globally current. Existing verified wefty or other provider APIs may supply observations; this contract does not install a daemon, poller, transport or new authentication route.

If a live source produces frequent samples, use its supported current observation rather than creating a Git commit per heartbeat. Publish snapshots on the OS's agreed cadence or meaningful change and retain the measurement time. Higher-frequency synchronization is a later verified adapter, not implied by this file layout.

## Legacy local Fleet files

An existing project/local fleet remains evidence during migration, not a second lasting authority. The existing owner and OS publisher reconcile identities and conflicts, publish permitted records, and then switch references. Preserve originals until consumers acknowledge the shared source. Never merge competing machine IDs, freshness claims or availability by last-writer-wins guessing. Project checkpoint migration remains owned by its project supervisor.
