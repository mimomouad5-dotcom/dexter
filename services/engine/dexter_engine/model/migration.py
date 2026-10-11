# Component: n23 ترحيل إصدارات المخطط (Schema Version Migrations)
"""
Schema Version Migration Engine for Unified Presentation Model.
Ensures forward compatibility and upgrades legacy project files seamlessly.
"""

from typing import Dict, Any
from dexter_engine.logging.safe_logger import get_safe_logger

logger = get_safe_logger("n23_migration")

CURRENT_SCHEMA_VERSION = "1.0.0"

def migrate_presentation_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Migrates raw presentation dictionary to CURRENT_SCHEMA_VERSION.
    """
    version = raw_data.get("schema_version", "0.9.0")
    if version == CURRENT_SCHEMA_VERSION:
        return raw_data

    logger.info(f"Migrating presentation data from version {version} to {CURRENT_SCHEMA_VERSION}...")
    migrated = dict(raw_data)

    # Migration from 0.9.0 to 1.0.0
    if version in ("0.9.0", "0.9", None):
        if "presentation" not in migrated:
            migrated["presentation"] = {
                "title": migrated.get("title", "عرض بدون عنوان"),
                "language": migrated.get("language", "ar"),
                "direction": "rtl" if migrated.get("language", "ar") == "ar" else "ltr",
                "aspect_ratio": migrated.get("aspect_ratio", "16:9"),
                "theme_id": migrated.get("theme_id", "modern-emerald"),
                "slides": migrated.get("slides", [])
            }

        pres = migrated["presentation"]
        if "direction" not in pres:
            pres["direction"] = "rtl" if pres.get("language") == "ar" else "ltr"
        if "sources" not in pres:
            pres["sources"] = []
        if "claims" not in pres:
            pres["claims"] = []
        if "assets" not in pres:
            pres["assets"] = []

        # Ensure elements have frames with unit: 'emu'
        for slide in pres.get("slides", []):
            if "claim_ids" not in slide:
                slide["claim_ids"] = []
            if "transition" not in slide:
                slide["transition"] = {"effect_id": "fade", "verified": True}
            for el in slide.get("elements", []):
                frame = el.get("frame", {})
                if "unit" not in frame:
                    frame["unit"] = "emu"
                el["frame"] = frame

        migrated["schema_version"] = "1.0.0"

    return migrated
