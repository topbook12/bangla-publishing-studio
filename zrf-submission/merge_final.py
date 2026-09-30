#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Merge cover + body into final ZRF submission PDF (normalize to A4)."""
from pypdf import PdfReader, PdfWriter

A4_W, A4_H = 595.28, 841.89

COVER = '/home/z/my-project/zrf-submission/cover.pdf'
BODY = '/home/z/my-project/zrf-submission/body.pdf'
OUT = '/home/z/my-project/zrf-submission/ZRF-Science-Fair-2026-Project-Summary-Bangla-Publishing-Studio.pdf'


def normalize_page_to_a4(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - A4_W) > 0.1 or abs(h - A4_H) > 0.1:
        page.scale_to(A4_W, A4_H)
    return page


writer = PdfWriter()
cover_page = PdfReader(COVER).pages[0]
writer.add_page(normalize_page_to_a4(cover_page))
for page in PdfReader(BODY).pages:
    writer.add_page(normalize_page_to_a4(page))

writer.add_metadata({
    '/Title': 'Bangla Publishing Studio - ZRF Science Fair 2026 Project Summary',
    '/Author': 'Topu Biswas',
    '/Creator': 'Z.ai',
    '/Subject': 'Project Summary for ZRF Science Fair 2026 Registration',
})
with open(OUT, 'wb') as f:
    writer.write(f)
print(f'FINAL OK: {OUT} ({len(writer.pages)} pages)')
