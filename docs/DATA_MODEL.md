# وثيقة نموذج البيانات الموحد (Data Model Specification) — Dexter Presentation Studio

> **المكوّن المحوري:** `n23 نموذج العرض الموحد (Slides/Elements/Notes)`  
> **الإصدار الحالي:** `schema_version: "1.0.0"`  
> **الوحدات المعتمدة:** وحدات القياس الإنجليزية المترية (EMU - English Metric Units: `914,400 EMU = 1 Inch`) لضمان التطابق البصري التام بين واجهة الكانفاس التفاعلية وملفات PowerPoint OpenXML الناتجة.

---

## 1. فلسفة النموذج الموحد (Single Source of Truth)
نموذج `n23` هو المصدر الوحيد والنهائي للحقيقة في النظام:
1. **المعاينة والتحرير (`n4`/`n5`):** تقرأ النموذج بوحدات EMU وتحوله إلى بكسل للعرض على الكانفاس، وتُرجع التعديلات كتحويلات نقية (Pure Transforms) للنموذج لدعم Undo/Redo بنمط Command.
2. **التصميم (`n24`):** يقرأ النموذج ويكتب خصائص التخطيط والتنسيق دون أن يحذف أي عنصر محتوى.
3. **التصدير (`n27`):** يقرأ النموذج ويكتب شرائح PowerPoint الأصلية، وأشكالها، وصورها، ورسومها البيانية.
4. **الحفظ (`n41`):** يُخزَّن بصيغة JSON داخل مجلد المشروع `<name>.dexter/project.json`.

---

## 2. هيكل البيانات الرئيسي (Schema Structure)

```json
{
  "schema_version": "1.0.0",
  "presentation": {
    "id": "uuid-v4",
    "title": "عنوان العرض التقديمي",
    "language": "ar",
    "direction": "rtl",
    "aspect_ratio": "16:9",
    "theme_id": "modern-emerald",
    "settings": {
      "audience": "تنفيذي ومستثمرون",
      "tone": "professional",
      "detail_level": "medium"
    },
    "slides": [
      {
        "id": "uuid-v4",
        "order": 1,
        "layout_id": "title-content",
        "elements": [
          {
            "id": "uuid-v4",
            "type": "text",
            "frame": {
              "x": 914400,
              "y": 1371600,
              "w": 10375600,
              "h": 1828800,
              "unit": "emu"
            },
            "style": {
              "font_family": "Cairo",
              "font_size_pt": 32.0,
              "font_color_hex": "#0F172A",
              "bold": true,
              "alignment": "right",
              "is_rtl": true
            },
            "z": 1,
            "content": {
              "text": "عنوان الشريحة الرئيسي"
            },
            "animation": {
              "effect_id": "appear",
              "verified": true,
              "trigger": "onClick"
            }
          }
        ],
        "notes": "ملاحظات المتحدث للشريحة الأولى",
        "transition": {
          "effect_id": "fade",
          "verified": true,
          "speed": "med"
        },
        "claim_ids": []
      }
    ],
    "sources": [],
    "claims": [],
    "assets": []
  }
}
```

---

## 3. تفاصيل الكيانات والأنواع

### 3.1 العنصر (SlideElement)
- `id`: معرّف فريد UUID.
- `type`: نوع العنصر:
  - `text`: نصوص وعناوين وفقرات.
  - `image`: صور مدمجة مع مسار محلي وبيانات ترخيص.
  - `shape`: أشكال هندسية (مستطيل، مستطيل مستدير، بيضاوي...).
  - `chart`: رسم بياني أصلي تفاعلي (أعمدة، خطي، شريطي، دائري).
  - `table`: جدول بيانات منظم بخلايا قابلة للتعديل.
- `frame`: إحداثيات المستطيل المحيط بوحدة EMU (`x`, `y`, `w`, `h`).
- `style`: الخط، الحجم، اللون، التعبئة، الحدود، المحاذاة، واتجاه النص العربي.
- `z`: الترتيب الطبقي للعمق.
- `animation`: الحركة المعتمدة (يجب أن تحمل `verified: true`).

### 3.2 الشريحة (Slide)
- `order`: الترتيب التسلسلي في العرض (1 إلى N).
- `layout_id`: معرّف التخطيط الهندسي المطبق من `n24`.
- `elements`: قائمة العناصر التابعة للشريحة.
- `notes`: نص ملاحظات المتحدث (Speaker notes).
- `transition`: تأثير الانتقال بين الشرائح (`verified: true`).
- `claim_ids`: قائمة معرّفات الادعاءات المرتبطة بهذه الشريحة في سجل الأدلة `n21`.

---

## 4. نظام ترحيل الإصدارات (Schema Version Migrations)
عند قراءة مشروع بإصدار قديم (مثل `0.9.0`)، يقوم محرك الترحيل في `services/engine/dexter_engine/model/migration.py` بترقية الكائن تلقائياً:
- حقن الاتجاه الافتراضي `direction` بحسب لغة العرض.
- ضبط وحدة القياس `unit: "emu"` لجميع إطارات العناصر.
- تهيئة القوائم الفارغة للمصادر والادعاءات والأصول.
- تحديث رقم الإصدار إلى `1.0.0` وحفظه ذرياً.
