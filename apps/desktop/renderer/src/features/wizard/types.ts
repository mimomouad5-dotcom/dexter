// Component: n3 معالج إنشاء العرض (Wizard & Outline Review) - Types & Schemas
import { z } from 'zod';

export type SlideLayoutType =
  | 'title'
  | 'title-content'
  | 'two-columns'
  | 'metrics'
  | 'image-text'
  | 'comparison'
  | 'quote'
  | 'conclusion';

export interface OutlineSlideItem {
  id: string;
  order: number;
  title: string;
  bullets: string[];
  suggestedLayout: SlideLayoutType;
  notes?: string;
  locked?: boolean;
}

export interface PresentationSettings {
  targetSlideCount: number;
  language: 'ar' | 'en';
  direction: 'rtl' | 'ltr';
  audience: string;
  detailLevel: 'brief' | 'medium' | 'detailed';
  tone: 'professional' | 'inspiring' | 'academic' | 'creative';
  aspectRatio: '16:9' | '4:3';
  styleThemeId: string;
  includeImages: boolean;
  includeCharts: boolean;
  enableResearch: boolean;
  offlineOnly: boolean;
  saveFolderPath: string;
}

export interface WizardProjectData {
  id: string;
  topic: string;
  inputMode: 'topic' | 'custom_outline';
  rawOutlineText?: string;
  settings: PresentationSettings;
  outlineSlides: OutlineSlideItem[];
  createdAt: string;
}

export const PresentationSettingsSchema = z.object({
  targetSlideCount: z.number().int().min(1).max(50),
  language: z.enum(['ar', 'en']),
  direction: z.enum(['rtl', 'ltr']),
  audience: z.string().min(1),
  detailLevel: z.enum(['brief', 'medium', 'detailed']),
  tone: z.enum(['professional', 'inspiring', 'academic', 'creative']),
  aspectRatio: z.enum(['16:9', '4:3']),
  styleThemeId: z.string().min(1),
  includeImages: z.boolean(),
  includeCharts: z.boolean(),
  enableResearch: z.boolean(),
  offlineOnly: z.boolean(),
  saveFolderPath: z.string().min(1),
});
