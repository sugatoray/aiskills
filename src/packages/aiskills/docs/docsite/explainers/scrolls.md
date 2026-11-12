# See how the scrolls skills work

The scrolls skills give a project a memory that lasts between agent sessions: a few Markdown files in `docs/.scrolls/`, and short pointer files (`AGENTS.md`, `CLAUDE.md`, `SCROLLS.md`) that lead every new session to them. The page below shows what each `/scrolls-*` command does to those files, step by step.

<iframe src="scrolls-explainer.html" title="How the scrolls-* skills work: an interactive explainer" loading="lazy" style="width:100%;height:880px;border:1px solid #2a3440;border-radius:10px;background:#060809"></iframe>

[Open the explainer full-size](scrolls-explainer.html)

## How to use it

- **Pick a tab.** *Overview* shows every command and file at once. *New session* shows how a fresh agent session finds the memory. Each command tab (`/scrolls-setup`, `/scrolls-update`, `/scrolls-hide`, `/scrolls-unhide`, `/scrolls-remove`, `/scrolls-restore`, `/scrolls-help`) plays what that command does.
- **Read the callout.** It sits next to the file being touched, with the step number, a title and a short explanation. Its ‹ › buttons step back and forward and pause the animation.
- **Use the keyboard.** Click inside the page first, then:

  | Keys | What they do |
  | --- | --- |
  | `→` / `←` | Next / previous step (pauses autoplay) |
  | `Home` / `End` | First / last step of the tab |
  | `]` / `[` or `Shift`+`→` / `←` | Next / previous tab |
  | `0`–`8` | Jump to a tab (`0` is Overview) |
  | `Space` or `P` | Pause / resume |
  | `R` | Replay the tab |
  | `?` | Show every shortcut |

- **Click a block** to see what it is and trace its connections. Click it again, or press `Esc`, to clear.

The page works offline and makes no network requests.

## Get it with the skill

The page ships with the [scrolls-explainer](../skills/scrolls-explainer.md) skill. After `aiskills install -G scrolls` (or `aiskills install -s scrolls-explainer`), run it from your agent:

```text
/scrolls-explainer            # open the page that ships with the skill
/scrolls-explainer -o docs/   # copy it into your project
/scrolls-explainer --build    # regenerate it from the scrolls skills you have
```

For the exact flags of every scrolls command, see [scrolls-help](../skills/scrolls-help.md).
