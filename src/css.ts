// Turns the tokens into the three stylesheets the package ships.

import {
  block,
  fonts,
  fontStylesheets,
  measure,
  palette,
  paper,
  spacing,
  terminal,
  typeRoles,
  type Theme,
  type TypeRole,
} from "./tokens.ts";

const header =
  "/* Generated from src/tokens.ts by scripts/build.ts. Don't edit. */\n";

const declarations = (vars: Record<string, string>, indent: string): string =>
  Object.entries(vars)
    .map(([name, value]) => `${indent}--colophon-${name}: ${value};`)
    .join("\n");

const roles = (
  theme: Theme,
  scheme: "dark" | "light",
  indent: string,
): string =>
  `${indent}color-scheme: ${scheme};\n${declarations(theme, indent)}`;

const typeVars = (name: string, role: TypeRole): Record<string, string> => ({
  [`${name}-family`]: `var(--colophon-font-${role.family})`,
  [`${name}-weight`]: String(role.weight),
  [`${name}-transform`]: role.transform ?? "none",
  [`${name}-tracking`]: role.tracking ?? "normal",
  [`${name}-leading`]: role.leading,
});

/**
 * Plain CSS variables, `--colophon-*`, for any stylesheet. Terminal applies by default;
 * `data-theme="paper"` on any element switches it and its children to paper, and
 * `data-theme="system"` follows the OS.
 */
export function renderVariables(): string {
  const constants = {
    ...palette,
    "font-mono": fonts.mono,
    "font-serif": fonts.serif,
    ...Object.fromEntries(
      Object.entries(typeRoles).flatMap(([name, role]) =>
        Object.entries(typeVars(name, role)),
      ),
    ),
    "measure-prose": measure.prose,
    "measure-code": measure.code,
    ...Object.fromEntries(
      Object.entries(spacing).map(([name, value]) => [`space-${name}`, value]),
    ),
    "block-mark-size": block.mark.size,
    "block-mark-gap": block.mark.gap,
    "block-wordmark-size": block.wordmark.size,
    "block-wordmark-gap": block.wordmark.gap,
  };
  return `${header}
:root {
${declarations(constants, "  ")}
}

:root,
[data-theme="terminal"] {
${roles(terminal, "dark", "  ")}
}

[data-theme="paper"] {
${roles(paper, "light", "  ")}
}

@media (prefers-color-scheme: light) {
  [data-theme="system"] {
${roles(paper, "light", "    ")}
  }
}
`;
}

const typeUtility = (name: string): string => `@utility type-${name} {
  font-family: var(--colophon-${name}-family);
  font-weight: var(--colophon-${name}-weight);
  text-transform: var(--colophon-${name}-transform);
  letter-spacing: var(--colophon-${name}-tracking);
  line-height: var(--colophon-${name}-leading);
}`;

const blockUtility = (
  name: "mark" | "wordmark",
): string => `@utility ${name}-block {
  display: inline-block;
  width: var(--colophon-block-${name}-size);
  height: var(--colophon-block-${name}-size);
  margin-left: var(--colophon-block-${name}-gap);
  background: var(--colophon-coral);
}`;

/**
 * The Tailwind v4 theme. `inline` makes utilities read the `--colophon-*` variables where they are
 * used, so `data-theme` switches them on any element.
 */
export function renderTheme(): string {
  const colours = [...Object.keys(palette), ...Object.keys(terminal)]
    .map((name) => `  --color-${name}: var(--colophon-${name});`)
    .join("\n");
  const space = Object.keys(spacing)
    .map((name) => `  --spacing-${name}: var(--colophon-space-${name});`)
    .join("\n");
  return `${header}
@import "./variables.css";

@theme inline {
${colours}
  --font-mono: var(--colophon-font-mono);
  --font-serif: var(--colophon-font-serif);
  --default-font-family: var(--colophon-font-mono);
  --default-mono-font-family: var(--colophon-font-mono);
  --container-prose: var(--colophon-measure-prose);
  --container-code: var(--colophon-measure-code);
${space}
  --animate-blink-twice: colophon-blink ${block.blink.duration} steps(1, end) ${block.blink.count};
}

@keyframes colophon-blink {
  50% {
    opacity: 0;
  }
}

${Object.keys(typeRoles).map(typeUtility).join("\n\n")}

${blockUtility("mark")}

${blockUtility("wordmark")}

/* Code shows the characters you'd type, and numbers line up. */
@layer base {
  html {
    font-variant-ligatures: none;
    font-variant-numeric: tabular-nums;
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-blink-twice {
    animation: none;
  }
}
`;
}

/** Loads the two fonts from the @fontsource-variable packages, served with the site. */
export function renderFonts(): string {
  return `${header}
${fontStylesheets.map((sheet) => `@import "${sheet}";`).join("\n")}
`;
}
