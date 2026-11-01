# @muradmadi/brand

My brand as a package: the colours, fonts and type settings as a Tailwind v4 theme and as plain CSS
variables, plus the logos, the icons, the social banners, the desktop fonts, the email signature
and the facts they're all made from. muradmadi.com and anything else with my name on it take their
look from here.

The files for people rather than code, every logo, banner, font and the signature, are at
<https://muradmadi.github.io/brand/>.

## Install

```sh
bun add @muradmadi/brand
```

## Use it with Tailwind CSS v4

In the stylesheet where you import Tailwind:

```css
@import "tailwindcss";
@import "@muradmadi/brand/fonts.css";
@import "@muradmadi/brand/theme.css";
```

That gives you:

| Utilities | What they are |
| --- | --- |
| `bg-ground`, `bg-surface`, `border-rule` | The ground, a raised surface and rules, for the current theme |
| `text-fg`, `text-fg-2`, `text-fg-muted`, `text-fg-faint` | Text, from strongest to faintest |
| `bg-coral`, `text-on-coral`, `text-coral-text` | Coral as a fill, text on it, and coral as text |
| `text-ok`, `text-warn`, `text-err` | Status colours, never a stand-in for coral |
| `bg-terminal`, `text-chalk`, `bg-paper`, `text-ink`, `bg-coral-terminal`, `bg-coral-paper`, `text-coral-ink` | The named colours, the same in both themes |
| `font-mono` (the default), `font-serif` | JetBrains Mono for the frame, Literata for the voice |
| `type-label`, `type-wordmark`, `type-display`, `type-prose` | Section labels in mono bold capitals, the name as the wordmark sets it, Literata display lines and running text |
| `mark-block`, `wordmark-block` | The coral block, sized for the M or for the name, sitting on the baseline |
| `animate-blink-twice` | The block's two blinks on first load; off for reduced motion |
| `max-w-prose`, `max-w-code` | 65 and 80 characters |
| `p-1ch`, `gap-2ch` and the rest | Spacing in character widths: `half-ch`, `1ch`, `2ch`, `4ch`, `8ch` |

Terminal is the default. Put `data-theme="paper"` on any element to switch it and everything inside
to paper, or `data-theme="system"` to follow the visitor's setting. The theme utilities change with
it; the named colours don't. Ligatures are off and figures are tabular everywhere.

The faint and status colours clear WCAG AA on the ground only; on paper's surface they don't, so
keep them off `bg-surface`.

```html
<html data-theme="system">
  <body class="bg-ground text-fg">
    <a class="type-wordmark" href="/">murad madi<span class="wordmark-block animate-blink-twice"></span></a>
    <p class="type-label text-fg-muted">Blog</p>
    <h1 class="type-display text-5xl">Why your GA4 numbers never match your ad platform</h1>
    <p class="type-prose max-w-prose text-fg-2">…</p>
  </body>
</html>
```

## Use it without Tailwind

`@muradmadi/brand/variables.css` holds the same values as `--colophon-*` variables:
`--colophon-ground`, `--colophon-fg`, `--colophon-coral`, `--colophon-font-serif`,
`--colophon-label-tracking` and so on, with the same `data-theme` switch. `fonts.css` imports the
font packages by name, so it needs a bundler that resolves package imports (Vite, PostCSS with
postcss-import, Lightning CSS).

## Fonts

Sites load both fonts from the `@fontsource-variable` packages this package depends on, served with
the site rather than from Google Fonts. The font files are linked relative to those packages, so the
site's bundler has to copy them: Vite and Astro (through `@tailwindcss/vite`) do, the Tailwind CLI on
its own doesn't.

For documents, slides and print, `@muradmadi/brand/fonts/` has the desktop variable fonts, each
folder with its SIL Open Font License:

| Font | Files | For |
| --- | --- | --- |
| JetBrains Mono | `jetbrains-mono/JetBrainsMono[wght].ttf`, `-Italic[wght].ttf` | The mark, navigation, labels, buttons, code, numbers and dates |
| Literata | `literata/Literata[opsz,wght].ttf`, `-Italic[opsz,wght].ttf` | Headlines, prose, standfirsts and captions |

