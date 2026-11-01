# /// script
# requires-python = ">=3.12"
# dependencies = ["fonttools[woff]==4.68.0", "uharfbuzz==0.57.0"]
# ///
"""Draw the logo SVGs in logos/, the social images in social/ and the icon sources in icons/, with
the text as outlines so they need no fonts.

`just logos` runs it. It follows the brand book's logo chapter: the M in JetBrains Mono ExtraBold
with the coral block on the baseline, the wordmark, the lockup and the prompt, set as the browser
sets them, using the fonts from node_modules. The social images are at the sizes in
src/social.json; the lockup and banners take the name and role from src/profile.json. The icons
are the mark; src/icons.ts turns them into the favicon and app icons.
"""

import io
import json
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2"
OUT = ROOT / "logos"
SOCIAL = ROOT / "social"
ICONS = ROOT / "icons"

TERMINAL = "#141416"
CHALK = "#EBE8E2"
PAPER = "#F4F1EA"
INK = "#17171A"
CORAL = "#EE7A52"
CORAL_PAPER = "#D76037"
CORAL_INK = "#A63F1B"

# Per ground: letters, block, muted text, rules, and coral as text.
GROUNDS = {
    "terminal": (CHALK, CORAL, "#A09D97", "#2E2E33", CORAL),
    "paper": (INK, CORAL_PAPER, "#5D5B56", "#D6D0C4", CORAL_INK),
}
# The mark in one colour: on a coral ground, for print, and on photos.
ONE_COLOUR = {"coral": TERMINAL, "black": "#000000", "white": "#FFFFFF"}

# The block's size, and the clear gap between the M's right stem and it, in em of the M. The gap is
# measured from the ink: set with the browser's -0.06em letter spacing it shrinks to a hairline,
# and the one-colour marks would read as one shape.
MARK_BLOCK, MARK_GAP = 0.2, 0.03
# The wordmark's, after "murad madi".
WORD_TRACKING, WORD_BLOCK, WORD_GAP = -0.03, 0.22, 0.06
# The prompt's cursor: a full cell, sunk below the baseline like a terminal's.
CURSOR_WIDTH, CURSOR_HEIGHT, CURSOR_DROP, CURSOR_GAP = 0.55, 1.0, 0.15, 0.15
PAD = 2
LABEL = "Murad Madi"


