import { beforeAll, expect, test } from "bun:test";
import { renderEmail, signatureName } from "./email.ts";
import profile from "./profile.json" with { type: "json" };

let files = new Map<string, string>();
beforeAll(async () => {
  files = await renderEmail();
});

test("there's one signature per language", () => {
  expect([...files.keys()]).toEqual(profile.languages.map(signatureName));
});

test("the signatures are what mail clients keep: inline styles, no stylesheet, script or image", () => {
  for (const html of files.values()) {
    expect(html).not.toMatch(/<style|class=|<script|<link|<img/);
    expect(html).not.toStartWith("<!--");
  }
});

test("every slot is filled from the profile", () => {
  for (const [language, html] of profile.languages.map(
    (l) => [l, files.get(signatureName(l)) as string] as const,
  )) {
    expect(html).not.toMatch(/\{[A-Za-z]+\}/);
    expect(html).toContain(profile.name);
    expect(html).toContain(profile.role[language as "en" | "es"]);
    expect(html).toContain(`href="${profile.website}"`);
    for (const link of Object.values(profile.links))
      expect(html).toContain(`href="${link}"`);
  }
});

test("the block is a coral table cell", () => {
  expect(files.get("signature.html")).toContain('bgcolor="#d76037"');
});
