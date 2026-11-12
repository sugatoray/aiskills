# Severity, confidence and verdict

Every finding carries one severity and one confidence. The verdict follows from them.

## Severity

Severity is the cost if the code ships as it is, weighed by how likely that cost is. Judge it on
the actual system (who calls this, with what data, how often), not on the worst case imaginable.

| Severity | Meaning | Typical examples | Effect on the verdict |
| --- | --- | --- | --- |
| `blocker` | Must be fixed before merge. Ships a defect with serious or hard-to-undo consequences. | Wrong results on a main path; data loss or corruption; injection, auth bypass, leaked secret; a crash on ordinary input; a migration that locks or breaks production; a breaking change to a public interface with no migration path | Request changes |
| `major` | Should be fixed before merge. A real defect or risk with a narrower trigger or a contained blast radius. | A mishandled edge case that real input reaches; a race that needs concurrent load; missing timeout, cleanup or error handling on a path that fails in production; an N+1 or quadratic path on data that grows; no test for the risky part of the change | Request changes, unless the author and reviewer agree to a tracked follow-up |
| `minor` | Worth fixing; safe to merge without. | Unclear names or structure that will cost the next reader; duplicated logic; a weak or missing test on a low-risk path; a missed idiom that makes a bug more likely later | Approve with comments |
| `nit` | Optional polish. The author may ignore it. | A slightly better name; a simpler expression; a comment typo | None |

Rules for choosing:

- **When torn between two levels, describe the trigger.** If you can write the input or timing
  that causes harm and it is plausible in production, take the higher level. If the trigger is
  hypothetical, take the lower one.
- **Reach raises severity.** The same bug is worse in a library used by many callers, a hot
  path, a migration, or anything that can't be rolled back.
- **Style is never above `minor`,** and never a finding at all if a formatter or linter the
  project runs would settle it.
- **Don't inflate to be heard, and don't deflate to be polite.** Both make the next report
  harder to trust.

Two more labels are not severities:

- `question` — you need an answer to judge the code ("is `user_id` validated upstream?"). Ask it
  as a question, with the severity it would become if the answer is no.
- `pre-existing` — a problem that was already there. Report it in its own section with the
  severity it would have, so it can be tracked, but leave it out of the verdict unless the
  change makes it worse or newly reachable.

## Confidence

| Confidence | You have | How to write it |
| --- | --- | --- |
| `confirmed` | Reproduced it, or traced the whole path through the code | State it as fact, and say how you confirmed it |
| `likely` | Read the code and it does this; you haven't exercised it and haven't seen every caller | State it, and name what would settle it |
| `to verify` | A sign of a problem that depends on something you couldn't see (config, a caller in another repo, production data) | Say exactly what to check, and what the finding becomes either way |

A `blocker` should be `confirmed` or `likely`. If the best you have is `to verify`, write it as a
`question` and say it would be a blocker.

## Verdict

One of three, stated on the first line of the report:

| Verdict | When |
| --- | --- |
| **Request changes** | At least one `blocker`, or `major` findings that aren't agreed follow-ups |
| **Approve with comments** | No `blocker` or unresolved `major`; there are `minor` findings or questions worth the author's time |
| **Approve** | Nothing above `nit` |

If the review couldn't cover enough to judge (large parts unread, the code wouldn't build, key
context missing), don't pick one of the three by default: say **No verdict**, and state what is
needed to give one.
