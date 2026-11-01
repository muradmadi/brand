// Builds the brand site: site/index.html with its slots filled from the tokens, the profile, the
// logos, the social images, the icons, the fonts and the signatures, compiled against the built
// theme, with the CSS and fonts inlined; every logo, social image and font under downloads/; the
// signatures under email/; and dist/icons/ under icons/, which the page itself uses.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderEmail, signatureName } from "./email.ts";
import { renderHead, renderIcons } from "./icons.ts";
import { png } from "./png.ts";
import profile from "./profile.json" with { type: "json" };
import social from "./social.json" with { type: "json" };
import { compileCss } from "./tailwind.ts";
import {
  fontStylesheets,
  palette,
  paper,
  terminal,
  type Theme,
} from "./tokens.ts";

const root = path.resolve(import.meta.dir, "..");
const source = path.join(root, "site");

/** Where GitHub Pages serves the site. */
export const siteUrl = "https://muradmadi.github.io/brand/";

/** Each logo file and the ground the page shows it on. */
export const logos = {
  "mark-on-terminal": "bg-terminal",
  "mark-on-paper": "bg-paper",
  "mark-on-coral": "bg-coral-terminal",
  "mark-black": "bg-white",
  "mark-white": "bg-black",
  "wordmark-on-terminal": "bg-terminal",
  "wordmark-on-paper": "bg-paper",
  "lockup-on-terminal": "bg-terminal",
  "lockup-on-paper": "bg-paper",
  "prompt-on-terminal": "bg-terminal",
} as const;

export type Logo = keyof typeof logos;
export const logoNames = Object.keys(logos) as Logo[];

/** Logo PNGs are drawn at this many pixels per SVG unit. */
export const logoScale = 4;

/** The desktop fonts in fonts/, each folder with its licence. */
export const fonts = [
  {
    family: "JetBrains Mono",
    folder: "jetbrains-mono",
    role: "the frame",
    use: "the mark, navigation, labels, buttons, code, numbers and dates",
    face: "font-mono",
    weight: "font-bold",
    files: ["JetBrainsMono[wght].ttf", "JetBrainsMono-Italic[wght].ttf"],
  },
  {
    family: "Literata",
    folder: "literata",
    role: "the voice",
    use: "headlines, prose, standfirsts and captions",
    face: "font-serif",
    weight: "font-medium",
    files: ["Literata[opsz,wght].ttf", "Literata-Italic[opsz,wght].ttf"],
  },
] as const;

type Rect = [number, number, number, number];
type Banner = (typeof social.banners)[number] & {
  avatar?: { rect: number[]; shape: string };
};

const escape = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const button =
  "inline-flex min-h-11 items-center border border-rule px-2ch text-xs text-coral-text hover:bg-surface";

const downloadLink = (file: string, label: string): string =>
  `<a class="${button}" href="${encodeURI(`downloads/${file}`)}" download>${label}</a>`;

const swatch = (name: string, hex: string): string => `
            <button class="flex min-h-11 items-center gap-1ch text-left text-xs hover:bg-surface" data-copy="${hex}" title="Copy ${hex}">
              <span class="h-5 w-4ch shrink-0 border border-rule bg-${name}"></span>
              <span class="grow">${name}</span>
              <span class="text-fg-muted">${hex}</span>
            </button>`;

const themePanel = (name: string, theme: Theme, note: string): string => `
          <div data-theme="${name}" class="flex flex-col gap-1ch border border-rule bg-ground p-2ch text-fg">
            <div class="flex justify-between gap-2ch">
              <span class="text-lg font-bold">${name}</span>
              <span class="text-xs text-fg-muted">${note}</span>
            </div>
            <div class="flex flex-col">${Object.entries(theme)
              .map(([role, hex]) => swatch(role, hex))
              .join("")}
            </div>
          </div>`;

const logo = (name: Logo, svg: string): string => {
  const height = name.startsWith("mark")
    ? "h-24"
    : name.startsWith("prompt")
      ? "h-16"
      : "h-12";
  return `
          <figure class="flex flex-col gap-1ch">
            <div class="flex h-48 items-center justify-center border border-rule p-2ch ${logos[name]}">
              ${svg.trim().replace("<svg ", `<svg class="${height} w-auto max-w-full" `)}
            </div>
            <figcaption class="flex flex-wrap items-center justify-between gap-1ch">
              <span class="text-xs text-fg-muted">${name}</span>
              <span class="flex gap-1ch">
                ${downloadLink(`logos/${name}.svg`, "SVG")}
                ${downloadLink(`logos/${name}.png`, "PNG")}
              </span>
            </figcaption>
          </figure>`;
};

