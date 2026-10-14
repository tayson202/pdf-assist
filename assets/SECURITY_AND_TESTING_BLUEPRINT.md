# 🛡️ الدليل الهندسي الشامل للأمان، الحماية، ومنظومة الاختبارات
# The Enterprise Security, Authentication & Automated Testing Blueprint

> **الهدف من هذا الملف:**
> هذا المستند هو مرجع أمني واختباري متكامل (Production-Grade Security & QA Standards). تم استخلاصه وتدقيقه من الاختبارات الواقعية، وسيناريوهات الاختراق، وحلول الحماية الدقيقة في تطبيقات الويب الحديثة (Next.js / React / Supabase / TypeScript).
> **يمكنك إرسال هذا الملف مباشرة لأي ذكاء اصطناعي (AI) أو مطور، ليقوم بتطبيق نفس منظومة الأمان، التحقق من الصلاحيات، وحزم الاختبارات الآلية على أي مشروع جديد فوراً.**

---

## 🤖 البرومبت المخصص للذكاء الاصطناعي (Master AI Prompt)
> 📋 **انسخ النص التالي وشاركه مع أي نموذج ذكاء اصطناعي (Claude / GPT / Cursor / Antigravity) لتطبيق معايير هذا الملف على أي مشروع جديد:**

```markdown
You are a Principal Security Engineer & Full-Stack QA Architect. 
Analyze, harden, and set up automated security and testing for this codebase according to the "Enterprise Security & Testing Blueprint".
Specifically implement:
1. Modern JWT Authentication using `jose` with strict HS256 enforcement and build-phase environment variable guards.
2. Multi-tier Role-Based Access Control (RBAC) on both client routes and server-side API endpoints with role-escalation protection (stripping privileged fields from client payloads).
3. Sliding-window in-memory rate limiting on sensitive routes (auth, password reset, proxies, admin actions).
4. Comprehensive Server-Side Request Forgery (SSRF) defense on any proxy routes, blocking private IP ranges, loopback, and Cloud Metadata IPs (169.254.169.254).
5. Enterprise HTTP security headers in next.config.ts (CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff).
6. Non-recursive PostgreSQL Row-Level Security (RLS) policies for Supabase tables.
7. Automated security test suite (`__tests__/security-audit.test.ts`) covering static analysis, rate-limit flooding, unauthenticated endpoint rejection, and concurrency safety.
Follow the exact architectural patterns, code snippets, and failure guards defined in the blueprint.
```

---

