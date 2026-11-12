# /scrolls-explainer — Examples

> **Writing rule for this file.** Write it in ASD-STE100 Simplified Technical English, at about 80% conformance. Keep to these rules when you change it:
>
> - Use short sentences: 20 words max for instructions, 25 words max for descriptions.
> - Use the active voice. Use the imperative for instructions.
> - Put one instruction in one sentence.
> - Use simple, approved words. Use one word for one meaning.
> - Prefer bullet points to paragraphs.
> - Put each example in one `## Example: NN — Title` block, with four sections: **Premise**, **Usage**, **Caveats**, **Expected Output**.

These examples show how to use `/scrolls-explainer`. The examples run in a folder named `/tmp/my-project`. The script output below is from real runs. Each scrolls skill has its own `assets/EXAMPLES.md`.

---

## Example: 01 — Make the page in the current folder

### Premise

- You want to see how the scrolls commands work.
- You do not have the page yet.

### Usage

```
/scrolls-explainer
```

### Caveats

- The skill writes one file: `./scrolls-explainer.html`.
- It does not read or change your scrolls.
- The agent can write the page to its own output folder instead, if the host has one.

### Expected Output

```
scrolls-explainer 2.5.0: wrote /tmp/my-project/scrolls-explainer.html
open: file:///tmp/my-project/scrolls-explainer.html
```

- The agent gives you the path and tells you how to use the tabs and keys.

---

## Example: 02 — Write the page to a folder

### Premise

- You keep documents in `docs/`.

### Usage

```
/scrolls-explainer -o docs/
/scrolls-explainer --output docs/scrolls/how-it-works.html
```

### Caveats

- A path that ends in `/`, or a folder that exists, gets the default file name.
- The script makes missing folders.

### Expected Output

```
scrolls-explainer 2.5.0: wrote /tmp/my-project/docs/scrolls-explainer.html
open: file:///tmp/my-project/docs/scrolls-explainer.html
```

---

## Example: 03 — Run it again

### Premise

- The page is already in the folder, and it is the same version.

### Usage

```
/scrolls-explainer
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

## Example: 06 — Open the page in a browser

### Premise

- You work on a computer with a display.

### Usage

```
/scrolls-explainer --open
```

### Caveats

- On a remote or headless machine, no browser can open. The script tells you, and the exit code is still 0.

### Expected Output

- The page opens in your default browser.
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
