# Mode: Structured debate

Two (or more) teammates argue opposing positions on a design decision; the lead synthesises the arguments and decides. Useful when the right answer needs adversarial pressure — when you suspect you're missing the case for the other side, and a single "balanced" agent would just hedge.

## When to use

- A design decision with two (or more) genuinely defensible options where the tradeoff is non-obvious.
- You're about to make the call yourself and want a sanity check from agents who must commit to a position.
- Time-bound — debates should be one or two rounds, not an open-ended thread.

## When NOT to use

- Decisions with an obviously correct answer. The exercise is performative.
- Decisions where you've already made up your mind and just want validation. The dissenting agent will be wasted effort.
- Implementation work — debate is for choosing between options, not building.

## Topology

```
team-lead (you, the synthesiser)
├── advocate-A   (argues for option A; never wavers)
└── advocate-B   (argues for option B; never wavers)
```

Three-way debates are possible but get noisy fast. Default to two.

## Setup sketch

1. Frame the question crisply (one sentence).
2. List the two options with one-paragraph descriptions each.
3. Spawn two teammates with role definitions like:

   ```markdown
   ---
   name: advocate-a
   description: Argues for Option A in a structured debate. Steelmans A; never argues for B.
   ---

   You are advocating for Option A: <description>.

   Your job is to make the strongest possible case for A. Do not hedge, do not concede. If your peer (advocate-b) makes a point that has merit, refute it from A's perspective or absorb it into A's framing. The team-lead will synthesise; your job is to give them the best version of A's argument.

   ## Required reading
   - <relevant docs>

   ## Communication protocol
   - First turn: state your case in ~250 words.
   - Subsequent turns: respond to advocate-b's most recent argument.
   - When the team-lead says CLOSING, give a final ~150-word summary.
   ```

   Mirror for advocate-b.

4. Run two rounds (opening + rebuttal) plus a closing summary from each.
5. Lead synthesises and decides.

## Cross-references

- Parent: [SKILL.md](../SKILL.md)
- Related: `grill-me` / `grill-with-docs` skills (structured interrogation, single-agent flavor)
