# Unit tests for Component: n23 نموذج العرض الموحد (Slides/Elements/Notes)
import json
import pytest
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
    ShapeGeometry,
    ChartType,
    EMU_PER_INCH,
    EMU_PER_PT
)
from dexter_engine.model.migration import migrate_presentation_data, CURRENT_SCHEMA_VERSION

def test_model_validation_and_creation():
    """Verifies that Pydantic properly constructs and validates a complete presentation."""
    # 1. Title Element
    title_element = SlideElement(
        type=ElementType.TEXT,
        frame=ElementFrame(x=EMU_PER_INCH, y=EMU_PER_INCH, w=10 * EMU_PER_INCH, h=int(1.5 * EMU_PER_INCH)),
        style=ElementStyle(font_family="Cairo", font_size_pt=36, bold=True, is_rtl=True),
        content={"text": "الذكاء الاصطناعي في خدمة الأعمال"},
        animation=AnimationEffect(effect_id="appear", verified=True)
    )

    # 2. Native Chart Element
    chart_element = SlideElement(
        type=ElementType.CHART,
        frame=ElementFrame(x=EMU_PER_INCH, y=3 * EMU_PER_INCH, w=6 * EMU_PER_INCH, h=4 * EMU_PER_INCH),
        content={
            "chart_type": "column",
            "categories": ["Q1", "Q2", "Q3", "Q4"],
            "series": [{"name": "المبيعات", "values": [120, 150, 200, 280]}]
        }
    )

    # 3. Slide
    slide1 = Slide(
        order=1,
        layout_id="title-content",
        elements=[title_element, chart_element],
        notes="ملاحظات المتحدث: استعراض نمو المبيعات خلال أرباع السنة.",
        transition=TransitionEffect(effect_id="fade", verified=True, speed="med")
    )

    # 4. Root Presentation
    model = UnifiedPresentationModel(
        schema_version="1.0.0",
        presentation=PresentationMetadata(
            title="تقرير الربع السنوي",
            language="ar",
            direction="rtl",
            aspect_ratio="16:9",
            theme_id="emerald-executive",
            slides=[slide1]
        )
    )

    assert model.schema_version == "1.0.0"
    assert model.presentation.title == "تقرير الربع السنوي"
    assert len(model.presentation.slides) == 1
    assert len(model.presentation.slides[0].elements) == 2
    assert model.presentation.slides[0].elements[0].frame.unit == "emu"

def test_json_schema_export():
    """Verifies that n23 can export a compliant JSON Schema."""
    schema = UnifiedPresentationModel.model_json_schema()
    assert "$defs" in schema or "properties" in schema
    assert "schema_version" in schema["properties"]
    assert "presentation" in schema["properties"]

def test_round_trip_json_serialization():
    """Verifies lossless serialization and deserialization."""
    slide = Slide(
        order=1,
        layout_id="metrics",
        elements=[
            SlideElement(
                type=ElementType.SHAPE,
                frame=ElementFrame(x=500000, y=500000, w=2000000, h=1000000),
                content={"geometry": "rounded_rectangle", "label": "إحصائية رئيسية"}
            )
        ],
        notes="ملاحظات مهمة"
    )

    original = UnifiedPresentationModel(
        schema_version="1.0.0",
        presentation=PresentationMetadata(
            title="اختبار الذهاب والإياب",
            language="ar",
            direction="rtl",
            slides=[slide]
        )
    )

    # Serialize to JSON string
    json_str = original.model_dump_json(indent=2)
    parsed_dict = json.loads(json_str)

    # Reload into model
    reloaded = UnifiedPresentationModel.model_validate(parsed_dict)
    assert reloaded.presentation.title == original.presentation.title
    assert reloaded.presentation.slides[0].elements[0].content["label"] == "إحصائية رئيسية"
    assert reloaded.presentation.slides[0].elements[0].frame.w == 2000000

def test_schema_migration_from_legacy():
    """Verifies migration of legacy payload (v0.9.0 without EMU units or direction)."""
    legacy_data = {
        "schema_version": "0.9.0",
        "title": "عرض قديم",
        "language": "ar",
        "slides": [
            {
                "order": 1,
                "layout_id": "title",
                "elements": [
                    {
                        "type": "text",
                        "frame": {"x": 100, "y": 100, "w": 500, "h": 200},
                        "content": {"text": "نص قديم"}
                    }
                ]
            }
        ]
    }

    migrated = migrate_presentation_data(legacy_data)
    assert migrated["schema_version"] == CURRENT_SCHEMA_VERSION
    assert migrated["presentation"]["direction"] == "rtl"
    assert migrated["presentation"]["slides"][0]["elements"][0]["frame"]["unit"] == "emu"

    # Must validate cleanly against UnifiedPresentationModel
    validated = UnifiedPresentationModel.model_validate(migrated)
    assert validated.schema_version == "1.0.0"
    assert validated.presentation.title == "عرض قديم"