const avatar = (): string => {
  const { width, height } = social.avatar;
  const img = (size: number) =>
    `<img class="rounded-full" src="downloads/social/avatar.svg" width="${size}" height="${size}" alt="" />`;
  return `
        <div class="flex flex-wrap items-end gap-2ch">
          <img class="rounded-full" src="downloads/social/avatar.svg" width="240" height="240" alt="The avatar: the M and its block on terminal, in its circle crop" />
          <div class="flex items-end gap-2ch bg-paper p-2ch">${[96, 48, 32].map(img).join("")}</div>
          <div class="flex items-end gap-2ch bg-terminal p-2ch">${[96, 48, 32].map(img).join("")}</div>
        </div>
        <div class="flex flex-wrap items-center gap-1ch">
          <span class="text-xs text-fg-muted">avatar · ${width} × ${height}</span>
          ${downloadLink("social/avatar.png", "PNG")}
          ${downloadLink("social/avatar.svg", "SVG")}
        </div>`;
};

/** A box over the banner at `rect`, in percent of its size so it scales with the preview. */
const overlay = (
  b: Banner,
  [x, y, w, h]: Rect,
  classes: string,
  label: string,
): string => {
  const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;
  return `
              <div data-guide class="absolute ${classes}" style="left: ${pct(x, b.width)}; top: ${pct(y, b.height)}; width: ${pct(w, b.width)}; height: ${pct(h, b.height)}">
                <span class="absolute top-1 left-1 bg-terminal px-1.5 py-0.5 text-[10px] text-coral-terminal">${label}</span>
              </div>`;
};

const banner = (b: Banner): string => {
  const guides = b.guides
    .map((g) =>
      overlay(
        b,
        g.rect as Rect,
        "border-2 border-dashed border-coral-terminal",
        g.label,
      ),
    )
    .join("");
  const cover = b.avatar
    ? overlay(
        b,
        b.avatar.rect as Rect,
        `${b.avatar.shape === "square" ? "" : "rounded-full"} border-2 border-dashed border-chalk`,
        "Photo",
      )
    : "";
  return `
          <figure class="flex flex-col gap-1ch">
            <div class="relative overflow-hidden border border-rule">
              <img class="block h-auto w-full" src="downloads/social/banner-${b.name}.svg" width="${b.width}" height="${b.height}" alt="" />${guides}${cover}
            </div>
            <figcaption class="flex flex-wrap items-center justify-between gap-1ch">
              <span class="text-xs text-fg-muted">${b.label} · ${b.width} × ${b.height}</span>
              <span class="flex gap-1ch">
                ${downloadLink(`social/banner-${b.name}.png`, "PNG")}
                ${downloadLink(`social/banner-${b.name}.svg`, "SVG")}
              </span>
            </figcaption>
          </figure>`;
};

const iconLink = (file: string, label: string): string =>
  `<a class="${button}" href="icons/${file}" download>${label}</a>`;

const iconsSection = (head: string): string => {
  const files = [
    ["favicon.ico", "favicon.ico · 16, 32, 48"],
    ["favicon.svg", "favicon.svg"],
    ["apple-touch-icon.png", "apple-touch-icon.png · 180"],
    ["icon-192.png", "icon-192.png"],
    ["icon-512.png", "icon-512.png"],
    ["icon-maskable-192.png", "icon-maskable-192.png"],
    ["icon-maskable-512.png", "icon-maskable-512.png"],
    ["icon-monochrome.svg", "icon-monochrome.svg"],
    ["icon-monochrome-512.png", "icon-monochrome-512.png"],
    ["og.png", "og.png · 1200 × 630"],
    ["site.webmanifest", "site.webmanifest"],
    ["head.html", "head.html"],
  ];
  return `
        <div class="flex flex-wrap items-end gap-4ch">
          <figure class="flex flex-col items-start gap-1ch">
            <div class="flex items-end gap-2ch">
              <img src="icons/favicon.svg" width="48" height="48" alt="" />
              <img src="icons/favicon.svg" width="32" height="32" alt="" />
              <img src="icons/favicon.ico" width="16" height="16" alt="" />
            </div>
            <figcaption class="text-xs text-fg-muted">favicon · 48 · 32 · 16</figcaption>
          </figure>
          <figure class="flex flex-col items-start gap-1ch">
            <img class="rounded-[22.5%]" src="icons/apple-touch-icon.png" width="90" height="90" alt="" />
            <figcaption class="text-xs text-fg-muted">iPhone</figcaption>
          </figure>
          <figure class="flex flex-col items-start gap-1ch">
            <img class="rounded-full" src="icons/icon-maskable-192.png" width="90" height="90" alt="" />
            <figcaption class="text-xs text-fg-muted">Android</figcaption>
          </figure>
          <figure class="flex flex-col items-start gap-1ch">
            <div class="flex size-[90px] items-center justify-center rounded-full bg-coral-ink">
              <img src="icons/icon-monochrome.svg" width="90" height="90" alt="" />
            </div>
            <figcaption class="text-xs text-fg-muted">Android, themed</figcaption>
          </figure>
        </div>
        <div class="flex flex-wrap gap-1ch">
          ${files.map(([file, label]) => iconLink(file as string, label as string)).join("\n          ")}
        </div>
        <div class="flex flex-col gap-1ch">
          <div class="flex items-center justify-between gap-2ch">
            <span class="text-xs text-fg-muted">head.html</span>
            <button class="${button}" data-copy-from="head-html">copy</button>
          </div>
          <pre class="max-h-64 overflow-auto border border-rule bg-surface p-2ch text-xs leading-relaxed"><code id="head-html">${escape(head)}</code></pre>
        </div>`;
};

