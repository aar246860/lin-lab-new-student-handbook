"""OCR the photo-based GW guide into a private, source-mapped archive.

This script deliberately writes to `.gwguide-private/`, which is ignored by git.
The public handbook should be rewritten from the OCR output, not copied from it.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageOps
from rapidocr import RapidOCR


DEFAULT_SOURCE = Path.home() / "Desktop" / "GW guide"
DEFAULT_OUTPUT = Path(".gwguide-private") / "ocr"


@dataclass
class PageRecord:
    sequence: int
    filename: str
    source_path: str
    width: int
    height: int
    rotated_for_ocr: bool
    ocr_text_path: str
    ocr_json_path: str
    line_count: int
    mean_score: float | None
    low_confidence: bool
    notes: str


def safe_reconfigure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def iter_images(source_dir: Path) -> Iterable[Path]:
    seen: dict[str, Path] = {}
    for pattern in ("*.jpg", "*.jpeg", "*.JPG", "*.JPEG"):
        for image_path in source_dir.glob(pattern):
            seen[str(image_path.resolve()).lower()] = image_path
    return sorted(seen.values(), key=lambda item: item.name.lower())


def prepare_image(path: Path, max_side: int) -> tuple[Image.Image, bool, int, int]:
    image = Image.open(path)
    image = ImageOps.exif_transpose(image).convert("RGB")
    width, height = image.size
    rotated = False

    # The source set contains a short landscape run near the end. Most are
    # sideways handbook pages, so rotate them before OCR but keep the source.
    if width > height:
        image = image.rotate(90, expand=True)
        rotated = True

    image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return image, rotated, width, height


def run_ocr(engine: RapidOCR, image: Image.Image) -> tuple[list[str], list[float], list[list[list[float]]]]:
    result = engine(image)
    raw_lines = getattr(result, "txts", None)
    raw_scores = getattr(result, "scores", None)
    raw_boxes = getattr(result, "boxes", None)

    lines = list(raw_lines) if raw_lines is not None else []
    scores = [float(score) for score in list(raw_scores)] if raw_scores is not None else []
    boxes = []
    if raw_boxes is not None:
        for box in list(raw_boxes):
            boxes.append([[float(x), float(y)] for x, y in box.tolist() if len([x, y]) == 2])
    return lines, scores, boxes


def write_page_outputs(
    output_dir: Path,
    sequence: int,
    image_path: Path,
    lines: list[str],
    scores: list[float],
    boxes: list[list[list[float]]],
) -> tuple[Path, Path]:
    stem = f"{sequence:03d}_{image_path.stem}"
    text_path = output_dir / "pages" / f"{stem}.md"
    json_path = output_dir / "page-json" / f"{stem}.json"
    text_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.parent.mkdir(parents=True, exist_ok=True)

    text_lines = [
        f"# OCR page {sequence:03d}: {image_path.name}",
        "",
        "> Private OCR draft. Review before using. Do not publish raw OCR text.",
        "",
    ]
    for index, line in enumerate(lines):
        score = scores[index] if index < len(scores) else None
        score_text = f"{score:.3f}" if score is not None else "NA"
        text_lines.append(f"- `{score_text}` {line}")

    text_path.write_text("\n".join(text_lines) + "\n", encoding="utf-8")
    json_path.write_text(
        json.dumps(
            {
                "source": str(image_path),
                "lines": [
                    {
                        "text": line,
                        "score": scores[index] if index < len(scores) else None,
                        "box": boxes[index] if index < len(boxes) else None,
                    }
                    for index, line in enumerate(lines)
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return text_path, json_path


def main() -> int:
    safe_reconfigure_stdout()
    parser = argparse.ArgumentParser(description="OCR GW guide page photos into a private source archive.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--limit", type=int, default=0, help="Limit number of pages for smoke tests.")
    parser.add_argument("--max-side", type=int, default=1800)
    args = parser.parse_args()

    source_dir = args.source
    output_dir = args.output
    if not source_dir.exists():
        raise SystemExit(f"Source directory not found: {source_dir}")

    output_dir.mkdir(parents=True, exist_ok=True)
    images = list(iter_images(source_dir))
    if args.limit > 0:
        images = images[: args.limit]

    engine = RapidOCR()
    records: list[PageRecord] = []

    for sequence, image_path in enumerate(images, start=1):
        prepared, rotated, width, height = prepare_image(image_path, args.max_side)
        lines, scores, boxes = run_ocr(engine, prepared)
        text_path, json_path = write_page_outputs(output_dir, sequence, image_path, lines, scores, boxes)
        mean_score = sum(scores) / len(scores) if scores else None
        low_confidence = mean_score is None or mean_score < 0.78 or len(lines) < 3
        records.append(
            PageRecord(
                sequence=sequence,
                filename=image_path.name,
                source_path=str(image_path),
                width=width,
                height=height,
                rotated_for_ocr=rotated,
                ocr_text_path=str(text_path),
                ocr_json_path=str(json_path),
                line_count=len(lines),
                mean_score=round(mean_score, 4) if mean_score is not None else None,
                low_confidence=low_confidence,
                notes="manual review required" if low_confidence else "",
            )
        )
        print(f"{sequence:03d}/{len(images):03d} {image_path.name}: {len(lines)} lines")

    manifest = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source_dir": str(source_dir),
        "output_dir": str(output_dir),
        "engine": "RapidOCR",
        "public_release_rule": "Do not publish raw OCR; rewrite and redact before public use.",
        "pages": [asdict(record) for record in records],
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    combined = output_dir / "combined-private-ocr.md"
    combined.write_text(
        "\n\n".join((Path(record.ocr_text_path).read_text(encoding="utf-8") for record in records)),
        encoding="utf-8",
    )
    print(f"Wrote {output_dir / 'manifest.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
