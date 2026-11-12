# /scrolls-explainer — Examples

> **Writing rule for this file.** Write it in ASD-STE100 Simplified Technical English, at about 80% conformance. Keep to these rules when you change it:
>
> - Use short sentences: 20 words max for instructions, 25 words max for descriptions.
> - Use the active voice. Use the imperative for instructions.
> - Put one instruction in one sentence.
> - Use simple, approved words. Use one word for one meaning.
> - Prefer bullet points to paragraphs.
> - Put each example in one `## Example: NN — Title` block, with four sections: **Premise**, **Usage**, **Caveats**, **Expected Output**.

These examples show how to use `/scrolls-explainer`. The skill is installed under `/work/aiskills/skills/scrolls/`. The examples that make a copy run in a folder named `/tmp/my-project`. The script output below is from real runs. Each scrolls skill has its own `assets/EXAMPLES.md`.

---

## Example: 01 — Show the page

### Premise

- You want to see how the scrolls commands work.

### Usage

```
/scrolls-explainer
/scrolls-explainer --show
```

### Caveats

- The two commands are the same.
- The skill opens the page that comes with the skill. It writes no file.
- It does not read or change your scrolls.
- On a headless machine, no browser can open. The skill gives you the URL.

### Expected Output

```
scrolls-explainer 2.5.0: /work/aiskills/skills/scrolls/scrolls-explainer/assets/scrolls-explainer.html
open: file:///work/aiskills/skills/scrolls/scrolls-explainer/assets/scrolls-explainer.html
```

- The page opens in your default browser. The agent tells you how to use the tabs and keys.

---

## Example: 02 — Make a copy of the page

### Premise

- You want your own copy of the page, for example to put in `docs/` or to send to your team.

### Usage

```
/scrolls-explainer -o .
/scrolls-explainer -o docs/
/scrolls-explainer --output docs/scrolls/how-it-works.html
```

### Caveats

- `-o .` writes `./scrolls-explainer.html` in the current folder.
- A path that ends in `/`, or a folder that exists, gets the default file name.
- The script makes missing folders.

### Expected Output

```
scrolls-explainer 2.5.0: wrote /tmp/my-project/scrolls-explainer.html
open: file:///tmp/my-project/scrolls-explainer.html
```

---

## Example: 03 — Copy it again

### Premise

- The copy is already in the folder, and it is the same version.

### Usage

```
/scrolls-explainer -o .
```

### Caveats

- The script does not write the file again. This is not an error.

### Expected Output

```
scrolls-explainer 2.5.0: /tmp/my-project/scrolls-explainer.html is already up to date
open: file:///tmp/my-project/scrolls-explainer.html
```

---

## Example: 04 — A different file has the same name

### Premise

- `docs/scrolls-explainer.html` exists, but it is a different file (for example, an older version or your own notes).

### Usage

```
/scrolls-explainer -o docs/
```

### Caveats

- The script does not overwrite the file. It stops with exit code 3.
- The agent asks you before it uses `-f`.

### Expected Output

```
explain: /tmp/my-project/docs/scrolls-explainer.html already exists and is different; pass -f to overwrite it, or -o to write elsewhere.
```

---

## Example: 05 — Replace an old page

### Premise

- You have a page from an older version of the scrolls skills.
- You want the current page.

### Usage

```
/scrolls-explainer -o docs/ -f
```

### Caveats

- `-f` replaces the file. Use it only for a file that you do not need.

### Expected Output

```
scrolls-explainer 2.5.0: wrote /tmp/my-project/docs/scrolls-explainer.html
open: file:///tmp/my-project/docs/scrolls-explainer.html
```

---

## Example: 06 — Make a copy and open it

### Premise

- You want a copy in `docs/`, and you want to look at it now.

### Usage

```
/scrolls-explainer -o docs/ --open
```

### Caveats

- `--open` goes with `-o`. Without `-o`, the skill opens the page that comes with the skill.
- On a remote or headless machine, no browser can open. The script tells you, and the exit code is still 0.

### Expected Output

