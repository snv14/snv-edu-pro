# 🏗️ ARCHITECTURE.md - وثائق البنية المعمارية

## نظرة عامة

منصة المذكرة البيداغوجية هي تطبيق ويب حديث يتكون من ثلاث طبقات:

```
┌─────────────────────────────────────────────────────────┐
│                  العميل (Frontend)                      │
│         React + TypeScript + Tailwind CSS              │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                  الخادم (Backend)                        │
│           Express.js + Node.js + Vite                  │
└──────────────────────┬──────────────────────────────────┘
                       │ REST/Firebase APIs
┌──────────────────────▼──────────────────────────────────┐
│            الخدمات الخارجية (External Services)          │
│  Firebase (Auth, Firestore) + Google Gemini AI       │
└─────────────────────────────────────────────────────────┘
```

---

## 1. الطبقة الأمامية (Frontend)

### البنية الهرمية للمكونات

```
src/
├── main.tsx                    # نقطة الدخول
├── App.tsx                     # المكون الجذر
│
├── components/
│   ├── Layout/                 # مكونات التخطيط
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   │
│   ├── MemoEditor/             # محرر المذكرات
│   │   ├── MemoForm.tsx
│   │   ├── ActivityInput.tsx
│   │   └── PreviewPanel.tsx
│   │
│   ├── DataTable/              # جداول البيانات
│   │   ├── Table.tsx
│   │   ├── TableHeader.tsx
│   │   └── TableRow.tsx
│   │
│   └── Shared/                 # مكونات مشتركة
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Loading.tsx
│
├── pages/
│   ├── Dashboard.tsx           # لوحة التحكم
│   ├── CreateMemo.tsx          # إنشاء مذكرة جديدة
│   ├── EditMemo.tsx            # تحرير مذكرة
│   ├── MemoList.tsx            # قائمة المذكرات
│   ├── Export.tsx              # تصدير إلى Word
│   └── Settings.tsx            # الإعدادات
│
├── services/
│   ├── firebase/
│   │   ├── auth.ts             # المصادقة
│   │   ├── firestore.ts        # إدارة البيانات
│   │   └── storage.ts          # تخزين الملفات
│   │
│   ├── api/
│   │   ├── memos.ts            # API المذكرات
│   │   ├── users.ts            # API المستخدمين
│   │   └── export.ts           # API التصدير
│   │
│   └── gemini/
│       └── ai.ts               # خدمة Google Gemini
│
├── hooks/                      # React Hooks المخصصة
│   ├── useAuth.ts
│   ├── useMemo.ts
│   ├── useFirestore.ts
│   └── useExport.ts
│
├── types/
│   ├── memo.ts                 # أنواع المذكرات
│   ├── user.ts                 # أنواع المستخدمين
│   ├── activity.ts             # أنواع الأنشطة
│   └── common.ts               # الأنواع المشتركة
│
├── data/
│   ├── lessons1am.ts           # درس السنة الأولى
│   ├── lessons2am.ts           # دروس السنة الثانية
│   ├── lessons3am.ts           # دروس السنة الثالثة
│   ├── lessons4am.ts           # دروس السنة الرابعة
│   └── constants.ts            # الثوابت العامة
│
├── styles/
│   ├── globals.css             # الأنماط العام
│   ├── tailwind.css            # Tailwind
│   └── animations.css          # الرسوم المتحركة
│
└── utils/
    ├── validators.ts           # دوال التحقق
    ├── formatters.ts           # دوال التنسيق
    ├── helpers.ts              # دوال مساعدة
    └── constants.ts            # الثوابت
```

### تدفق البيانات (Data Flow)

```
المستخدم
   │
   ▼
┌─────────────────────────────────┐
│  React Component (الصفحة)       │
│  - عرض واجهة المستخدم          │
│  - معالجة الأحداث             │
└──────────────┬──────────────────┘
               │
               ▼
         ┌──────────────────┐
         │  React State     │
         │  (useState)      │
         └──────────┬───────┘
                    │
                    ▼
          ┌────────────────────┐
          │  Custom Hook       │
          │  (useFirestore)    │
          └──────────┬─────────┘
                     │
                     ▼
            ┌─────────────────────┐
            │  Firebase Service   │
            │  - firestore.ts     │
            │  - auth.ts          │
            └──────────┬──────────┘
                       │
                       ▼
                ┌──────────────────┐
                │  Firebase Cloud  │
                │  (Firestore DB)  │
                └──────────────────┘
```

---

## 2. الطبقة الوسطى (Backend)

### بنية الخادم

```
src/server/
├── server.ts                   # نقطة الدخول للخادم
├── index.ts                    # تكوين Express
│
├── routes/
│   ├── memos.route.ts          # مسارات المذكرات
│   ├── users.route.ts          # مسارات المستخدمين
│   ├── export.route.ts         # مسارات التصدير
│   └── auth.route.ts           # مسارات المصادقة
│
├── controllers/
│   ├── memoController.ts
│   ├── userController.ts
│   ├── exportController.ts
│   └── authController.ts
│
├── middleware/
│   ├── auth.middleware.ts      # التحقق من المصادقة
│   ├── validate.middleware.ts  # التحقق من البيانات
│   ├── errorHandler.ts         # معالجة الأخطاء
│   └── cors.middleware.ts      # معالجة CORS
│
└── utils/
    ├── docxGenerator.ts        # توليد Word
    ├── validators.ts           # دوال التحقق
    └── logger.ts               # تسجيل العمليات
```

### دورة حياة الطلب

