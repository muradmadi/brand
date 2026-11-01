// The brand's values. Everything the package ships as CSS is generated from this file by
// scripts/build.ts; the reasons behind each value are in the brand book.

/**
 * The named colours, the same in both themes: the two grounds and their text, and coral in the
 * three strengths the grounds need.
 */
export const palette = {
  terminal: "#141416",
  chalk: "#EBE8E2",
  paper: "#F4F1EA",
  ink: "#17171A",
  // Fills, the block, and text on terminal.
  "coral-terminal": "#EE7A52",
  // Fills, the block and large type on paper; too light for body text there.
  "coral-paper": "#D76037",
  // Coral for text and links on paper.
  "coral-ink": "#A63F1B",
} as const;

export type Role =
  | "ground"
  | "surface"
  | "rule"
  | "fg"
  | "fg-2"
  | "fg-muted"
  | "fg-faint"
  | "coral"
  | "coral-text"
  | "on-coral"
  | "ok"
  | "warn"
  | "err";

export type Theme = Record<Role, string>;

/** Terminal is the default theme: warm charcoal, easy on the eyes for long reading. */
export const terminal: Theme = {
  ground: palette.terminal,
  surface: "#1D1D21",
  rule: "#2E2E33",
  fg: palette.chalk,
  "fg-2": "#C9C6BF",
  "fg-muted": "#A09D97",
  "fg-faint": "#8A8780",
  coral: palette["coral-terminal"],
  "coral-text": palette["coral-terminal"],
  "on-coral": palette.terminal,
  ok: "#86C99A",
  warn: "#E2B65E",
  err: "#F2797F",
};

/** Paper, for a light preference and for print. Coral text uses its darker ink. */
export const paper: Theme = {
  ground: palette.paper,
  surface: "#EBE7DE",
  rule: "#D6D0C4",
  fg: palette.ink,
  "fg-2": "#3D3C39",
  "fg-muted": "#5D5B56",
  "fg-faint": "#6E6C67",
  coral: palette["coral-paper"],
  "coral-text": palette["coral-ink"],
  "on-coral": palette.ink,
  ok: "#2F7A4A",
  warn: "#8A5A00",
  err: "#B3262E",
};

/**
 * Text roles and the grounds they sit on; each pair must meet WCAG AA (4.5:1) in both themes.
 * The faint and status colours are for the ground only: on paper's surface they drop below it.
 */
export const textPairs: readonly (readonly [text: Role, ground: Role])[] = [
  ["fg", "ground"],
  ["fg", "surface"],
  ["fg-2", "ground"],
  ["fg-2", "surface"],
  ["fg-muted", "ground"],
  ["fg-muted", "surface"],
  ["coral-text", "ground"],
  ["coral-text", "surface"],
  ["fg-faint", "ground"],
  ["ok", "ground"],
  ["warn", "ground"],
  ["err", "ground"],
  ["on-coral", "coral"],
];

export const fonts = {
  // The frame: the mark, navigation, labels, buttons, code, numbers and dates.
  mono: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
  // The voice: headlines, prose, standfirsts and captions.
  serif: "'Literata Variable', Literata, Georgia, serif",
} as const;

/** The @fontsource-variable stylesheets that load the fonts, with every axis the type roles use. */
export const fontStylesheets = [
  "@fontsource-variable/jetbrains-mono/index.css",
  "@fontsource-variable/jetbrains-mono/wght-italic.css",
  "@fontsource-variable/literata/opsz.css",
  "@fontsource-variable/literata/opsz-italic.css",
] as const;

export interface TypeRole {
  family: keyof typeof fonts;
  weight: number;
  transform?: "uppercase";
  tracking?: string;
  leading: string;
}

export const typeRoles = {
  // Section labels: the only capitals, in mono bold.
  label: {
    family: "mono",
    weight: 700,
    transform: "uppercase",
    tracking: "0.08em",
    leading: "1.4",
  },
  // The name set in text, as the wordmark has it; the logo files are the wordmark itself.
  wordmark: {
    family: "mono",
    weight: 700,
    tracking: "-0.03em",
    leading: "1",
  },
  // Display lines and post titles in Literata; optical sizing picks the cut for the size.
  display: {
    family: "serif",
    weight: 500,
    tracking: "-0.015em",
    leading: "1.05",
  },
  prose: {
    family: "serif",
    weight: 400,
    leading: "1.55",
  },
} as const satisfies Record<string, TypeRole>;

/** Line lengths in the mono's character widths, and the spacing steps of the grid. */
export const measure = { prose: "65ch", code: "80ch" } as const;
export const spacing = {
  "half-ch": "0.5ch",
  "1ch": "1ch",
  "2ch": "2ch",
  "4ch": "4ch",
  "8ch": "8ch",
} as const;

/**
 * The block: the coral square that sits on the baseline after the M and after the name, as a
 * fraction of the type size it follows. It blinks twice when a page first loads, then stays.
 */
export const block = {
  mark: { size: "0.2em", gap: "0.03em" },
  wordmark: { size: "0.22em", gap: "0.06em" },
  blink: { duration: "1.06s", count: 2 },
} as const;