- The script writes the copy, then opens it in your default browser.
- On a headless machine, the script also prints:

```
could not open a browser here; open it by hand with the URL above.
```

---

## Example: 07 — Use the page from the keyboard

### Premise

- The page is open in a browser.

### Usage

- Press `1` to show `/scrolls-setup`.
- Press `→` to go to the next step. Press `←` to go back.
- Press `]` for the next tab. Press `[` for the previous tab.
- Press `Space` to pause or continue. Press `R` to start the tab again.
- Press `?` to see all the keys. Press `Esc` to close the panel.

### Caveats

- An arrow key also pauses the animation, so you can read the callout.
- The keys do nothing while you hold Ctrl, Alt or Cmd.

### Expected Output

- A callout appears next to each file that the command changes. It shows the step number, a title and a short explanation.

---

## Example: 08 — Show the version

### Premise

- You want to know which version of the page the skill writes.

### Usage

```
/scrolls-explainer --version
```

### Caveats

- The page has the same version as all the other scrolls skills.

### Expected Output

```
scrolls-explainer 2.5.0
```

---

## Example: 09 — Use -f without -o

### Premise

- You give `-f`, but you do not give `-o`.

### Usage

```
/scrolls-explainer -f
```

### Caveats

- Without `-o`, the skill copies nothing. So there is nothing to overwrite.
- The script stops with exit code 2.

### Expected Output

```
explain: -f only goes with -o: without -o nothing is copied, so there is nothing to overwrite
Run with -h for usage.
```

---

## Example: 10 — Rebuild the page from the skills

### Premise

- The scrolls skills changed, or you want to make sure that the page agrees with them.

### Usage

```
/scrolls-explainer --build
/scrolls-explainer --build --show
```

### Caveats

- `--build` needs the `network-flow` skill. Install it next to this skill if the build cannot find it (exit code 5).
- The build changes only the page in this skill's `assets/` folder.
- `--build` alone makes no copy. Add `--show` to open the result, or `-o` to also copy it.

### Expected Output

- When the page already agrees with the skills:

```
skills in /work/aiskills/skills/scrolls: scrolls-explainer, scrolls-help, scrolls-hide, scrolls-remove, scrolls-restore, scrolls-setup, scrolls-unhide, scrolls-update
unchanged: /work/aiskills/skills/scrolls/scrolls-explainer/assets/scrolls-explainer.html already matches the skills (scrolls 2.5.0)
```

---

## Example: 11 — A skill changed since the last review

### Premise

- Somebody changed `scrolls-update/SKILL.md`. The text on the `/scrolls-update` tab can be out of date.

### Usage

```
/scrolls-explainer --build
```

### Caveats

- The build stops (exit code 4). It writes nothing.
- The agent reads the changed `SKILL.md`, and changes the tab text if necessary. Then it runs `--build --reviewed`.
- A version change only does not stop the build.

### Expected Output

```
explain --build: stopped, nothing written.
- SKILL.md changed since the page was last reviewed: scrolls-update. Check that each one's tab still says what the skill does (edit assets/explainer-graph.json if not), then run --build --reviewed.
```

- After the review, `--build --reviewed` prints:

```
recorded the reviewed SKILL.md fingerprints in assets/explainer-graph.json
```

---

## Example: 12 — A skill is switched off

### Premise

- The maintainers switched off `/scrolls-hide`: its `SKILL.md` is now `SKILL.md.deprecated`.

### Usage

```
/scrolls-explainer --build
```

### Caveats

- The page loses the `/scrolls-hide` tab and its block.
- A skill folder that is missing is different: the build stops (exit code 4). Install the skill again.

### Expected Output

```
skills in /work/aiskills/skills/scrolls: scrolls-explainer, scrolls-help, scrolls-hide (off), scrolls-remove, scrolls-restore, scrolls-setup, scrolls-unhide, scrolls-update
dropped the /scrolls-hide tab: scrolls-hide is deactivated (SKILL.md.deprecated)
wrote /work/aiskills/skills/scrolls/scrolls-explainer/assets/scrolls-explainer.html (scrolls 2.5.0)
```
