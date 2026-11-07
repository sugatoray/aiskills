// The docs and banner themes, the default (Lights Out) first: one list, used by build-docs-html.mjs (the gear
// menu at the top right of docs/docsite/index.html) and create-banner.mjs (the
// gear menu in the banner editor's toolbar).
//
// "teal" is the base design in docs-template.html and banner-template.html, so
// it needs no rules of its own. Every other theme sets the page's colour and
// font variables for light and dark, and the banner's colours. Lights Out also
// restyles parts of the page (LIGHTS_OUT_CSS).
//
// Used only to build the docs and the banner, so it is not published.

export const DEFAULT_THEME = "lightsout";

export const THEMES = [
  {
    "id": "lightsout",
    "name": "Lights Out",
    "blurb": "X-style pure black with shadcn zinc: frosted header, pill tabs, hairline borders, one blue. Geist throughout.",
    "swatch": [
      "#1d9bf0",
      "#e7e9ea",
      "#000000"
    ],
    "fonts": {
      "display": "\"Geist\", system-ui, sans-serif",
      "body": "\"Geist\", system-ui, sans-serif",
      "mono": "\"Geist Mono\", ui-monospace, monospace"
    },
    "googleFonts": "family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600",
    "light": {
      "bg": "#ffffff",
      "surface": "#fafafa",
      "surface2": "#f4f4f5",
      "fg": "#09090b",
      "muted": "#66666e",
      "line": "#e4e4e7",
      "accent": "#0f6cbd",
      "accentSoft": "#e8f2fc",
      "accentFg": "#ffffff",
      "codeBg": "#fafafa",
      "codeFg": "#09090b",
      "kw": "#a626a4",
      "str": "#1a7f37",
      "num": "#b35900",
      "com": "#71717a",
      "attr": "#0f6cbd",
      "fn": "#4b3fd1"
    },
    "dark": {
      "bg": "#000000",
      "surface": "#0a0a0b",
      "surface2": "#16181c",
      "fg": "#e7e9ea",
      "muted": "#8b9096",
      "line": "#2f3336",
      "accent": "#1d9bf0",
      "accentSoft": "#071d2c",
      "accentFg": "#031321",
      "codeBg": "#0a0a0b",
      "codeFg": "#e7e9ea",
      "kw": "#c792ea",
      "str": "#7ee2b8",
      "num": "#f9c97c",
      "com": "#6e767d",
      "attr": "#1d9bf0",
      "fn": "#82aaff"
    },
    "banner": {
      "bg": "#000000",
      "a": "#1d9bf0",
      "b": "#e7e9ea",
      "term": "#0a0a0b",
      "line": "#2f3336",
      "glowA": "29,155,240",
      "glowB": "120,86,255",
      "darkInkA": "#0f6cbd",
      "darkInkB": "#a626a4"
    }
  },
  {
    "id": "teal",
    "name": "Teal (current)",
    "blurb": "Borrowed from callai: cool teal and violet, Bricolage + Public Sans.",
    "swatch": [
      "#0b6d77",
      "#d39af5",
      "#0f1719"
    ],
    "fonts": {
      "display": "\"Bricolage Grotesque\", \"Public Sans\", system-ui, sans-serif",
      "body": "\"Public Sans\", system-ui, sans-serif",
      "mono": "\"JetBrains Mono\", ui-monospace, monospace"
    },
    "googleFonts": "family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700;800"
  },
  {
    "id": "paper",
    "name": "Ink & Paper",
    "blurb": "Warm, editorial: cream paper, ink text, rust accent. Fraunces headings, Plex Sans body.",
    "swatch": [
      "#a8401b",
      "#e8c27a",
      "#17130f"
    ],
    "fonts": {
      "display": "\"Fraunces\", Georgia, serif",
      "body": "\"IBM Plex Sans\", system-ui, sans-serif",
      "mono": "\"IBM Plex Mono\", ui-monospace, monospace"
    },
    "googleFonts": "family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600",
    "light": {
      "bg": "#faf6ee",
      "surface": "#f2ecdf",
      "surface2": "#e8e0cf",
      "fg": "#221c15",
      "muted": "#6a5d4d",
      "line": "#e0d6c4",
      "accent": "#a8401b",
      "accentSoft": "#f4e1d4",
      "accentFg": "#ffffff",
      "codeBg": "#f4eee2",
      "codeFg": "#2a231b",
      "kw": "#8a3a6b",
      "str": "#4d7a28",
      "num": "#a8401b",
      "com": "#8d806f",
      "attr": "#2f6b74",
      "fn": "#3a5aa8"
    },
    "dark": {
      "bg": "#17130f",
      "surface": "#201a14",
      "surface2": "#2a221a",
      "fg": "#efe6d8",
      "muted": "#b3a592",
      "line": "#352b21",
      "accent": "#f0915f",
      "accentSoft": "#3b2418",
      "accentFg": "#1d0f08",
      "codeBg": "#1c1712",
      "codeFg": "#ece2d2",
      "kw": "#e2a3c7",
      "str": "#b5d68a",
      "num": "#f0b27a",
      "com": "#8f8170",
      "attr": "#86c3cb",
      "fn": "#9db7f0"
    },
    "banner": {
      "bg": "#17120e",
      "a": "#f0915f",
      "b": "#e8c27a",
      "term": "#100c09",
      "line": "#342a20",
      "glowA": "240,145,95",
      "glowB": "232,194,122",
      "darkInkA": "#a8401b",
      "darkInkB": "#8a3a6b"
    }
  },
  {
    "id": "phosphor",
    "name": "Phosphor",
    "blurb": "A terminal at night: green phosphor on near-black, mono headings. Plex Mono + Plex Sans.",
    "swatch": [
      "#1a6f2e",
      "#6be38a",
      "#0a0f0b"
    ],
    "fonts": {
      "display": "\"IBM Plex Mono\", ui-monospace, monospace",
      "body": "\"IBM Plex Sans\", system-ui, sans-serif",
      "mono": "\"IBM Plex Mono\", ui-monospace, monospace"
    },
    "googleFonts": "family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700",
    "light": {
      "bg": "#f7f9f5",
      "surface": "#edf2ea",
      "surface2": "#e1e9dc",
      "fg": "#142114",
      "muted": "#4f6150",
      "line": "#d3ddcf",
      "accent": "#1a6f2e",
      "accentSoft": "#dcefdf",
      "accentFg": "#ffffff",
      "codeBg": "#eef3eb",
      "codeFg": "#18261a",
      "kw": "#7a3fa8",
      "str": "#1a6f2e",
      "num": "#9a5b00",
      "com": "#738473",
      "attr": "#0f6a6a",
      "fn": "#2954a8"
    },
    "dark": {
      "bg": "#0a0f0b",
      "surface": "#0f1711",
      "surface2": "#152018",
      "fg": "#d7ecd9",
      "muted": "#8faa93",
      "line": "#1f2e22",
      "accent": "#6be38a",
      "accentSoft": "#12301b",
      "accentFg": "#04140a",
      "codeBg": "#0c130e",
      "codeFg": "#cfe8d3",
      "kw": "#c79bff",
      "str": "#6be38a",
      "num": "#ffc66b",
      "com": "#5f7a64",
      "attr": "#62d6c8",
      "fn": "#8fb4ff"
    },
    "banner": {
      "bg": "#070b08",
      "a": "#6be38a",
      "b": "#62d6c8",
      "term": "#050806",
      "line": "#1c2b20",
      "glowA": "107,227,138",
      "glowB": "98,214,200",
      "darkInkA": "#1a6f2e",
      "darkInkB": "#7a3fa8"
    }
  },
  {
    "id": "grimoire",
    "name": "Grimoire",
    "blurb": "Skills as spells: deep indigo, violet and rose. Space Grotesk headings, Manrope body.",
    "swatch": [
      "#5b2bc4",
      "#ff8fcf",
      "#110e1c"
    ],
    "fonts": {
      "display": "\"Space Grotesk\", system-ui, sans-serif",
      "body": "\"Manrope\", system-ui, sans-serif",
      "mono": "\"JetBrains Mono\", ui-monospace, monospace"
    },
    "googleFonts": "family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600",
    "light": {
      "bg": "#faf9fe",
      "surface": "#f1eefb",
      "surface2": "#e6e1f6",
      "fg": "#1b1530",
      "muted": "#5d5675",
      "line": "#dcd6ef",
      "accent": "#5b2bc4",
      "accentSoft": "#ebe3fb",
      "accentFg": "#ffffff",
      "codeBg": "#f2effa",
      "codeFg": "#211a38",
      "kw": "#b0287a",
      "str": "#2f7a4a",
      "num": "#a8551b",
      "com": "#857e9c",
      "attr": "#5b2bc4",
      "fn": "#2a57b8"
    },
    "dark": {
      "bg": "#110e1c",
      "surface": "#171326",
      "surface2": "#201a33",
      "fg": "#ebe6fb",
      "muted": "#a79fc4",
      "line": "#2b2442",
      "accent": "#b9a0ff",
      "accentSoft": "#2a1f4d",
      "accentFg": "#130a2b",
      "codeBg": "#140f22",
      "codeFg": "#e4ddf8",
      "kw": "#ff8fcf",
      "str": "#9fe0b0",
      "num": "#ffbf86",
      "com": "#776f94",
      "attr": "#b9a0ff",
      "fn": "#8fb0ff"
    },
    "banner": {
      "bg": "#100c1b",
      "a": "#b9a0ff",
      "b": "#ff8fcf",
      "term": "#0b0815",
      "line": "#2a2342",
      "glowA": "185,160,255",
      "glowB": "255,143,207",
      "darkInkA": "#5b2bc4",
      "darkInkB": "#b0287a"
    }
  },
  {
    "id": "signal",
    "name": "Signal",
    "blurb": "Swiss and high-contrast: white and black, one signal red. Archivo throughout.",
    "swatch": [
      "#c8261b",
      "#0b0b0b",
      "#ffffff"
    ],
    "fonts": {
      "display": "\"Archivo\", system-ui, sans-serif",
      "body": "\"Archivo\", system-ui, sans-serif",
      "mono": "\"JetBrains Mono\", ui-monospace, monospace"
    },
    "googleFonts": "family=Archivo:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600",
    "light": {
      "bg": "#ffffff",
      "surface": "#f4f4f4",
      "surface2": "#e9e9e9",
      "fg": "#0b0b0b",
      "muted": "#555555",
      "line": "#e2e2e2",
      "accent": "#c8261b",
      "accentSoft": "#fbe4e1",
      "accentFg": "#ffffff",
      "codeBg": "#f5f5f5",
      "codeFg": "#111111",
      "kw": "#c8261b",
      "str": "#1d6b3a",
      "num": "#8a4b00",
      "com": "#7a7a7a",
      "attr": "#0b0b0b",
      "fn": "#1f4fb0"
    },
    "dark": {
      "bg": "#0b0b0b",
      "surface": "#141414",
      "surface2": "#1d1d1d",
      "fg": "#f2f2f2",
      "muted": "#a3a3a3",
      "line": "#262626",
      "accent": "#ff6a5c",
      "accentSoft": "#3a1512",
      "accentFg": "#1a0503",
      "codeBg": "#111111",
      "codeFg": "#ededed",
      "kw": "#ff6a5c",
      "str": "#8fd6a3",
      "num": "#ffb86b",
      "com": "#7d7d7d",
      "attr": "#f2f2f2",
      "fn": "#8fb4ff"
    },
    "banner": {
      "bg": "#0b0b0b",
      "a": "#ff6a5c",
      "b": "#ffb199",
      "term": "#060606",
      "line": "#262626",
      "glowA": "255,106,92",
      "glowB": "255,177,153",
      "darkInkA": "#c8261b",
      "darkInkB": "#c8261b"
    }
  },
  {
    "id": "frost",
    "name": "Frost",
    "blurb": "Cool and calm: arctic blue-grey with ice blue and heather. Sora headings, Source Sans body.",
    "swatch": [
      "#2f5f9e",
      "#88c0d0",
      "#1d2230"
    ],
    "fonts": {
      "display": "\"Sora\", system-ui, sans-serif",
      "body": "\"Source Sans 3\", system-ui, sans-serif",
      "mono": "\"JetBrains Mono\", ui-monospace, monospace"
    },
    "googleFonts": "family=Sora:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600",
    "light": {
      "bg": "#f6f8fb",
      "surface": "#edf1f6",
      "surface2": "#e2e8f0",
      "fg": "#1c2430",
      "muted": "#56627a",
      "line": "#d8dfe9",
      "accent": "#2f5f9e",
      "accentSoft": "#e1eaf6",
      "accentFg": "#ffffff",
      "codeBg": "#eef2f7",
      "codeFg": "#1e2633",
      "kw": "#8a4f9e",
      "str": "#3f7a3a",
      "num": "#a8601b",
      "com": "#7c879a",
      "attr": "#2c7a8a",
      "fn": "#2f5f9e"
    },
    "dark": {
      "bg": "#1d2230",
      "surface": "#232938",
      "surface2": "#2b3243",
      "fg": "#e5e9f0",
      "muted": "#a3adc0",
      "line": "#343c50",
      "accent": "#88c0d0",
      "accentSoft": "#26394a",
      "accentFg": "#0f1a22",
      "codeBg": "#1a1f2b",
      "codeFg": "#e0e5ee",
      "kw": "#c4a3d4",
      "str": "#a3c48a",
      "num": "#e0b07a",
      "com": "#7f8aa0",
      "attr": "#88c0d0",
      "fn": "#8fb2e8"
    },
    "banner": {
      "bg": "#1a1f2b",
      "a": "#88c0d0",
      "b": "#b48ead",
      "term": "#10131b",
      "line": "#2e3546",
      "glowA": "136,192,208",
      "glowB": "180,142,173",
      "darkInkA": "#2f5f9e",
      "darkInkB": "#8a4f9e"
    }
  },
  {
    "id": "dusk",
    "name": "Dusk",
    "blurb": "Warm evening light: coral and rose on blush or plum. Outfit headings, DM Sans body.",
    "swatch": [
      "#b3204f",
      "#ff8a7a",
      "#1a1015"
    ],
    "fonts": {
      "display": "\"Outfit\", system-ui, sans-serif",
      "body": "\"DM Sans\", system-ui, sans-serif",
      "mono": "\"DM Mono\", ui-monospace, monospace"
    },
    "googleFonts": "family=Outfit:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500",
    "light": {
      "bg": "#fff8f6",
      "surface": "#fbeee9",
      "surface2": "#f5e1da",
      "fg": "#2a1620",
      "muted": "#6e5560",
      "line": "#f0dbd3",
      "accent": "#b3204f",
      "accentSoft": "#fbe1e8",
      "accentFg": "#ffffff",
      "codeBg": "#fbf0ec",
      "codeFg": "#2d1a22",
      "kw": "#7a35a8",
      "str": "#3d7a3a",
      "num": "#b0520b",
      "com": "#8c7680",
      "attr": "#b3204f",
      "fn": "#3a58b0"
    },
    "dark": {
      "bg": "#1a1015",
      "surface": "#22161c",
      "surface2": "#2c1c24",
      "fg": "#f5e6ea",
      "muted": "#c0a3ad",
      "line": "#3a2630",
      "accent": "#ff8a7a",
      "accentSoft": "#45202a",
      "accentFg": "#2a0a10",
      "codeBg": "#1d1218",
      "codeFg": "#f2e2e7",
      "kw": "#e0a3ff",
      "str": "#a8d98a",
      "num": "#ffc07a",
      "com": "#8f7480",
      "attr": "#ff9ec0",
      "fn": "#9fb7ff"
    },
    "banner": {
      "bg": "#1a0f15",
      "a": "#ff8a7a",
      "b": "#ff9ec0",
      "term": "#12090e",
      "line": "#3a2430",
      "glowA": "255,138,122",
      "glowB": "255,158,192",
      "darkInkA": "#b3204f",
      "darkInkB": "#7a35a8"
    }
  },
  {
    "id": "blueprint",
    "name": "Blueprint",
    "blurb": "An engineering drawing: blueprint blue and cyan, condensed headings. Barlow + Fira Code.",
    "swatch": [
      "#1f4fc4",
      "#6ee7f0",
      "#0b1430"
    ],
    "fonts": {
      "display": "\"Barlow Semi Condensed\", system-ui, sans-serif",
      "body": "\"Barlow\", system-ui, sans-serif",
      "mono": "\"Fira Code\", ui-monospace, monospace"
    },
    "googleFonts": "family=Barlow+Semi+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600;700&family=Fira+Code:wght@400;500;600",
    "light": {
      "bg": "#f5f8ff",
      "surface": "#eaf0fd",
      "surface2": "#dde6fb",
      "fg": "#0f1d3a",
      "muted": "#4d5d80",
      "line": "#d3ddf5",
      "accent": "#1f4fc4",
      "accentSoft": "#e0e9fd",
      "accentFg": "#ffffff",
      "codeBg": "#edf2fd",
      "codeFg": "#12203d",
      "kw": "#8a3ab9",
      "str": "#1f7a4a",
      "num": "#a8551b",
      "com": "#6f7ea0",
      "attr": "#0e7490",
      "fn": "#1f4fc4"
    },
    "dark": {
      "bg": "#0b1430",
      "surface": "#101b3d",
      "surface2": "#16234a",
      "fg": "#e3eaff",
      "muted": "#9fb0d8",
      "line": "#1f2d58",
      "accent": "#7aa2ff",
      "accentSoft": "#1a2c66",
      "accentFg": "#050c22",
      "codeBg": "#0d1736",
      "codeFg": "#dde6ff",
      "kw": "#d0a3ff",
      "str": "#8fe0b0",
      "num": "#ffc27a",
      "com": "#6f80ad",
      "attr": "#6ee7f0",
      "fn": "#7aa2ff"
    },
    "banner": {
      "bg": "#0a1230",
      "a": "#7aa2ff",
      "b": "#6ee7f0",
      "term": "#070d24",
      "line": "#1f2d58",
      "glowA": "122,162,255",
      "glowB": "110,231,240",
      "darkInkA": "#1f4fc4",
      "darkInkB": "#8a3ab9"
    }
  },
  {
    "id": "matcha",
    "name": "Matcha",
    "blurb": "Soft and unhurried: sage green and warm cream. Lexend throughout, made for easy reading.",
    "swatch": [
      "#3f6a2e",
      "#e8d48a",
      "#141913"
    ],
    "fonts": {
      "display": "\"Lexend\", system-ui, sans-serif",
      "body": "\"Lexend\", system-ui, sans-serif",
      "mono": "\"JetBrains Mono\", ui-monospace, monospace"
    },
    "googleFonts": "family=Lexend:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600",
    "light": {
      "bg": "#f7f8f2",
      "surface": "#eef1e6",
      "surface2": "#e3e8d8",
      "fg": "#1d2418",
      "muted": "#5a6650",
      "line": "#dce2cf",
      "accent": "#3f6a2e",
      "accentSoft": "#e3eedb",
      "accentFg": "#ffffff",
      "codeBg": "#f0f3e8",
      "codeFg": "#1f271b",
      "kw": "#7a4a8a",
      "str": "#3f6a2e",
      "num": "#9a5b00",
      "com": "#7b8670",
      "attr": "#2f6f6a",
      "fn": "#355f9e"
    },
    "dark": {
      "bg": "#141913",
      "surface": "#1a2119",
      "surface2": "#222b20",
      "fg": "#e6ecdf",
      "muted": "#a8b59c",
      "line": "#2c3729",
      "accent": "#a8d08d",
      "accentSoft": "#26361f",
      "accentFg": "#0f1a0a",
      "codeBg": "#161c15",
      "codeFg": "#e1e8da",
      "kw": "#d2a8e0",
      "str": "#a8d08d",
      "num": "#e8c07a",
      "com": "#77856c",
      "attr": "#8fd4c4",
      "fn": "#9fbbe8"
    },
    "banner": {
      "bg": "#121811",
      "a": "#a8d08d",
      "b": "#e8d48a",
      "term": "#0c110b",
      "line": "#2a3527",
      "glowA": "168,208,141",
      "glowB": "232,212,138",
      "darkInkA": "#3f6a2e",
      "darkInkB": "#7a4a8a"
    }
  },
  {
    "id": "rose",
    "name": "Rosé",
    "blurb": "Muted pastels: rose, iris and gold on aubergine, or on parchment by day. Young Serif + Nunito Sans.",
    "swatch": [
      "#934460",
      "#c4a7e7",
      "#191724"
    ],
    "fonts": {
      "display": "\"Young Serif\", Georgia, serif",
      "body": "\"Nunito Sans\", system-ui, sans-serif",
      "mono": "\"JetBrains Mono\", ui-monospace, monospace"
    },
    "googleFonts": "family=Young+Serif&family=Nunito+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;500;600",
    "light": {
      "bg": "#faf4ed",
      "surface": "#f4ede4",
      "surface2": "#ece3d8",
      "fg": "#2a2438",
      "muted": "#655c78",
      "line": "#e6dccf",
      "accent": "#934460",
      "accentSoft": "#f4e1e3",
      "accentFg": "#ffffff",
      "codeBg": "#f2ebe1",
      "codeFg": "#2a2438",
      "kw": "#7a4a9e",
      "str": "#286983",
      "num": "#9a5b1b",
      "com": "#837a91",
      "attr": "#286983",
      "fn": "#56739a"
    },
    "dark": {
      "bg": "#191724",
      "surface": "#1f1d2e",
      "surface2": "#26233a",
      "fg": "#e0def4",
      "muted": "#a8a3c4",
      "line": "#2e2a44",
      "accent": "#ebbcba",
      "accentSoft": "#3a2834",
      "accentFg": "#1d1218",
      "codeBg": "#1c1a29",
      "codeFg": "#dcd8f0",
      "kw": "#c4a7e7",
      "str": "#9ccfd8",
      "num": "#f6c177",
      "com": "#7b7694",
      "attr": "#ebbcba",
      "fn": "#9ccfd8"
    },
    "banner": {
      "bg": "#17151f",
      "a": "#ebbcba",
      "b": "#c4a7e7",
      "term": "#110f18",
      "line": "#2c2840",
      "glowA": "235,188,186",
      "glowB": "196,167,231",
      "darkInkA": "#934460",
      "darkInkB": "#7a4a9e"
    }
  }
];

