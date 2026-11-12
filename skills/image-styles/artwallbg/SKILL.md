---
name: artwallbg
description: Create a vivid illustrated image of a subject in front of a huge spray-painted wall. Use when the user invokes /artwallbg or requests this art-wall background visual.
license: MIT
compatibility: "An image-generation or image-editing tool capable of returning rendered images"
disable-model-invocation: true
metadata:
  name: artwallbg
  type: skill
  author: sugatoray
  version: "1.0.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/image-styles/artwallbg"
---

# Art wall background

Interpret `/artwallbg {{ context }}` as `/visualize [[ {{ context | default="a girl" }} in front of a huge wall painted with spray paint. Create a vivid illustrated scene with the scale of the wall as the focal point. ]]`. Treat context as the subject or scene details, and default to a girl when omitted. Honor additional user-specified style, aspect ratio, composition, and content details.

Generate and display the actual image using the available image-generation tool, rather than merely writing a prompt or describing it. Make the wall monumental relative to the subject, with visible spray-paint art and a vivid illustrated scene. Avoid adding text unless requested.

See [assets/EXAMPLE.md](assets/EXAMPLE.md) for example `/artwallbg` prompts and their outputs.
