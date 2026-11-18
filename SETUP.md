# دليل تشغيل المنصة وإعداد مفاتيحها

**الملف المرجعي للقيم:** `.env.example` (منسوخ إلى `.env.local`)
**تاريخ التحديث:** 14 نوفمبر 2026

---

## القاعدة الأولى: لا تحتاج أي مفتاح لتشغيل المنصة

المنصة **كاملة الأركان** بلا أي إعداد. قواعدها المنهجية (111 مذكرة، 200 نشاط، 11 وثيقة رسمية بـ 469 ألف حرف، التدرجات السنوية، الدفتر اليومي، التصدير إلى Word/PDF) كلها **مضمَّنة في الشيفرة** وتُقرأ محلياً.

المفاتيح **تفتح ميزتين فقط**:

| الميزة | تحتاج | بدون المفتاح |
|--------|-------|--------------|
| المزامنة السحابية | قسم 1 (Firebase) | البيانات في متصفحك فقط |
| المساعد الذكي وتوليد المذكرات وتحليل المرفقات | قسم 2 (Gemini) | معطّل — والكتابة اليدوية تعمل |

كل ما عدا ذلك يعمل بلا قيود.

---

## التشغيل السريع

```bash
npm install
npm run dev        # ← http://localhost:3000
```

هذا كل ما يلزم. لا تنسخ `.env.example` أصلاً إن كنت تريد التجربة المحلية فقط.

---

## هل تريد تشغيل المزامنة السحابية؟

### الخطوة 1 — أنشئ مشروع Firebase (مجاناً)

1. اذهب إلى <https://console.firebase.google.com> ← **Add project**.
2. **Build → Firestore Database → Create database**.
   اختر **Production mode** (الافتراضي). سيُرفض كل قراءة وكتابة حتى تنشر القواعد في الخطوة 4 — وهذا هو المطلوب.
3. **Build → Authentication → Sign-in method → Google → Enable**.
   أضف نطاقك (`localhost` مسموح افتراضياً) في **Authorized domains**.

### الخطوة 2 — سجّل تطبيق الويب

**Project settings (⚙️) → Your apps → Web (</>) → Register app**

ستظهر لك نافذة فيها كائن `firebaseConfig`. انسخ قيمه إلى `.env.local`:

```bash
cp .env.example .env.local
```

```dotenv
VITE_FIREBASE_API_KEY=AIza...            # ← apiKey
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### الخطوة 3 — أعد تشغيل الخادم

```bash
npm run dev
```

يجب أن يختفي سطر التحذير هذا من السجلّ:

```
[env] Firebase غير مفعّل (المزامنة السحابية متوقفة): ينقص VITE_FIREBASE_API_KEY, ...
```

وتظهر شارة `المزامنة السحابية نشطة` أسفل يسار الشاشة بعد تسجيل الدخول.

### الخطوة 4 — انشر قواعد الأمان ⚠️

**هذه الخطوة ليست اختيارية.** بلا نشر القواعد، كل كتابة إلى Firestore ستُرفض بـ `permission-denied`.

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project <project-id>
```

أو انسخ محتوى `firestore.rules` يدوياً والصقه في تبويب **Rules** بوحدة التحكم ثم اضغط **Publish**.

---

## هل تريد تشغيل المساعد الذكي؟

### Gemini (المزوّد الموصى به)

1. اذهب إلى <https://aistudio.google.com/apikey> ← **Create API key**.
2. أضف إلى `.env.local`:

```dotenv
GEMINI_API_KEY=AIza...
```

3. أعد تشغيل الخادم. يجب أن يختفي التحذير ويظهر `[env] Gemini مفعّل`.

**لماذا Gemini أولاً؟** لأنه المزوّد الوحيد في المنصة الذي يدعم **تحليل الصور وPDF** (المرفقات). المزوّدون البديلون يولّدون نصاً فقط، والشيفرة صريحة في ذلك:

> `لا يتم إرسال المرفقات إلى مزود بديل تلقائياً؛ تحليل الصور/PDF يبقى عبر مزود يدعم الرؤية.`
> — `src/server/aiGateway.ts:113`

### مزوّد بديل

إن لم ترغب في Gemini، املأ **واحداً** من هذه فقط:

```dotenv
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# أو Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# أو Hugging Face
HF_TOKEN=hf_...
```

وحدّد المزوّد الأساسي صراحة:

```dotenv
AI_PROVIDER=openai
```

---

## ⚠️ قواعد أمان المفاتيح

| القاعدة | السبب |
|---------|-------|
| **لا تضع مفتاحاً سِرّياً في متغيّر يبدأ بـ `VITE_`** | كل متغيّر `VITE_*` يُحزَّم داخل JavaScript في المتصفح ويصبح مقروءاً لأي زائر |
| **مفاتيح `VITE_FIREBASE_*` ليست سِرّية** | هذا طبيعي ومقصود؛ الحماية الحقيقية من `firestore.rules` |
| **`GEMINI_API_KEY` و`OPENAI_API_KEY` و`HF_TOKEN` سِرّية** | تبقى على الخادم فقط ولا تظهر في الحزمة |
| **لا تُرفع `.env.local` إلى Git** | مستثنى في `.gitignore` — تحقق بـ `git check-ignore -v .env.local` |
| **لا تشارك المفاتيح في محادثة أو لقطة شاشة** | من يملك المفتاح يستهلك حصتك و billing الخاص بك |

**ملاحظة على هذا المستودع:** `.env.example` **مقصود أن يكون فارغ القيم**. لا تضع فيه مفاتيح حقيقية لأنه **مُتعقَّب في Git** ويُرفع مع كل commit. القيم الحقيقية مكانها `.env.local` فقط.

---

## استكشاف الأعطال

| العَرَض | السبب المحتمل | الحل |
|---------|----------------|------|
| `[env] Firebase غير مفعّل` | نقص في `VITE_FIREBASE_*` | املأ القيم الثلاثة الإلزامية: `API_KEY`, `PROJECT_ID`, `APP_ID` |
| `permission-denied` عند الحفظ | القواعد لم تُنشر | الخطوة 4 أعلاه |
| `auth/unauthorized-domain` | النطاق غير مسجَّل | Authentication → Settings → Authorized domains |
| شارة «تعذرت المزامنة» حمراء | تجاوز حد 1 MiB للوثيقة — انظر التقرير P0-1 وP0-2 | الدفتر بجدول كامل يتجاوز الحد حتماً؛ بيانياً: مشكلة مفتوحة |
| `[env] لا يوجد أي مفتاح ذكاء اصطناعي` | لا مزوّد مضبوط | املأ `GEMINI_API_KEY` |
| المساعد يرد لكن دون تحليل صورة | أنت على مزوّد بديل | المرفقات تحتاج Gemini |
| `429 Too Many Requests` | تجاوزت 20 طلباً/دقيقة | انتظر دقيقة أو ارفع `AI_RATE_LIMIT_PER_MINUTE` |
| تغيّر `.env.local` لا يظهر | Vite يقرأ البيئة عند الإقلاع فقط | أعد تشغيل `npm run dev` |

---

## مرجع المتغيّرات الكامل

انظر `.env.example` — كل متغيّر موثَّق هناك بتعليق يشرح أثره ونطاقه.
