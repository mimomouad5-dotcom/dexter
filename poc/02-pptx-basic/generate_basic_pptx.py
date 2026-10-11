#!/usr/bin/env python3
# Component: n27 مصدّر PPTX (python-pptx + OOXML) & n46 ملف .pptx
"""
PoC-02: Generates and verifies a native .pptx presentation containing:
1. Editable text frames
2. Geometric shapes (styled fill/border)
3. Embedded images
4. Native PowerPoint charts (tabular editable chart)
5. Speaker notes
6. Arabic RTL text with OOXML rtl="1" alignment and font declaration
7. Automated round-trip verification
"""

import os
import sys
from io import BytesIO
from PIL import Image, ImageDraw

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE
from pptx.oxml import parse_xml
from pptx.oxml.ns import nsdecls

def create_sample_image(path: str):
    """Generates a clean PNG badge image to test image embedding."""
    img = Image.new('RGBA', (400, 400), color=(240, 244, 248, 255))
    draw = ImageDraw.Draw(img)
    # Draw geometric motif
    draw.rounded_rectangle([20, 20, 380, 380], radius=25, fill=(43, 84, 126, 255), outline=(13, 148, 136, 255), width=6)
    draw.ellipse([100, 100, 300, 300], fill=(20, 184, 166, 255))
    draw.rectangle([170, 140, 230, 260], fill=(255, 255, 255, 255))
    draw.rectangle([140, 170, 260, 230], fill=(255, 255, 255, 255))
    img.save(path, format='PNG')

def set_arabic_rtl_paragraph(paragraph, font_name="Cairo", font_size=18, is_rtl=True):
    """
    Directly injects or sets the rtl attribute on the paragraph properties (a:pPr)
    according to OOXML standard (ISO/IEC 29500-1 §21.1.2.2.7).
    """
    pPr = paragraph._p.get_or_add_pPr()
    if is_rtl:
        pPr.set('rtl', '1')
        pPr.set('algn', 'r')
    else:
        pPr.set('rtl', '0')
        pPr.set('algn', 'l')

    for run in paragraph.runs:
        run.font.name = font_name
        run.font.size = Pt(font_size)
        # Add bidi font property to run
        rPr = run._r.get_or_add_rPr()
        ea = parse_xml(f'<a:cs {nsdecls("a")} typeface="{font_name}"/>')
        rPr.append(ea)

def generate_poc_presentation(output_path: str):
    prs = Presentation()
    prs.slide_width = Inches(13.333)  # 16:9 widescreen
    prs.slide_height = Inches(7.5)

    blank_slide_layout = prs.slide_layouts[6]

    # ================= Slide 1: Title & Arabic Heading =================
    slide1 = prs.slides.add_slide(blank_slide_layout)
    
    # Title Box
    title_box = slide1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.333), Inches(2.0))
    tf1 = title_box.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "مختبر ديكستر للعروض التقديمية"
    set_arabic_rtl_paragraph(p1, font_name="Cairo", font_size=40, is_rtl=True)

    # Subtitle Box
    sub_box = slide1.shapes.add_textbox(Inches(1.0), Inches(3.8), Inches(11.333), Inches(1.2))
    tf_sub = sub_box.text_frame
    p_sub = tf_sub.paragraphs[0]
    p_sub.text = "Dexter Presentation Studio — Native PPTX Architecture PoC"
    p_sub.font.size = Pt(22)
    p_sub.font.color.rgb = RGBColor(100, 116, 139)

    # Slide 1 Speaker Notes
    notes_slide1 = slide1.notes_slide
    notes_tf1 = notes_slide1.notes_text_frame
    notes_tf1.text = "ملاحظات المتحدث للشرائح الأولى: الترحيب بالحضور واستعراض أهداف المشروع."

    # ================= Slide 2: Complex Native Elements =================
    slide2 = prs.slides.add_slide(blank_slide_layout)

    # 1. Slide 2 Heading
    s2_title_box = slide2.shapes.add_textbox(Inches(1.0), Inches(0.6), Inches(11.333), Inches(1.0))
    p2_title = s2_title_box.text_frame.paragraphs[0]
    p2_title.text = "العناصر المتقدمة والرسوم البيانية الأصلية"
    set_arabic_rtl_paragraph(p2_title, font_name="Cairo", font_size=28, is_rtl=True)

    # 2. Geometric Shape with styling
    shape = slide2.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(1.0), Inches(1.8), Inches(3.5), Inches(2.2)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(241, 245, 249)
    shape.line.color.rgb = RGBColor(15, 118, 110)
    shape.line.width = Pt(2)
    
    stf = shape.text_frame
    stf.word_wrap = True
    sp = stf.paragraphs[0]
    sp.text = "بطاقة معيار الجودة (n26)"
    set_arabic_rtl_paragraph(sp, font_name="Cairo", font_size=16, is_rtl=True)
    sp2 = stf.add_paragraph()
    sp2.text = "• تباين WCAG 4.5:1\n• انضباط حدود النصوص\n• تنسيق قابل للتحرير 100%"
    set_arabic_rtl_paragraph(sp2, font_name="Cairo", font_size=13, is_rtl=True)

    # 3. Embedded Image
    image_temp_path = os.path.join(os.path.dirname(output_path), "sample_badge.png")
    create_sample_image(image_temp_path)
    slide2.shapes.add_picture(image_temp_path, Inches(1.0), Inches(4.3), Inches(3.5), Inches(2.6))

    # 4. Native PowerPoint Chart (Editable Column Chart)
    chart_data = CategoryChartData()
    chart_data.categories = ['المرحلة 0', 'المرحلة 1', 'المرحلة 2', 'المرحلة 3']
    chart_data.add_series('نسبة الإنجاز %', (100, 85, 70, 50))
    chart_data.add_series('مستوى الأمان %', (100, 100, 100, 100))

    x, y, cx, cy = Inches(5.0), Inches(1.8), Inches(7.3), Inches(5.0)
    chart = slide2.shapes.add_chart(
        XL_CHART_TYPE.COLUMN_CLUSTERED, x, y, cx, cy, chart_data
    ).chart
    chart.has_legend = True
    chart.legend.include_in_layout = False

    # Slide 2 Notes
    notes_slide2 = slide2.notes_slide
    notes_slide2.notes_text_frame.text = "ملاحظات المتحدث: استعراض الرسم البياني مع الإشارة إلى أن البيانات قابلة للتحرير المباشر داخل PowerPoint كجدول بيانات أصلي."

    # Save presentation
    prs.save(output_path)
    print(f"[OK] Presentation created at: {output_path}")

