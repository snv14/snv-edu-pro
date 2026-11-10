#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تفريغ الوثائق الرسمية (PDF) إلى وحدات بيانات نصية تستهلكها قاعدة معرفة المساعد الذكي.

الوثائق المعالجة (11 ملفاً) تغطي العائلات الأربع:
  • المنهاج              — منهاج علوم الطبيعة والحياة، التعليم المتوسط (2016)
  • الوثيقة المرافقة     — الوثيقة المرافقة لمنهاج المادة (الجيل الثاني)
  • دليل الأستاذ         — دليل استعمال الكتاب المدرسي، السنة الرابعة متوسط
  • التدرج               — المخططات السنوية 2022/2023 + المخطط السنوي للتعلمات (س1..س4)

لماذا أربعة مسارات استخراج لكل ملف؟
-----------------------------------
ملفات الوزارة مولّدة بأدوات مختلفة، وجودة طبقتها النصية غير متجانسة:

1) بعض الملفات تحوي جدول ToUnicode معطوباً: المولّد «طوى» نطاقات كاملة من الأشكال
   العربية على محرف واحد، مثلاً:
       <038C> <03C2> <0626>   ← 55 شكلاً (أ ب ت ث ج …) كلها تُقرأ «ئ»
       <03C8> <03F5> <0638>   ← 46 شكلاً كلها تُقرأ «ظ»
   لكن البرنامج الخطي المضمَّن سليم: أسماء أشكاله تحمل الترميز الحقيقي
   (gid 916 = uniFE94 أي «ة»، بينما يدّعي ToUnicode أنها «خ»).
   فيُعاد بناء الجدول من أسماء الأشكال — بالدمج لا بالاستبدال، وبوجهات من محرف
   واحد فقط لأن قيماً من 8 خانات عشرية تُسقط محلّل pypdf.

2) محركا الاستخراج يختلفان جوهرياً: PyMuPDF يعيد ترتيب الاتجاه فيقلب الحروف
   المتجاورة («الموارد» ← «املوارد»، «خلال» ← «خالل»)، بينما pypdf يحفظ ترتيب
   مجرى المحتوى الصحيح. ولا يصلح محرك واحد لكل الملفات: دليل الأستاذ مبني
   بأشكال عرض لا يفكّها pypdf، والوثيقة المرافقة تحتاج إصلاح ToUnicode أولاً.

لذلك يولّد السكربت أربعة مرشّحات لكل ملف — {pypdf، PyMuPDF} × {أصلي، مُصلَح} —
ويُسجّل كل مرشّح بنسبة كلماته المطابقة لمفردات رسمية محصودة من قاعدة المنصة
(src/data/official_*.ts و lessons*.ts)، ثم يعتمد الأفضل.

الاستخدام
---------
    python3 -m venv /tmp/pdfenv
    /tmp/pdfenv/bin/pip install pypdf pymupdf fonttools cryptography
    /tmp/pdfenv/bin/python scripts/ingest_official_pdfs.py /path/to/pdfs

