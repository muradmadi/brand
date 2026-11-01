// Writes the package's stylesheets, profile, icons, social images and signatures to dist/, then the
// brand site, built from them, to _site/. `just build` runs it.

import { mkdir, rm } from "node:fs/promises";
import { renderFonts, renderTheme, renderVariables } from "../src/css.ts";
import { renderEmail } from "../src/email.ts";
import { renderIcons } from "../src/icons.ts";
import profile from "../src/profile.json" with { type: "json" };
import { renderSite, renderSocial } from "../src/site.ts";

const dist = new URL("../dist/", import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await Promise.all([
  Bun.write(new URL("variables.css", dist), renderVariables()),
  Bun.write(new URL("theme.css", dist), renderTheme()),
  Bun.write(new URL("fonts.css", dist), renderFonts()),
  Bun.write(
    new URL("profile.json", dist),
    `${JSON.stringify(profile, null, 2)}\n`,
  ),
]);

const [icons, social, email] = await Promise.all([
  renderIcons(),
  renderSocial(),
  renderEmail(),
]);
const folders = { icons, social, email };
await Promise.all(
  Object.entries(folders).flatMap(([folder, files]) =>
    [...files].map(([file, contents]) =>
      Bun.write(new URL(`${folder}/${file}`, dist), contents),
    ),
  ),
);

const site = new URL("../_site/", import.meta.url);
await rm(site, { recursive: true, force: true });
const files = await renderSite({}, { icons, social });
await Promise.all(
  [...files].map(([file, contents]) =>
    Bun.write(new URL(file, site), contents),
  ),
);