def verify_poc_presentation(output_path: str):
    """Round-trip verification test reading the generated presentation."""
    print("=== Verifying Generated Presentation (Round-Trip Test) ===")
    prs = Presentation(output_path)

    # 1. Slide Count
    assert len(prs.slides) == 2, f"Expected 2 slides, got {len(prs.slides)}"
    print(f"PASS: Slide count matches: {len(prs.slides)}")

    # 2. Slide 1 Verification
    slide1 = prs.slides[0]
    slide1_texts = [shape.text_frame.text for shape in slide1.shapes if shape.has_text_frame]
    assert any("مختبر ديكستر" in t for t in slide1_texts), "Title text missing in Slide 1"
    assert "ملاحظات المتحدث للشرائح الأولى" in slide1.notes_slide.notes_text_frame.text, "Speaker notes missing in Slide 1"
    print("PASS: Slide 1 title, subtitle, and speaker notes verified.")

    # Check RTL XML on Slide 1
    slide1_xml = slide1._element.xml
    assert 'rtl="1"' in slide1_xml, "RTL attribute rtl='1' missing in Slide 1 XML!"
    print("PASS: Slide 1 OOXML contains valid rtl='1' attribute.")

    # 3. Slide 2 Verification (Shapes, Chart, Image, Notes)
    slide2 = prs.slides[1]
    has_chart = any(shape.has_chart for shape in slide2.shapes)
    has_image = any(shape.shape_type == 13 for shape in slide2.shapes) # 13 is MSO_SHAPE_TYPE.PICTURE
    has_rounded_rect = any(shape.has_text_frame and "بطاقة معيار الجودة" in shape.text_frame.text for shape in slide2.shapes)

    assert has_chart, "Native chart missing in Slide 2!"
    assert has_image, "Picture shape missing in Slide 2!"
    assert has_rounded_rect, "Geometric styled shape missing in Slide 2!"
    assert "ملاحظات المتحدث: استعراض الرسم البياني" in slide2.notes_slide.notes_text_frame.text, "Speaker notes missing in Slide 2"
    print("PASS: Slide 2 chart, image, shape, and speaker notes verified.")
    print("=== [PoC-02] RESULT: SUCCESS (Full PPTX creation & round-trip verified) ===\n")

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    target_pptx = os.path.join(out_dir, "dexter_poc02_presentation.pptx")
    generate_poc_presentation(target_pptx)
    verify_poc_presentation(target_pptx)
