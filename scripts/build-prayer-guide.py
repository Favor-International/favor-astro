#!/usr/bin/env python3
"""Build Favor International's printable 30-day prayer guide."""

from pathlib import Path
from io import BytesIO
from PIL import Image
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/pdf/favor-30-day-prayer-guide.pdf"
WEB = ROOT / "public/downloads/favor-30-day-prayer-guide.pdf"

GREEN = HexColor("#1f4d2a")
GREEN_DEEP = HexColor("#173a20")
CREAM = HexColor("#f7f2e9")
GOLD = HexColor("#d99b2b")
INK = HexColor("#33352f")
SAGE = HexColor("#dce7d6")

COUNTRIES = [
    ("Uganda", "Days 1-10", "public/images/field/country-uganda.webp", "Pray for ministry teams serving from Gulu into cities, villages, schools, and cattle-herding communities.", [
        "Pray for the Gulu House of Prayer and for every gathering to remain rooted in Scripture and intercession.",
        "Pray for Portable Bible School trainers as they equip believers to disciple others.",
        "Pray for open doors, wise translators, and safe travel as teams serve Karamoja communities.",
        "Pray for teachers and students at Favor Primary School to grow in knowledge, character, and faith.",
        "Pray for Village Learning Center teachers bringing dependable learning close to children's homes.",
        "Pray for trauma-counseling teams and for participants walking toward forgiveness and healing.",
        "Pray for medical staff serving families with practical care, health education, and prayer.",
        "Pray for women building skills, stable income, and strong homes through empowerment programs.",
        "Pray for local pastors and congregations to serve their communities with humility and courage.",
        "Pray for Favor's Ugandan staff and their families: endurance, unity, provision, and rest.",
    ]),
    ("South Sudan", "Days 11-20", "public/images/field/hero-prayer-ssudan.webp", "Pray for leaders serving from Juba into communities shaped by conflict, displacement, and deep spiritual hunger.", [
        "Pray for the Juba House of Prayer and for prayer to remain the foundation of every ministry response.",
        "Pray for Portable Bible School teachers traveling to communities with limited access to sustained Bible training.",
        "Pray for Taposa communities and former warriors hearing the Gospel through leaders who understand their language and culture.",
        "Pray for young people in GIFT to know safety, belonging, discipleship, and a hopeful path forward.",
        "Pray for Favor's school leaders, teachers, students, and families in Juba.",
        "Pray for trauma-counseling participants carrying the wounds of conflict and loss.",
        "Pray for medical teams bringing care and health education where services are limited.",
        "Pray for new believers to be discipled and connected to healthy, locally led churches.",
        "Pray for displaced families and for ministry teams serving them with wisdom and compassion.",
        "Pray for Favor's South Sudanese staff and their families: protection, provision, unity, and strength.",
    ]),
    ("Chad", "Days 21-30", "public/images/field/country-chad.webp", "Pray for the growing work in Chad and for national leaders carrying prayer, discipleship, and the Gospel forward.", [
        "Pray for the House of Prayer in N'Djamena to strengthen believers and serve the city faithfully.",
        "Pray for protection, discernment, and endurance for Favor's team on the ground.",
        "Pray for trusted relationships with local pastors, churches, and community leaders.",
        "Pray for Portable Bible School teachers as they train believers to understand and share Scripture.",
        "Pray for clear communication across languages and for teaching to be understood and remembered.",
        "Pray for new believers to receive patient follow-up, sound discipleship, and Christian community.",
        "Pray for families and young people to encounter the hope and love of Jesus.",
        "Pray for wisdom as field leaders respond to changing needs and opportunities.",
        "Pray for national leaders to be equipped to train and send others from their own communities.",
        "Pray for lasting fruit in Chad: transformed hearts, healthy churches, and faithful disciples who multiply.",
    ]),
]


