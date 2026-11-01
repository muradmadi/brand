import { expect, test } from "bun:test";
import { renderFonts, renderTheme, renderVariables } from "./css.ts";
import { compileCss } from "./tailwind.ts";
import { palette } from "./tokens.ts";

// Compile the theme the way a site would import it, with the stylesheets rendered in memory.
const tailwind = (candidates: string[]): Promise<string> =>
  compileCss(
    '@import "tailwindcss";\n@import "./theme.css";',
    import.meta.dir,
    candidates,
    { "./theme.css": renderTheme(), "./variables.css": renderVariables() },
  );

test("every colour becomes a Tailwind utility that reads the --colophon variable", async () => {
  const css = await tailwind([
    "bg-ground",
    "text-fg",
    "text-coral-text",
    "border-rule",
    "bg-coral-paper",
  ]);
  expect(css).toContain("background-color: var(--colophon-ground)");
  expect(css).toContain("color: var(--colophon-fg)");
  expect(css).toContain("color: var(--colophon-coral-text)");
  expect(css).toContain("border-color: var(--colophon-rule)");
  expect(css).toContain("background-color: var(--colophon-coral-paper)");
});

test("the type roles, the blocks, the spacing and the blink are utilities", async () => {
  const css = await tailwind([
    "type-label",
    "type-display",
    "mark-block",
    "wordmark-block",
    "gap-2ch",
    "max-w-code",
    "animate-blink-twice",
    "font-serif",
  ]);
  expect(css).toContain("letter-spacing: var(--colophon-label-tracking)");
  expect(css).toContain("font-family: var(--colophon-display-family)");
  expect(css).toContain("width: var(--colophon-block-mark-size)");
  expect(css).toContain("margin-left: var(--colophon-block-wordmark-gap)");
  expect(css).toContain("gap: var(--colophon-space-2ch)");
  expect(css).toContain("max-width: var(--colophon-measure-code)");
  expect(css).toContain("animation: colophon-blink");
  expect(css).toContain("font-family: var(--colophon-font-serif)");
});

test("text defaults to JetBrains Mono, without ligatures", async () => {
  const css = await tailwind([]);
  // `inline` puts the variable straight into the base styles.
  expect(css).toContain("font-family: var(--colophon-font-mono,");
  expect(css).toContain("font-variant-ligatures: none");
});

test("the variables define every palette colour and switch roles by data-theme", () => {
  const css = renderVariables();
  for (const [name, hex] of Object.entries(palette))
    expect(css).toContain(`--colophon-${name}: ${hex};`);
  expect(css).toContain(
    '[data-theme="paper"] {\n  color-scheme: light;\n  --colophon-ground: #F4F1EA;',
  );
  expect(css).toContain(
    '@media (prefers-color-scheme: light) {\n  [data-theme="system"]',
  );
});

test("fonts load from the @fontsource-variable packages that exist", async () => {
  const imports = [...renderFonts().matchAll(/@import "([^"]+)";/g)].map(
    (m) => m[1] ?? "",
  );
  expect(imports.length).toBe(4);
  for (const sheet of imports)
    expect(
      await Bun.file(Bun.resolveSync(sheet, import.meta.dir)).exists(),
    ).toBe(true);
});
