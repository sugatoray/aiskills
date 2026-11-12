# Maintaining artwallbg

- `../SKILL.md` defines the invocation and output contract.
- `../README.md` documents installation and usage.
- `../agents/openai.yaml` supplies interface metadata.
- `../CHANGELOG.md` records releases; keep its version aligned with the skill frontmatter.

Validate frontmatter and agent YAML, verify the group plugin and marketplace JSON, and forward-test typical and default invocations with an image tool when available. Keep the group manifest and marketplace registration consistent with skill names and paths. Do not claim generated results were checked without running the image tool.