def num(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


class Face:
    """A variable font fixed at one weight, shaped with HarfBuzz."""

    def __init__(self, path, weight):
        font = instantiateVariableFont(TTFont(path), {"wght": weight})
        font.flavor = None
        buf = io.BytesIO()
        font.save(buf)
        self.data = buf.getvalue()
        self.font = TTFont(io.BytesIO(self.data))
        upem = self.font["head"].unitsPerEm
        # Chromium's line metrics: typo metrics when USE_TYPO_METRICS is set, hhea otherwise.
        os2 = self.font["OS/2"]
        if os2.fsSelection & (1 << 7):
            self.ascent, self.descent = os2.sTypoAscender / upem, -os2.sTypoDescender / upem
        else:
            self.ascent, self.descent = self.font["hhea"].ascent / upem, -self.font["hhea"].descent / upem

    def baseline(self, size, leading):
        """Baseline position from the top of a line box `leading` times `size` high."""
        return (leading * size - (self.ascent + self.descent) * size) / 2 + self.ascent * size

    def outline(self, text, size, tracking=0.0):
        """SVG path for `text` at `size` px with CSS letter-spacing `tracking` (em), baseline at y=0.

        Returns the path, the advance width (with the trailing spacing, as CSS adds it) and the
        ink bounds (x0, y0, x1, y1) in SVG space. Ligatures are off, as everywhere in the brand.
        """
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(hb.Font(hb.Face(self.data)), buf, {"liga": False, "clig": False, "calt": False})
        glyphs = self.font.getGlyphSet()
        order = self.font.getGlyphOrder()
        scale = size / self.font["head"].unitsPerEm
        pen = SVGPathPen(glyphs, ntos=num)
        bounds = BoundsPen(glyphs)
        x = 0.0
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            transform = (scale, 0, 0, -scale, x + pos.x_offset * scale, -pos.y_offset * scale)
            glyphs[order[info.codepoint]].draw(TransformPen(pen, transform))
            glyphs[order[info.codepoint]].draw(TransformPen(bounds, transform))
            x += pos.x_advance * scale + tracking * size
        return pen.getCommands(), x, bounds.bounds


def union(*boxes):
    return (
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    )


def rect(x, y, w, h, fill):
    return f'<rect x="{num(x)}" y="{num(y)}" width="{num(w)}" height="{num(h)}" fill="{fill}"/>'


def path(d, fill, x=0.0, y=0.0):
    move = f' transform="translate({num(x)} {num(y)})"' if x or y else ""
    return f'<path fill="{fill}"{move} d="{d}"/>'


def mark(bold, size, letter, block):
    """The M and its block at `size` px, baseline at y=0. Returns the body, the advance (where the
    block ends) and the ink bounds."""
    m, _, ink = bold.outline("M", size)
    bx, side = ink[2] + MARK_GAP * size, MARK_BLOCK * size
    body = [path(m, letter), rect(bx, -side, side, side, block)]
    return body, bx + side, union(ink, (bx, -side, bx + side, 0))


def wordmark(bold, size, letter, block):
    """`murad madi` and its block at `size` px, baseline at y=0. Returns the body, the advance and
    the ink bounds."""
    name, advance, ink = bold.outline("murad madi", size, WORD_TRACKING)
    bx, side = advance + WORD_GAP * size, WORD_BLOCK * size
    body = [path(name, letter), rect(bx, -side, side, side, block)]
    return body, bx + side, union(ink, (bx, -side, bx + side, 0))


def prompt_line(regular, size, letter, muted):
    """`$ whoami` at `size` px, the dollar sign muted, baseline at y=0."""
    dollar, adv, d_ink = regular.outline("$ ", size)
    cmd, cmd_adv, c_ink = regular.outline("whoami", size)
    body = [path(dollar, muted), path(cmd, letter, adv)]
    return body, adv + cmd_adv, union(d_ink, (c_ink[0] + adv, c_ink[1], c_ink[2] + adv, c_ink[3]))


def cursor_line(face, size, text, letter, cursor, tracking=0.0):
    """`text` followed by the prompt's cursor, at `size` px, baseline at y=0."""
    d, advance, ink = face.outline(text, size, tracking)
    cx, w, h = advance + CURSOR_GAP * size, CURSOR_WIDTH * size, CURSOR_HEIGHT * size
    top = CURSOR_DROP * size - h
    body = [path(d, letter), rect(cx, top, w, h, cursor)]
    return body, cx + w, union(ink, (cx, top, cx + w, top + h))


def write(name, box, body, folder=OUT):
    """One logo SVG cropped to the ink `box`, padded by PAD on every side."""
    x0, y0, x1, y1 = box
    lines = "\n".join(f"    {line}" for line in body)
    (folder / name).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {num(x1 - x0 + 2 * PAD)} {num(y1 - y0 + 2 * PAD)}" role="img" aria-label="{LABEL}">\n'
        f"  <title>{LABEL}</title>\n"
        f'  <g transform="translate({num(PAD - x0)} {num(PAD - y0)})">\n{lines}\n  </g>\n'
        f"</svg>\n"
    )


def write_image(name, width, height, body, folder):
    """One image, `width` by `height` px with nothing outside it."""
    lines = "\n".join(f"  {line}" for line in body)
    (folder / name).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{LABEL}">\n'
        f"  <title>{LABEL}</title>\n{lines}\n</svg>\n"
    )


def group(body, x, y, scale=1.0):
    size = f" scale({num(scale)})" if scale != 1 else ""
    return [f'<g transform="translate({num(x)} {num(y)}){size}">', *(f"  {line}" for line in body), "</g>"]