## 📑 فهرس المحتويات
1. [معمارية المصادقة وحماية التوكنات (JWT & Session Security)](#1-معمارية-المصادقة-وحماية-التوكنات-jwt--session-security)
2. [التحكم في الصلاحيات ومنع الاختراق (RBAC & Escalation Protection)](#2-التحكم-في-الصلاحيات-ومنع-الاختراق-rbac--escalation-protection)
3. [أمان السيرفر والشبكة والـ SSRF (Server, Rate Limiting & Proxy Security)](#3-أمان-السيرفر-والشبكة-والـ-ssrf-server-rate-limiting--proxy-security)
4. [ترويسات الأمان الصارمة (HTTP Security Headers & CSP)](#4-ترويسات-الأمان-الصارمة-http-security-headers--csp)
5. [أمان قواعد البيانات وسياسات RLS (Supabase & Database Hardening)](#5-أمان-قواعد-البيانات-وسياسات-rls-supabase--database-hardening)
6. [حزمة الاختبارات الآلية الشاملة (Automated Testing Framework)](#6-حزمة-الاختبارات-الآلية-الشاملة-automated-testing-framework)
7. [قائمة الفحص الأمني السريعة (Pre-Production Security Checklist)](#7-قائمة-الفحص-الأمني-السريعة-pre-production-security-checklist)

---

## 1. معمارية المصادقة وحماية التوكنات (JWT & Session Security)

### 🔑 معايير استخدام مكتبة `jose` الصارمة
تجنب المكتبات القديمة مثل `jsonwebtoken` التي تعتمد على خوارزميات Node.js القديمة وتسبب مشاكل في Edge Runtime. استخدم `jose` مع الالتزام بالقواعد التالية:

#### كود معتمد لحماية التوكنات ([lib/jwt.ts]):
```typescript
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// 1. حماية مرحلة البناء (Build Phase Guard) لمنع فشل الـ CI/CD عند غياب المتغيرات السرية
const isBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.npm_lifecycle_event === 'build';

const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production' && !isBuildPhase
    ? (() => { throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start in production.'); })()
    : 'super-secret-development-key-change-me'
);

const secretKey = new TextEncoder().encode(JWT_SECRET as string);

export interface CustomJWTPayload extends JWTPayload {
  sub: string; // معرف المستخدم (User ID)
  role: string; // الصلاحية
}

/**
 * توقيع التوكن بخوارزمية HS256 الصارمة
 */
export async function signToken(payload: { sub: string; role: string }, expiresIn: string = '7d'): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * التحقق من التوكن مع منع هجمات تبديل الخوارزمية (Algorithm Confusion Attacks)
 * عبر إجبار الخادم على قبول 'HS256' حصراً ورفض خوارزمية 'none' تلقائياً.
 */
export async function verifyToken(token: string): Promise<CustomJWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'], // قبول HS256 فقط
    });
    return payload as CustomJWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

### 🚫 القواعد الذهبية لحماية الجلسة:
1. **كلمات المرور لا تُخزن محلياً أبداً:** ممنوع تماماً حفظ كلمات المرور المشفرة أو غير المشفرة في `localStorage` أو `sessionStorage`.
2. **حظر كلمة المرور من تحديث البيانات:** عند استدعاء دالة تحديث الملف الشخصي `updateProfile` من الواجهة، تأكد من تجريد أي حقل يحمل اسم `password`.
3. **التأكد من انتهاء صلاحية التوكن (Token Expiration):** توكنات الوصول القصيرة (Access Tokens) من 15 إلى 60 دقيقة، وتوكنات التجديد (Refresh Tokens) مع تخزين آمن ومحمي في الكوكيز من نوع `httpOnly, secure, sameSite="lax"`.

---

## 2. التحكم في الصلاحيات ومنع الاختراق (RBAC & Escalation Protection)

### 🛡️ 1. منع هجوم تصعيد الصلاحيات (Role Escalation Protection)
أحد أخطر الثغرات الشائعة هي قيام المستخدم بتعديل بياناته في المتصفح وإرسال حقل `role: "admin"` مع الـ Payload لتغيير رتبته.
- **الحل الإلزامي على الكلاينت والسيرفر:**
```typescript
// في دالة updateProfile:
const sanitizePayload = (input: Partial<UserProfile>) => {
  const { role, id, ...allowedFields } = input as any; // حذف role و id نهائياً
  return allowedFields;
};
```

### 🚪 2. حماية مسارات الواجهة (Client-Side Protected Routes)
```tsx
// components/admin-protected-route.tsx
export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login?redirect=/admin");
      } else if (!["admin", "super-admin", "moderator"].includes(user.role)) {
        router.push("/dashboard"); // إعادة توجيه غير المصرح لهم فوراً
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <LoadingSpinner />;
  return <>{children}</>;
}
```

### 🔒 3. حماية الـ API Endpoints الصارمة (Server-Side Route Guard)
لا تعتمد أبداً على حماية الواجهة فقط. كل طلب API يجب أن يفحص التوكن والصلاحية من قاعدة البيانات مباشرة:
```typescript
// app/api/admin/delete-user/route.ts
export async function POST(req: Request) {
  // 1. فحص وجود الترويسة Authorization
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized: Token required" }, { status: 401 });
  }

  // 2. التحقق من التوكن مع الخادم
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
  }

  // 3. التحقق من صلاحية المستخدم الحقيقية من قاعدة البيانات
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super-admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  // تنفيذ الإجراء الآمن هنا
}
```

---

## 3. أمان السيرفر والشبكة والـ SSRF (Server, Rate Limiting & Proxy Security)

### ⏱️ 1. محدد معدل الطلبات (In-Memory Sliding-Window Rate Limiter)
لحماية مسارات تسجيل الدخول، استعادة كلمة المرور، وطلبات الـ API من هجمات التخمين والـ Brute-Force والـ DoS:

```typescript
// lib/rate-limiter.ts
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// تنظيف الذاكرة تلقائياً كل 5 دقائق لمنع تسريب الذاكرة (Memory Leaks)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function checkRateLimit(
  identifier: string,
  options = { limit: 10, windowSeconds: 60 }
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const existing = rateLimitStore.get(identifier);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, limit: options.limit, remaining: options.limit - 1, reset: Math.ceil((now + windowMs) / 1000) };
  }

  if (existing.count >= options.limit) {
    return { success: false, limit: options.limit, remaining: 0, reset: Math.ceil(existing.resetAt / 1000) };
  }

  existing.count++;
  return { success: true, limit: options.limit, remaining: options.limit - existing.count, reset: Math.ceil(existing.resetAt / 1000) };
}
```

### 🛑 2. حماية الـ SSRF الشاملة للبروكسي والروابط الخارجية
إذا كان موقعك يحتوي على مسار Proxy لجلب بيانات من روابط يحددها المستخدم، يجب حمايته بالكامل لمنع المهاجمين من استهداف خدمات السيرفر الداخلية أو استخراج بيانات سحابة AWS / GCP / Azure:

```typescript
// فحص وحظر الـ IP الداخلي وبيانات السحابة الحساسة
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "::",
  "169.254.169.254",            // عنوان الميتاداتا الحساس في AWS / GCP / Azure
  "metadata.google.internal",
  "instance-data"
]);

