# Markdown security review

The security scope for Markdown: READMEs, documentation, changelogs, runbooks, and the
instruction files that coding agents read. It is read for the security pass of a full
review, and on its own, with `WISDOM.md`, when the review runs with `-s`/`--security`. Rate
findings with `../SEVERITY.md` and report them with `../REPORT_TEMPLATE.md`.

## Scope

In scope: secrets and internal detail in prose and examples, instructions that lead a
reader to run unsafe commands or weaken a control, raw HTML and links where the renderer
does not sanitise, links and images that reach other hosts, and text aimed at an automated
reader (prompt injection).

Establish first:

- **Who reads it, and what they do with it.** Documentation is executed by people: a
  command in a README is copied into a terminal, often as an administrator. Instruction
  files (`AGENTS.md`, `CLAUDE.md`, `SKILL.md`, rules files) are executed by agents with
  access to the repository and its credentials.
- **Where it is rendered.** GitHub and GitLab sanitise raw HTML. A static site generator, a
  wiki, an in-app help viewer or a Markdown-to-HTML library with raw HTML enabled may not.
- **Who can change it.** A file editable through a pull request from a fork, a wiki page or
  user-submitted content is untrusted input to whatever renders or obeys it.

## Where untrusted data enters

- Markdown submitted by users and rendered in an application: comments, issues, profiles.
- Documentation changes from outside contributors.
- Content included at build time from other repositories, packages or URLs.
- Front matter and directives that a site generator evaluates.
- Third-party instruction files, skills and rules that an agent is asked to follow.

## Checks

### Secrets and internal detail

- **Real credentials in examples:** API keys, tokens, passwords, connection strings,
  private keys, session cookies, signed URLs. Removing the line is not the fix: the secret
  is in the history, so it must be revoked and replaced. Examples should use obvious
  placeholders (`<YOUR_API_KEY>`, `sk-…example`).
- **Internal host names, IP addresses, bucket and account identifiers, employee names,
  ticket links and customer data** in a file that is or may become public.
- **Screenshots and terminal recordings** that show any of the above, including in
  address bars, shell prompts and environment dumps.
- **Output pasted from a real system:** logs, `env`, `kubectl describe`, stack traces.

### Instructions that put the reader at risk

- **Download-and-run:** `curl … | sh`, `iwr … | iex`, `bash <(curl …)`, especially with
  `sudo`, over `http://`, or from a branch or other mutable URL. Prefer a pinned version
  with a checksum or signature check, or a package manager.
- **Steps that disable a control:** `--insecure`, `-k`, `verify=False`,
  `NODE_TLS_REJECT_UNAUTHORIZED=0`, `--no-verify`, `--allow-root`, `chmod 777`,
  `Set-ExecutionPolicy Bypass`, turning off a firewall, SELinux or certificate checks,
  disabling branch protection or signing. If one is unavoidable, the text must say why,
  limit its scope and say how to undo it.
- **Commands that are destructive without saying so:** `rm -rf`, `git push --force`,
  `git clean -fdx`, `DROP`, `terraform destroy`, `docker system prune -a`, with a path or
  target the reader is expected to fill in.
- **Advice to put secrets where they leak:** on a command line, in a URL, in a committed
  `.env`, in a build argument, in a public CI variable.
- **Insecure defaults presented as the way to run it:** default passwords, binding to
  `0.0.0.0`, debug mode, wildcard CORS, an example configuration with authentication off.
- **Unpinned installs** (`pip install pkg`, `npm i -g pkg`, an action referenced by branch)
  in instructions for production or CI use.
- **Commands containing characters that do not show:** zero-width and bidirectional
  control characters, or look-alike letters in a package or host name, so that what is
  pasted differs from what is read.

### Raw HTML and links

- **Raw HTML where the renderer does not sanitise:** `<script>`, event attributes,
  `<iframe>`, `<object>`, `<form>`, `<style>`, `<meta http-equiv>`. Find out whether raw
  HTML is enabled and whether a sanitiser runs after rendering, not before.
