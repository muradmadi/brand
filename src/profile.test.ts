import { expect, test } from "bun:test";
import profile from "./profile.json" with { type: "json" };

test("every translated field has each language and no other", () => {
  for (const field of [profile.role, profile.roleShort, profile.intro]) {
    expect(Object.keys(field)).toEqual(profile.languages);
    for (const text of Object.values(field)) expect(text).not.toBe("");
  }
  expect(profile.languages[0]).toBe("en");
});

test("the website and links are https, the website the bare domain", () => {
  expect(profile.website).toMatch(/^https:\/\/(?!www\.)[a-z0-9.-]+$/);
  for (const link of Object.values(profile.links))
    expect(link).toMatch(/^https:\/\//);
});

test("the links are LinkedIn, GitHub and YouTube", () => {
  expect(Object.keys(profile.links)).toEqual(["linkedin", "github", "youtube"]);
});

test("no phone number is published", () => {
  expect(JSON.stringify(profile)).not.toMatch(/\+\d|\d{3}[ -]?\d{3}[ -]?\d{3}/);
});
