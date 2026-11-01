# brand

Murad Madi's brand as a package, `@muradmadi/brand`: the colophon(7) Tailwind v4 theme and CSS
variables, logos, icons, social banners, desktop fonts, the email signature and `src/profile.json`.
It's published to npm on every release, and the site in `site/` is deployed to
https://muradmadi.github.io/brand/.

## The brand book is private

The brand book at `~/muradmadi/guidelines/index.html` is where every value here comes from, and it
is internal. Never publish it, copy it into this repo, or put its chapters (voice, language,
content, components) on the site. The site offers only what the package ships: logos, banners,
icons, fonts, the signature and the profile.

## Where things come from

- `src/tokens.ts` holds the colours, fonts, type roles, measures and the block; `src/css.ts` turns
  them into `dist/`'s stylesheets. Every text pair in `textPairs` must clear WCAG AA in both
  themes; the tests check it.
- `src/profile.json` is the one place for the name, role, intro, location, email and links. No
  phone number, and no X link.
- `scripts/logos.py` (`just logos`, through uv) draws `logos/`, `social/` and `icons/` from the
  fonts in `node_modules`. Those SVGs are committed; redraw them after changing the profile,
  `src/social.json` or the drawing, and look at the result.
- `fonts/` holds the upstream desktop TTFs and their OFL.txt, unchanged.
- `just build` writes `dist/` and `_site/`. Neither is committed.

## Working here

The tools are pinned in `mise.toml`: run `mise install`, then `just setup` once. `just check` is the
gate, the same one CI runs (`just ci`): run it before calling a change done, and report what it
printed. In a shell without mise activated, run `mise exec -- just check`.

## Git and GitHub

- Changes reach `main` only through a pull request whose `check` passes; a ruleset enforces it.
  One branch per change, kept to one commit.
- PRs are squash-merged, so the PR title becomes the commit on `main`. Titles are Conventional
  Commits, `type: description`, with the description in the imperative and starting lowercase.
  `feat` releases a minor version, `fix` and `perf` a patch, and `!` after the type a major;
  `refactor`, `docs`, `test`, `build`, `ci`, `chore` and `revert` don't release.
- release-please owns `CHANGELOG.md` and the version, and Renovate owns dependency and tool
  updates; don't edit those by hand. release-please's PRs need "Approve workflows to run" clicked
  once before their `check` runs.
- Labels: `feature`, `bug`, `docs`, `ci`, `dependencies`.
- Don't merge a PR unless the owner asks.
- Never commit `.env` files, databases or backups; the pre-commit hook and gitleaks refuse secrets.
