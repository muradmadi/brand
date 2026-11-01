// Builds the email signature: the template in email/ with every slot filled from the profile, once
// for each of its languages.

import { readFile } from "node:fs/promises";
import path from "node:path";
import profile from "./profile.json" with { type: "json" };

const root = path.resolve(import.meta.dir, "..");

export type Language = keyof typeof profile.role;

/** The signature's file name for `language`: English is the plain one. */
export const signatureName = (language: string): string =>
  language === "en" ? "signature.html" : `signature.${language}.html`;

/** What each slot in the template is filled with. */
export const slots = (language: Language): Record<string, string> => ({
  name: profile.name,
  role: profile.role[language],
  location: profile.location,
  website: profile.website,
  websiteLabel: new URL(profile.website).hostname,
  linkedin: profile.links.linkedin,
  github: profile.links.github,
  youtube: profile.links.youtube,
});

const escape = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** One signature per language, keyed by file name. */
export async function renderEmail(): Promise<Map<string, string>> {
  const template = await readFile(
    path.join(root, "email", "signature.template.html"),
    "utf8",
  );
  // The template's opening comment is for this repo, not for every email sent.
  const body = template.replace(/^<!--[\s\S]*?-->\s*/, "");
  return new Map(
    profile.languages.map((language) => [
      signatureName(language),
      body.replace(/\{([A-Za-z]+)\}/g, (slot, key: string) => {
        const value = slots(language as Language)[key];
        return value === undefined ? slot : escape(value);
      }),
    ]),
  );
}
