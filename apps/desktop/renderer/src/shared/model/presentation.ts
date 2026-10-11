// Component: n23 نموذج العرض الموحد (Unified Presentation Model) - TypeScript Types
export const EMU_PER_INCH = 914400;
export const EMU_PER_PT = 36000;

export type ElementType = 'text' | 'image' | 'shape' | 'chart' | 'table';

export interface ElementFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  unit: 'emu';
}

export interface AnimationEffect {
  effect_id: string;
  verified: boolean;
  trigger?: 'onClick' | 'afterPrevious' | 'withPrevious';
  delay_ms?: number;
  duration_ms?: number;
}

export interface TransitionEffect {
  effect_id: string;
  verified: boolean;
  speed?: 'fast' | 'med' | 'slow';
}

export interface ElementStyle {
  font_family?: string;
  font_size_pt?: number;
  font_color_hex?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fill_color_hex?: string;
  border_color_hex?: string;
  border_width_pt?: number;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  is_rtl?: boolean;
}

export interface SlideElement {
  id: string;
  type: ElementType;
  frame: ElementFrame;
  style: ElementStyle;
  z: number;
  content: Record<string, unknown>;
  animation?: AnimationEffect;
}

export interface Slide {
  id: string;
  order: number;
  layout_id: string;
  elements: SlideElement[];
  notes?: string;
  transition?: TransitionEffect;
  claim_ids: string[];
}

export interface PresentationSettings {
  audience: string;
  tone: string;
  detail_level: string;
}

export interface PresentationMetadata {
  id: string;
  title: string;
  language: 'ar' | 'en';
  direction: 'rtl' | 'ltr';
  aspect_ratio: '16:9' | '4:3';
  theme_id: string;
  settings: PresentationSettings;
  slides: Slide[];
  sources: Array<Record<string, unknown>>;
  claims: Array<Record<string, unknown>>;
  assets: Array<Record<string, unknown>>;
}

export interface UnifiedPresentationModel {
  schema_version: '1.0.0';
  presentation: PresentationMetadata;
}

/** Pure helper to convert pixel coordinates (96 DPI screen) to EMUs */
export function pxToEmu(px: number): number {
  return Math.round((px * EMU_PER_INCH) / 96);
}

/** Pure helper to convert EMUs to pixel coordinates (96 DPI screen) */
export function emuToPx(emu: number): number {
  return Math.round((emu * 96) / EMU_PER_INCH);
}
