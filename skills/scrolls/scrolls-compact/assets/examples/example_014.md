# /scrolls-compact — Example-14: No scrolls folder

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the `no-scrolls` fixture (a repository with no scrolls folder).

<!--- example:start fixture=no-scrolls --->
## Example-14

A repository with no scrolls folder. Set one up with `/scrolls-setup` first.

### Premise

- The repository has no scrolls folder.

### Caveats

- Set up the scrolls with `/scrolls-setup` first.

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
**Output** (exit 1):

```text
No scrolls folder found under /work/shop. Try -t (repository root) or -r (search recursively). Set one up with /scrolls-setup.
```
<!--- prompt-output:end --->

`-r` searches the whole tree, and finds nothing either:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact -r
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 1):

```text
No scrolls folder found under /work/shop. Set one up with /scrolls-setup.
```
<!--- prompt-output:end --->
<!--- example:end --->
