# Parallel research

Use this pattern for read-only investigation across natural code, document, data, or system boundaries.

## Setup

1. Define the decision the research must support.
2. Split the question by natural ownership boundary, not by arbitrary file count.
3. Give each researcher a precise question, scope, source priority, and return format.
4. Require source locations, commands or queries used, findings, uncertainty, and unresolved contradictions.

Researchers can share a checkout when every task is read-only. Do not grant write authority by convenience.

## Topology

```text
                ┌─ frontend question
orchestrator ───┼─ backend question
                └─ infrastructure question
```

Each researcher reports only to the orchestrator. The orchestrator compares evidence, resolves terminology, and distinguishes direct observations from inferences.

Use a return table when several researchers contribute:

| Question | Finding | Evidence | Confidence or limit |
| --- | --- | --- | --- |

Do not use this pattern when a few focused searches can answer the question locally.
