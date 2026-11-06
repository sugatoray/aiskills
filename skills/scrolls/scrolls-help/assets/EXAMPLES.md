# /scrolls-help — Examples

> **Writing rule for this file.** Write it in ASD-STE100 Simplified Technical English, at about 80% conformance. Keep to these rules when you change it:
>
> - Use short sentences: 20 words max for instructions, 25 words max for descriptions.
> - Use the active voice. Use the imperative for instructions.
> - Put one instruction in one sentence.
> - Use simple, approved words. Use one word for one meaning.
> - Prefer bullet points to paragraphs.
> - Put each example in one `## Example: NN — Title` block, with four sections: **Premise**, **Usage**, **Caveats**, **Expected Output**.

These examples show how to use `/scrolls-help` itself. The help content is in `references/HELP.md`. Each scrolls skill has its own `assets/EXAMPLES.md`.

---

## Example: 01 — Show the full reference

### Premise

- You are new to the scrolls skills.

### Usage

```
/scrolls-help
```

### Caveats

- The skill shows `references/HELP.md` as it is. It does not examine your project.
- It does not write a file.

### Expected Output

- The full reference in chat:
  - Quick start
  - The commands
  - Flags
  - Examples
  - How the pieces fit together
  - Troubleshooting

---

## Example: 02 — Ask a specific question

### Premise

- You want to know how to use scrolls in a monorepo.

### Usage

```
/scrolls-help how do I use scrolls in a monorepo?
/scrolls-help what does -r do on scrolls-remove?
```

### Caveats

- The skill gives the related part first. It does not show the full reference.

### Expected Output

- A short answer, for example `/scrolls-setup -p packages/api/docs` and `/scrolls-remove -t -r`.
- A note: run `/scrolls-help` with no text for the full reference.

---

## Example: 03 — Open the reference as a web page

### Premise

- You prefer a formatted page to chat text.

### Usage

```
/scrolls-help -e
/scrolls-help --online
```

### Caveats

- The server listens on `127.0.0.1` only. The OS selects the port.
- The server stops after 30 minutes idle, or after 2 hours in total.
- The page has two toggles: light/dark and colorize/plain.

### Expected Output

```
http://127.0.0.1:41821/
(pid 916 — stop it with: <skill-dir>/scripts/open_help.sh --stop 41821; it also shuts itself down after being idle; log at /tmp/scrolls-help-server.XXXXXX)
```

---

## Example: 04 — Stop the help server

### Premise

- You opened the page with `-e`. You want to stop the server now.

### Usage

```
bash <skill-dir>/scripts/open_help.sh --stop 41821
bash <skill-dir>/scripts/open_help.sh --stop --all
pwsh <skill-dir>/scripts/open_help.ps1 --stop 41821
```

### Caveats

- Each `-e` run starts a new server on a new port.
- `--stop --all` stops all of them.

### Expected Output

```
Stopped server on port 41821 (pid 916)
```

- If no server runs: `No matching running server found.`

---

## Example: 05 — No browser opens

### Premise

- You use a remote or headless machine. It has no display.

### Usage

```
/scrolls-help -e
```

### Caveats

- This is normal. The URL is still correct.
- Open the URL in a browser that can reach the machine.

### Expected Output

- The same URL and PID line as in Example 03.

---

## Example: 06 — Ask a specific question and get the page

### Premise

- You want a short answer now and the full page for later.

### Usage

```
/scrolls-help -e how do I restore the scrolls?
```

### Caveats

- `-e` changes where the full reference goes. A specific question still gets a short answer first.

### Expected Output

- A short answer in chat, for example `/scrolls-restore` and `/scrolls-restore --list`.
- The URL of the full page.
