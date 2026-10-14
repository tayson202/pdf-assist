# ⚙️ الدليل الهندسي الشامل لمعمارية الباك إند وقواعد البيانات
# The Enterprise Backend Architecture & Database Engineering Blueprint

> **الهدف من هذا الملف:**
> هذا المستند هو مرجع هندسي متكامل ومستقل (Master Backend Specification). تم تصميمه ليغطي كافة جوانب الباك إند وقواعد البيانات في تطبيقات الويب الحديثة (Next.js App Router / Node.js / PostgreSQL / Supabase / RESTful APIs).
> **يمكنك إرسال هذا الملف مباشرة لأي ذكاء اصطناعي (AI) أو مهندس برمجيات ليقوم ببناء وهندسة وضبط الباك إند لأي مشروع جديد وفق أعلى معايير الجودة العالمية.**

---

## 🤖 البرومبت المخصص للذكاء الاصطناعي (Master AI Backend Prompt)
> 📋 **انسخ النص التالي وشاركه مع أي نموذج ذكاء اصطناعي (Claude / GPT / Cursor / Antigravity) لبناء وهندسة الباك إند لأي مشروع جديد:**

```markdown
You are a Principal Backend Engineer & Database Architect. 
Design, structure, and implement the backend for this application according to the "Enterprise Backend Architecture & Database Engineering Blueprint".
Specifically implement:
1. PostgreSQL Schema with UUIDv4 primary keys, auto-updating `updated_at` triggers, idempotent migrations, and strategic B-Tree / GIN indexing.
2. PostgreSQL Row-Level Security (RLS) policies for all tables with non-blocking public reads, owner-only writes, admin overrides, and protection against infinite recursion.
3. Dual-Token Authentication Lifecycle: Short-lived Access Token (15m in memory) + Long-lived Refresh Token (7d in HttpOnly, Secure, SameSite=Strict cookie with rotation).
4. Standardized Next.js App Router API response envelopes (`{ success, data, error, code, timestamp }`), strict input validation with Zod, and safe error masking (no raw SQL/stack trace leakage).
5. Sliding-window in-memory Rate Limiting on sensitive endpoints with `Retry-After` headers.
6. Scalable data patterns: Cursor-based pagination for high-volume entities, atomic counters (avoiding race conditions), and JSONB columns for flexible non-relational sub-entities.
7. Cloud storage bucket architecture with signed temporary URLs for sensitive files and pre-upload client compression.
Follow all code snippets, security rules, and architectural standards defined in the blueprint.
```

---

