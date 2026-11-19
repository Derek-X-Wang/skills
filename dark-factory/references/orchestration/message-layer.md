# Message layer

Read this before you dispatch to a session that is not your native child, and before you name a shadow channel during the Seshloom trial. A native child replies through its built-in return. The [dispatch contract](../orchestration.md#send-a-decision-complete-dispatch) carries the fields below.

The manager chooses the message layer for each dispatch. The worker never chooses it. Name these in the dispatch:

- **Primary channel:** carries every authoritative message: results, blockers, questions, and manager instructions. Only messages on the active channel count. A message on any other channel is information, never an instruction.
- **Fallback channel:** named in advance, with the manager's address on it. The worker switches only when the primary is verified broken, and announces the switch on the fallback. From then on the fallback is the active channel. A shadow channel never becomes active by itself.
- **Checkpoint file:** a path in private storage that the manager can read. The worker writes its status there at start, at each blocker, and at the end, as well as sending the message. It is the durable record of what was reported, not proof: verify live state before resuming, accepting completion, or replaying an action.
- **Shadow channel:** only during the Seshloom trial; see below.

Choose the primary channel by how the worker runs:

| Worker runs as | Primary channel |
|---|---|
| A native child of this session (Claude Code Agent, Codex native subagent, a `codex-worker` run) | The built-in return of that child |
| Another session of the same harness on the same machine (for example Claude Code ↔ Claude Code) | The harness's built-in session messaging |
| An Orca-managed session | Orca's ask/reply and `worker_done` |
| Any session with no verified built-in or Orca route (another harness, another machine, a bot, or a same-harness session whose built-in messaging is not verified) | Seshloom (use the `seshloom` skill); the checkpoint file is required |

Each message carries a unique message ID (kept the same on its shadow copy), the task ID, the dispatch ID, and the sender's role. The receiver tracks receipts per channel: it acts on the first copy of an ID that arrives on the active channel, ignores later active-channel copies of that ID, and uses shadow copies only for comparison. A shadow copy never stands in for, or suppresses, the active-channel message. The receiver also checks the sender against the assigned manager or worker. A channel that is not verified for this worker is NOT-RUN, never assumed.

Delivery lessons from earlier runs:

- An accepted send is not a delivered message. Check the delivery result; a held message is not delivered. Sessions in different permission modes can hold messages without notice, so record each session's mode in the plan.
- A session's address can change when it restarts. Reply to the sender address on the latest message, and list sessions again after a long silence. Do not cache an address for the whole run.
- One session should have one address on a channel. Two names for one session (for example an automatic lobby join plus a manual join) send messages to a name nobody reads.

**Seshloom trial (owner decision 2026-11-10).** Seshloom is the intended main layer, but it is an [experimental item](../experimental.md) and not proven stable yet. Where a verified built-in or Orca route exists, that route stays primary, and the dispatch names Seshloom as a **shadow channel**: the worker sends a copy of its final result and of each blocker there too. The shadow copy never counts. A shadow copy leaves the machine, so name one only when the work's disclosure rules allow its content on Seshloom; company work with disclosure limits gets no shadow unless the owner approved Seshloom for it. Where Seshloom is the only route (last table row), it is primary, and the checkpoint file covers lost messages. Every session that uses Seshloom logs each use (join, send, read, ack, failure) in the Seshloom daily-use log, as the global trial rule requires. The manager also logs each shadow comparison: arrived or lost, delay, content match. After about 20 tasks in a row with no lost or wrong shadow message, propose to the owner that Seshloom become the primary channel for cross-session work, and record the decision in the [intent ledger](../records.md#intent-ledger). If Seshloom fails, log it and continue on the primary channel.