const fontCard = (font: (typeof fonts)[number]): string => `
          <div class="flex flex-col gap-2ch border border-rule p-2ch">
            <div class="flex justify-between gap-2ch text-xs text-fg-muted">
              <span>${font.role}</span>
              <span>OFL · variable</span>
            </div>
            <span class="${font.face} ${font.weight} text-4xl leading-none">${font.family}</span>
            <span class="${font.face} text-lg leading-relaxed text-fg-2">ñ á é í ó ú ü ¿ ¡ « » € · 0123456789</span>
            <span class="text-xs text-fg-muted">for ${font.use}</span>
            <span class="flex flex-wrap gap-1ch">
              ${font.files.map((file) => downloadLink(`fonts/${font.folder}/${file}`, file)).join("\n              ")}
              ${downloadLink(`fonts/${font.folder}/OFL.txt`, "OFL.txt")}
            </span>
          </div>`;

const signature = (language: string, html: string): string => {
  const file = signatureName(language);
  const id = `signature-${language}`;
  return `
          <figure class="flex flex-col gap-1ch">
            <div class="border border-rule bg-white p-2ch">
              <div id="${id}">${html}</div>
            </div>
            <figcaption class="flex flex-wrap items-center justify-between gap-1ch">
              <span class="text-xs text-fg-muted">${language === "en" ? "English" : "Español"}</span>
              <span class="flex flex-wrap gap-1ch">
                <button class="${button}" data-copy-rich="${id}">copy signature</button>
                <a class="${button}" href="email/${file}" download>HTML</a>
              </span>
            </figcaption>
          </figure>`;
};

const profileSection = (json: string): string => `
        <div class="flex flex-col gap-1ch">
          <div class="flex items-center justify-between gap-2ch">
            <span class="text-xs text-fg-muted">profile.json</span>
            <span class="flex gap-1ch">
              <button class="${button}" data-copy-from="profile-json">copy</button>
              ${downloadLink("profile.json", "download")}
            </span>
          </div>
          <pre class="overflow-x-auto border border-rule bg-surface p-2ch text-xs leading-relaxed"><code id="profile-json">${escape(json)}</code></pre>
        </div>`;

/**
 * The @font-face rules fonts.css loads, for the latin and latin-ext subsets only (what English
 * and Spanish need), with each font file inlined as a data URI.
 */
async function inlineFonts(): Promise<string> {
  const rules: string[] = [];
  for (const sheet of fontStylesheets) {
    const file = Bun.resolveSync(sheet, root);
    const css = await readFile(file, "utf8");
    for (const [rule] of css.matchAll(/@font-face\s*\{[^}]*\}/g)) {
      const font = /url\(\.\/files\/([^)]+)\)/.exec(rule)?.[1];
      if (font === undefined || !font.includes("-latin-")) continue;
      const data = await readFile(path.join(path.dirname(file), "files", font));
      rules.push(
        rule.replace(
          `./files/${font}`,
          `data:font/woff2;base64,${data.toString("base64")}`,
        ),
      );
    }
  }
  return rules.join("\n");
}

/** The width of an SVG's viewBox. */
export const viewBoxWidth = (svg: string): number =>
  Number(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+) [\d.]+"/.exec(svg)?.[1]);

/** The social images: the avatar, then a banner per platform, with their pixel widths. */
export const socialImages = (): { name: string; width: number }[] => [
  { name: "avatar", width: social.avatar.width },
  ...social.banners.map((b) => ({ name: `banner-${b.name}`, width: b.width })),
];

/** Each social image as SVG and PNG, keyed by their path under social/. */
export async function renderSocial(): Promise<
  Map<string, string | Uint8Array>