## 📑 فهرس المحتويات
1. [تصميم ونمذجة قواعد البيانات (PostgreSQL & Database Modeling)](#1-تصميم-ونمذجة-قواعد-البيانات-postgresql--database-modeling)
2. [سياسات أمان البيانات على مستوى الصف (Row-Level Security Architecture)](#2-سياسات-أمان-البيانات-على-مستوى-الصف-row-level-security-architecture)
3. [دورة حياة المصادقة والتوكنات المزدوجة (Dual-Token Auth Lifecycle)](#3-دورة-حياة-المصادقة-والتوكنات-المزدوجة-dual-token-auth-lifecycle)
4. [معمارية مسارات الـ API والتحقق (API Design, Validation & Envelopes)](#4-معمارية-مسارات-الـ-api-والتحقق-api-design-validation--envelopes)
5. [الأداء، التزامن، والتحجيم (Performance, Concurrency & Scaling)](#5-الأداء-التزامن-والتحجيم-performance-concurrency--scaling)
6. [إدارة وتخزين الملفات السحابية (Cloud Storage & Media Management)](#6-إدارة-وتخزين-الملفات-السحابية-cloud-storage--media-management)
7. [معالجة الـ Webhooks والعمليات غير المتزامنة (Webhooks & Idempotency)](#7-معالجة-الـ-webhooks-والعمليات-غير-المتزامنة-webhooks--idempotency)
8. [قائمة فحص جاهزية الباك إند (Backend Launch Checklist)](#8-قائمة-فحص-جاهزية-الباك-إند-backend-launch-checklist)

---

## 1. تصميم ونمذجة قواعد البيانات (PostgreSQL & Database Modeling)

### 🧱 1. المعايير الهيكلية للجداول (Table Design Standards)
- **المفاتيح الأساسية (Primary Keys):** استخدم دائماً `UUIDv4` (`gen_random_uuid()`) بدلاً من الأرقام التسلسلية (`id SERIAL`). يمنع ذلك تخمين عدد المستخدمين والبيانات في النظام (`Insecure Direct Object Reference`).
- **التحديث التلقائي للوقت (`updated_at` Trigger):** أنشئ Trigger تلقائي لتحديث وقت التعديل بدلاً من الاعتماد على إرسال التاريخ من الواجهة.
- **التشغيل غير المعطل (Idempotent Migrations):** استخدم دائماً `IF NOT EXISTS` في كل سكربتات التهيئة.

```sql
-- 1. تفعيل ملحق توليد المفاتيح العشوائية
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. دالة التحديث التلقائي لحقل updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. مثال جدول مكتمل المعايير (Profiles Table)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name_ar TEXT,
  name_en TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'moderator', 'admin', 'super-admin')),
  avatar TEXT DEFAULT '🎓',
  bio TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ربط التريجر بالجدول
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 🎯 2. متى تستخدم جداول علائقية ومتى تستخدم JSONB؟ (The JSONB Golden Rule)
- **استخدم جداول علائقية عادية (Normalized Tables):** للكيانات الأساسية في النظام، والبيانات المالية، والسجلات التي تحتاج لعمليات ربط معقدة وفهارس ثنائية صريحة.
- **استخدم حقول `JSONB`:**
  - للإعدادات المتغيرة وديناميكية الحقول (System Configs, AI Prompts).
  - للتفاعلات السريعة مثل الإعجابات ومصفوفة التعليقات الخفيفة.
  - للبيانات غير المحددة مسبقاً (Custom Form Submissions, User Metadata).

### ⚡ 3. استراتيجية الفهارس (Indexing Strategies)
لا تنشئ فهارس عشوائية تستهلك الذاكرة وتبطئ عمليات الإضافة (`INSERT`)، بل اتبع القواعد التالية:
```sql
-- أ. فهرسة الحقول شائعة البحث والتصفية (B-Tree Index)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ب. الفهارس الجزئية (Partial Indexes) لتوفير الذاكرة وتسريع الاستعلامات النشطة
CREATE INDEX IF NOT EXISTS idx_active_students ON public.profiles(id) WHERE is_active = true AND role = 'student';

-- جـ. فهرسة حقول الـ JSONB والبحث النصي (GIN Index)
CREATE INDEX IF NOT EXISTS idx_profiles_metadata_gin ON public.profiles USING GIN (metadata);
```

---

## 2. سياسات أمان البيانات على مستوى الصف (Row-Level Security Architecture)

### 🛡️ معمارية السياسات الأربع المقدسة (The 4 Sacred RLS Policies)
لكل جدول في قاعدة البيانات، يجب تفعيل الـ RLS وتطبيق القواعد التالية بدقة:

```sql
-- 1. إجبار تفعيل الحماية
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 2. سياسة القراءة العامة (Public Read - Non-Blocking)
CREATE POLICY "Public Read Access"
ON public.posts FOR SELECT
USING (is_published = true OR auth.uid() = author_id);

-- 3. سياسة الإضافة للمسجلين فقط (Authenticated Insert)
CREATE POLICY "Authenticated Users Can Insert"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- 4. سياسة التعديل للمالك فقط (Owner Update)
CREATE POLICY "Author Can Update Own Posts"
ON public.posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- 5. سياسة الإدارة العليا (Admin Override)
-- ملاحظة: تجنب التكرار اللانهائي (Infinite Recursion) بفحص الـ JWT claims أو دالة SECURITY DEFINER
CREATE POLICY "Admins Full Access"
ON public.posts FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role') IN ('admin', 'super-admin')
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super-admin')
  )
);
```

---

## 3. دورة حياة المصادقة والتوكنات المزدوجة (Dual-Token Auth Lifecycle)

### 🔄 المعمارية القياسية لتوكنات الويب الحديثة (Access + Refresh Token)
تعتمد الأنظمة عالية الأمان على توكنين:
1. **Access Token:** عمره قصير (15 دقيقة)، يحمله الكلاينت في الذاكرة المؤقتة (Memory State)، ولا يُخزن في LocalStorage.
2. **Refresh Token:** عمره طويل (7 أيام)، يُخزن في كوكي مشفرة تماماً من نوع:
   `httpOnly: true`, `secure: true`, `sameSite: 'strict'`, `path: '/'`.

#### 1. مسار تسجيل الدخول المكتمل ([app/api/auth/login/route.ts]):
```typescript
import { NextResponse } from "next/server";
import { signToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: Request) {
  // أ. فحص معدل الطلبات (Rate Limiting) لمنع هجمات التخمين
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const rate = checkRateLimit(`login-${ip}`, { limit: 5, windowSeconds: 60 });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait." },
      { status: 429, headers: { "Retry-After": `${rate.reset}` } }
    );
  }

  const { email, password } = await req.json();
  // التحقق من بيانات الدخول مع قاعدة البيانات...
  const user = { id: "user_uuid", role: "admin", email };

  // ب. إنشاء التوكنات بخوارزمية HS256
  const accessToken = await signToken({ sub: user.id, role: user.role }, "15m");
  const refreshToken = await signToken({ sub: user.id, role: user.role }, "7d");

  // جـ. حفظ Refresh Token في كوكي آمنة غير قابلة للقراءة عبر الـ JavaScript
  const cookieStore = await cookies();
  cookieStore.set("auth_refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return NextResponse.json({
    success: true,
    accessToken,
    user: { id: user.id, email: user.email, role: user.role }
  });
}
```

#### 2. مسار تجديد الجلسة الصامت ([app/api/auth/refresh/route.ts]):
عند انتهاء الـ 15 دقيقة، تطلب الواجهة تجديد الـ Access Token تلقائياً في الخلفية بدون تسجيل خروج المستخدم:
```typescript
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("auth_refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const payload = await verifyToken(refreshToken);
    const newAccessToken = await signToken({ sub: payload.sub, role: payload.role }, "15m");
    return NextResponse.json({ success: true, accessToken: newAccessToken });
  } catch {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }
}
```

---

## 4. معمارية مسارات الـ API والتحقق (API Design, Validation & Envelopes)

### 📦 1. غلاف الاستجابة الموحد (Standard API Response Envelope)
تجنب إرجاع كائنات عشوائية أو مصفوفات مجردة. يجب أن تكون كل استجابات الـ API بهيكل ثابت:
```typescript
// types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status });
}

export function apiError(message: string, status = 400, code = "BAD_REQUEST"): Response {
  return Response.json({
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString()
  }, { status });
}
```

### 🔍 2. التحقق الصارم من المدخلات (Zod Input Validation)
لا تثق أبداً بأي بيانات قادمة من العميل:
```typescript
import { z } from "zod";

const CreatePostSchema = z.object({
  title: z.string().min(5, "Title too short").max(120, "Title too long"),
  content: z.string().min(10, "Content too short"),
  category: z.enum(["academic", "career", "tech", "general"]),
  tags: z.array(z.string()).max(5).optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = CreatePostSchema.parse(body);
    // تنفيذ العملية بالبيانات الموثوقة والمفحوصة
    return apiSuccess({ postId: "new_id" }, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError(err.errors[0].message, 422, "VALIDATION_FAILED");
    }
    return apiError("Internal server error", 500, "SERVER_ERROR");
  }
}
```

---

## 5. الأداء، التزامن، والتحجيم (Performance, Concurrency & Scaling)

### 🏎️ 1. استراتيجية التصفح المعتمد على المؤشر (Cursor-Based Pagination)
في الأنظمة الكبيرة، تصفح `OFFSET & LIMIT` يصبح بطيئاً جداً ويسقط الصفحات عند إضافة بيانات جديدة أثناء التصفح.
- **الحل:** استخدم Cursor-Based Pagination بالاعتماد على تاريخ الإنشاء والمعرف:
```sql
-- تصفح سريع وذو أداء ثابت O(1) مهما كبر حجم الجدول
SELECT * FROM public.posts
WHERE (created_at, id) < ($last_seen_created_at, $last_seen_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

### 🔒 2. معالجة التنافس والعمليات الذرية (Atomic Counters & Concurrency)
لمنع أخطاء التزامن (Race Conditions) عند قيام عدة مستخدمين بالضغط على الإعجاب أو حجز المقاعد في نفس اللحظة:
- **تجنب القراءة ثم الحفظ من الواجهة (`likes = likes + 1`):**
- **استخدم دالة ذرية على قاعدة البيانات مباشرة (Atomic Increment):**
```sql
CREATE OR REPLACE FUNCTION increment_post_likes(target_post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = likes_count + 1
  WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. إدارة وتخزين الملفات السحابية (Cloud Storage & Media Management)

### 🗄️ 1. نمط المستودع الخاص والمحمي (Private Buckets & Signed URLs)
- للملفات الحساسة (الشهادات، بطاقات الهوية، التقارير الأكاديمية):
  1. اجعل الـ Bucket خاصاً (`public = false`).
  2. لا ترسل الرابط المباشر للعميل.
  3. قم بتوليد رابط موقع مؤقت (Signed URL) ينتهي خلال 10 إلى 30 دقيقة:
```typescript
const { data, error } = await supabaseAdmin.storage
  .from("private-docs")
  .createSignedUrl(`user_${userId}/certificate.pdf`, 60 * 15); // متاح 15 دقيقة فقط
```

---

## 7. معالجة الـ Webhooks والعمليات غير المتزامنة (Webhooks & Idempotency)

### 🔁 منع تكرار العمليات (Idempotent Webhook Processing)
عند استقبال Webhook من بوابات الدفع (Stripe / Paymob) أو أحداث التحديث:
1. **تحقق من التوقيع السري للطلب (Signature Verification)**.
2. **سجل معرف الحدث لمنع التكرار (Idempotency Key)**:
```sql
CREATE TABLE IF NOT EXISTS public.processed_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
3. عند وصول أي حدث، إذا وجد في جدول `processed_events`، أرجع رد `200 OK` فوراً دون تكرار العملية المالية أو التحديث.

---

## 8. قائمة فحص جاهزية الباك إند (Backend Launch Checklist)

قبل إطلاق أي نظام أو ربطه بالإنتاج:

- [ ] **1. قواعد البيانات:**
  - كل جدول يمتلك `id UUID DEFAULT gen_random_uuid()`.
  - كل جدول يمتلك `created_at` و `updated_at` مع التريجر التلقائي.
  - فهارس B-Tree على كل المفاتيح الخارجية وحقول التصفية المتكررة.
- [ ] **2. الأمان والصلاحيات (RLS):**
  - تفعيل `ENABLE ROW LEVEL SECURITY` على كل جدول.
  - التحقق من عدم وجود حلقة تكرار لانهائية في سياسات المستخدمين.
- [ ] **3. الـ API والمصادقة:**
  - فحص وجود ترويسة `Authorization: Bearer` في المسارات المحمية.
  - إرجاع استجابات موحدة بهيكل `{ success, data, error, timestamp }`.
  - التحقق من المدخلات بـ Zod لمنع إدخال نصوص خبيثة أو حقول غير مصرح بها.
- [ ] **4. محدد النبضات (Rate Limiter):**
  - حماية مسارات تسجيل الدخول، إنشاء الحساب، والـ Webhooks من الـ DoS.
- [ ] **5. معالجة الأخطاء:**
  - عدم تسريب تفاصيل الخطأ الداخلي للخادم أو استعلامات SQL الصريحة للعميل.

---

> 🏆 **هذا الدليل يمثل المعيار الاحترافي الأعلى لبناء وصيانة أي نظام باك إند حديث، آمن، وقابل للتحجيم لملايين المستخدمين.**