export function isDisallowedOrPrivateIP(ip: string): boolean {
  if (BLOCKED_HOSTNAMES.has(ip.toLowerCase())) return true;

  const match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (match) {
    const o1 = parseInt(match[1], 10);
    const o2 = parseInt(match[2], 10);
    
    if (o1 === 0 || o1 === 127) return true; // Loopback
    if (o1 === 10) return true;              // 10.0.0.0/8 Private
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true; // 172.16.0.0/12 Private
    if (o1 === 192 && o2 === 168) return true;          // 192.168.0.0/16 Private
    if (o1 === 169 && o2 === 254) return true;          // 169.254.0.0/16 Link-Local / AWS Metadata
    if (o1 >= 224) return true;                          // Multicast & Reserved
  }
  return false;
}
```

---

## 4. ترويسات الأمان الصارمة (HTTP Security Headers & CSP)

أضف هذه الإعدادات في ملف `next.config.ts` لحماية المنصة من هجمات Clickjacking و XSS و MIME-sniffing:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  poweredByHeader: false, // إخفاء معلومة أن الموقع مبني بـ Next.js لمنع استهداف الإصدار
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com",
            "frame-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
      ],
    },
  ],
};
```

---

## 5. أمان قواعد البيانات وسياسات RLS (Supabase & Database Hardening)

### 🛡️ قواعد Row-Level Security الإلزامية في PostgreSQL:
1. **تفعيل الـ RLS على كل جدول دون استثناء:**
   ```sql
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
   ```
2. **سياسات القراءة العامة غير المعطلة (Non-Blocking Select):**
   ```sql
   CREATE POLICY "Allow public read on settings"
   ON settings FOR SELECT USING (true);
   ```
3. **حماية التعديل بناءً على الملكية أو الرتبة:**
   ```sql
   -- تعديل الملف الشخصي لصاحب الحساب فقط
   CREATE POLICY "Users can update their own profile"
   ON profiles FOR UPDATE
   USING (auth.uid() = id);
   
   -- الأدمن فقط يمكنه حذف أو تعديل إعدادات المنصة
   CREATE POLICY "Admins full access on settings"
   ON settings FOR ALL
   TO authenticated
   USING (
     EXISTS (
       SELECT 1 FROM profiles 
       WHERE profiles.id = auth.uid() 
       AND profiles.role IN ('admin', 'super-admin')
     )
   );
   ```
4. **تجنب التكرار اللانهائي (Infinite Recursion Trap):**
   عند كتابة سياسة RLS لجدول `profiles`، تجنب عمل `SELECT FROM profiles` داخل نفس السياسة لأن ذلك يسبب انهيار قاعدة البيانات في حلقة تكرار لا تنتهي. اعتمد بدلاً منها على دالة `SECURITY DEFINER` أو فحص `auth.jwt()`.

---

## 6. حزمة الاختبارات الآلية الشاملة (Automated Testing Framework)

قم بإنشاء مجلد `__tests__/` يحتوي على الاختبارات التالية لتشغيلها والتحقق التلقائي من خلو الكود من الثغرات:

