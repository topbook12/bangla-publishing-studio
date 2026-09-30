#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Merge Bangla cover + body into the final ZRF submission PDF.

Normalizes every page to exact A4 (595.276 x 841.890 pt) with 0.1 pt
tolerance (same approach as Task 9's merge_final.py) so pdf_qa sees one
consistent page size.
"""
import io

from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import A4

SRC_COVER = '/home/z/my-project/zrf-submission/cover-bn.pdf'
SRC_BODY = '/home/z/my-project/zrf-submission/body-bn.pdf'
OUT = '/home/z/my-project/zrf-submission/ZRF-Science-Fair-2026-Project-Summary-Bangla.pdf'

TARGET_W, TARGET_H = A4  # 595.276 x 841.890 pt
TOL = 0.1


def normalize_page(page):
    w = float(page.mediabox.width)
    h = float(page.mediabox.height)
    if abs(w - TARGET_W) > TOL or abs(h - TARGET_H) > TOL:
        sx = TARGET_W / w
        sy = TARGET_H / h
        page.scale(sx, sy)
        page.mediabox.lower_left = (0, 0)
        page.mediabox.upper_right = (TARGET_W, TARGET_H)
    return page


def main():
    writer = PdfWriter()
    total = 0
    for path in (SRC_COVER, SRC_BODY):
        reader = PdfReader(path)
        for page in reader.pages:
            writer.add_page(normalize_page(page))
            total += 1

    writer.add_metadata({
        '/Title': 'বাংলা পাবলিশিং স্টুডিও — ZRF বিজ্ঞান মেলা ২০২৬ প্রকল্প সারসংক্ষেপ',
        '/Author': 'Topu Biswas',
        '/Subject': 'ZRF Science Fair 2026 — Project Summary (Bangla)',
        '/Creator': 'Z.ai',
    })
    with open(OUT, 'wb') as fh:
        writer.write(fh)
    print(f'MERGED OK: {OUT} ({total} pages, normalized to A4)')


if __name__ == '__main__':
    main()