> {
  const files = new Map<string, string | Uint8Array>();
  for (const { name, width } of socialImages()) {
    const svg = await readFile(
      path.join(root, "social", `${name}.svg`),
      "utf8",
    );
    files.set(`${name}.svg`, svg);
    files.set(`${name}.png`, png(svg, width));
  }
  return files;
}

/** Every logo, social image and font, keyed by their path under downloads/. */
async function downloads(
  socialFiles: Map<string, string | Uint8Array>,
): Promise<Map<string, string | Uint8Array>> {
  const files = new Map<string, string | Uint8Array>();
  for (const name of logoNames) {
    const svg = await readFile(path.join(root, "logos", `${name}.svg`), "utf8");
    files.set(`logos/${name}.svg`, svg);
    files.set(
      `logos/${name}.png`,
      png(svg, Math.round(viewBoxWidth(svg) * logoScale)),
    );
  }
  for (const [file, contents] of socialFiles)
    files.set(`social/${file}`, contents);
  for (const font of fonts) {
    for (const file of [...font.files, "OFL.txt"]) {
      files.set(
        `fonts/${font.folder}/${file}`,
        new Uint8Array(
          await readFile(path.join(root, "fonts", font.folder, file)),
        ),
      );
    }
  }
  files.set("profile.json", `${JSON.stringify(profile, null, 2)}\n`);
  return files;
}

export interface Built {
  icons?: Map<string, string | Uint8Array>;
  social?: Map<string, string | Uint8Array>;
}

/**
 * The finished site, keyed by path. By default the CSS comes from dist/, so build that first;
 * `overrides` serves dist's stylesheets from memory instead, by import path, as the tests do.
 * `built` passes what the build already drew for dist/, so it isn't drawn twice.
 */
export async function renderSite(
  overrides: Record<string, string> = {},
  built: Built = {},
): Promise<Map<string, string | Uint8Array>> {
  const [page, css, pkg, iconMap, socialMap, email] = await Promise.all([
    readFile(path.join(source, "index.html"), "utf8"),
    readFile(path.join(source, "style.css"), "utf8"),
    Bun.file(path.join(root, "package.json")).json() as Promise<{
      version: string;
    }>,
    built.icons ?? renderIcons(),
    built.social ?? renderSocial(),
    renderEmail(),
  ]);
  const files = await downloads(socialMap);
  const head = renderHead("icons/", {
    title: "Murad Madi brand files",
    description:
      "Logos, banners, icons, fonts and the email signature for Murad Madi.",
    url: siteUrl,
    iconsUrl: `${siteUrl}icons/`,
  });
  const html = page
    .replace("<!-- mm:head -->", head)
    .replace("<!-- mm:version -->", pkg.version)
    .replace(
      "<!-- mm:themes -->",
      themePanel("terminal", terminal, "default") +
        themePanel("paper", paper, "light preference, print"),
    )
    .replace(
      "<!-- mm:palette -->",
      Object.entries(palette)
        .map(([name, hex]) => swatch(name, hex))
        .join(""),
    )
    .replace(
      "<!-- mm:logos -->",
      logoNames
        .map((name) => logo(name, files.get(`logos/${name}.svg`) as string))
        .join(""),
    )
    .replace("<!-- mm:avatar -->", avatar())
    .replace("<!-- mm:banners -->", social.banners.map(banner).join(""))
    .replace(
      "<!-- mm:icons -->",
      iconsSection(iconMap.get("head.html") as string),
    )
    .replace("<!-- mm:fonts -->", fonts.map(fontCard).join(""))
    .replace(
      "<!-- mm:signatures -->",
      profile.languages
        .map((language) =>
          signature(language, email.get(signatureName(language)) as string),
        )
        .join(""),
    )
    .replace(
      "<!-- mm:profile -->",
      profileSection(files.get("profile.json") as string),
    );
  // Every word in a class attribute, as Tailwind's own scanner would find them.
  const candidates = [...html.matchAll(/class="([^"]*)"/g)].flatMap(
    ([, classes]) => classes?.split(/\s+/).filter(Boolean) ?? [],
  );
  const [styles, fontFaces] = await Promise.all([
    compileCss(css, source, [...new Set(candidates)], overrides),
    inlineFonts(),
  ]);
  const site = new Map<string, string | Uint8Array>([
    [
      "index.html",
      html.replace(
        "<!-- mm:style -->",
        `<style>\n${fontFaces}\n${styles}</style>`,
      ),
    ],
  ]);
  for (const [file, contents] of files) site.set(`downloads/${file}`, contents);
  for (const [file, contents] of iconMap) site.set(`icons/${file}`, contents);
  for (const [file, contents] of email) site.set(`email/${file}`, contents);
  return site;
}