def lockup(extrabold, bold, regular, role, letter, block, muted, rule):
    """The mark, a rule, then the name over the role, as the brand book sets it at twice the size.

    The 88px mark in extra bold in a line box as tall as it, a 24px gap, a 2px rule as tall as the mark, a 24px
    gap, then a column centred on the mark: the name in bold at 30px (-0.02em), an 8px gap, and the
    role at 18px, each line 1.2 times its size. Returns the body and the ink bounds.
    """
    size = 88
    m_body, m_adv, m_ink = mark(extrabold, size, letter, block)
    m_base = extrabold.baseline(size, 1)
    rx = m_adv + 24
    name, _, n_ink = bold.outline("murad madi", 30, -0.02)
    role_d, _, r_ink = regular.outline(role, 18)
    column = 30 * 1.2 + 8 + 18 * 1.2
    top = (size - column) / 2
    n_base = top + bold.baseline(30, 1.2)
    r_base = top + 30 * 1.2 + 8 + regular.baseline(18, 1.2)
    tx = rx + 2 + 24
    body = [
        *group(m_body, 0, m_base),
        rect(rx, 0, 2, size, rule),
        path(name, letter, tx, n_base),
        path(role_d, muted, tx, r_base),
    ]
    box = union(
        (m_ink[0], m_ink[1] + m_base, m_ink[2], m_ink[3] + m_base),
        (rx, 0, rx + 2, size),
        (tx + n_ink[0], n_base + n_ink[1], tx + n_ink[2], n_base + n_ink[3]),
        (tx + r_ink[0], r_base + r_ink[1], tx + r_ink[2], r_base + r_ink[3]),
    )
    return body, box


def prompt(regular, letter, cursor, muted):
    """`$ whoami`, then `murad madi` and the cursor on the next line, at 32px with 1.5 leading."""
    size, leading = 32, 1.5 * 32
    p_body, _, p_ink = prompt_line(regular, size, letter, muted)
    n_body, _, n_ink = cursor_line(regular, size, "murad madi", letter, cursor)
    body = [*p_body, *group(n_body, 0, leading)]
    return body, union(p_ink, (n_ink[0], n_ink[1] + leading, n_ink[2], n_ink[3] + leading))


def centred_mark(bold, square, width_share, letter, block):
    """The mark with its ink centred in a `square` px square, its ink `width_share` of the side."""
    body, _, (x0, y0, x1, y1) = mark(bold, 100, letter, block)
    s = width_share * square / (x1 - x0)
    x = square / 2 - (x0 + x1) / 2 * s
    y = square / 2 - (y0 + y1) / 2 * s
    return group(body, x, y, s)


def main():
    OUT.mkdir(exist_ok=True)
    profile = json.loads((ROOT / "src/profile.json").read_text())
    extrabold = Face(FONT, 800)
    bold = Face(FONT, 700)
    regular = Face(FONT, 400)

    # Mark: the M at 128px with its block, on terminal and paper, and in one colour.
    for ground, (letter, block, *_rest) in GROUNDS.items():
        body, _, ink = mark(extrabold, 128, letter, block)
        write(f"mark-on-{ground}.svg", ink, body)
    for name, colour in ONE_COLOUR.items():
        body, _, ink = mark(extrabold, 128, colour, colour)
        write(f"mark-{'on-coral' if name == 'coral' else name}.svg", ink, body)

    # Wordmark: `murad madi` at 48px with its block.
    for ground, (letter, block, *_rest) in GROUNDS.items():
        body, _, ink = wordmark(bold, 48, letter, block)
        write(f"wordmark-on-{ground}.svg", ink, body)

    for ground, (letter, block, muted, rule, _) in GROUNDS.items():
        body, box = lockup(extrabold, bold, regular, profile["roleShort"]["en"], letter, block, muted, rule)
        write(f"lockup-on-{ground}.svg", box, body)

    letter, block, muted, *_ = GROUNDS["terminal"]
    body, box = prompt(regular, letter, block, muted)
    write("prompt-on-terminal.svg", box, body)

    social(extrabold, bold, regular, profile)
    icons(extrabold)