```
الطلب الوارد
   │
   ▼
┌──────────────────────┐
│  CORS Middleware     │
│  - تحقق من المصدر   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Auth Middleware      │
│ - تحقق من التوكن   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Validation           │
│ - تحقق من البيانات  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Controller           │
│ - معالجة الطلب      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Service/Database     │
│ - العمليات الفعلية  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Response             │
│ - إرسال النتيجة     │
└──────────────────────┘
```

---

## 3. الطبقة الخارجية (External Services)

### خدمات Firebase

```
Firebase Project
├── Authentication
│   ├── Email/Password
│   ├── Social Login (Google, Facebook)
│   └── 2FA (Two-Factor Authentication)
│
├── Firestore Database
│   ├── Real-time Sync
│   ├── Security Rules
│   └── Offline Support
│
└── Storage
    ├── File Upload
    ├── Cloud Functions
    └── Hosting
```

### Google Gemini AI

```
Google Gemini API
├── Generate Content
│   ├── Lesson Outlines
│   ├── Activity Suggestions
│   └── Assessment Questions
│
└── Text Processing
    ├── Summarization
    ├── Translation
    └── Sentiment Analysis
```

---

## 4. نموذج البيانات (Data Schema)

### Firestore Collection Structure

```
users/
├── {userId}/
│   ├── profile/
│   │   ├── email: string
│   │   ├── displayName: string
│   │   ├── schoolName: string
│   │   ├── teacherName: string
│   │   └── createdAt: timestamp
│   │
│   ├── config/
│   │   ├── {configId}/
│   │   │   ├── userId: string
│   │   │   ├── schoolYear: string
│   │   │   ├── theme: string
│   │   │   └── updatedAt: timestamp
│   │
│   ├── data/
│   │   ├── {memoId}/
│   │   │   ├── userId: string
│   │   │   ├── title: string
│   │   │   ├── level: string (1am|2am|3am|4am)
│   │   │   ├── maqta: string
│   │   │   ├── mawrid: string
│   │   │   ├── activities: array
│   │   │   ├── createdAt: timestamp
│   │   │   └── updatedAt: timestamp
│   │
│   ├── distributions/
│   │   ├── {distId}/
│   │   │   ├── userId: string
│   │   │   ├── level: string
│   │   │   ├── trimester: number (1|2|3)
│   │   │   ├── month: string
│   │   │   ├── weekNumber: number
│   │   │   ├── mawrid: string
│   │   │   └── status: string (pending|completed)
│   │
│   └── dailyLogs/
│       └── {logId}/
│           ├── userId: string
│           ├── date: string (YYYY-MM-DD)
│           ├── dayOfWeek: string
│           ├── level: string
│           ├── className: string
│           ├── lessonTitle: string
│           ├── activities: array
│           └── isCompleted: boolean
```

### TypeScript Types

```typescript
// المستخدم
interface User {
  uid: string;
  email: string;
  displayName: string;
  schoolName: string;
  createdAt: Date;
}

// المذكرة
interface Memo {
  id: string;
  userId: string;
  title: string;
  level: 'patrameters1am' | '2am' | '3am' | '4am';
  maqta: string;
  mawrid: string;
  activities: Activity[];
  createdAt: Date;
  updatedAt: Date;
}

// النشاط
interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'exercise' | 'experiment' | 'discussion';
  duration: number; // بالدقائق
  resources: string[];
  assessment: string;
}

// التوزيع السنوي
interface Distribution {
  id: string;
  userId: string;
  level: string;
  trimester: 1 | 2 | 3;
  month: string;
  weekNumber: number;
  mawrid: string;
  status: 'pending' | 'completed';
}
```

---

## 5. تدفق الاستخدام (Use Cases)

### حالة 1: إنشاء مذكرة جديدة

```
مستخدم يملأ النموذج
   │
   ▼
التحقق من البيانات على الجهة الأمامية
   │
   ▼
إرسال الطلب إلى الخادم
   │
   ▼
التحقق من المصادقة والتفويض
   │
   ▼
التحقق من صحة البيانات
   │
   ▼
حفظ في Firestore
   │
   ▼
إرسال النتيجة للعميل
   │
   ▼
تحديث واجهة المستخدم
```

### حالة 2: تصدير إلى Word

```
المستخدم يختار "تصدير"
   │
   ▼
جمع بيانات المذكرة من Firestore
   │
   ▼
توليد ملف Word باستخدام docx
   │
   ▼
(اختياري) إضافة الصور والجداول
   │
   ▼
توليد ملف docx
   │
   ▼
تحميل الملف للعميل
```

---

## 6. المتطلبات غير الوظيفية

### الأداء
- **وقت التحميل:** < 3 ثوانٍ
- **استجابة API:** < 500ms
- **حجم الصفحة:** < 2MB

### الأمان
- HTTPS إلزامي
- Firebase Security Rules مفعلة
- التحقق من المصادقة على كل طلب
- تشفير البيانات الحساسة

### الموثوقية
- 99.9% من وقت التشغيل
- نسخ احتياطية يومية
- استعادة الكوارث

### القابلية للتوسع
- Firebase Firestore يقبل ملايين العمليات
- CDN لتسليم الملفات الثابتة
- Cloud Functions للعمليات الثقيلة

---

## 7. تحسينات مستقبلية

- [ ] تخزين مؤقت (Caching) على الجهة الأمامية
- [ ] مزامنة غير متصلة (Offline Sync)
- [ ] البحث الكامل (Full-text Search)
- [ ] الإشعارات الفورية (Real-time Notifications)
- [ ] لوحة تحكم إدارية (Admin Dashboard)
- [ ] تقارير وإحصائيات متقدمة

---

**آخر تحديث:** 29 أغسطس 2026
