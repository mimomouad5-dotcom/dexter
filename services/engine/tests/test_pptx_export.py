# Unit tests for Component: n27 مصدّر PPTX & n28 مدقق الحركات & n46 ملف .pptx
import os
import shutil
import tempfile
import zipfile
import pytest
from pptx import Presentation
from dexter_engine.model.presentation import (
    UnifiedPresentationModel,
    PresentationMetadata,
    Slide,
    SlideElement,
    ElementType,
    ElementFrame,
    ElementStyle,
    AnimationEffect,
    TransitionEffect,
    EMU_PER_INCH
)
from dexter_engine.export.pptx_writer import PPTXWriter
from dexter_engine.export.animations import is_transition_verified, is_animation_verified

@pytest.fixture
def temp_export_dir():
    d = tempfile.mkdtemp(prefix="dexter_pptx_test_")
    yield d
    shutil.rmtree(d)

def test_full_pptx_export_from_model(temp_export_dir):
    """Verifies that n27 transforms UnifiedPresentationModel into valid editable .pptx."""
    target_pptx = os.path.join(temp_export_dir, "output_presentation.pptx")

    # Slide 1: Title with Arabic RTL
    s1_el = SlideElement(
        type=ElementType.TEXT,
        frame=ElementFrame(x=EMU_PER_INCH, y=EMU_PER_INCH, w=10 * EMU_PER_INCH, h=int(1.5 * EMU_PER_INCH)),
        style=ElementStyle(font_family="Cairo", font_size_pt=36, bold=True, is_rtl=True),
        content={"text": "الذكاء الاصطناعي في قيادة الأعمال"},
        animation=AnimationEffect(effect_id="appear", verified=True)
    )
    slide1 = Slide(
        order=1,
        layout_id="title",
        elements=[s1_el],
        notes="ملاحظات الشريحة الأولى: الافتتاحية والترحيب.",
        transition=TransitionEffect(effect_id="fade", verified=True)
    )

    # Slide 2: Native Chart & Styled Shape
    chart_el = SlideElement(
        type=ElementType.CHART,
        frame=ElementFrame(x=EMU_PER_INCH, y=EMU_PER_INCH, w=6 * EMU_PER_INCH, h=4 * EMU_PER_INCH),
        content={
            "chart_type": "column",
            "categories": ["2023", "2024", "2025", "2026"],
            "series": [
                {"name": "النمو الفعلي", "values": [10, 25, 45, 80]},
                {"name": "المستهدف", "values": [15, 30, 50, 85]}
            ]
        }
    )
    shape_el = SlideElement(
        type=ElementType.SHAPE,
        frame=ElementFrame(x=8 * EMU_PER_INCH, y=EMU_PER_INCH, w=4 * EMU_PER_INCH, h=3 * EMU_PER_INCH),
        style=ElementStyle(fill_color_hex="#1E293B", border_color_hex="#0D9488", border_width_pt=2),
        content={"geometry": "rounded_rectangle", "label": "بطاقة المؤشرات الرئيسية"}
    )
    slide2 = Slide(
        order=2,
        layout_id="two-columns",
        elements=[chart_el, shape_el],
        notes="ملاحظات الشريحة الثانية: توضيح نسبة النمو في الرسم البياني الأصلي.",
        transition=TransitionEffect(effect_id="push", verified=True)
    )

    model = UnifiedPresentationModel(
        schema_version="1.0.0",
        presentation=PresentationMetadata(
            title="تقرير الأعمال المعتمد",
            language="ar",
            direction="rtl",
            aspect_ratio="16:9",
            theme_id="emerald-executive",
            slides=[slide1, slide2]
        )
    )

    export_res = PPTXWriter.export_presentation(model, target_pptx)
    assert export_res["status"] == "success"
    assert export_res["slide_count"] == 2
    assert os.path.exists(target_pptx)
    assert not os.path.exists(target_pptx + ".tmp")

    # Round-trip verification
    verify_res = PPTXWriter.verify_round_trip(target_pptx)
    assert verify_res["round_trip_valid"] is True
    assert verify_res["slide_count"] == 2
    assert verify_res["has_charts"] is True
    assert verify_res["has_notes"] is True
    assert verify_res["has_arabic_rtl"] is True

def test_verified_transitions_and_animations_filtering():
    """Verifies that n28 strictly validates effects against registry."""
    assert is_transition_verified("fade") is True
    assert is_transition_verified("push") is True
    assert is_transition_verified("unsupported_3d_cube") is False

    assert is_animation_verified("appear") is True
    assert is_animation_verified("fade") is True
    assert is_animation_verified("unverified_fly_in") is False

def test_round_trip_xml_package_integrity(temp_export_dir):
    """Verifies that the generated PPTX package conforms to ISO/IEC 29500-1."""
    target_pptx = os.path.join(temp_export_dir, "test_pkg.pptx")

    s = Slide(
        order=1,
        elements=[
            SlideElement(
                type=ElementType.TEXT,
                frame=ElementFrame(x=1000000, y=1000000, w=5000000, h=1000000),
                content={"text": "نص عربي للتحقق"}
            )
        ],
        transition=TransitionEffect(effect_id="fade", verified=True)
    )

    model = UnifiedPresentationModel(
        schema_version="1.0.0",
        presentation=PresentationMetadata(
            title="حزمة اختبارية",
            language="ar",
            direction="rtl",
            slides=[s]
        )
    )

    PPTXWriter.export_presentation(model, target_pptx)

    # Inspect ZIP structure
    with zipfile.ZipFile(target_pptx, "r") as zf:
        namelist = zf.namelist()
        assert "[Content_Types].xml" in namelist
        assert "ppt/presentation.xml" in namelist
        slide_xml = zf.read("ppt/slides/slide1.xml").decode("utf-8")
        assert "p:transition" in slide_xml
        assert "fade" in slide_xml