- **`javascript:`, `data:` and `vbscript:` link targets,** including in reference-style
  definitions and autolinks. Most Markdown libraries pass them through unless told not to.
- **Rendered Markdown inserted into a page** with `innerHTML` or an escaping bypass: the
  finding belongs to the application, and the HTML and JavaScript scopes apply.
- **Link text that shows one destination and goes to another,** links to look-alike
  domains, and links to resources whose owner can change (an expired domain, a deleted
  account, an unpinned gist).
- **Remote images** disclose each reader's address and client to the host, and can be
  swapped after review. In documentation shown inside an authenticated application this is
  a tracking and content-spoofing channel.

### Text aimed at an automated reader

Instruction files and any Markdown an agent will read are reviewed as code that the agent
executes.

- **Instructions that do not belong to the file's purpose:** to send data elsewhere, read
  credentials, fetch and run a remote script, alter CI, approve or merge, or ignore earlier
  or higher-priority instructions.
- **Text a human reviewer does not see but a model does:** HTML comments, collapsed
  `<details>`, link titles, image alt text, white-on-white HTML, zero-width characters,
  content after long runs of blank lines.
- **Instructions inside quoted data:** an example, a log or a fetched page that addresses
  the reader directly. Data stays data; say so in the file where it is not obvious.
- **Scope creep in permissions:** an instruction file that grants a tool broader access,
  or tells the agent to skip confirmation, tests or review.
- **Remote includes:** instructions to fetch further instructions from a URL at run time.

### Site generators and front matter

- **Front matter and directives that execute:** template expressions, includes of
  arbitrary paths, shortcodes or plugins that run code or read files at build time, when
  the content author is not trusted.
- **Build output that publishes more than intended:** drafts, internal sections, files
  matched by a broad glob.

## Tools

| Purpose | Command | Notes |
| --- | --- | --- |
| Secrets | `gitleaks detect --no-git --source .` | Run over history too (`gitleaks detect`) when a secret was removed rather than revoked. |
| Download-and-run and disabled controls | `git grep -nE 'curl[^\|]*\|\s*(sudo )?(ba)?sh\|wget[^\|]*\|\s*(ba)?sh\|iwr[^\|]*\|\s*iex\|--insecure\|curl[^\n]* -k\b\|verify=False\|--no-verify\|chmod (-R )?777\|ExecutionPolicy +Bypass\|TLS_REJECT_UNAUTHORIZED' -- '*.md' '*.markdown'` | Read each hit in context. |
| Raw HTML and script-bearing links | `git grep -niE '<(script\|iframe\|object\|embed\|form\|style\|meta)\b\|\son[a-z]+=\|\]\((javascript\|data\|vbscript):' -- '*.md' '*.markdown'` | Then check how the renderer treats them. |
| Hidden text | `git grep -nE '<!--' -- '*.md'`, and `grep -nP '[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2066}-\x{2069}\x{FEFF}]' file.md` | The second needs GNU `grep -P` in a UTF-8 locale. |
| Remote images and plain-HTTP links | `git grep -nE '!\[[^]]*\]\(https?://\|\]\(http://' -- '*.md' '*.markdown'` | |
| What the renderer does with raw HTML | render a three-line probe with the project's renderer and read the output | Confirms sanitising instead of assuming it. |
| Internal names | `git grep -niE '\.internal\b\|\.corp\b\|\b10\.[0-9]+\.[0-9]+\.[0-9]+\b\|\b192\.168\.' -- '*.md'` | Adapt to the organisation's naming. |

## What this review does not establish

It reads the files. It does not test the site or application that renders them, so
sanitising is confirmed only where the renderer was run. It does not check that every
documented command is safe on every reader's machine, or that a linked third-party resource
is trustworthy beyond what the link shows.
