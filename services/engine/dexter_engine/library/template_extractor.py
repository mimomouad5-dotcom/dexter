# Component: n29 مستورد وفهرسة المكتبة (Template & Presentation Metadata Extractor)
"""
Extracts structural and design metadata from PowerPoint (.pptx) presentations and templates.
Operates strictly in READ-ONLY mode without modifying the source presentation.
"""

import os
from typing import Dict, Any, List, Optional
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE

# Aspect ratio tolerance threshold
RATIO_16_9 = 16.0 / 9.0   # ~1.7778
RATIO_4_3 = 4.0 / 3.0     # ~1.3333

def get_aspect_ratio_label(width_emu: int, height_emu: int) -> str:
    if height_emu == 0:
        return "custom"
    ratio = width_emu / height_emu
    if abs(ratio - RATIO_16_9) < 0.05:
        return "16:9"
    elif abs(ratio - RATIO_4_3) < 0.05:
        return "4:3"
    elif abs(ratio - 1.0) < 0.05:
        return "1:1"
    else:
        return f"{round(ratio, 2)}:1"

def extract_presentation_metadata(file_path: str) -> Dict[str, Any]:
    """
    Safely opens a PPTX file and extracts deep structural metadata.
    Returns:
        {
            "slide_count": int,
            "width_emu": int,
            "height_emu": int,
            "aspect_ratio": str,
            "titles": List[str],
            "layouts": List[str],
            "total_shapes": int,
            "total_charts": int,
            "total_tables": int,
            "total_images": int,
            "has_notes": bool,
            "is_template_candidate": bool,
            "template_score": float
        }
    """
    try:
        prs = Presentation(file_path)
    except Exception as e:
        return {
            "error": f"Failed to parse presentation: {e}",
            "slide_count": 0,
            "aspect_ratio": "unknown"
        }

    width_emu = prs.slide_width
    height_emu = prs.slide_height
    aspect_ratio = get_aspect_ratio_label(width_emu, height_emu)

    slide_titles: List[str] = []
    total_shapes = 0
    total_charts = 0
    total_tables = 0
    total_images = 0
    has_notes = False

    for slide in prs.slides:
        # Check notes
        if slide.has_notes_slide and slide.notes_slide.notes_text_frame.text.strip():
            has_notes = True

        # Extract title
        title_text = ""
        if slide.shapes.title and slide.shapes.title.text.strip():
            title_text = slide.shapes.title.text.strip()
        else:
            # Fallback: look for the first non-empty text shape
            for shape in slide.shapes:
                if shape.has_text_frame and shape.text_frame.text.strip():
                    title_text = shape.text_frame.text.strip().split("\n")[0]
                    break
        if title_text:
            slide_titles.append(title_text)

        # Count shape types
        for shape in slide.shapes:
            total_shapes += 1
            if shape.has_chart:
                total_charts += 1
            elif shape.has_table:
                total_tables += 1
            elif shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                total_images += 1

    # Extract layout names from slide masters
    layout_names: List[str] = []
    for master in prs.slide_masters:
        for layout in master.slide_layouts:
            if layout.name and layout.name not in layout_names:
                layout_names.append(layout.name)

    slide_count = len(prs.slides)
    # A template candidate has reusable layouts, master slides, or structured slides >= 1
    is_template = slide_count >= 1 and (len(layout_names) >= 2 or total_shapes >= 3)
    template_score = min(1.0, (slide_count * 0.1) + (len(layout_names) * 0.05) + (total_shapes * 0.02))

    return {
        "slide_count": slide_count,
        "width_emu": width_emu,
        "height_emu": height_emu,
        "aspect_ratio": aspect_ratio,
        "titles": slide_titles[:15], # top 15 titles
        "layouts": layout_names[:20],
        "total_shapes": total_shapes,
        "total_charts": total_charts,
        "total_tables": total_tables,
        "total_images": total_images,
        "has_notes": has_notes,
        "is_template_candidate": is_template,
        "template_score": round(template_score, 2),
        "error": None
    }