/** The theme with this id, or null. */
export const themeById = (id) => THEMES.find((t) => t.id === id) ?? null;

/** The Google Fonts stylesheet for a theme. */
export const fontsHref = (t) => `https://fonts.googleapis.com/css2?${t.googleFonts}&display=swap`;

const tokens = (c, f) =>
  `--bg:${c.bg};--surface:${c.surface};--surface-2:${c.surface2};--fg:${c.fg};--muted:${c.muted};--line:${c.line};` +
  `--accent:${c.accent};--accent-soft:${c.accentSoft};--accent-fg:${c.accentFg};--code-bg:${c.codeBg};--code-fg:${c.codeFg};` +
  `--tok-kw:${c.kw};--tok-str:${c.str};--tok-num:${c.num};--tok-com:${c.com};--tok-attr:${c.attr};--tok-fn:${c.fn};` +
  `--font-display:${f.display};--font-body:${f.body};--font-mono:${f.mono};`;

// Lights Out: X's pure-black reading view with shadcn's zinc neutrals.
const LIGHTS_OUT_CSS = `/* ── Lights Out: the page itself changes, not only its colours ── */
:root[data-skin="lightsout"] { --shadow: none; }
:root[data-skin="lightsout"][data-effective="dark"] { --note: #1d9bf0; --tip: #00ba7c; --important: #a78bfa; --warning: #ffd400; --caution: #f4212e; }
:root[data-skin="lightsout"] body {
  background: radial-gradient(1100px 380px at 50% -220px, color-mix(in srgb, var(--accent) 14%, transparent), transparent 72%) no-repeat, var(--bg); }
:root[data-skin="lightsout"] .top {
  background: color-mix(in srgb, var(--bg) 72%, transparent); -webkit-backdrop-filter: saturate(180%) blur(14px); backdrop-filter: saturate(180%) blur(14px); }
:root[data-skin="lightsout"] .brand-name { letter-spacing: -.04em; font-weight: 700; }
:root[data-skin="lightsout"] .brand-ver, :root[data-skin="lightsout"] .search kbd { border-radius: 6px; background: var(--surface); }
:root[data-skin="lightsout"] .search input { border-radius: 999px; background: var(--surface-2); border-color: transparent; }
:root[data-skin="lightsout"] .search input:focus { background: var(--bg); border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
:root[data-skin="lightsout"] .icon-btn { border-radius: 999px; background: transparent; border-color: var(--line); }
:root[data-skin="lightsout"] .icon-btn:hover { background: var(--surface-2); border-color: var(--line); }
:root[data-skin="lightsout"] .tab { position: relative; border-bottom: 0; font-weight: 500; transition: background .15s, color .15s; }
:root[data-skin="lightsout"] .tab:hover { background: color-mix(in srgb, var(--fg) 6%, transparent); }
:root[data-skin="lightsout"] .tab[aria-selected="true"] { font-weight: 700; }
:root[data-skin="lightsout"] .tab[aria-selected="true"]::after {
  content: ""; position: absolute; left: 14px; right: 14px; bottom: 0; height: 4px; border-radius: 999px; background: var(--accent); }
:root[data-skin="lightsout"] .tab .count { border: 1px solid var(--line); border-radius: 999px; padding: 0 6px; line-height: 16px; }
:root[data-skin="lightsout"] .nav-list a { border-radius: 8px; color: var(--muted); }
:root[data-skin="lightsout"] .nav-list a:hover { background: var(--surface-2); color: var(--fg); }
:root[data-skin="lightsout"] .nav-list a[aria-current="page"] { background: var(--surface-2); color: var(--fg); font-weight: 600; box-shadow: inset 0 0 0 1px var(--line); }
:root[data-skin="lightsout"] .nav-list a[aria-current="page"] .step { color: var(--accent); }
:root[data-skin="lightsout"] .side-label, :root[data-skin="lightsout"] .toc-label { letter-spacing: .02em; text-transform: none; font-size: 13px; font-weight: 600; color: var(--fg); }
:root[data-skin="lightsout"] .toc a.active { border-left-color: var(--fg); color: var(--fg); }
:root[data-skin="lightsout"] .doc h1 { font-weight: 700; letter-spacing: -.045em; line-height: 1.05; }
:root[data-skin="lightsout"] .doc h2 { font-weight: 650; letter-spacing: -.03em; border-top: 0; padding-top: 8px; }
:root[data-skin="lightsout"] .doc h3 { letter-spacing: -.02em; }
:root[data-skin="lightsout"] .doc a { text-decoration-color: color-mix(in srgb, var(--accent) 40%, transparent); }
:root[data-skin="lightsout"] .doc a:hover { text-decoration-color: var(--accent); }
:root[data-skin="lightsout"] .doc :not(pre) > code { background: var(--surface-2); border: 1px solid color-mix(in srgb, var(--line) 55%, transparent); padding: .05em .36em; border-radius: 6px; }
:root[data-skin="lightsout"] .codeblock { border-radius: 12px; transition: border-color .2s, box-shadow .2s; }
:root[data-skin="lightsout"] .codeblock:hover { border-color: color-mix(in srgb, var(--accent) 55%, var(--line)); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 10%, transparent); }
:root[data-skin="lightsout"] .codeblock .copy { border-radius: 999px; background: var(--surface-2); }
:root[data-skin="lightsout"] .codeblock.output { background: color-mix(in srgb, var(--surface) 60%, transparent); border-style: solid; }
:root[data-skin="lightsout"] .codeblock.output::before { text-transform: none; letter-spacing: 0; font-size: 12px; font-weight: 600; }
:root[data-skin="lightsout"] .table-wrap { border-radius: 12px; }
:root[data-skin="lightsout"] .doc th { background: transparent; color: var(--muted); font-weight: 500; }
:root[data-skin="lightsout"] .doc tr:hover td { background: color-mix(in srgb, var(--fg) 3%, transparent); }
:root[data-skin="lightsout"] .alert { border-left-width: 1px; border-radius: 12px; background: color-mix(in srgb, var(--a) 7%, var(--bg)); border-color: color-mix(in srgb, var(--a) 35%, var(--line)); }
:root[data-skin="lightsout"] .pager a { border-radius: 14px; transition: background .15s, border-color .15s; }
:root[data-skin="lightsout"] .pager a:hover { background: var(--surface); border-color: var(--line); }
:root[data-skin="lightsout"] .hero { border-radius: 16px; border-color: var(--line); }
:root[data-skin="lightsout"] .crumbs { font-size: 13px; }
@media (prefers-reduced-motion: reduce) { :root[data-skin="lightsout"] * { transition: none !important; } }`;