المخرج: src/data/official/<id>.ts (صفحات مرقمة للاستشهاد) و src/data/official/index.ts
الملفات الأصلية (PDF) لا تُلتزم في المستودع؛ المخرج النصي وحده هو الذي يُشحن.
"""

from __future__ import annotations

import gc
import glob
import io
import json
import logging
import os
import re
import sys
import unicodedata
import warnings

warnings.filterwarnings("ignore")
logging.getLogger("pypdf").setLevel(logging.CRITICAL)

import fitz  # PyMuPDF
from fontTools.agl import toUnicode as agl
from fontTools.ttLib import TTFont
from pypdf import PdfReader

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO, "src", "data", "official")

MIN_QUALITY = 40.0
# حد أدنى لحجم المفردات المرجعية (القياس الفعلي 12109 كلمات مطويّة) — حارس ضد
# فقدان صامت لمدخلات load_vocabulary() عند أي نقل مستقبلي لملفات البيانات.
MIN_VOCABULARY = 10000  # أدنى نسبة مطابقة مقبولة لاعتماد نص ما

# ───────────────────────────── تعريف الوثائق ─────────────────────────────
# كل مدخلة: مطابقة اسم الملف، المعرّف، العائلة، المستوى، العنوان، الجهة، المسار الرسمي
SOURCES = [
    {
        "match": "منهاح ع ط ح أ 2016",
        "id": "curriculum2016",
        "kind": "curriculum",
        "level": "all",
        "title": "منهاج علوم الطبيعة والحياة — مرحلة التعليم المتوسط (2016)",
        "authority": "وزارة التربية الوطنية — المديرية المكلفة بالمناهج",
        "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
        "role": "النص الرسمي الحرفي للمنهاج: الملمح الشامل، الميادين، الكفاءات الختامية ومركباتها.",
    },
    {
        "match": "الوثيقة المرافقة",
        "id": "companionDocument",
        "kind": "companionDocument",
        "level": "all",
        "title": "الوثيقة المرافقة لمنهاج مادة علوم الطبيعة والحياة — الجيل الثاني",
        "authority": "وزارة التربية الوطنية — مديرية التعليم المتوسط",
        "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
        "role": "التوجيهات المنهجية الرسمية: بناء المقطع، التقويم التكويني، معالجة التعثرات.",
    },
    {
        "match": "دليل الاستاذ العلوم الطبيعية للسنة الرابعة متوسط",
        "id": "teacherGuide4am",
        "kind": "teacherGuide",
        "level": "4am",
        "title": "دليل الأستاذ لاستعمال الكتاب المدرسي — علوم الطبيعة والحياة — السنة الرابعة متوسط",
        "authority": "وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية",
        "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
        "role": "التنفيذ الصفي الرسمي لكل نشاط: الهدف التعلمي، الوضعية الانطلاقية، استغلال الوثائق، الأسئلة والأجوبة.",
    },
    {
        "match": "plans_annuels2023-sciences1am",
        "id": "annualPlan2023_1am",
        "kind": "progression",
        "level": "1am",
        "title": "المخططات السنوية 2022/2023 — علوم الطبيعة والحياة — السنة الأولى متوسط",
        "authority": "وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية / مديرية التعليم المتوسط",
        "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
        "role": "التدرج السنوي الرسمي: الكفاءة الشاملة والختامية، توزيع المقاطع على الأسابيع.",
    },
    {
        "match": "plans_annuels2023-sciences2am",
        "id": "annualPlan2023_2am",
        "kind": "progression",
        "level": "2am",
        "title": "المخططات السنوية 2022/2023 — علوم الطبيعة والحياة — السنة الثانية متوسط",
        "authority": "وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية / مديرية التعليم المتوسط",
        "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
        "role": "التدرج السنوي الرسمي: الكفاءة الشاملة والختامية، توزيع المقاطع على الأسابيع.",
    },
    {
        "match": "plans_annuels2023-sciences3am",
        "id": "annualPlan2023_3am",
        "kind": "progression",
        "level": "3am",
        "title": "المخططات السنوية 2022/2023 — علوم الطبيعة والحياة — السنة الثالثة متوسط",
        "authority": "وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية / مديرية التعليم المتوسط",
        "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
        "role": "التدرج السنوي الرسمي: الكفاءة الشاملة والختامية، توزيع المقاطع على الأسابيع.",
    },
    {
        "match": "plans_annuels2023-sciences4am",
        "id": "annualPlan2023_4am",
        "kind": "progression",
        "level": "4am",
        "title": "المخططات السنوية 2022/2023 — علوم الطبيعة والحياة — السنة الرابعة متوسط",
        "authority": "وزارة التربية الوطنية — المفتشية العامة للتربية الوطنية / مديرية التعليم المتوسط",
        "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
        "role": "التدرج السنوي الرسمي: الكفاءة الشاملة والختامية، توزيع المقاطع على الأسابيع.",
    },
    {
        "match": "علوم الطبيعة والحياة  س1",
        "id": "learningPlan1am",
        "kind": "progression",
        "level": "1am",
        "title": "المخطط السنوي للتعلمات وآليات تنفيذه — علوم الطبيعة والحياة — السنة الأولى متوسط",
        "authority": "وزارة التربية الوطنية — مديرية التعليم المتوسط",
        "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
        "role": "مخطط التعلمات وآليات التنفيذ: الموارد، الحصص، التقويم، والحجم الساعي.",
    },
    {
        "match": "علوم الطبيعة والحياة  س2",
        "id": "learningPlan2am",
        "kind": "progression",
        "level": "2am",
        "title": "المخطط السنوي للتعلمات وآليات تنفيذه — علوم الطبيعة والحياة — السنة الثانية متوسط",
        "authority": "وزارة التربية الوطنية — مديرية التعليم المتوسط",
        "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
        "role": "مخطط التعلمات وآليات التنفيذ: الموارد، الحصص، التقويم، والحجم الساعي.",
    },
    {
        "match": "علوم الطبيعة والحياة  س3",
        "id": "learningPlan3am",
        "kind": "progression",
        "level": "3am",
        "title": "المخطط السنوي للتعلمات وآليات تنفيذه — علوم الطبيعة والحياة — السنة الثالثة متوسط",
        "authority": "وزارة التربية الوطنية — مديرية التعليم المتوسط",
        "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
        "role": "مخطط التعلمات وآليات التنفيذ: الموارد، الحصص، التقويم، والحجم الساعي.",
    },
    {
        "match": "علوم الطبيعة والحياة  س4",
        "id": "learningPlan4am",
        "kind": "progression",
        "level": "4am",
        "title": "المخطط السنوي للتعلمات وآليات تنفيذه — علوم الطبيعة والحياة — السنة الرابعة متوسط",
        "authority": "وزارة التربية الوطنية — مديرية التعليم المتوسط",
        "url": "https://www.education.gov.dz/category/ressources-pedagogiques/",
        "role": "مخطط التعلمات وآليات التنفيذ: الموارد، الحصص، التقويم، والحجم الساعي.",
    },
]


# ─────────────────────── 1) إصلاح جدول ToUnicode ───────────────────────
def parse_tounicode(raw: str) -> dict[int, str]:
    """قراءة جدول ToUnicode (bfchar + bfrange بصيغتيه) إلى {معرّف الشكل: 4 خانات}."""
    out: dict[int, str] = {}
    for block, body in re.findall(r"begin(bfchar|bfrange)(.*?)end\1", raw, re.S):
        if block == "bfchar":
            for a, b in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", body):
                if len(a) == 4 and len(b) == 4:
                    out[int(a, 16)] = b.upper()
        else:
            # نطاق ← مصفوفة قيم
            for lo, hi, arr in re.findall(
                r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[(.*?)\]", body, re.S
            ):
                vals = [v.upper() for v in re.findall(r"<([0-9A-Fa-f]+)>", arr) if len(v) == 4]
                for i, code in enumerate(range(int(lo, 16), int(hi, 16) + 1)):
                    if i < len(vals):
                        out.setdefault(code, vals[i])
            # نطاق ← قيمة بداية متزايدة
            for lo, hi, dst in re.findall(
                r"<([0-9A-Fa-f]{4})>\s*<([0-9A-Fa-f]{4})>\s*<([0-9A-Fa-f]{4})>", body
            ):
                step = int(dst, 16)
                for code in range(int(lo, 16), int(hi, 16) + 1):
                    out.setdefault(code, f"{step:04X}")
                    step += 1
    return out


# المدى المقبول في نص وزاري عربي: لاتيني أساسي + علامات ترقيم + العربية +
# أشكال العرض + الترقيم العام + الرموز والأسهم. ما خارجه (العربية الموسعة
# 0750-08FF، التيلوغو، الصينية…) لا يمكن أن يكون مقصوداً، بل هو خطأ في
# مطابقة أسماء الأشكال داخل الخطوط المجموعاتية الفرعية.
ALLOWED_CODEPOINT = re.compile(
    "["
    "\u0020-\u007e"      # لاتيني أساسي مطبوع
    "\u00a0-\u00ff"      # لاتيني-1 (علامات ترقيم وفراغات خاصة)
    "\u0600-\u06ff"      # العربية
    "\ufb50-\ufeff"      # أشكال العرض العربية
    "\u2000-\u206f"      # الترقيم العام
    "\u2190-\u27bf"      # أسهم ورموز وزخارف (❖ ◄ ♦ ■ •)
    "\ufeff\n\r\t"
    "]"
)


def is_allowed_codepoint(value: int) -> bool:
    return bool(ALLOWED_CODEPOINT.match(chr(value)))


def glyph_truth(buffer: bytes) -> dict[int, str]:
    """معرّف الشكل ← محرفه الحقيقي، من اسم الشكل (uniXXXX) أو جدول cmap أو قائمة AGL.

    تُقبل الوجهات ذات المحرف الواحد فقط؛ الربوط متعددة المحارف يترك تفكيكها لـ NFKD،
    لأن قيم 8 خانات عشرية تكسر محلّل pypdf. ولا تُقبل إلا محارف من المدى المقبول:
    في الخطوط المجموعاتية الفرعية لا يطابق ترقيم الأشكال أسماءها، وقد أنتجت مطابقة
    عمياء محارف تيلوغو وعربية موسعة في النص.
    """
    try:
        font = TTFont(io.BytesIO(buffer), lazy=True)
    except Exception:
        return {}
    try:
        order = font.getGlyphOrder()
        name_to_uni: dict[str, int] = {}
        for table in font["cmap"].tables:
            if table.isUnicode():
                for uni, name in table.cmap.items():
                    name_to_uni.setdefault(name, uni)
        truth: dict[int, str] = {}
        for gid, name in enumerate(order):
            hex4 = None
            m = re.fullmatch(r"uni([0-9A-Fa-f]{4})", name) or re.fullmatch(r"u([0-9A-Fa-f]{4})", name)
            if m:
                hex4 = m.group(1).upper()
            if hex4 is None and name in name_to_uni and name_to_uni[name] <= 0xFFFF:
                hex4 = f"{name_to_uni[name]:04X}"
            if hex4 is None:
                resolved = agl(name)
                if resolved and len(resolved) == 1 and ord(resolved) <= 0xFFFF:
                    hex4 = f"{ord(resolved):04X}"
            if hex4 and is_allowed_codepoint(int(hex4, 16)):
                truth[gid] = hex4
    except Exception:
        truth = {}
    try:
        font.close()
    except Exception:
        pass
    return truth


def build_cmap(gid_to_hex: dict[int, str]) -> bytes:
    """توليد جدول ToUnicode صالح من خريطة {معرّف الشكل: 4 خانات}."""
    items = sorted(gid_to_hex.items())
    body: list[str] = []
    buf: list[str] = []
    for gid, hex4 in items:
        buf.append(f"<{gid:04X}> <{hex4}>")
        if len(buf) == 90:
            body.append(f"{len(buf)} beginbfchar\n" + "\n".join(buf) + "\nendbfchar")
            buf = []
    if buf:
        body.append(f"{len(buf)} beginbfchar\n" + "\n".join(buf) + "\nendbfchar")
    head = (
        b"/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n"
        b"/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n"
        b"/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n"
        b"1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n"
    )
    tail = b"endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n"
    return head + ("\n".join(body) + "\n").encode() + tail


def repair_tounicode(src: str, dst: str) -> int:
    """دمج الحقيقة المستمدة من أسماء الأشكال في جداول ToUnicode، وحفظ نسخة مُصلَحة."""
    doc = fitz.open(src)
    if doc.needs_pass:
        doc.authenticate("")
    xrefs: set[int] = set()
    for number in range(len(doc)):
        for entry in doc[number].get_fonts(full=True):
            xrefs.add(entry[0])
    patched = 0
    for xref in sorted(xrefs):
        try:
            _, _, _, buffer = doc.extract_font(xref)
        except Exception:
            continue
        if not buffer:
            continue
        key = doc.xref_get_key(xref, "ToUnicode")
        if not key or key[0] != "xref":
            continue
        stream = int(key[1].split()[0])
        try:
            merged = parse_tounicode(doc.xref_stream(stream).decode("latin-1"))
        except Exception:
            continue
        truth = glyph_truth(buffer)
        del buffer
        override = {g: h for g, h in truth.items() if merged.get(g) != h}
        del truth
        if not override:
            continue
        merged.update(override)
        doc.update_stream(stream, build_cmap(merged), compress=False)
        patched += 1
    doc.save(dst, garbage=1, deflate=True, clean=False)
    doc.close()
    gc.collect()
    return patched


# ─────────────────────────── 2) التطبيع اللغوي ───────────────────────────
# مبدأان يحكمان هذه المرحلة:
#
# (أ) النص المُخزَّن يبقى أميناً للوثيقة الرسمية لأنه يُقتبس حرفياً للأستاذ.
#     لذلك لا نوحّد الهمزات ولا نحوّل «المدرسة» إلى «المدرسه»؛ المطابقة تتكفل بها
#     normalizeArabic() داخل محرك البحث عند الفهرسة.
# (ب) ما نُصلحه هنا هو ما ليس من رسم العربية أصلاً: أشكال العرض المضمّنة،
#     التشكيل والضوابط ومحارف التحكم، والحواشي المتكررة، والمحارف الفارسية
#     التي تسرّبت من ترميز الخطوط.

# حركات وعلامات وضوابط تُزال (تُستثنى علامات الهمزة 0653-0655 حتى تُعاد صياغتها)
STRIP_RE = re.compile(
    "["
    "\u0000-\u0008\u000b-\u001f\u007f"          # محارف تحكم (يُستثنى \t و \n)
    "\u00ad"                                          # واصلة لينة
    "\u0640"                                          # تطويل
    "\u064b-\u0652\u0670"                           # حركات وسكون وشدة
    "\u0656-\u065f\u06d6-\u06ed"                   # علامات مشوهة ووقف قرآني
    "\u0300-\u036f"                                  # علامات تركيبية لاتينية (من NFKD)
    "\u0250-\u02af"                                  # امتداد لاتيني صوتي (ʪ ʭ)
    "\u0750-\u08ff"                                  # عربية موسعة: خطأ مطابقة أشكال
    "\u200b-\u200f\u202a-\u202e\u2066-\u2069"     # ضوابط اتجاه ومسافات صفرية
    "\ue000-\uf8ff\ufffd"                           # استخدام خاص ومحرف استبدال
    "]"
)

# محارف أجنبية تسرّبت من ترميز الخطوط ← مقابلاتها العربية
FOREIGN_GLYPHS = str.maketrans({
    "\u06cc": "\u064a",   # ی فارسية ← ي
    "\u06a9": "\u0643",   # ک فارسية ← ك
    "\u06aa": "\u0643",   # ڪ ← ك
    "\u06af": "\u0643",   # گ ← ك
    "\u06c0": "\u0647",   # ۀ ← ه
    "\u06d5": "\u0647",   # ە ← ه
    "\u06c2": "\u0647",   # ۂ ← ه
    "\u06c5": "\u0648",   # ۅ ← و
    "\u06c6": "\u0648",   # ۆ ← و
    "\u06be": "\u0647",   # ہ دوچشمیة ← ه («منھاج» ← «منهاج»)
})

# إعادة تركيب حروف الهمزة بعد تفكيك NFKD (بدون NFC الذي يعيد أشكال العرض «ﻻ»)
HAMZA_RECOMPOSE = [
    ("\u0627\u0653", "\u0622"),   # ا + مدة ← آ
    ("\u0627\u0654", "\u0623"),   # ا + همزة فوق ← أ
    ("\u0627\u0655", "\u0625"),   # ا + همزة تحت ← إ
    ("\u0648\u0654", "\u0624"),   # و + همزة ← ؤ
    ("\u064a\u0654", "\u0626"),   # ي + همزة ← ئ
    ("\u0649\u0654", "\u0626"),   # ى + همزة ← ئ
]
RESIDUAL_MARKS = re.compile("[\u0653-\u0655]")

WATERMARK = re.compile(
    r"(loamari\.maktoobblog\.com|djarbouaiMed@yahoo\.fr|^\s*e\s*\.?\s*Mail\s*:.*$|^\s*www\..*$)",
    re.I | re.M,
)
PAGE_NUMBER_LINE = re.compile(r"^\s*\d{1,4}\s*$", re.M)
# ذيل الترويسة: أرقام صفحات/سنوات ونقاط وشرطات فقط. كل الفروع مُرساة بـ $،
# فكان «وزارة التربية الوطنية - 2016 6» ينجو: \d* يلتهم السنة ثم يقف قبل رقم الصفحة.
HEAD_TAIL = r"[\s\d.\-–—]*"
RUNNING_HEAD_STEMS = (
    r"الوثيقة المرافقة لمن.?اج.*",                      # ترويسة الوثيقة المرافقة
    r"منهج علوم الطبيعة والحياة.*المتوسط",                # ترويسة المنهاج
    r".*وزارة التربية الوطنية",                           # تذييل وزاري + سنة + رقم صفحة
    r".*الجمهورية الجزائرية الديمقراطية الشعبية",         # ترويسة جمهورية
    r"المفتشية العامة للتربية الوطنية",
    r"مديرية التعليم\s*المتوسط",
    r"(?:جويلية|سبتمبر|أكتوبر|نوفمبر|ديسمبر|جانفي|فيفري|مارس|أفريل|ماي|جوان)\s*\d{4}",
)
RUNNING_HEAD = re.compile(
    "^(?:" + "|".join(stem + HEAD_TAIL for stem in RUNNING_HEAD_STEMS) + ")$",
    re.I | re.M,
)

MAX_RUNNING_HEAD_LEN = 160

ARABIC_LETTERS = "\u0621-\u063a\u0641-\u064a"


def normalize(text: str) -> str:
    """تنظيف بنيوي لصفحة: يفكّ أشكال العرض ويزيل الضوابط والحواشي، ويحفظ الرسم الأصلي."""
    out = unicodedata.normalize("NFKD", text)
    out = STRIP_RE.sub("", out)
    for source, target in HAMZA_RECOMPOSE:
        out = out.replace(source, target)
    out = RESIDUAL_MARKS.sub("", out)
    out = out.translate(FOREIGN_GLYPHS)
    out = WATERMARK.sub("", out)
    out = PAGE_NUMBER_LINE.sub("", out)
    # انهيار المسافات والتطويل أولاً: الترويسة الخام تصل محشوّة بالتطويل والفراغات
    # (سطر ترويسة المنهاج 217 حرفاً خاماً)، فلا يطابقها المرشّح إلا بعد التنظيف.
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r"\n[ \t]+", "\n", out)
    out = "\n".join(
        line
        for line in out.split("\n")
        if not (
            line.strip()
            and len(line.strip()) <= MAX_RUNNING_HEAD_LEN
            and RUNNING_HEAD.match(line.strip())
        )
    )
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out.strip()


# الطيّ المطابق لدلال normalizeArabic() في محرك البحث — يُستعمل للمقارنة فقط،
# ولا يُطبَّق أبداً على النص المخزَّن.
FOLD_RE = re.compile(f"[\u064b-\u065f\u0670\u0640\u06d6-\u06ed]")
FOLD_TABLE = str.maketrans({
    "\u0623": "\u0627", "\u0625": "\u0627", "\u0622": "\u0627", "\u0671": "\u0627",
    "\u0649": "\u064a", "\u0626": "\u064a", "\u0624": "\u0648", "\u0629": "\u0647",
})


def fold(word: str) -> str:
    """طيّ كلمة للمقارنة بالمفردات المرجعية (لا تغيّر النص المخزَّن)."""
    return FOLD_RE.sub("", word).translate(FOLD_TABLE)


DEFINITE_ARTICLE_RE = re.compile(f"\\bامل[{ARABIC_LETTERS}]{{3,}}")
MIN_ARTIFACT_LEN = 6


def repair_definite_article(text: str, vocabulary: set[str]) -> tuple[str, int]:
    """إصلاح أداة التعريف في «امل…» ← «الم…» داخل امتدادات نصية معطوبة.

    بعض امتدادات النص في ملفات الوزارة وصلت بحرفين متجاورين مقلوبين، وأشهرها
    وأخطرها على البحث قلب أداة التعريف: «الموارد» ← «املوارد»، «المقطع» ← «املقطع».

    جُرّب هنا إصلاح عام لكل قلب حرفين متجاورين فأعطى نتيجة عكسية: حوّل
    «التعليم» الصحيحة إلى «التعلمي» لأن المفردات المرجعية المحصودة من دروس
    المنصة لا تعرف كلمة عامة مثل «التعليم». لذلك اقتصر الإصلاح على قلب أداة
    التعريف وحدها، بثلاثة شروط أمان:
      • الكلمة 6 أحرف فأكثر (فلا تُمَسّ «أمل» و«آمل»)؛
      • صيغتها الحالية غير معروفة في المفردات المرجعية؛
      • الصيغة المصححة معروفة فيها.
    بقية القلوب النادرة («خلال» ← «خالل») تُترك كما هي: تجميلٌ لا يضرّ المطابقة،
    وإصلاحها بلا معجم عربي عام يهدد النص الرسمي الصحيح.
    """
    fixed = 0

    def correct(match: "re.Match[str]") -> str:
        nonlocal fixed
        token = match.group(0)
        if len(token) < MIN_ARTIFACT_LEN or fold(token) in vocabulary:
            return token
        candidate = "الم" + token[3:]
        if fold(candidate) in vocabulary:
            fixed += 1
            return candidate
        return token

    return DEFINITE_ARTICLE_RE.sub(correct, text), fixed


def build_source_vocabulary(pages: list[str], floor: int = 5) -> set[str]:
    """مفردات عالية التكرار من النصوص المستخرجة نفسها؛ تحمي الكلمات الصحيحة من «الإصلاح».

    الغرض منها حماية كلمة مثل «التعليم» الغائبة عن دروس المنصة. لذلك تُستثنى
    منها الكلمات المطابقة لنمط العطب نفسه («امل…») وإلا صارت تحمي العطب:
    «املوارد» تتكرر في 23 موضعاً من الملف المصدر، فلو دخلت القاموس لما صُحّحت أبداً.
    """
    counts: dict[str, int] = {}
    for text in pages:
        for token in set(re.findall(f"[{ARABIC_LETTERS}]{{3,}}", text)):
            folded = fold(token)
            if folded.startswith("امل"):
                continue
            counts[folded] = counts.get(folded, 0) + 1
    return {word for word, count in counts.items() if count >= floor}


# ─────────────────────── 3) المفردات المرجعية والتسجيل ───────────────────────
def load_vocabulary() -> set[str]:
    """مفردات رسمية محصودة من قاعدة المنصة نفسها؛ تُستعمل للتسجيل ولإصلاح «امل»."""
    vocabulary: set[str] = set()
    # بيانات المذكرات انتقلت إلى src/data/memos/ ضمن إعادة تنظيم القاعدة الموحدة.
    # الحارس أسفل هذه الدالة يمنع أن يتسبب نقلٌ مستقبلي في فقدان المفردات صمتاً
    # (فالمفردات تحدد قياس الجودة وإصلاح «امل»، أي أنها تغير الناتج الملتزم).
    patterns = [
        os.path.join(REPO, "src", "data", "memos", "official_*.ts"),
        os.path.join(REPO, "src", "data", "memos", "lessons*.ts"),
        os.path.join(REPO, "src", "data", "memos", "curriculumDb.ts"),
    ]
    for pattern in patterns:
        for path in glob.glob(pattern):
            try:
                raw = open(path, encoding="utf-8", errors="ignore").read()
            except OSError:
                continue
            raw = re.sub(r"/\*.*?\*/", "", raw, flags=re.S)
            for word in re.findall(f"[{ARABIC_LETTERS}]{{3,}}", raw):
                folded = fold(word)
                vocabulary.add(folded)
                if folded.startswith("ال") and len(folded) > 4:
                    vocabulary.add(folded[2:])
    if len(vocabulary) < MIN_VOCABULARY:
        raise SystemExit(
            f"المفردات المرجعية {len(vocabulary)} كلمة فقط (الحد الأدنى {MIN_VOCABULARY}). "
            "الأرجح أن ملفات src/data/memos/ (official_*.ts وlessons*.ts وcurriculumDb.ts) "
            "نُقلت أو حُذفت، فأنماط glob في load_vocabulary() لم تعد تجدها. "
            "المتابعة ستغيّر قياس الجودة وإصلاح «امل» وبالتالي الناتج الملتزم."
        )
    return vocabulary


def score(text: str, vocabulary: set[str]) -> float:
    """نسبة الكلمات (3 أحرف فأكثر) المطابقة للمفردات الرسمية بعد الطيّ."""
    words = re.findall(f"[{ARABIC_LETTERS}]{{3,}}", text)
    if not words:
        return 0.0
    return sum(1 for w in words if fold(w) in vocabulary) / len(words) * 100


# هامش التفوق اللازم لاستبدال مرشّح نظيف بآخر: يمنع تفضيل مسار يعيد ترتيب
# الاتجاه لمجرد تفوقه بنقطة أو نقطتين في مطابقة المفردات، لأن تلك الدرجة لا تقيس
# سلامة ترتيب الأسطر. في المنهاج مثلاً يتقارب المساران (80.7% مقابل 81.7%)
# لكن pypdf يحفظ «تقديم:» في موضعها ويُبقي العناوين على أسطر مستقلة.
ENGINE_PREFERENCE_MARGIN = 2.0

# أقصى نسبة محارف شاذة مقبولة في نص معتمد.
# المرشّحات السليمة تحقق صفراً تماماً، والعتبة ضيقة عمداً: إصلاح ToUnicode
# أنتج في المخططات السنوية 0.019% تلوثاً (5 محارف تيلوغو) مع درجة مفردات
# أعلى بقليل، فلو كانت العتبة متساهلة لفاز النص الملوث — ودرجة المفردات وحدها
# لا ترى خلط ترتيب الأسطر الذي رافقه.
MAX_GARBAGE_RATIO = 0.00005


def strip_disallowed(text: str) -> str:
    """المصفاة النهائية: لا يصل إلى وحدة البيانات إلا محرف من المدى المقبول.

    تُقاس نسبة التلوث قبل هذه المصفاة (لأنها تُخفي أثر العطب)، ثم تُطبَّق دائماً
    حتى لا تتسرب محارف مثل التيلوغو (U+0C2A) التي تأتي من ToUnicode الأصلي.
    """
    return "".join(c for c in text if ALLOWED_CODEPOINT.match(c) or c == "\n")


def garbage_ratio(text: str) -> float:
    """نسبة المحارف الخارجة عن المدى المقبول — مؤشر مستقل عن درجة المفردات.

    درجة المفردات وحدها لا تكفي: إصلاح ToUnicode رفع مطابقة المفردات في أحد
    الملفات من 78.5% إلى 79.2% بينما أدخل محارف تيلوغو وعربية موسعة وخلط
    ترتيب الأسطر. هذه البوابة ترفض أي مرشّح ملوّث ولو كانت درجته أعلى.
    """
    if not text:
        return 1.0
    allowed = len(ALLOWED_CODEPOINT.findall(text))
    return 1.0 - allowed / len(text)


# ─────────────────────────── 4) مسارات الاستخراج ───────────────────────────
def read_pypdf(path: str) -> list[str]:
    """ترتيب مجرى المحتوى الأصلي — الأدق لغالبية الملفات."""
    reader = PdfReader(path)
    if reader.is_encrypted:
        reader.decrypt("")
    pages = []
    for page in reader.pages:
        try:
            pages.append(page.extract_text() or "")
        except Exception:
            pages.append("")
    return pages


def read_pymupdf(path: str) -> list[str]:
    """يفكّ أشكال العرض التي يعجز عنها pypdf (دليل الأستاذ)."""
    doc = fitz.open(path)
    if doc.needs_pass:
        doc.authenticate("")
    pages = [doc[i].get_text() for i in range(len(doc))]
    doc.close()
    return pages


def extract_best(path: str, vocabulary: set[str]) -> tuple[list[str], str, float, int]:
    """استخراج أفضل المرشّحات الأربعة، وإرجاع (الصفحات، المسار، الجودة، عدد الإصلاحات)."""
    repaired = path + ".repaired.pdf"
    try:
        repair_tounicode(path, repaired)
        has_repaired = os.path.exists(repaired)
    except Exception:
        has_repaired = False

    # الترتيب = الأفضلية: pypdf (بلا إصلاح ثم به) ثم PyMuPDF (بلا إصلاح ثم به)
    candidates = [("pypdf", lambda: read_pypdf(path))]
    if has_repaired:
        candidates.append(("pypdf+tounicode", lambda: read_pypdf(repaired)))
    candidates.append(("pymupdf", lambda: read_pymupdf(path)))
    if has_repaired:
        candidates.append(("pymupdf+tounicode", lambda: read_pymupdf(repaired)))

    best: tuple[list[str], str, float] | None = None
    fallback: tuple[list[str], str, float, tuple[float, float]] | None = None
    scores: dict[str, float] = {}
    for label, reader in candidates:
        try:
            raw = reader()
        except Exception:
            scores[label] = 0.0
            continue
        pages = [normalize(page) for page in raw]
        joined = "\n".join(pages)
        quality = score(joined, vocabulary)
        garbage = garbage_ratio(joined)
        scores[label] = quality if garbage <= MAX_GARBAGE_RATIO else -garbage * 100
        clean = garbage <= MAX_GARBAGE_RATIO
        # المرشّحات تُفحص بترتيب الأفضلية: pypdf أولاً لأنه يحفظ ترتيب مجرى
        # المحتوى ولا يعيد ترتيب الاتجاه، فيُبقي بنية الأسطر والترقيم سليمين.
        # لا يُستبدل المرشّح المعتمد إلا إذا تفوّق عليه لاحقٌ بهامش واضح.
        if clean and (best is None or quality > best[2] + ENGINE_PREFERENCE_MARGIN):
            best = (pages, label, quality)
        # الاحتياطي: الأقل تلوثاً، فالأعلى درجة — نص ملوّث لا تنفعه درجته
        if fallback is None or (garbage, -quality) < fallback[3]:
            fallback = (pages, label, quality, (garbage, -quality))
        gc.collect()
    if best is None:
        best = (fallback[0], fallback[1], fallback[2])

    if has_repaired:
        try:
            os.remove(repaired)
        except OSError:
            pass

    pages, label, quality = best or ([], "none", 0.0)
    # تمرير ثانٍ: مفردات المنصة + الكلمات المتكررة في الوثيقة نفسها (≥5 صفحات)
    guard = vocabulary | build_source_vocabulary(pages)
    separator = "\n\x00\n"
    joined, fixes = repair_definite_article(separator.join(pages), guard)
    pages = joined.split(separator)
    return pages, label, quality, fixes


# ─────────────────────────── 5) توليد وحدات البيانات ───────────────────────────
def find_source_file(directory: str, needle: str) -> str | None:
    for path in sorted(glob.glob(os.path.join(directory, "*.pdf"))):
        name = os.path.basename(path)
        if needle in name:
            return path
    return None


def emit_module(spec: dict, pages: list[str], label: str, quality: float) -> dict:
    """كتابة src/data/official/<id>.ts بصفحات مرقمة، وإرجاع مدخلة الفهرس."""
    numbered = [
        {"page": index + 1, "text": strip_disallowed(text).strip()}
        for index, text in enumerate(pages)
        if strip_disallowed(text).strip()
    ]
    chars = sum(len(item["text"]) for item in numbered)
    body = json.dumps(numbered, ensure_ascii=False, indent=0)
    module = (
        "/**\n"
        f" * {spec['title']}\n"
        " *\n"
        " * نص رسمي حرفي مفرَّغ آلياً من ملف الوزارة الأصلي، صفحةً صفحة، للاقتباس الدقيق.\n"
        f" * مسار الاستخراج المعتمد: {label} — جودة المطابقة للمفردات الرسمية {quality:.1f}%.\n"
        " * أعاد التوليد: python3 scripts/ingest_official_pdfs.py <مجلد ملفات PDF>\n"
        " */\n"
        "import type { OfficialSourcePages } from './types';\n"
        "\n"
        f"export const pages: OfficialSourcePages = {body};\n"
        "\n"
        "export default pages;\n"
    )
    path = os.path.join(OUT_DIR, f"{spec['id']}.ts")
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(module)
    return {
        "garbage": round(garbage_ratio("\n".join(pages)) * 100, 4),
        "id": spec["id"],
        "kind": spec["kind"],
        "level": spec["level"],
        "title": spec["title"],
        "authority": spec["authority"],
        "url": spec["url"],
        "role": spec["role"],
        "module": f"./{spec['id']}",
        "pages": len(numbered),
        "chars": chars,
        "extraction": label,
        "quality": round(quality, 1),
    }


def emit_index(entries: list[dict]) -> None:
    """كتابة src/data/official/index.ts: بيان ثابت + محمّلات كسولة لكل وثيقة."""
    manifest = json.dumps(entries, ensure_ascii=False, indent=2)
    loaders = "\n".join(
        f"  {entry['id']}: () => import('{entry['module']}')," for entry in entries
    )
    module = f"""/**
 * فهرس المصادر الرسمية الحرفية لقاعدة معرفة المساعد الذكي.
 *
 * هذا الملف مولَّد آلياً — لا تحرّره يدوياً.
 * لإعادة التوليد: python3 scripts/ingest_official_pdfs.py <مجلد ملفات PDF>
 *
 * النصوص مُحمَّلة كسولياً (dynamic import) حتى لا تدخل في الحزمة الرئيسية؛
 * البيان (MANIFEST) وحده ثابت ومتاح فوراً لعرضه في الواجهة قبل وصول النص.
 */