### 🧪 1. كود فحص الأمان الآلي ([__tests__/security-audit.test.ts]):
```typescript
import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'http://localhost:3000/api';

async function runSecurityAudit() {
  console.log("🛡️ تشغيل فحص الأمان الشامل...");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, err: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${err}`);
      failed++;
    }
  }

  // 1. فحص الكود المصدري (Static Code Analysis)
  const authSource = fs.readFileSync(path.join(process.cwd(), 'context/auth-context.tsx'), 'utf8');
  assert(!authSource.includes('password: u.password'), "منع تخزين كلمات المرور محلياً", "تم العثور على كلمة مرور مخزنة محلياً");
  assert(!authSource.includes('role: updatedUser.role'), "منع تصعيد الصلاحيات (Role Escalation)", "تم العثور على حقل role في حمولة التعديل");

  // 2. اختبار رفض الطلبات غير المصرح بها (Dynamic API Auth)
  try {
    const res = await fetch(`${API_BASE}/admin/delete-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test-123' })
    });
    assert(res.status === 401, "المسارات الإدارية ترفض الطلب بدون توكن بـ 401", `النتيجة كانت ${res.status}`);
  } catch (e) {
    console.warn("تأكد من تشغيل السيرفر المحلي لاختبار الـ API الديناميكي.");
  }

  // 3. اختبار صد محاولات SSRF
  try {
    const ssrfRes = await fetch(`${API_BASE}/moodle-proxy?url=${encodeURIComponent("http://169.254.169.254/latest/meta-data/")}`);
    assert(ssrfRes.status === 403 || ssrfRes.status === 400, "حظر طلبات الـ SSRF وعناوين الميتاداتا السحابية", `النتيجة كانت ${ssrfRes.status}`);
  } catch (e) {}

  console.log(`\nنتائج الفحص: ${passed} ناجح | ${failed} فاشل`);
}

runSecurityAudit();
```

### ⚡ 2. اختبار التحمل والتزامن العشوائي ([__tests__/production-readiness.test.ts]):
- محاكاة إرسال **100 طلب متزامن** في ثانية واحدة للتأكد من قيام الـ Rate Limiter بصد الفيضان وإرجاع كود `429 Too Many Requests`.
- محاكاة **250 تحديث حالة متزامن (Chaos Concurrency Test)** للتأكد من أن تقنية تجميع التحديثات (Coalesced Updates) تمنع ضرب قاعدة البيانات بطلبات مكررة.

---

## 7. قائمة الفحص الأمني السريعة (Pre-Production Security Checklist)

قبل رفع أي مشروع إلى سيرفر الإنتاج (Production / Vercel)، تأكد من مراجعة البنود التالية:

- [ ] **1. التوكنات والـ JWT:**
  - التأكد من ضبط `JWT_SECRET` بقيمة عشوائية قوية (> 32 حرفاً) في متغيرات البيئة.
  - التأكد من حظر الخوارزميات غير `HS256`.
- [ ] **2. تجريد الصلاحيات:**
  - مراجعة جميع دوال تعديل بيانات المستخدم والتأكد من عدم قبول حقل `role`.
- [ ] **3. معدل الطلبات (Rate Limiting):**
  - تفعيل محدد الطلبات على تسجيل الدخول، إنشاء الحساب، والعمليات الحساسة.
- [ ] **4. قاعدة البيانات و RLS:**
  - التأكد من تشغيل أمر `ENABLE ROW LEVEL SECURITY` على جميع الجداول في Supabase.
- [ ] **5. ترويسات الأمان:**
  - التأكد من تفعيل ترويسات CSP و HSTS و `X-Frame-Options: DENY` في `next.config.ts`.
- [ ] **6. تشغيل حزمة الاختبارات الآلية:**
  - تشغيل `node __tests__/security-audit.test.ts` وتأكيد نجاح جميع بنود الحماية.
- [ ] **7. فحص البناء النهائي:**
  - تشغيل `npm run build` وتأكيد توليد جميع المسارات بـ `Exit Code 0` بدون أخطاء TypeScript أو حقول ناقصة.

---

> 🏆 **تم إعداد هذا الدليل ليكون معيارك الأمني المرجعي الذي يحمي تطبيقاتك وقواعد بياناتك من أي ثغرة أو عبث برمجي.**
