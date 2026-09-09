# Source of truth for app/favicon.ico, app/apple-icon.png and app/icon.svg.
#
# The STEEZ wordmark is type-only and the fonts come from a provider, so the
# app mark is drawn as geometry instead — no font dependency, and it stays
# crisp at 16px. Regenerate with:  python3 scripts/make-icons.py  (needs Pillow)

from PIL import Image, ImageDraw
import math

GREEN = (4, 52, 44, 255)      # --primary  #04342c
CREAM = (250, 249, 245, 255)  # --primary-foreground  #faf9f5

# Two tangent circles on a 64-unit grid make the S. Each bowl sweeps 235°
# rather than a full 270° — a 270° sweep curls the terminals back on
# themselves and the mark reads as "$".
U = (32.0, 22.0)   # upper bowl centre
L = (32.0, 42.0)   # lower bowl centre; the gap must equal 2R so they meet
R = 10.0           # bowl radius
W = 5.5            # stroke weight
UPPER = (90.0, 325.0)   # Pillow angles: 0 = 3 o'clock, increasing clockwise
LOWER = (-90.0, 145.0)

def _pt(c, deg):
    return (c[0] + R * math.cos(math.radians(deg)), c[1] + R * math.sin(math.radians(deg)))

def render(px, rounded=True, ss=8):
    """Draw at ss x then downsample — Pillow arcs have no round caps or AA."""
    n = px * ss
    k = n / 64.0
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if rounded:
        d.rounded_rectangle([0, 0, n - 1, n - 1], radius=int(14 * k), fill=GREEN)
    else:
        d.rectangle([0, 0, n - 1, n - 1], fill=GREEN)

    w = W * k
    for c, (a0, a1) in ((U, UPPER), (L, LOWER)):
        cx, cy, r = c[0] * k, c[1] * k, R * k
        d.arc([cx - r, cy - r, cx + r, cy + r], a0, a1, fill=CREAM, width=int(round(w)))

    # Round the two open terminals.
    for c, ang in ((U, UPPER[1]), (L, LOWER[1])):
        x, y = _pt(c, ang)
        cx, cy, r = x * k, y * k, w / 2
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CREAM)

    return img.resize((px, px), Image.LANCZOS)

def svg_path():
    sx, sy = _pt(U, UPPER[1])            # upper terminal
    mx, my = _pt(U, UPPER[0])            # where the bowls meet
    ex, ey = _pt(L, LOWER[1])            # lower terminal
    return (f"M{sx:.2f} {sy:.2f}A{R} {R} 0 1 0 {mx:.2f} {my:.2f}"
            f"A{R} {R} 0 1 1 {ex:.2f} {ey:.2f}")

if __name__ == "__main__":
    sizes = [16, 32, 48, 64, 128, 256]
    render(256).save("app/favicon.ico", format="ICO",
                     sizes=[(s, s) for s in sizes],
                     append_images=[render(s) for s in sizes if s != 256])
    render(180, rounded=False).save("app/apple-icon.png", format="PNG")

    with open("app/icon.svg", "w") as f:
        f.write(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"'
            ' role="img" aria-label="STEEZ">\n'
            '  <rect width="64" height="64" rx="14" fill="#04342c"/>\n'
            f'  <path d="{svg_path()}"\n'
            '        fill="none" stroke="#faf9f5" stroke-width="5.5" stroke-linecap="round"/>\n'
            '</svg>\n'
        )
    print("wrote app/favicon.ico, app/apple-icon.png, app/icon.svg")
