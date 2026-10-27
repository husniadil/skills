# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy==2.5.4", "pillow==12.3.0"]
# ///
"""Two-pass frame sifting.

Holistic pass: keep a frame when at least --unique percent of its blocks differ
from the last kept frame, so a shot where only a mouth moves yields one frame
while cuts, zooms and pans yield new ones.

Detail pass: inside each holistic span, group blocks that keep changing into
clusters (mouth, legs, hands) and keep every distinct pose of each cluster,
with the order and timing in which the poses appear.

  uv run framesift.py <video> <out_dir> [--vtt captions.vtt] [--unique 20] [--start S --end E]
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

AW, AH = 320, 180          # analysis frame size
BS = 10                    # block size in analysis pixels
GW, GH = AW // BS, AH // BS
OW, OH = 1280, 720         # saved frame size
SCALE = OW // AW
COLORS = [(255, 64, 64), (64, 200, 255), (255, 200, 0), (120, 255, 120)]


def decode(video, fps, w, h, pix, start, end):
    cmd = ["ffmpeg", "-nostdin", "-v", "error"]
    if sys.platform == "darwin":
        cmd += ["-hwaccel", "videotoolbox"]
    if start:
        cmd += ["-ss", str(start)]
    cmd += ["-i", str(video)]
    if end:
        cmd += ["-t", str(end - (start or 0))]
    cmd += ["-vf", f"fps={fps},scale={w}:{h}:flags=area", "-pix_fmt", pix, "-f", "rawvideo", "-"]
    shape = (h, w) if pix == "gray" else (h, w, 3)
    size = int(np.prod(shape))
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    i = 0
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        yield i, np.frombuffer(buf, np.uint8).reshape(shape)
        i += 1
    p.stdout.close()
    if p.wait() != 0:
        sys.exit(f"ffmpeg failed: {' '.join(cmd)}")


def block_means(f):
    # Block averages shrug off small camera drift that per-pixel differences would count.
    return f.reshape(GH, BS, GW, BS).mean(axis=(1, 3))


def secs(h, m, s):
    return float(h) * 3600 + float(m) * 60 + float(s)


def speech_intervals(vtt):
    """Speech spans from the per-word times in YouTube auto-captions.

    Whole cues are useless here: rolling captions stay on screen between lines.
    """
    if not vtt:
        return []
    cue_re = re.compile(r"(\d+):(\d\d):(\d\d\.\d+) --> ")
    word_re = re.compile(r"<(\d+):(\d\d):(\d\d\.\d+)><c>([^<]*)</c>")
    out, cue_start = [], None
    for line in Path(vtt).read_text(encoding="utf-8").splitlines():
        m = cue_re.match(line)
        if m:
            cue_start = secs(*m.groups())
            continue
        if cue_start is None or "<c>" not in line:
            continue
        words = [(cue_start, line.split("<", 1)[0])]
        words += [(secs(h, mi, s), w) for h, mi, s, w in word_re.findall(line)]
        for j, (t, w) in enumerate(words):
            if not w.strip() or w.strip().startswith("["):
                continue
            nxt = words[j + 1][0] if j + 1 < len(words) else t + 0.5
            out.append((t, min(nxt, t + 0.6)))
    out.sort()
    merged = []
    for a, b in out:
        if merged and a <= merged[-1][1] + 0.3:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    return merged


def overlap(a, b, intervals):
    return sum(max(0.0, min(b, y) - max(a, x)) for x, y in intervals)


def components(mask):
    """Label active blocks, joining blocks up to one empty block apart."""
    lab = np.zeros(mask.shape, int)
    n = 0
    for r, c in zip(*np.nonzero(mask)):
        if lab[r, c]:
            continue
        n += 1
        lab[r, c] = n
        stack = [(r, c)]
        while stack:
            y, x = stack.pop()
            for yy in range(max(0, y - 2), min(GH, y + 3)):
                for xx in range(max(0, x - 2), min(GW, x + 3)):
                    if mask[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n
                        stack.append((yy, xx))
    return lab, n


def detail(buf, args, t0):
    """Find moving clusters in one holistic span and pick their distinct poses."""
    n = len(buf)
    if n < 3:
        return []
    stack = np.stack([f for _, f in buf]).astype(np.int16)
    moved = np.abs(np.diff(stack, axis=0)).reshape(n - 1, GH, BS, GW, BS).mean(axis=(2, 4)) > args.block_thr
    act = moved.sum(0)
    lab, k = components(act >= max(2, 0.05 * (n - 1)))
    clusters = []
    for c in range(1, k + 1):
        blocks = lab == c
        clusters.append((int(act[blocks].sum()), blocks))
    clusters = [x for x in sorted(clusters, key=lambda x: -x[0]) if x[0] >= 6][: args.max_clusters]

    out = []
    for activity, blocks in clusters:
        rows, cols = np.nonzero(blocks)
        y0, y1 = (rows.min() - 1) * BS, (rows.max() + 2) * BS
        x0, x1 = (cols.min() - 1) * BS, (cols.max() + 2) * BS
        cy, cx = (y0 + y1) // 2, (x0 + x1) // 2
        hh, hw = max(y1 - y0, 48) // 2, max(x1 - x0, 48) // 2
        y0, y1 = max(0, cy - hh), min(AH, cy + hh)
        x0, x1 = max(0, cx - hw), min(AW, cx + hw)
        mask = np.kron(blocks, np.ones((BS, BS), bool))[y0:y1, x0:x1]
        crops = stack[:, y0:y1, x0:x1]

        variants, assign = [0], []
        for j in range(n):
            dist = [np.mean(np.abs(crops[j] - crops[v])[mask] > 25) * 100 for v in variants]
            best = int(np.argmin(dist))
            if dist[best] >= args.variant and len(variants) < args.max_variants:
                variants.append(j)
                best = len(variants) - 1
            assign.append(best)

        seq = []
        for j, v in enumerate(assign):
            t = t0(buf[j][0])
            if seq and seq[-1][0] == v + 1:
                seq[-1][2] = round(t + 1 / args.fps, 3)
            else:
                seq.append([v + 1, round(t, 3), round(t + 1 / args.fps, 3)])

        moving_frames = moved[:, blocks].any(axis=1).mean() * 100
        out.append({
            "box": [int(x0), int(y0), int(x1), int(y1)],
            "active_blocks": int(blocks.sum()),
            "moving_frames_pct": round(float(moving_frames), 1),
            "variants": [{"n": i + 1, "idx": buf[j][0], "t": round(t0(buf[j][0]), 3),
                          "frames": assign.count(i)} for i, j in enumerate(variants)],
            "sequence": seq,
        })
    return out


def label(t):
    return f"{int(t // 60):02d}:{t % 60:04.1f}"


def stamp(t):
    return f"{int(t // 60):02d}m{t % 60:04.1f}s"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--vtt")
    ap.add_argument("--fps", type=float, default=12)
    ap.add_argument("--unique", type=float, default=20, help="percent of blocks that must differ from the last kept frame")
    ap.add_argument("--mean-thr", type=float, default=6, help="change in a block's average (0-255) for the holistic pass to count it as changed")
    ap.add_argument("--block-thr", type=float, default=8, help="mean abs pixel difference (0-255) for the detail pass to count a block as moving")
    ap.add_argument("--settle", type=float, default=2, help="percent of blocks still changing frame to frame for a transition to count as settled")
    ap.add_argument("--max-wait", type=float, default=1.0, help="seconds to wait for a transition to settle before keeping a frame anyway")
    ap.add_argument("--variant", type=float, default=10, help="percent of a cluster's moving area that must differ for a new pose")
    ap.add_argument("--max-variants", type=int, default=12)
    ap.add_argument("--max-clusters", type=int, default=3)
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float)
    args = ap.parse_args()

    out = Path(args.out)
    (out / "holistic").mkdir(parents=True, exist_ok=True)
    (out / "detail").mkdir(exist_ok=True)
    speech = speech_intervals(args.vtt)

    def t0(i):
        return args.start + i / args.fps

    keeps, buf = [], []
    ref = prev = prev_lum = None
    pending = peak = trig_u = None

    def close_span(upto):
        span = [x for x in buf if x[0] < upto]
        if keeps and span:
            a, b = t0(span[0][0]), t0(span[-1][0]) + 1 / args.fps
            keeps[-1]["end"] = round(b, 3)
            keeps[-1]["speech_pct"] = round(overlap(a, b, speech) / (b - a) * 100, 1) if speech else None
            keeps[-1]["clusters"] = detail(span, args, t0)

    for i, f in decode(args.video, args.fps, AW, AH, "gray", args.start, args.end):
        m = block_means(f)
        if ref is None:
            ref = m
            keeps.append({"id": 1, "idx": i, "t": round(t0(i), 3), "trigger": "start", "unique_pct": 100.0})
        else:
            u = (np.abs(m - ref) > args.mean_thr).mean() * 100
            c = (np.abs(m - prev) > args.mean_thr).mean() * 100
            if pending is None and u >= args.unique:
                pending, peak, trig_u = i, c, u
            elif pending is not None:
                peak = max(peak, c)
            # Frames faded near black, or still brightening or darkening, belong to the transition.
            lum = f.mean()
            blank = f.std() < 8
            fading = abs(lum - prev_lum) > 1.5
            waited = i - pending if pending is not None else 0
            if pending is not None and (
                (not blank and not fading and (c < args.settle or waited >= args.fps * args.max_wait))
                or waited >= args.fps * 3
            ):
                close_span(pending)
                buf = []
                ref = m
                keeps.append({"id": len(keeps) + 1, "idx": i, "t": round(t0(i), 3),
                              "trigger": "cut" if peak >= 50 else "change", "unique_pct": round(float(trig_u), 1)})
                pending = None
        if pending is None:
            buf.append((i, f))
        prev, prev_lum = m, f.mean()
    close_span(float("inf"))

    # Second decode at output size: save the kept frames and the pose crops.
    want = {}
    for k in keeps:
        k["file"] = f"holistic/h{k['id']:04d}_{stamp(k['t'])}.jpg"
        want.setdefault(k["idx"], []).append((k["file"], None))
        for ci, cl in enumerate(k.get("clusters", []), 1):
            box = [v * SCALE for v in cl["box"]]
            for v in cl["variants"]:
                v["file"] = f"detail/h{k['id']:04d}/c{ci}_v{v['n']:02d}_{stamp(v['t'])}.jpg"
                want.setdefault(v["idx"], []).append((v["file"], box))
    for i, f in decode(args.video, args.fps, OW, OH, "rgb24", args.start, args.end):
        for name, box in want.get(i, []):
            img = Image.fromarray(f)
            if box:
                img = img.crop(box)
            p = out / name
            p.parent.mkdir(parents=True, exist_ok=True)
            img.save(p, quality=90)

    font = ImageFont.load_default(size=16)

    def cell_w(im):
        return max(im.width, 150) + 6

    # Holistic contact sheets, 5x6 per page.
    tw, th, per = 320, 180, 30
    for page in range(0, len(keeps), per):
        chunk = keeps[page:page + per]
        rows = (len(chunk) + 4) // 5
        sheet = Image.new("RGB", (5 * tw, rows * (th + 22)), "black")
        d = ImageDraw.Draw(sheet)
        for j, k in enumerate(chunk):
            x, y = (j % 5) * tw, (j // 5) * (th + 22)
            sheet.paste(Image.open(out / k["file"]).resize((tw, th)), (x, y + 22))
            d.text((x + 4, y + 2), f"h{k['id']:04d} {label(k['t'])} {k['trigger']}", fill="white", font=font)
        sheet.save(out / f"holistic_sheet_{page // per + 1:02d}.jpg", quality=85)

    # One detail sheet per span that has moving clusters.
    for k in keeps:
        if not k.get("clusters"):
            continue
        thumb = Image.open(out / k["file"]).resize((480, 270))
        d = ImageDraw.Draw(thumb)
        for ci, cl in enumerate(k["clusters"]):
            x0, y0, x1, y1 = [v * 480 // AW for v in cl["box"]]
            d.rectangle([x0, y0, x1, y1], outline=COLORS[ci % len(COLORS)], width=3)
        rows = []
        for ci, cl in enumerate(k["clusters"]):
            cells = []
            for v in cl["variants"]:
                im = Image.open(out / v["file"])
                im = im.resize((max(1, im.width * 160 // im.height), 160))
                cells.append((im, f"c{ci + 1} v{v['n']} {label(v['t'])} x{v['frames']}"))
            rows.append((ci, cells))
        width = max(480, *(sum(cell_w(im) for im, _ in cells) for _, cells in rows))
        height = 270 + 30 + sum(160 + 26 for _ in rows)
        sheet = Image.new("RGB", (width, height), (24, 24, 24))
        sd = ImageDraw.Draw(sheet)
        sheet.paste(thumb, (0, 0))
        speech_txt = "" if k.get("speech_pct") is None else f", speech {k['speech_pct']}%"
        sd.text((4, 274), f"h{k['id']:04d} {label(k['t'])}-{label(k['end'])}{speech_txt}", fill="white", font=font)
        y = 300
        for ci, cells in rows:
            x = 0
            for im, txt in cells:
                sd.text((x + 2, y), txt, fill=COLORS[ci % len(COLORS)], font=font)
                sheet.paste(im, (x, y + 22))
                x += cell_w(im)
            y += 186
        sheet.save(out / "detail" / f"h{k['id']:04d}_sheet.jpg", quality=85)

    for k in keeps:
        for cl in k.get("clusters", []):
            for v in cl["variants"]:
                del v["idx"]
        del k["idx"]
    meta = {"video": str(args.video), "fps": args.fps, "unique_pct": args.unique, "block_thr": args.block_thr,
            "variant_pct": args.variant, "start": args.start, "end": args.end,
            "analysis_size": [AW, AH], "saved_size": [OW, OH], "box_scale": SCALE, "holistic": keeps}
    (out / "index.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False))
    n_detail = sum(1 for k in keeps if k.get("clusters"))
    n_var = sum(len(c["variants"]) for k in keeps for c in k.get("clusters", []))
    print(f"holistic frames: {len(keeps)}, spans with motion: {n_detail}, pose crops: {n_var}")


if __name__ == "__main__":
    main()
