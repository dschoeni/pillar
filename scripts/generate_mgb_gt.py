"""Generate a stylized binary STL of a 1973 MGB GT.

Units are millimetres. The model is a low-poly approximation: an extruded
side profile for the body with four cylindrical wheels.
"""

from __future__ import annotations

import math
import struct
from pathlib import Path

Vec3 = tuple[float, float, float]


def normal(a: Vec3, b: Vec3, c: Vec3) -> Vec3:
    ux, uy, uz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
    vx, vy, vz = c[0] - a[0], c[1] - a[1], c[2] - a[2]
    nx = uy * vz - uz * vy
    ny = uz * vx - ux * vz
    nz = ux * vy - uy * vx
    length = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
    return (nx / length, ny / length, nz / length)


def quad(tris: list[tuple[Vec3, Vec3, Vec3]], a: Vec3, b: Vec3, c: Vec3, d: Vec3) -> None:
    tris.append((a, b, c))
    tris.append((a, c, d))


def extrude_profile(profile_xz: list[tuple[float, float]], y_min: float, y_max: float) -> list[tuple[Vec3, Vec3, Vec3]]:
    tris: list[tuple[Vec3, Vec3, Vec3]] = []
    n = len(profile_xz)

    # Side caps: triangulate the 2D profile as a fan from vertex 0.
    for side, y in (("right", y_max), ("left", y_min)):
        for i in range(1, n - 1):
            a = (profile_xz[0][0], y, profile_xz[0][1])
            b = (profile_xz[i][0], y, profile_xz[i][1])
            c = (profile_xz[i + 1][0], y, profile_xz[i + 1][1])
            if side == "right":
                tris.append((a, b, c))
            else:
                tris.append((a, c, b))

    # Side walls connecting the two caps.
    for i in range(n):
        x0, z0 = profile_xz[i]
        x1, z1 = profile_xz[(i + 1) % n]
        p0 = (x0, y_min, z0)
        p1 = (x1, y_min, z1)
        p2 = (x1, y_max, z1)
        p3 = (x0, y_max, z0)
        quad(tris, p0, p1, p2, p3)

    return tris


def cylinder(center: Vec3, axis: str, radius: float, length: float, segments: int = 24) -> list[tuple[Vec3, Vec3, Vec3]]:
    """Cylinder centred on `center`, aligned with the given axis ('y')."""
    assert axis == "y"
    cx, cy, cz = center
    half = length / 2.0
    tris: list[tuple[Vec3, Vec3, Vec3]] = []

    ring_lo = []
    ring_hi = []
    for i in range(segments):
        theta = 2 * math.pi * i / segments
        dx = radius * math.cos(theta)
        dz = radius * math.sin(theta)
        ring_lo.append((cx + dx, cy - half, cz + dz))
        ring_hi.append((cx + dx, cy + half, cz + dz))

    # Side walls.
    for i in range(segments):
        j = (i + 1) % segments
        quad(tris, ring_lo[i], ring_lo[j], ring_hi[j], ring_hi[i])

    # End caps (fans).
    cap_lo = (cx, cy - half, cz)
    cap_hi = (cx, cy + half, cz)
    for i in range(segments):
        j = (i + 1) % segments
        tris.append((cap_lo, ring_lo[j], ring_lo[i]))
        tris.append((cap_hi, ring_hi[i], ring_hi[j]))

    return tris


def build_mgb_gt() -> list[tuple[Vec3, Vec3, Vec3]]:
    # Side profile (x, z) traced clockwise so the right-side cap faces +Y.
    # Dimensions roughly match a 1973 MGB GT: ~3890 mm long, ~1270 mm tall.
    profile = [
        (0,    260),   # front bumper bottom
        (250,  260),
        (250,  430),   # front valance
        (380,  500),   # front bumper top
        (420,  720),   # bonnet leading edge
        (900,  780),   # bonnet
        (1180, 800),   # cowl / scuttle
        (1280, 1230),  # top of windscreen
        (2380, 1270),  # rear of roof (slight peak)
        (2750, 1180),  # start of fastback
        (3350, 900),   # fastback shoulder
        (3700, 770),   # rear hatch top
        (3820, 700),
        (3890, 600),   # rear bumper top
        (3890, 260),   # rear bumper bottom
        (3700, 260),
    ]

    body_half_width = 760.0
    tris = extrude_profile(profile, -body_half_width, body_half_width)

    # Wheels: front axle ~610 mm from nose, rear axle ~2920 mm; hub 305 mm.
    wheel_radius = 305.0
    wheel_thickness = 165.0
    wheel_offset = body_half_width - wheel_thickness / 2.0 + 30.0
    front_x = 700.0
    rear_x = 3050.0
    wheel_z = 305.0  # ground at z = 0; tyre touches ground.

    for x in (front_x, rear_x):
        for y_sign in (-1, 1):
            tris.extend(
                cylinder(
                    center=(x, y_sign * wheel_offset, wheel_z),
                    axis="y",
                    radius=wheel_radius,
                    length=wheel_thickness,
                    segments=28,
                )
            )

    return tris


def write_binary_stl(path: Path, triangles: list[tuple[Vec3, Vec3, Vec3]]) -> None:
    header = b"MGB GT 1973 - stylized low-poly model".ljust(80, b"\0")
    with path.open("wb") as f:
        f.write(header)
        f.write(struct.pack("<I", len(triangles)))
        for a, b, c in triangles:
            nx, ny, nz = normal(a, b, c)
            f.write(struct.pack("<fff", nx, ny, nz))
            f.write(struct.pack("<fff", *a))
            f.write(struct.pack("<fff", *b))
            f.write(struct.pack("<fff", *c))
            f.write(struct.pack("<H", 0))


def main() -> None:
    triangles = build_mgb_gt()
    out = Path(__file__).resolve().parent.parent / "models" / "mgb_gt_1973.stl"
    out.parent.mkdir(parents=True, exist_ok=True)
    write_binary_stl(out, triangles)
    print(f"Wrote {len(triangles)} triangles to {out}")


if __name__ == "__main__":
    main()