def banner_body(bold, regular, profile, w, h, safe):
    """A banner on terminal: a manual's running head across the top of the safe area, then the
    prompt, the name with the cursor, and the role and site, as a column centred in it.

    The name's size comes from the safe area; everything else is a share of it.
    """
    letter, block, muted, _, coral = GROUNDS["terminal"]
    sx, sy, sw, sh = safe
    n = min(0.22 * sh, 0.085 * sw)
    small = 0.36 * n
    head = 0.26 * n

    p_body, _, p_ink = prompt_line(regular, small, letter, muted)
    c_body, _, c_ink = cursor_line(bold, n, "murad madi", letter, block, WORD_TRACKING)
    role, r_adv, r_ink = regular.outline(f"{profile['roleShort']['en']} · ", small)
    site, _, s_ink = regular.outline(profile["website"].removeprefix("https://"), small)

    # Baselines down the column, from its top.
    p_base = -p_ink[1]
    c_base = p_base + 0.55 * n - c_ink[1]
    r_base = c_base + c_ink[3] + 0.42 * n + small * 0.75
    width = max(p_ink[2], c_ink[2], r_adv + s_ink[2])
    height = r_base + max(r_ink[3], s_ink[3])

    # The running head keeps a margin inside the safe area, so no crop cuts it close.
    inset = 0.3 * n
    title, t_adv, t_ink = regular.outline("MURADMADI(1)", head)
    where, w_adv, _ = regular.outline(profile["location"], head)
    head_base = sy + inset - t_ink[1]
    head_bottom = head_base + t_ink[3]
    # The column sits in what the safe area has left under the running head.
    left = sx + (sw - width) / 2
    top = head_bottom + (sy + sh - inset - head_bottom - height) / 2

    return [
        rect(0, 0, w, h, TERMINAL),
        path(title, muted, sx + inset, head_base),
        path(where, muted, sx + (sw - w_adv) / 2, head_base),
        path(title, muted, sx + sw - inset - t_adv, head_base),
        *group(p_body, left, top + p_base),
        *group(c_body, left, top + c_base),
        path(role, muted, left, top + r_base),
        path(site, coral, left + r_adv, top + r_base),
    ]


def social(extrabold, bold, regular, profile):
    """The avatar and the banners, all on terminal."""
    spec = json.loads((ROOT / "src/social.json").read_text())
    SOCIAL.mkdir(exist_ok=True)
    letter, block, *_ = GROUNDS["terminal"]

    # Avatar: the mark in the middle of the circle every platform crops it to.
    w, h = spec["avatar"]["width"], spec["avatar"]["height"]
    write_image("avatar.svg", w, h, [rect(0, 0, w, h, TERMINAL), *centred_mark(extrabold, w, 0.5, letter, block)], SOCIAL)

    for banner in spec["banners"]:
        w, h = banner["width"], banner["height"]
        body = banner_body(bold, regular, profile, w, h, banner["safe"])
        write_image(f"banner-{banner['name']}.svg", w, h, body, SOCIAL)


def icons(extrabold):
    """The sources of the favicon and the app icons, all 512 px square."""
    ICONS.mkdir(exist_ok=True)
    letter, block, *_ = GROUNDS["terminal"]
    sq = 512
    ground = rect(0, 0, sq, sq, TERMINAL)
    write_image("favicon.svg", sq, sq, [ground, *centred_mark(extrabold, sq, 0.78, letter, block)], ICONS)
    # At 16px the block turns to mush, so the tile turns coral and the M goes dark, with no block.
    m, _, (x0, y0, x1, y1) = extrabold.outline("M", 100)
    s = 0.62 * sq / (y1 - y0)
    tile = [
        rect(0, 0, sq, sq, CORAL),
        f'<path fill="{TERMINAL}" transform="translate({num(sq / 2 - (x0 + x1) / 2 * s)} {num(sq / 2 - (y0 + y1) / 2 * s)}) scale({num(s)})" d="{m}"/>',
    ]
    write_image("favicon-16.svg", sq, sq, tile, ICONS)
    # iOS rounds the touch icon itself and turns transparency black, so it's a full square.
    write_image("apple-touch-icon.svg", sq, sq, [ground, *centred_mark(extrabold, sq, 0.62, letter, block)], ICONS)
    # Maskable: full bleed, the mark inside the middle 80% circle that every launcher mask keeps.
    write_image("maskable.svg", sq, sq, [ground, *centred_mark(extrabold, sq, 0.5, letter, block)], ICONS)
    # Monochrome: one colour on transparent; the system tints it and reads only its alpha.
    write_image("monochrome.svg", sq, sq, centred_mark(extrabold, sq, 0.5, "#FFFFFF", "#FFFFFF"), ICONS)


if __name__ == "__main__":
    main()
