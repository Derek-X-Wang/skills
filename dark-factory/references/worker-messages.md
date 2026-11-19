# Worker messages

Read this when your dispatch names a fallback channel, a checkpoint file, or a shadow channel, or when you are not a native child of your manager. [Worker mode](worker.md#messages) holds the primary and one-message channels.

- **Fallback channel:** switch to it only when the primary is verified broken. Announce the switch there, with the reason. From then on, it is the active channel.
- **Checkpoint file:** write your status at start, at each blocker, and at the end, as well as sending the message. If no channel works, stop, leave the status in the file, and wait. Do not contact anyone else.
- **Shadow channel** (when named, usually Seshloom): send a copy of your final result and of each blocker. It is a test copy; it never replaces or becomes the active channel. Send it only when your dispatch allows it for this work, because the copy leaves the machine. If it fails, note it in your result and continue; a shadow failure never makes you wait.

Give every message a unique message ID (use the same ID on its shadow copy), plus the task ID, the dispatch ID, and your role. A send that was only accepted or held is not delivered: check the delivery result. Reply to the address on your manager's latest message; addresses can change when a session restarts.