/** CSS for the docs page: each theme's variables in light and dark, and Lights Out's own styles. */
export function pageSkinCss() {
  const out = ["/* Themes (src/scripts/themes.mjs): chosen with the gear menu; data-skin on <html>. */"];
  for (const t of THEMES.filter((x) => x.light)) {
    out.push(`:root[data-skin="${t.id}"]:not([data-effective="dark"]) {${tokens(t.light, t.fonts)}}`);
    out.push(`:root[data-skin="${t.id}"][data-effective="dark"] {${tokens(t.dark, t.fonts)}color-scheme:dark;}`);
  }
  out.push(':root[data-skin="phosphor"] .doc h1, :root[data-skin="phosphor"] .doc h2 { letter-spacing: -.03em; }');
  out.push(':root[data-skin="signal"] .doc h1 { letter-spacing: -.035em; } :root[data-skin="signal"] .tab[aria-selected="true"] { border-bottom-width: 3px; }');
  out.push(':root[data-skin="paper"] .doc h1, :root[data-skin="paper"] .doc h2 { font-weight: 600; letter-spacing: -.01em; }');
  out.push(LIGHTS_OUT_CSS);
  return out.join("\n");
}

/**
 * CSS for the banner (inside its banner:css markers, so the docs page gets it
 * too). Every rule is scoped to #banner. Light ink (the dark banner) uses the
 * theme's bright accents; dark ink (on white) uses its light-mode accents.
 */
export function bannerSkinCss() {
  const out = ["/* Banner themes (src/scripts/themes.mjs). */"];
  for (const t of THEMES.filter((x) => x.banner)) {
    const b = t.banner;
    const s = `:root[data-skin="${t.id}"] #banner`;
    out.push(`${s} { --bg: ${b.bg}; --term-bg: ${b.term}; --term-line: ${b.line}; }`);
    out.push(`${s}:not(.ink-dark) { --teal: ${b.a}; --violet: ${b.b}; }`);
    out.push(`${s}.ink-dark { --teal: ${b.darkInkA}; --violet: ${b.darkInkB}; }`);
    out.push(`${s} .bg-glow { background: radial-gradient(620px 420px at 8% 0%, rgba(${b.glowA}, .22), transparent 70%), radial-gradient(560px 460px at 100% 100%, rgba(${b.glowB}, .20), transparent 70%); }`);
    out.push(`${s} .term-body .p, ${s} .install .dollar { color: ${b.a}; }`);
    out.push(`${s} .term-body .cursor { background: ${b.a}; }`);
    out.push(`${s} .mark { box-shadow: 0 10px 30px rgba(${b.glowA}, .25); }`);
  }
  return out.join("\n");
}
