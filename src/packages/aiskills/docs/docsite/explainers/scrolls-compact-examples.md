# Browse the scrolls-compact examples

[scrolls-compact](../skills/scrolls-compact.md) condenses the old history in a project's scrolls and keeps the full text in git, at a checkpoint. The page below holds its 23 worked examples, one tab each. Every flag, refusal and exit code is shown on one small demo repository. Every output is real: a test replays each example against the skill's script and fails on any difference.

<iframe data-page="scrolls-compact-examples.html" title="The scrolls-compact worked examples, one tab each" loading="lazy" style="width:100%;height:880px;border:1px solid #2f3336;border-radius:12px;background:#000000"></iframe>

[Open the examples full-size](scrolls-compact-examples.html) (full screen; close it with ✕ or `Esc`)

## How to use it

- **Start on the Index tab.** Its table lists every example, what it shows, and the state it starts from. Click an example to open its tab.
- **Pick a tab** (`01`–`23`), or choose an example from **Jump to**. **Previous** and **Next** step through them in order.
- **Read the Note box first.** It holds the example's *Premise* (the situation) and *Caveats* (what to watch for). Then come the prompt you type and the output you get.
- **Follow the links.** *← All examples* goes back to the Index. *Starts from* opens the example whose state this one continues.
- **Switch to Markdown** to see an example's file exactly as it ships.

The page loads [marked](https://marked.js.org/) from cdnjs to render the Markdown. Offline, it shows the files as plain text, and the tabs still work.

## Get it with the skill

The page ships with the skill as `assets/example-viewer.html`, next to the Markdown files it is built from: `assets/EXAMPLES.md` (the index) and `assets/examples/example_001.md`–`example_023.md`. After `aiskills install -s scrolls-compact` (or `aiskills install -G scrolls`), open it from the installed skill's folder, or ask your agent to show you an example.
