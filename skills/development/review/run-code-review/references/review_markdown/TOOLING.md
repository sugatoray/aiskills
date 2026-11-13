# Markdown tooling

Commands to run during a review, and how to read them. Follow `SKILL.md` step 4: run what the
project already has, don't install into it, and treat output as leads to confirm.

Linters check the form. The findings that matter most (a command that fails, a name that
drifted) come from comparing the document with the repository and from running what it says to
run. **Run a documented command only when it is safe to:** read it first, never run one that
downloads and executes, deploys, deletes, or needs credentials, and prefer a scratch copy or
container.

## Find what the project uses

```bash
ls .markdownlint* .markdownlint-cli2* .lycheeignore lychee.toml .vale.ini cspell.json .cspell.json mkdocs.yml docusaurus.config.* _config.yml .remarkrc* 2>/dev/null
git grep -nE '"(markdownlint[a-z0-9-]*|remark[a-z-]*|markdown-link-check|linkinator|cspell|prettier)"' -- '*package.json'
git grep -nE 'markdownlint|lychee|vale|cspell|mkdocs build|docusaurus build' -- '.github/workflows' '.pre-commit-config.yaml' 2>/dev/null
git grep -nE '<!-- *(BEGIN|START|GENERATED|AUTO-GENERATED|prettier-ignore|markdownlint-disable)' -- '*.md' | head -20   # generated sections and disabled rules
```

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Lint | `npx markdownlint-cli2 "**/*.md" "#node_modules"` | Honours `.markdownlint*` and `.markdownlint-cli2*`. Rule ids are `MDnnn`: MD001 heading increment, MD024 duplicate headings, MD040 fence language, MD045 image alt text, MD051 link fragments. |
| Broken links, offline | `lychee --offline "**/*.md"` | Checks relative file links without the network. Add `--include-fragments` for anchors. |
| Broken links, external | `lychee "**/*.md"`, `npx markdown-link-check README.md` | Rate limits and logins cause false failures; check failures by hand before reporting. |
| Does it render as intended | `npx marked -i file.md -o /tmp/out.html`, `pandoc -f gfm -t html file.md` | Read the HTML or open it. For site content use the project's own build. |
| Docs site build | `mkdocs build --strict`, `npx docusaurus build`, `hugo --printPathWarnings`, `bundle exec jekyll build` | Strict modes turn broken internal links and missing pages into errors. |
| Formatting | `npx prettier --check "**/*.md"` | Only if the project uses Prettier. |
| Spelling and prose style | `npx cspell "**/*.md"`, `vale docs/` | Only with the project's own dictionary or style; otherwise the output is mostly noise. |
| Front matter is valid YAML | `python3 -c "import sys, yaml; print(yaml.safe_load(open(sys.argv[1]).read().split('---')[1]))" file.md` | Needs PyYAML. A rough split: it assumes the file starts with `---` and that no value contains `---`. |
| Secrets in examples | `gitleaks detect --no-git --source docs/`, `trufflehog filesystem docs/` | See `SECURITY.md`. |
| Code samples run | the project's doc tests: `pytest --doctest-glob="*.md"`, `cargo test --doc`, `npx markdown-doctest`, `mdsh`, `cog` | Where there is none, extract and run the samples by hand (below). |

## Checking a document against the repository

```bash
# Paths the document mentions that do not exist
grep -oE '`[A-Za-z0-9_./-]+\.[a-z0-9]+`' README.md | tr -d '`' | sort -u | while read -r p; do
  [ -e "$p" ] || echo "missing: $p"
done

# Relative links to files that do not exist
grep -oE '\]\([^)#: ]+' README.md | sed 's/^](//' | sort -u | while read -r p; do
  [ -e "$p" ] || echo "broken link: $p"
done

# Scripts and options the document names
grep -oE 'npm run [a-z:_-]+' README.md | sort -u            # compare with "scripts" in package.json
git grep -n -- '--some-flag'                                 # does the flag the document names still exist
```

Both loops resolve paths against the current directory: run them from the document's own
folder, and expect false reports for paths meant as examples.

For a code change, search the documentation for what it renamed or removed:

```bash
git diff --name-only origin/main...HEAD                              # what changed
git grep -n 'old_function_name\|--old-flag\|OLD_ENV_VAR' -- '*.md'   # documents that still mention it
```

## Running the samples

Extract the fenced blocks of one language and run or check them in a scratch directory:

```bash
awk '/^```bash$/{f=1;next} /^```$/{f=0} f' README.md > /tmp/readme-commands.sh
bash -n /tmp/readme-commands.sh           # syntax only
shellcheck /tmp/readme-commands.sh        # if available
```

Then read the commands and run the safe ones in order, as a new reader would, from a clean
checkout. Record which were run and which were only read.

## Reading the output

- **A clean lint does not mean the document is right.** No linter knows whether `npm run
  build:all` exists.
- **Lint rules encode one style.** A rule the project switched off is a decision, not a
  finding. A rule disabled inline around one passage deserves a look.
- **Link checkers report what they could not reach,** not only what is broken: private
  repositories, rate limits, sites that block automated requests.
- **Renderers differ.** A file that renders on GitHub can break on a package registry or a
  docs site, especially tables, alerts, raw HTML and relative links. Check on the renderer the
  readers use.

## Reproducing a finding

Quote the line, then show the evidence that contradicts it:

```text
README.md:42 says: npm run build:all
package.json "scripts": build, test, lint        (no build:all)
$ npm run build:all
npm error Missing script: "build:all"
```