import type {{ OfficialSourceManifestEntry, OfficialSourcePages }} from './types';

export const OFFICIAL_SOURCES_MANIFEST: OfficialSourceManifestEntry[] = {manifest};

/** محمّلات كسولة: كل وثيقة في حزمة مستقلة تُجلب عند أول استعمال. */
export const OFFICIAL_SOURCE_LOADERS: Record<string, () => Promise<{{ pages: OfficialSourcePages }}>> = {{
{loaders}
}};

export const OFFICIAL_SOURCES_TOTAL_CHARS = OFFICIAL_SOURCES_MANIFEST.reduce(
  (sum, entry) => sum + entry.chars,
  0,
);

export const OFFICIAL_SOURCES_TOTAL_PAGES = OFFICIAL_SOURCES_MANIFEST.reduce(
  (sum, entry) => sum + entry.pages,
  0,
);
"""
    with open(os.path.join(OUT_DIR, "index.ts"), "w", encoding="utf-8") as handle:
        handle.write(module)


TYPES_MODULE = """/**
 * أنواع المصادر الرسمية الحرفية في قاعدة معرفة المساعد الذكي.
 * النصوص مولَّدة بواسطة scripts/ingest_official_pdfs.py من ملفات الوزارة الأصلية.
 */

import type { KnowledgeLevel, KnowledgeSourceKind } from '../../types/knowledge';

