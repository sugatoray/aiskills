# Stata <-> Python interop

There are three genuinely different directions of travel here, and the
right one depends on which side is driving. Pick based on that, not on
habit — the CSV-roundtrip pattern below works in every direction, which
is exactly why it's usually the wrong default: it loses value labels and
variable formats, and adds an unnecessary disk write/read.

All three require Stata 16.0+ with the Python integration feature
(`python query` inside Stata shows what's configured); the `pystata`
package direction additionally requires Stata 17+, where it ships
bundled. Nothing here needs a Python package beyond what Stata already
installs, except `pandas` for dataframe-shaped work.

## 1. Calling Python *from inside* a `.do` file

Use this when Stata is driving the overall workflow and Python is doing
one step it's better at (a specific library, a plot type, a model class
Stata doesn't have) — the dataset stays "owned" by Stata before and
after.

```stata
* stata-2-py-inline.do
clear all
set more off
sysuse auto, clear

python:
from sfi import Data, Macro
import pandas as pd

# Pull the current Stata dataset into a pandas DataFrame
df = Data.get(var=None, missingval=float('nan'), valuelabel=True, pandas=True)

# Do something Python is better at here — e.g. a quick correlation heatmap
# input, a model class not available in Stata, text processing, etc.
corr_price_weight = df['price'].corr(df['weight'])
Macro.setLocal('corr_price_weight', str(round(corr_price_weight, 4)))
end

display "price/weight correlation from Python: `corr_price_weight'"
```

- `Data.get(..., pandas=True)` needs `pandas` importable by the Python
  interpreter Stata is configured to use (`python query` shows which
  one) — `valuelabel=True` brings value labels across as categorical
  labels rather than raw underlying codes, which matters if the Python
  step needs to read them.
- `Macro.setLocal('name', value)` is the cleanest way to hand a *scalar*
  result back to the `.do` file as a local macro for use in later Stata
  commands (like the `display` above). For a whole column/dataset, use
  `Data.store` (below) instead.
- A `python:` … `end` block is for a few lines inline. For anything
  longer, put the Python in its own `.py` file and run it with `python
  script "helper.py"` instead — keeps the `.do` file readable and the
  Python code independently testable/importable.

**Bad version of the same thing** — writing the dataset to CSV, shelling
out to a separate Python process, reading the CSV back:
```stata
export delimited using "temp_export.csv", replace
shell python3 analyze.py
import delimited "temp_output.csv", clear
```
This works, but throws away value labels and variable formats on the way
out, requires `analyze.py` to reimplement whatever type inference pandas
would otherwise skip, and leaves stray temp files around if the script
errors partway. Reach for it only when the Python step genuinely needs to
run as an independent OS process (a long-running service, a tool with no
Python-callable API) — not as the default for "call some Python."

## 2. Reading Stata's active dataset from Python, modifying it, writing it back

Same direction as #1 in spirit, but framed as "what can Python read from
Stata" rather than "how do I call Python" — useful when most of the logic
is naturally the Python side's job (e.g. an existing Python function you
already have) and Stata is just supplying/receiving the data.

```python
# inside a python: block, or a .py file run via `python script`
from sfi import Data, Macro, SFIToolkit
import pandas as pd
import numpy as np

df = Data.get(var=['price', 'mpg', 'weight'], pandas=True)

# Example: a Python-side transform Stata has no direct equivalent for
df['log_price'] = np.log(df['price'])

# Write a new variable back into the live Stata dataset (same N of obs,
# same row order — sfi writes back by observation index, not by merge key)
Data.addVarDouble('log_price')
Data.store('log_price', None, df['log_price'].tolist())
```
Then, back in Stata (same session, after the `python:` block ends), the
`log_price` variable exists in the dataset just like anything created
with `gen`.

**Footgun to flag:** `Data.store` writes by row position, assuming the
DataFrame's row order still matches the Stata dataset's row order exactly
— never `sort`/reindex the DataFrame between `Data.get` and `Data.store`
without also re-deriving whatever alignment you need, or the values land
on the wrong observations with no error raised.

## 3. Driving Stata *from* a Python script

Use this when Python is the orchestrator — e.g. a larger data pipeline,
a batch job iterating over many input files, or driving Stata as part of
automated/scheduled analysis outside an interactive Stata session.
Two ways to do it, and they suit different situations:

### 3a. `pystata` / `stata_setup` — in-process, dataframe-native

Best when you want tight back-and-forth (run a Stata command, inspect the
result in Python, run another Stata command) inside one Python process,
e.g. a Jupyter notebook or an automated script that needs Stata's
estimation commands but Python for everything around them.

```python
import stata_setup
# Point this at your local Stata installation and edition ('be'/'se'/'mp')
stata_setup.config('/usr/local/stata17', 'se')

from pystata import stata
import pandas as pd

stata.run('sysuse auto, clear')

# Pull the active Stata dataset into a pandas DataFrame
df = stata.pdataframe_from_data()

# ... do pandas-side work ...
df['price_per_lb'] = df['price'] / df['weight']

# Push it back and continue in Stata
stata.pdataframe_to_data(df, force=True)
stata.run('regress price weight mpg price_per_lb')

# Pull a scalar/matrix result back out
r2 = stata.get_return()['r(N)']  # after `summarize`, `regress`, etc. as relevant
```

`force=True` on `pdataframe_to_data` overwrites whatever's currently in
Stata's memory with the DataFrame's contents — omit it (or handle the
prompt) if you specifically want Stata to warn before that happens.

### 3b. Batch mode — separate process, best for pipelines/automation/CI

Best when each run should be a clean, independent Stata invocation (a
scheduled job, a CI step, one `.do` file per input file in a loop) rather
than a long-lived shared session — failures in one run don't poison the
next.

```python
import subprocess

subprocess.run(
    ['stata-se', '-b', 'do', 'analysis.do', 'input_2024.dta'],
    check=True,
)
# Stata writes a matching analysis.log — read it back to check for errors,
# since batch mode doesn't raise a Python exception just because a Stata
# command inside the .do file failed.
with open('analysis.log') as f:
    log = f.read()
if 'r(' in log and 'error' in log.lower():
    raise RuntimeError('Stata batch run reported an error — see analysis.log')
```

- `-b` is batch mode: no interactive window, runs to completion (or until
  a command errors) and exits.
- `check=True` only catches a *process*-level failure (Stata binary
  missing, crashed); a Stata command erroring inside the `.do` file still
  exits the process with status 0 in many configurations, so the log
  check above is what actually catches a failed regression, a bad file
  path, etc. — don't skip it and assume success just because `subprocess`
  didn't raise.
- Pass the input file as a positional argument only if `analysis.do` is
  written to read it from a macro; otherwise hardcode the path inside the
  `.do` file or generate a small per-run `.do` file from a template.

## Choosing between 3a and 3b

| | `pystata`/`stata_setup` (3a) | Batch mode (3b) |
| --- | --- | --- |
| Session lifetime | One shared process across many commands | Fresh process per `.do` file |
| Data exchange | In-memory DataFrame, no disk round-trip | Via files (`.dta`, exported tables) |
| Best for | Interactive/notebook analysis, tight loops | Pipelines, scheduled jobs, CI, many independent inputs |
| Isolation | A crash/bad state can affect later commands in the same session | Each run is independent |
