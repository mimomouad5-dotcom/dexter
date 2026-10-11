# Component: n23 نموذج العرض الموحد (Slides/Elements/Notes) ⭐
"""
Unified Presentation Model (n23) - Single Source of Truth for Preview and Export.
Uses English Metric Units (EMU) for pixel-perfect alignment with OpenXML PowerPoint standards.
"""

from enum import Enum
from typing import List, Dict, Any, Optional, Union, Literal
from pydantic import BaseModel, Field, field_validator, model_validator
import uuid

# 914400 EMUs per Inch, 36000 EMUs per Point
EMU_PER_INCH = 914400
EMU_PER_PT = 36000

class ElementType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    SHAPE = "shape"
    CHART = "chart"
    TABLE = "table"

class ShapeGeometry(str, Enum):
    RECTANGLE = "rectangle"
    ROUNDED_RECTANGLE = "rounded_rectangle"
    ELLIPSE = "ellipse"
    LINE = "line"
    ARROW = "arrow"

class ChartType(str, Enum):
    COLUMN = "column"
    BAR = "bar"
    LINE = "line"
    PIE = "pie"

class ElementFrame(BaseModel):
    x: int = Field(..., description="X position in EMU")
    y: int = Field(..., description="Y position in EMU")
    w: int = Field(..., gt=0, description="Width in EMU")
    h: int = Field(..., gt=0, description="Height in EMU")
    unit: Literal["emu"] = "emu"

class AnimationEffect(BaseModel):
    effect_id: str = Field(..., description="Identifier matching verified effect registry in n28")
    verified: bool = Field(default=True, description="Strict verified flag")
    trigger: Literal["onClick", "afterPrevious", "withPrevious"] = "onClick"
    delay_ms: int = 0
    duration_ms: int = 500

class TransitionEffect(BaseModel):
    effect_id: str = "fade"
    verified: bool = True
    speed: Literal["fast", "med", "slow"] = "med"

class ElementStyle(BaseModel):
    font_family: Optional[str] = "Cairo"
    font_size_pt: Optional[float] = 18.0
    font_color_hex: Optional[str] = "#FFFFFF"
    bold: bool = False
    italic: bool = False
    underline: bool = False
    fill_color_hex: Optional[str] = None
    border_color_hex: Optional[str] = None
    border_width_pt: Optional[float] = None
    alignment: Literal["left", "center", "right", "justify"] = "right"
    is_rtl: bool = True

class TextContent(BaseModel):
    text: str
    paragraphs: Optional[List[Dict[str, Any]]] = None

class ImageContent(BaseModel):
    asset_id: Optional[str] = None
    file_path: str
    alt_text: Optional[str] = None
    source_license: Optional[str] = "local_library"

class ShapeContent(BaseModel):
    geometry: ShapeGeometry = ShapeGeometry.ROUNDED_RECTANGLE
    label: Optional[str] = None

class ChartContent(BaseModel):
    chart_type: ChartType = ChartType.COLUMN
    title: Optional[str] = None
    categories: List[str]
    series: List[Dict[str, Any]]  # [{"name": "Series 1", "values": [10, 20, 30]}]

class TableContent(BaseModel):
    rows: int
    cols: int
    data: List[List[str]]

class SlideElement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ElementType
    frame: ElementFrame
    style: ElementStyle = Field(default_factory=ElementStyle)
    z: int = 0
    content: Dict[str, Any]
    animation: Optional[AnimationEffect] = None

class Slide(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order: int
    layout_id: str = "title-content"
    elements: List[SlideElement] = Field(default_factory=list)
    notes: Optional[str] = None
    transition: Optional[TransitionEffect] = Field(default_factory=TransitionEffect)
    claim_ids: List[str] = Field(default_factory=list)

class PresentationSettings(BaseModel):
    audience: str = "General"
    tone: str = "professional"
    detail_level: str = "medium"

class PresentationMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    language: Literal["ar", "en"] = "ar"
    direction: Literal["rtl", "ltr"] = "rtl"
    aspect_ratio: Literal["16:9", "4:3"] = "16:9"
    theme_id: str = "modern-emerald"
    settings: PresentationSettings = Field(default_factory=PresentationSettings)
    slides: List[Slide] = Field(default_factory=list)
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    claims: List[Dict[str, Any]] = Field(default_factory=list)
    assets: List[Dict[str, Any]] = Field(default_factory=list)

class UnifiedPresentationModel(BaseModel):
    schema_version: str = "1.0.0"
    presentation: PresentationMetadata

    def export_json_schema(self) -> Dict[str, Any]:
        """Generates and returns official JSON Schema."""
        return self.model_json_schema()
