# 💎 ميزار — تطبيق إدارة المصاريف الشخصية

تطبيق ويب احترافي لتتبع المصاريف والدخل والادخار باللغة العربية مع دعم RTL.

---

## ✨ المميزات

- 🔐 تسجيل دخول بالهاتف + رمز OTP تجريبي
- 📊 لوحة تحكم رئيسية مع رسوم بيانية
- 💸 إدارة المعاملات (إضافة / تعديل / حذف + فلاتر + بحث)
- 📊 ميزانيات شهرية مع إنذارات التجاوز
- 🎯 أهداف ادخار مع مؤشر تقدم
- 🏦 إدارة الحسابات (نقدي / بنكي / بطاقة)
- 📈 تقارير مفصّلة مع رسوم بيانية
- 🌙 وضع داكن / فاتح
- 📱 متجاوب تماماً للجوال

---

## 🚀 تشغيل المشروع محلياً

```bash
# 1. تثبيت الاعتمادات
npm install

# 2. تشغيل بيئة التطوير
npm run dev

# 3. فتح المتصفح على
http://localhost:3000
```

---

## 🏗️ هيكل الملفات

```
src/
├── app/
│   ├── layout.tsx           # Layout الرئيسي
│   ├── page.tsx             # Redirect للـ login أو dashboard
│   ├── login/page.tsx       # صفحة تسجيل الدخول
│   └── dashboard/
│       ├── layout.tsx       # Layout مع الشريط الجانبي
│       ├── page.tsx         # الرئيسية
│       ├── transactions/    # المعاملات
│       ├── budgets/         # الميزانيات
│       ├── goals/           # الأهداف
│       ├── accounts/        # الحسابات
│       ├── reports/         # التقارير
│       └── settings/        # الإعدادات
├── components/
│   └── layout/
│       └── Sidebar.tsx      # الشريط الجانبي
├── data/
│   └── mockData.ts          # البيانات التجريبية
├── hooks/
│   └── useAppState.ts       # State management
├── lib/
│   ├── store.ts             # CRUD + computed values
│   └── utils.ts             # Helper functions
└── types/
    └── index.ts             # TypeScript types
```

---

## ☁️ النشر على Cloudflare Pages

### الطريقة الأولى: من GitHub (موصى بها)

1. ارفع المشروع على GitHub
2. اذهب إلى [Cloudflare Pages](https://pages.cloudflare.com)
3. اضغط **Create a project** → **Connect to Git**
4. اختر المستودع
5. اضبط:
   - **Framework preset:** Next.js
   - **Build command:** `npx @cloudflare/next-on-pages`
   - **Build output directory:** `.vercel/output/static`
6. اضغط **Save and Deploy**

### الطريقة الثانية: من سطر الأوامر

```bash
# تثبيت Wrangler
npm install -g wrangler

# تسجيل الدخول
wrangler login

# بناء المشروع
npx @cloudflare/next-on-pages

# النشر
wrangler pages deploy .vercel/output/static --project-name=mizar-finance
```

---

## 🔧 ربط API أو Supabase لاحقاً

طبقة البيانات في `src/lib/store.ts` منظّمة لتسهيل الربط:
- استبدل `loadState()` بـ `supabase.from('...').select()`
- استبدل `saveState()` بعمليات الـ upsert
- كل الـ CRUD functions جاهزة للتعديل

---

## 🛠️ التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| Next.js 14 (App Router) | الإطار الرئيسي |
| TypeScript | Type safety |
| Tailwind CSS | التنسيق |
| Recharts | الرسوم البيانية |
| Lucide React | الأيقونات |
| localStorage | التخزين المحلي |

---

## 📄 الترخيص

MIT
