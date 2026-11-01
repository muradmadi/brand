import { beforeAll, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderTheme, renderVariables } from "./css.ts";
import { pngSize } from "./png.ts";
import {
  fonts,
  logoNames,
  logoScale,
  renderSite,
  socialImages,
  viewBoxWidth,
} from "./site.ts";
import social from "./social.json" with { type: "json" };
import { palette, paper, terminal } from "./tokens.ts";

// dist/ may not be built yet (CI runs the tests first), so serve its stylesheets from memory.
let site = new Map<string, string | Uint8Array>();
let page = "";
beforeAll(async () => {
  site = await renderSite({
    "../dist/theme.css": renderTheme(),
    "./variables.css": renderVariables(),
  });
  page = site.get("index.html") as string;
}, 60_000);

test("both fonts are inlined, latin and latin-ext only", () => {
  for (const family of ["JetBrains Mono", "Literata"]) {
    expect(page).toContain(`font-family: '${family} Variable'`);
  }
  expect(page).toContain("data:font/woff2;base64,");
  expect(page).not.toContain("url(./files/");
  expect(page).not.toMatch(/vietnamese|cyrillic|greek/);
});

test("the page fetches nothing from another site", () => {
  // Anything that would fetch from elsewhere: stylesheets, scripts, images, and url() pointing
  // off the site. Links in the signatures and the profile are only followed when clicked.
  const fetches = page.match(
    /<link\b[^>]*rel="stylesheet"[^>]*>|<link\b[^>]*href="(?!icons\/)[^"]*"[^>]*>|<script\s+src[^>]*>|url\((?!data:)[^)]*\)|src="(?:https?:)?\/\/[^"]*"/g,
  );
  expect(fetches).toBeNull();
  expect(page).not.toContain("<!-- mm:");
});

test("the CSS covers the theme's utilities the page uses", () => {
  for (const selector of [
    ".bg-ground",
    ".type-label",
    ".wordmark-block",
    ".animate-blink-twice",
    ".text-coral-text",
    ".bg-coral-terminal",
    ".border-coral-terminal",
  ]) {
    expect(page).toContain(`${selector} {`);
  }
});

test("every colour and every logo is on the page", () => {
  for (const hex of [
    ...Object.values(palette),
    ...Object.values(terminal),
    ...Object.values(paper),
  ])
    expect(page).toContain(`data-copy="${hex}"`);
  expect(page.match(/<svg class=/g)?.length).toBe(logoNames.length);
});

test("both signatures are on the page, ready to copy", () => {
  expect(page).toContain('data-copy-rich="signature-en"');
  expect(page).toContain('data-copy-rich="signature-es"');
  expect(site.has("email/signature.html")).toBe(true);
  expect(site.has("email/signature.es.html")).toBe(true);
});

test("every file the page links or shows is built, and every file built is linked", () => {
  const used = new Set(
    [
      ...page.matchAll(/(?:href|src)="((?:downloads|icons|email)\/[^"]+)"/g),
    ].map(([, file]) => decodeURI(file as string)),
  );
  for (const file of used) expect(site.has(file)).toBe(true);
  const files = [...site.keys()].filter((file) => file !== "index.html");
  const fontFiles = fonts.reduce((n, f) => n + f.files.length + 1, 0);
  expect(files.filter((file) => file.startsWith("downloads/")).length).toBe(
    2 * logoNames.length + 2 * socialImages().length + fontFiles + 1,
  );
  for (const file of files) expect(used.has(file)).toBe(true);
});

test("the social PNGs are the size each platform asks for", () => {
  expect(
    pngSize(site.get("downloads/social/avatar.png") as Uint8Array),
  ).toEqual([social.avatar.width, social.avatar.height]);
  for (const b of social.banners) {
    expect(
      pngSize(site.get(`downloads/social/banner-${b.name}.png`) as Uint8Array),
    ).toEqual([b.width, b.height]);
  }
});

test("the logo PNGs are drawn at four times their SVG size", () => {
  for (const name of logoNames) {
    const svg = site.get(`downloads/logos/${name}.svg`) as string;
    const [width] = pngSize(
      site.get(`downloads/logos/${name}.png`) as Uint8Array,
    );
    expect(width).toBe(Math.round(viewBoxWidth(svg) * logoScale));
  }
});

test("the logo and social SVGs are drawn without fonts, at their sizes", async () => {
  for (const name of logoNames) {
    const svg = await readFile(
      path.join(import.meta.dir, "../logos", `${name}.svg`),
      "utf8",
    );
    expect(svg).not.toContain("<text");
  }
  const images = [
    { name: "avatar", ...social.avatar },
    ...social.banners.map((b) => ({ ...b, name: `banner-${b.name}` })),
  ];
  for (const { name, width, height } of images) {
    const svg = await readFile(
      path.join(import.meta.dir, "../social", `${name}.svg`),
      "utf8",
    );
    expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
    expect(svg).not.toContain("<text");
  }
});
