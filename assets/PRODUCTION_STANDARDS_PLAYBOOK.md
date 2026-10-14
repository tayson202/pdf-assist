# 🚀 دليل المعايير الهندسية والتصميمية لتطوير تطبيقات الويب الاحترافية
# The Enterprise Web Architecture & UI/UX Playbook

> **الهدف من هذا الملف:**
> هذا المستند هو مرجع هندسي وتصميمي شامل ومستقل (Master Blueprint). تم استخلاص كل قاعدة وحل برمجي فيه من التجارب الواقعية والمشاكل الدقيقة وحلولها المتقدمة.
> **يمكنك نسخ هذا الملف واستخدامه في أي مشروع ويب جديد (React / Next.js / Tailwind CSS) لتضمن وصوله لنفس مستوى الكفاءة، الجمالية، والأداء المؤسسي الفائق.**

---

## 📑 فهرس المحتويات (Table of Contents)
1. [نظام التصميم والألوان (Design System & Color Tokens)](#1-نظام-التصميم-والألوان-design-system--color-tokens)
2. [هندسة الواجهات وتجربة المستخدم (UI/UX Engineering)](#2-هندسة-الواجهات-وتجربة-المستخدم-uiux-engineering)
3. [الموبايل والتصميم التجاوبي (Mobile-First Architecture)](#3-الموبايل-والتصميم-التجاوبي-mobile-first-architecture)
4. [مكونات تفاعلية متقدمة جاهزة (Advanced Interactive Components)](#4-مكونات-تفاعلية-متقدمة-جاهزة-advanced-interactive-components)
5. [الأداء وهندسة البناء (Performance & Next.js Build Optimizations)](#5-الأداء-وهندسة-البناء-performance--nextjs-build-optimizations)
6. [قواعد السيو وإمكانية الوصول (SEO & Accessibility Architecture)](#6-قواعد-السيو-وإمكانية-الوصول-seo--accessibility-architecture)
7. [معمارية تدفق البيانات والمزامنة السحابية (Cloud Sync & State Flow)](#7-معمارية-تدفق-البيانات-والمزامنة-السحابية-cloud-sync--state-flow)
8. [قائمة فحص بدء أي مشروع جديد (New Project Launch Checklist)](#8-قائمة-فحص-بدء-أي-مشروع-جديد-new-project-launch-checklist)

---

## 1. نظام التصميم والألوان (Design System & Color Tokens)

### 🎨 فلسفة الألوان الاحترافية (Professional Palette Rules)
تجنب دائماً الألوان البدائية الصريحة (مثل الأحمر 100% أو الأزرق البحت). السر في المظهر الفاخر هو استخدام **درجات Slate/Zinc الطبيعية** مع ألوان دلالية هادئة ذات تباين عالي:

```css
/* Color Philosophy & Tokens */
:root {
  /* الوضع الفاتح (Light Mode) */
  --bg-main: #f8fafc;          /* خلفية ناعمة ومريحة للعين */
  --surface-card: #ffffff;      /* بطاقات بيضاء نقية */
  --border-subtle: #e2e8f0;     /* حدود ناعمة جداً */
  --text-primary: #0f172a;      /* نصوص داكنة عالية الوضوح */
  --text-secondary: #64748b;    /* نصوص فرعية هادئة */
  
  /* ألوان التمييز (Accent Tokens) */
  --brand-primary: #0284c7;     /* Sky 600 - للأزرار والروابط */
  --brand-success: #10b981;     /* Emerald 500 - للنجاح والتفعيل */
  --brand-warning: #f59e0b;     /* Amber 500 - للتنبيهات والتقييمات */
  --brand-danger: #ef4444;      /* Rose/Red 500 - للحذف والأخطاء */
}

.dark {
  /* الوضع الداكن الفاخر (Deep Dark Mode) */
  --bg-main: #09090b;          /* Zinc 950 - أسود عميق وليس رمادي باهت */
  --surface-card: #18181b;      /* Zinc 900 - بطاقات بارزة بنعومة */
  --border-subtle: #27272a;     /* Zinc 800 - حدود خافتة أنيقة */
  --text-primary: #f8fafc;      /* نصوص بيضاء نقية */
  --text-secondary: #a1a1aa;    /* نصوص فرعية مقروءة */
}
```

### 💎 معايير الزجاج البلوري (Glassmorphism Standards)
لإعطاء إحساس بالحداثة في الهيدر والبطاقات والنوافذ المنبثقة:
- **في الوضع الفاتح:** `bg-white/80 backdrop-blur-md border border-zinc-200/80 shadow-sm`
- **في الوضع الداكن:** `bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 shadow-2xl`
- **القاعدة الذهبية:** لا تضع `backdrop-blur` بمفردها أبداً؛ يجب دائماً دمجها مع شفافية لونية خفيفة (`bg-*/80`) وحدود خافتة (`border-*/50`) لمنع اختلاط المحتوى الخلفي.

---

## 2. هندسة الواجهات وتجربة المستخدم (UI/UX Engineering)

### 🌟 توحيد شكل وحاويات الأيقونات (The Icon Badge Formula)
تجنب وضع الأيقونات حافية بجانب النصوص. استخدم قاعدة "حاوية الأيقونة" الموحدة:
```tsx
// نمط الحاوية الموحدة لأي أيقونة رئيسية في الموقع
<div className="h-9 w-9 rounded-xl bg-sky-500/10 dark:bg-sky-400/15 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
  <Icon className="h-4.5 w-4.5" />
</div>
```
- **المقاسات الموصى بها:** `h-8 w-8` للأماكن المدمجة، و`h-10 w-10` للبطاقات البارزة، وحجم الأيقونة الداخلية دائماً نصف حجم الحاوية تقريباً.
- **التفاعل الحركي (Micro-Interactions):** أضف دائماً `transition-all duration-200 active:scale-95 cursor-pointer` لأي عنصر قابل للنقر لإعطاء شعور بالتجاوب اللمسي (Tactile Feedback).

### 🌐 المعمارية ثنائية اللغة (Bilingual RTL / LTR Architecture)
- استخدم دائماً `dir={dir}` في جذر الصفحة والمودالز.
- تجنب تماماً استخدام `mr-*` أو `ml-*` بشكل ثابت؛ اعتمد على:
  - `ms-*` (Margin Start) و `me-*` (Margin End).
  - الفليكس مع التباعد: `flex items-center gap-2.5` (يعمل تلقائياً في الاتجاهين بنفس الدقة).
  - الأيقونات الاتجاهية: اجعل السهم يتغير حسب اللغة:
    ```tsx
    const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;
    ```

---

## 3. الموبايل والتصميم التجاوبي (Mobile-First Architecture)

### 📐 معمارية "الثلاثي المحكم" في شاشات الموبايل (The Mobile Trio Layout)
لكي لا تتداخل عناصر الموبايل ببعضها، اعتمد هذا الترتيب الدقيق للطبقات (`z-index`):

| العنصر (Component) | موضع التثبيت | طبقة العرض (Z-Index) | الوظيفة والسلوك |
| :--- | :--- | :--- | :--- |
| **Mobile Header** | `sticky top-0` | `z-50` | هيدر خفيف يضم اللوجو، زر السايدبار، زر اللغة والمظهر. |
| **Mobile Taskbar** | `fixed bottom-0` | `z-40` | شريط سفلي سريع مع مسافة حماية للأجهزة الحديثة (`pb-safe`). |
| **Sidebar Drawer** | `fixed inset-y-0` | `z-[60]` | السايدبار يفتح **فوق** الهيدر مع خلفية تعتيم `z-[55]`. |
| **Modals / Dialogs** | `fixed inset-0` | `z-[99999]` عبر **Portal** | النوافذ تفتح في جذر الصفحة لتعلو كل شيء. |

### ⚠️ فخ طبقات الحركة في CSS وحله الحاسم (The Stacking Context Trap)
> **المشكلة الشائعة:** عند وضع نافذة منبثقة (`position: fixed`) داخل صفحة تحتوي على حركة Framer Motion (`<motion.div>` أو `transform: translate`)، تصبح النافذة محصورة داخل حاوية الصفحة بدلاً من الشاشة الكاملة، مما يؤدي لنزولها لأسفل وغرقها خلف الـ Taskbar!
>
> **الحل الإلزامي:** **استخدم دائماً `React Portal`** في كل المودالز:

```tsx
import { createPortal } from "react-dom";

export function CustomModal({ isOpen, onClose, children }: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true); // حماية من أخطاء الـ SSR والـ Hydration
  }, []);

  // قفل التمرير الخلفي أثناء فتح المودال
  React.useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const modalJSX = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[92vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );

  // الخروج إلى جذر المستند مباشرة
  return createPortal(modalJSX, document.body);
}
```

---

## 4. مكونات تفاعلية متقدمة جاهزة (Advanced Interactive Components)

### 📸 1. محرك قص وتكبير وتدوير الصور (Zero-Dependency Canvas Cropper)
بدلاً من تثبيت مكتبات خارجية قد تتعارض مع React 19 أو Next.js 16، تم بناء محرك متكامل يعتمد على HTML5 Canvas مع الميزات التالية:
- **دعم السحب والتحريك (Pan & Drag)** بالماوس واللمس.
- **التكبير والتصغير المتعدد (Pinch-to-Zoom & Wheel Zoom)**.
- **التدوير 90 درجة (90° Step Rotation)**.
- **قناع تعتيم دائري مع خطوط أثلاثية إرشادية (Rule of Thirds SVG Mask)**.
- **معاينة حية فورية بمعدل 60 إطار/ثانية (Live Mini Preview)**.
- **استخراج بدقة فائقة Retina مع ضغط الذاكرة**.

#### معادلة التحويل والحساب الدقيق للـ Canvas (Canvas Mathematical Proof):
```typescript
// مقاس الإخراج المطلوب في قاعدة البيانات
const outputSize = 400; // 400x400 Retina crisp square
const scaleRatio = outputSize / cropDiameter;

// 1. الانتقال إلى منتصف الكانفاس
ctx.translate(outputSize / 2, outputSize / 2);

// 2. تحريك الإزاحة بناءً على سحب المستخدم
ctx.translate(pan.x * scaleRatio, pan.y * scaleRatio);

// 3. التدوير حول نفس نقطة المركز
ctx.rotate((rotation * Math.PI) / 180);

// 4. تطبيق التكبير
const drawScale = baseScale * zoom * scaleRatio;
ctx.scale(drawScale, drawScale);

// 5. رسم الصورة في المنتصف
ctx.drawImage(img, -naturalWidth / 2, -naturalHeight / 2, naturalWidth, naturalHeight);

// 6. استخراج بصيغة JPEG مضغوطة عالية الجودة (~40-60KB)
const base64 = canvas.toDataURL("image/jpeg", 0.88);
```

### 🔒 2. عارض الصور السينمائي المحمي (Privacy-Protected Lightbox)
لعرض صور المستخدمين بحجم كامل مع حماية خصوصيتهم:
- تعطيل القائمة المنسدلة: `onContextMenu={(e) => e.preventDefault()}` لمنع حفظ الصورة بالزر الأيمن.
- تعطيل السحب: `draggable={false}` و `pointer-events-none` على عنصر الصورة لمنع سحبها للمتصفح.
- إغلاق سلس بالضغط على زر `Esc` أو الضغط على الخلفية.

---

## 5. الأداء وهندسة البناء (Performance & Next.js Build Optimizations)

### ⚙️ 1. حل مشكلة توقف تنزيل الخطوط في Turbopack (Font Timeout Fix)
في Next.js 16، قد يفشل الـ Build أثناء تنزيل خطوط Google Font عبر Turbopack بسبب مهلة الشبكة.
- **الحل:** تحديث سكريبت الـ Build في `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build --webpack",
    "start": "next start"
  }
}
```

### 🚫 2. قاعدة صادمة في Next.js App Router (Named Exports Restriction)
في ملفات `page.tsx` داخل مجلد `app/`:
- **ممنوع تماماً تصدير أي كائنات أو ثوابت فرعية:**
  ```tsx
  // ❌ خطأ يتسبب في فشل Next.js Build فورا:
  export const MY_DATA = [...];
  export interface MyProps { ... }
  export default function Page() { ... }
  ```
- **الحل الصحيح:**
  - إما إزالة كلمة `export` وتركها خاصة بالملف.
  - أو نقل الثوابت والأنواع إلى ملف منفصل داخل `lib/` أو `types/`.

### 🛡️ 3. حماية الـ Build من غياب المتغيرات البيئية (CI/Build Phase Secrets Guard)
أثناء قيام Next.js بجمع بيانات الصفحات الثابتة (Static Page Data Collection)، لا تكون المتغيرات البيئية مثل `JWT_SECRET` متاحة دائماً في بيئة الـ CI، مما يتسبب في توقف الـ Build بخطأ قاتل.
- **الحل:** وضع فحص ذكي لمرحلة الـ Build:
```typescript
// lib/jwt.ts
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NODE_ENV === "test" ||
  process.env.npm_lifecycle_event === "build";

if (!process.env.JWT_SECRET && !isBuildPhase) {
  throw new Error("FATAL: JWT_SECRET environment variable is missing!");
}
```

### 🗜️ 4. ضغط الصور الفوري على المتصفح (Client-Side Canvas Compression)
لا تقم برفع صور المستخدمين الأصلية ذات الأحجام الضخمة (5MB-15MB) إلى قاعدة البيانات مباشرة. قم بضغطها عبر Canvas أولاً لتصبح أقل من 100KB:
```typescript
const canvas = document.createElement("canvas");
const MAX_DIM = 400; // مقاس كافٍ تماماً للأفاتار والبطاقات
// حساب النسبة وضغط الصورة
const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
```

---

## 6. قواعد السيو وإمكانية الوصول (SEO & Accessibility Architecture)

### 🏷️ 1. هيكل الميتا الديناميكي (Dynamic Metadata)
في كل صفحة أو في `layout.tsx` الأساسي:
```typescript
export const metadata: Metadata = {
  title: {
    template: "%s | اسم المنصة",
    default: "اسم المنصة - الوصف الأساسي"
  },
  description: "وصف تسويقي دقيق ومختصر يتراوح بين 140 إلى 160 حرفاً.",
  openGraph: {
    title: "اسم المنصة",
    description: "وصف منصتك لمشاركتها على السوشيال ميديا",
    url: "https://yourdomain.com",
    siteName: "اسم المنصة",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    locale: "ar_EG",
    type: "website"
  }
};
```

### ♿ 2. المعايير الدلالية وإمكانية الوصول (Semantic HTML & A11y)
- عنوان رئيسي واحد فقط `<h1>` في الصفحة.
- استخدام وسوم HTML5 الدلالية: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`.
- إضافة `aria-label` و `title` لأي زر يحتوي على أيقونة فقط بدون نص.
- إضافة `tabIndex={0}` و `onKeyDown` لأي عنصر `div` تفاعلي لتمكين التصفح عبر لوحة المفاتيح.

---

## 7. معمارية تدفق البيانات والمزامنة السحابية (Cloud Sync & State Flow)

### ☁️ معضلة التعديلات واختفاء البيانات (The Cloud Override Trap & Fix)
> **المشكلة الشائعة:** عندما يقوم الأدمن بتعديل إعدادات في الموقع، ثم يقوم المطور برفع كود جديد أو فتح متصفح جديد، تعود البيانات للقيم الافتراضية المكتوبة في الكود (Hardcoded Defaults)!
>
> **السبب:** كان الكود يفحص `localStorage` أولاً، فإذا وجدها فارغة يضع القيم الافتراضية، أو كان التطبيق لا ينتظر جلب البيانات الحقيقية من السحابة (Supabase) قبل إقرار الحالة.

#### النمط الهندسي الصحيح (Cloud-First Hydration with Resilient Fallback):
1. **أولوية القراءة من السحابة أولاً (Cloud First):**
   ```typescript
   // 1. ابدأ بتحميل البيانات من Supabase
   const { data, error } = await supabase.from("settings").select("*");
   if (data && data.length > 0) {
     // اعتمد بيانات السحابة فوراً وحدث الـ State والـ LocalStorage بها
     setSettings(data[0].value);
     localStorage.setItem("app_settings", JSON.stringify(data[0].value));
   } else {
     // إذا لم توجد بيانات سحابية فقط، اعتمد القيم الافتراضية
     setSettings(DEFAULT_SETTINGS);
   }
   ```
2. **استخدام حقول JSONB للمرونة القصوى:**
   بدلاً من إنشاء 10 جداول متفرقة للتعليقات والإعجابات والإعدادات المعقدة، استخدم نوع `JSONB` في PostgreSQL لتخزين وتحديث البيانات المتشعبة بكفاءة دون الحاجة لعمليات Join معقدة.
3. **سياسات الأمان RLS الآمنة وغير المعطلة:**
   تأكد من وجود سياسات تسمح للجميع بالقراءة (`SELECT USING (true)`) بينما تقصر الإضافة والتعديل والحذف على المستخدمين المصرح لهم فقط (`TO authenticated`).

---

## 8. قائمة فحص بدء أي مشروع جديد (New Project Launch Checklist)

عندما تبدأ أي مشروع ويب جديد في المستقبل، طبق هذه القائمة بالترتيب:

- [ ] **الخطوة 1: تهيئة سكريبت البناء**
  - عدل `package.json` ليستخدم `"build": "next build --webpack"`.
- [ ] **الخطوة 2: تهيئة نظام الألوان والـ Dark Mode**
  - اضبط خلفيات عميقة (`bg-zinc-950`) وبطاقات زجاجية (`backdrop-blur-md`).
- [ ] **الخطوة 3: معمارية الموبايل الثلاثية**
  - هيدر `z-50`، سايدبار منزلق `z-[60]`، شريط سفلي `z-40`.
- [ ] **الخطوة 4: حماية المودالز عبر Portal**
  - تأكد أن جميع النوافذ المنبثقة تستخدم `createPortal(..., document.body)`.
- [ ] **الخطوة 5: حماية السيرفر والـ Build**
  - لا تصدر ثوابت من ملفات `page.tsx`.
  - احمِ أسرار الـ JWT والـ API من مرحلة الـ Build الثابت.
- [ ] **الخطوة 6: حماية بيانات المستخدمين والسحابة**
  - اضبط التحميل ليكون السحابي هو الأساس لمنع استعادة القيم الافتراضية عند تحديث الكود.
- [ ] **الخطوة 7: خصوصية وأداء الوسائط**
  - قص وضغط الصور على الكلاينت قبل الإرسال لمنع استهلاك مساحة السيرفر.

---

> 🏆 **تم إعداد هذا المستند ليكون مرجعك الدائم لكل مشروع ناجح وذو جودة عالمية.**
