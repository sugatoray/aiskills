# /scrolls-compact — Example-15: Not a git repository

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the `no-git` fixture (a plain folder).

<!--- example:start fixture=no-git --->
## Example-15

Not a git repository. The old text has to live in git, so the skill needs one.

### Premise

- The folder is not a git repository.

### Caveats

- The old text must live in git. The skill needs a repository.

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 2):

```text
Not inside a git repository. /scrolls-compact keeps old history in git, so it needs one.
```
<!--- prompt-output:end --->
<!--- example:end --->