## Logos

`@muradmadi/brand/logos/` has the letters as outlines, so the files need no fonts:

| File | For |
| --- | --- |
| `mark-on-terminal.svg`, `mark-on-paper.svg` | The M and its coral block: the favicon, the avatar, small spaces |
| `mark-on-coral.svg`, `mark-black.svg`, `mark-white.svg` | The mark in one colour: on coral, for print, on photos |
| `wordmark-on-terminal.svg`, `wordmark-on-paper.svg` | `murad madi` and the block: headers, signatures |
| `lockup-on-terminal.svg`, `lockup-on-paper.svg` | The mark, a rule, the name and the role: cards, CVs, slides, footers |
| `prompt-on-terminal.svg` | `$ whoami` and the name with a cursor: heroes, video intros. Never small |

Keep one block's width clear around each, and don't set the mark smaller than 24 pixels. Never
round the block, lift it off the baseline, swap the colours or stretch it.

## Icons and the manifest

`@muradmadi/brand/icons/` has what a site's `<head>` needs for a browser tab, a home screen and a
link preview:

| File | For |
| --- | --- |
| `favicon.ico` (16, 32, 48) and `favicon.svg` | Browser tabs and bookmarks. At 16 pixels it's a coral tile with a dark M |
| `apple-touch-icon.png` (180) | iPhone and iPad home screens |
| `icon-192.png`, `icon-512.png` | `purpose: any` |
| `icon-maskable-192.png`, `icon-maskable-512.png` | Android, which crops icons to its own shape |
| `icon-monochrome.svg`, `icon-monochrome-512.png` | Android themed icons |
| `og.png` (1200 × 630) | The default link preview |
| `site.webmanifest` | The name, the colours and the icons |
| `head.html` | Every tag that wires them up |

Serve the folder at `/icons/` and paste `head.html` into the `<head>`, filling in the bracketed
title, description and URLs per page. With Astro, copy it into `public/` as part of the build:

```json
"scripts": {
  "prebuild": "cp -r node_modules/@muradmadi/brand/dist/icons public/icons"
}
```

## Social images

`@muradmadi/brand/social/` has the avatar (1024 square) and a banner for each profile, as SVG and
PNG: `banner-linkedin` (1584 × 396), `banner-youtube` (2560 × 1440), `banner-x` (1500 × 500),
`banner-github` (1280 × 640, the repository social preview) and `banner-og` (1200 × 630). The
sizes, the areas each platform keeps on every screen, and where the profile photo covers a banner
are in `src/social.json`; the site draws them over each banner.

## Profile

`@muradmadi/brand/profile.json` has the facts the signature, the lockup and the banners are made
from: the name, the role (long and short), the intro line and the location, in each of its
`languages` (English first), plus the email address, the website and the LinkedIn, GitHub and
YouTube links.

```ts
import profile from "@muradmadi/brand/profile.json" with { type: "json" };

const footer = `© ${new Date().getFullYear()} ${profile.name}`;
```

There's no phone number in it, and a test keeps it that way.

## Email signature

`@muradmadi/brand/email/signature.html` (English) and `signature.es.html` (Spanish) are the
signature, built from `profile.json`. They're tables with inline styles and no images, so they look
the same in every mail app: the name falls back to Menlo or Consolas, and the block is a coral table
cell. The easiest way to use one is the site's copy button, then paste into the mail app's signature
box.

## Working on it

The values live in `src/tokens.ts` and `src/profile.json`. `just build` writes the stylesheets,
icons, social images and signatures to `dist/` and the site to `_site/`, and
`.github/workflows/pages.yml` deploys the site on every push to `main`. `just logos` redraws the
logo SVGs, the avatar and banners in `social/` and the icon sources in `icons/` from the fonts in
`node_modules`; run it after changing the profile or `src/social.json`. The tests check that every
text colour meets WCAG AA on its ground in both themes, that the theme compiles with Tailwind, and
that every file the site offers is built.

## Licence

The code and stylesheets are MIT. My name and logos are not, and the fonts are under their own
licence: see [LICENSE](LICENSE).
