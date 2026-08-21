# Recipe template

A recipe is a self-contained file for one named, recurring workflow (a
model class, a data-prep pattern, a whole class of analysis) — detailed
enough that following it produces a genuinely runnable script, not just a
description of what the commands roughly do. `ardl.md` is the first one
and follows this structure; use it as the concrete example alongside the
outline below when writing a new one.

## Sections every recipe should have

1. **When to use this** — the plain-language asks that map to this
   recipe, and just as importantly, when something that *sounds* similar
   actually needs a different approach (e.g. ARDL vs. a plain VAR vs. a
   static long-run regression — they get confused for each other often
   enough to be worth one paragraph of "not this when...").

2. **Data shape this assumes** — cross-sectional / panel / time series,
   what `tsset`/`xtset` needs to look like going in, and any precondition
   the method actually requires (e.g. ARDL requires no I(2) variables —
   say what breaks if that's violated, not just that it's a requirement).

3. **A full worked script against a real dataset** — use a dataset that
   ships with Stata (`webuse`/`sysuse`) so the script is actually runnable
   as shown, not a hypothetical `use "yourdata.dta"` with invented
   variable names. Close the recipe with a short note on exactly which
   line(s) to swap for the user's real file and variables — usually just
   the `use`/`webuse` line and the variable names in the model command.

4. **Diagnostics specific to this method** — not a generic "check your
   residuals" but the actual postestimation commands that apply *after
   this specific estimator*, including any gotcha about what does and
   doesn't work directly (see `ardl.md`'s `regstore()`/`estimates
   restore` note for the kind of thing worth flagging).

5. **Common mistakes** — the recipe-specific version of
   `../good-bad-examples.md`: choices that are easy to get wrong
   specifically in this method (arbitrary lag choice instead of a
   selection criterion, wrong significance test for this estimator,
   etc.), each with why it's wrong.

## Writing a new recipe

- Verify command syntax and postestimation availability against the
  actual Stata documentation for the Stata version you're targeting
  (`help <command>`, or the online Stata manuals) rather than pattern-
  matching from a different estimator's usual postestimation menu —
  what's available varies more than it looks.
- Prefer Stata's own bundled example datasets (`webuse`, `sysuse`) over
  inventing one, so the script in the recipe is byte-for-byte runnable.
- Add the new file to the recipe table in `../../SKILL.md` (one row) —
  that's the only place outside `references/recipes/` that needs
  touching; nothing else in the skill references recipes by name.