def crop_image(c, path, x, y, width, height):
    source = Image.open(ROOT / path).convert("RGB")
    source.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
    buffer = BytesIO()
    source.save(buffer, format="JPEG", quality=84, optimize=True)
    buffer.seek(0)
    image = ImageReader(buffer)
    iw, ih = image.getSize()
    scale = max(width / iw, height / ih)
    draw_w, draw_h = iw * scale, ih * scale
    c.saveState()
    clip = c.beginPath()
    clip.rect(x, y, width, height)
    c.clipPath(clip, stroke=0, fill=0)
    c.drawImage(image, x - (draw_w - width) / 2, y - (draw_h - height) / 2, draw_w, draw_h, mask="auto")
    c.restoreState()


def paragraph(c, text, x, top, width, style):
    p = Paragraph(text, style)
    _, height = p.wrap(width, 200)
    p.drawOn(c, x, top - height)
    return top - height


def footer(c, page):
    c.setStrokeColor(SAGE)
    c.line(42, 35, 570, 35)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(GREEN)
    c.drawString(42, 21, "FAVOR INTERNATIONAL  |  favorintl.org/pray")
    c.drawRightString(570, 21, str(page))


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    WEB.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("Playfair", str(ROOT / "public/fonts/PlayfairDisplay-VariableFont.ttf")))

    body = ParagraphStyle("body", fontName="Helvetica", fontSize=10.2, leading=14.2, textColor=INK)
    intro = ParagraphStyle("intro", fontName="Helvetica", fontSize=12, leading=18, textColor=white)
    prayer = ParagraphStyle("prayer", fontName="Helvetica", fontSize=9.2, leading=12.8, textColor=INK)

    c = canvas.Canvas(str(OUT), pagesize=letter)
    c.setTitle("Favor International - 30-Day Prayer Guide")
    c.setAuthor("Favor International")
    width, height = letter

    crop_image(c, "public/images/field-2026/prayer-1.webp", 0, 0, width, height)
    c.setFillColor(HexColor("#102b18"), alpha=0.84)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.drawImage(str(ROOT / "public/images/favor-logo-white.png"), 42, 700, width=170, height=55, preserveAspectRatio=True, mask="auto")
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(44, 630, "30-DAY PRAYER GUIDE")
    c.setFillColor(white)
    c.setFont("Playfair", 40)
    c.drawString(42, 565, "Three nations.")
    c.drawString(42, 515, "Thirty days of")
    c.drawString(42, 465, "focused prayer.")
    paragraph(c, "Pray with Favor's teams in Uganda, South Sudan, and Chad - one clear ministry focus at a time.", 44, 405, 390, intro)
    c.setFillColor(GOLD)
    c.roundRect(42, 88, 282, 54, 27, fill=1, stroke=0)
    c.setFillColor(GREEN_DEEP)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(183, 108, "NAME THE NATION. PRAY SPECIFICALLY.")
    c.showPage()

    day = 1
    for name, days, image_path, country_intro, prayers in COUNTRIES:
        c.setFillColor(CREAM)
        c.rect(0, 0, width, height, fill=1, stroke=0)
        crop_image(c, image_path, 0, 552, width, 240)
        c.setFillColor(GREEN_DEEP, alpha=0.62)
        c.rect(0, 552, width, 240, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(42, 738, days.upper())
        c.setFillColor(white)
        c.setFont("Playfair", 37)
        c.drawString(40, 681, name)
        paragraph(c, country_intro, 42, 646, 480, intro)

        y = 525
        for text in prayers:
            accent = [GREEN, GOLD, HexColor("#b85c3c"), HexColor("#74896b")][(day - 1) % 4]
            c.setFillColor(white)
            c.roundRect(42, y - 42, 528, 48, 12, fill=1, stroke=0)
            c.setFillColor(accent)
            c.roundRect(54, y - 32, 58, 29, 14, fill=1, stroke=0)
            c.setFillColor(white)
            c.setFont("Helvetica-Bold", 7.7)
            c.drawCentredString(83, y - 21, f"DAY {day}")
            paragraph(c, text, 128, y - 5, 424, prayer)
            y -= 51
            day += 1
        footer(c, day // 10 + 1)
        c.showPage()

    c.save()
    WEB.write_bytes(OUT.read_bytes())
    print(OUT)
    print(WEB)


if __name__ == "__main__":
    build()
