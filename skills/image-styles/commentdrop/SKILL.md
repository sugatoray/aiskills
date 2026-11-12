---
name: commentdrop
description: Add simulated social-media comment overlays to a still image in the floating comment-drop style used in video editing. Use when the user invokes /commentdrop or asks for a comment-drop effect on an image.
license: MIT
compatibility: "An image-generation or image-editing tool capable of returning rendered images"
disable-model-invocation: true
metadata:
  name: commentdrop
  type: skill
  author: sugatoray
  version: "1.0.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/image-styles/commentdrop"
---

# Comment drop

Interpret `/commentdrop {{ image + sampleComments | default="auto-generate" }}` as a request to edit an image with floating comment cards. Use the supplied image or, when clearly referenced, the most recent relevant image in the conversation. If no target image is available, ask for one. A separately supplied reference image may guide card styling; do not confuse it with the target.

Use supplied comments faithfully, including usernames and other details when given. Otherwise invent a few short, context-appropriate reactions and fictional handles. Comments are simulated, not evidence of real engagement. Respect any specified number, wording, platform, placement, or style.

By default, add a small set of staggered, floating social-style cards: rounded light rectangles, soft shadows, circular avatars, bold usernames, subtle timestamps, readable comment text, and small heart icons. Make them look like overlay graphics captured from a video edit, not paint on the image. Balance the layout and keep the main subject and important visual features visible; preserve the source image, aspect ratio, and overall composition. Adapt colors and density to the scene or user's preferences.

Use the available image-editing tool to produce and display the edited image. Include the source image and any style reference as inputs. If exact text is important, preserve it as accurately as the tool allows; do not claim verbatim accuracy without verification. Do not present a description alone as the completed result.

See [assets/EXAMPLE.md](assets/EXAMPLE.md) for example `/commentdrop` prompts and their outputs.