/** صفحة واحدة من وثيقة رسمية؛ الرقم يُستعمل في الاستشهاد («المنهاج 2016، ص 29»). */
export interface OfficialSourcePage {
  /** رقم الصفحة كما هو في الملف الأصلي (يبدأ من 1). */
  page: number;
  text: string;
}

export type OfficialSourcePages = OfficialSourcePage[];

/** وصف ثابت لوثيقة رسمية، متاح فوراً قبل تحميل نصها الكسول. */
export interface OfficialSourceManifestEntry {
  id: string;
  kind: KnowledgeSourceKind;
  level: KnowledgeLevel;
  title: string;
  authority: string;
  url: string;
  role: string;
  /** مسار الوحدة المولَّدة داخل src/data/official. */
  module: string;
  pages: number;
  chars: number;
  /** مسار الاستخراج الذي فاز بالتسجيل الآلي. */
  extraction: string;
  /** نسبة مطابقة الكلمات للمفردات الرسمية (مؤشر جودة الطبقة النصية). */
  quality: number;
  /** نسبة المحارف الشاذة قبل المصفاة النهائية؛ صفر تعني طبقة نصية نظيفة. */
  garbage: number;
}
"""


# ─────────────────────────────── نقطة الدخول ───────────────────────────────
def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__.split("الاستخدام")[0].strip()[:400])
        print("\nالاستخدام: python3 scripts/ingest_official_pdfs.py <مجلد ملفات PDF>")
        return 2
    directory = os.path.abspath(argv[1])
    if not os.path.isdir(directory):
        print(f"مجلد غير موجود: {directory}")
        return 2

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "types.ts"), "w", encoding="utf-8") as handle:
        handle.write(TYPES_MODULE)

    print("تحميل المفردات المرجعية من قاعدة المنصة…")
    vocabulary = load_vocabulary()
    print(f"  {len(vocabulary)} كلمة\n")

    entries: list[dict] = []
    missing: list[str] = []
    print(
        f"{'الوثيقة':<26} {'المسار':<20} {'الجودة':>7} {'شاذ':>7} "
        f"{'صفحات':>6} {'أحرف':>8} {'إصلاح':>6}"
    )
    for spec in SOURCES:
        path = find_source_file(directory, spec["match"])
        if not path:
            missing.append(spec["match"])
            continue
        pages, label, quality, fixes = extract_best(path, vocabulary)
        if quality < MIN_QUALITY:
            print(
                f"  تحذير: {spec['id']} جودته {quality:.1f}% دون الحد {MIN_QUALITY}% — "
                "النص مفهرس لكن سيُوسم بجودة منخفضة."
            )
        entry = emit_module(spec, pages, label, quality)
        entries.append(entry)
        garbage = garbage_ratio("\n".join(pages))
        print(
            f"{spec['id']:<26} {label:<20} {quality:>6.1f}% {garbage*100:>6.3f}% "
            f"{entry['pages']:>6} {entry['chars']:>8} {fixes:>6}"
        )
        gc.collect()

    emit_index(entries)

    total_chars = sum(e["chars"] for e in entries)
    total_pages = sum(e["pages"] for e in entries)
    print(f"\nتم: {len(entries)} وثيقة، {total_pages} صفحة، {total_chars} حرفاً")
    print(f"المخرج: {os.path.relpath(OUT_DIR, REPO)}/")
    if missing:
        print("ملفات لم يُعثر عليها:", ", ".join(missing))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
