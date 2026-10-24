# منصة المذكرة البيداغوجية 📚

تطبيق React/Vite باللغة العربية لإعداد وتوليد المذكرات البيداغوجية لمادة علوم الطبيعة والحياة، مع دعم التصدير إلى Word، التخزين المحلي، والمزامنة الاختيارية مع Firebase.

## المتطلبات

- Node.js 18 أو أحدث
- npm 9 أو أحدث
- إعداد Firebase فقط عند الحاجة إلى تسجيل الدخول والمزامنة السحابية

## التشغيل

```bash
git clone https://github.com/snv14/snv-edu-pro.git
cd snv-edu-pro
npm install
cp .env.example .env.local
npm run dev
```

يفتح التطبيق على: `http://localhost:3000`

## متغيرات البيئة

انسخ `.env.example` إلى `.env.local` محليًا، ثم املأ القيم الفعلية. في بيئة النشر، أضف المتغيرات نفسها من لوحة إعدادات البيئة الخاصة بخدمة الاستضافة، ثم أعد البناء/النشر. لا تضع القيم الحقيقية في GitHub أو في ملفات المصدر.

```dotenv
# Gemini — server-side only
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash

# Firebase Web App configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
```

### من أين تحصل على القيم؟

- **Firebase:** من Firebase Console، افتح المشروع الصحيح ثم إعدادات المشروع (Project settings) ثم تطبيق الويب (Web app)، وانسخ قيم الإعدادات كما هي. لا تخمّن `projectId` أو `appId` أو `apiKey` أو بقية القيم.
- **`VITE_FIREBASE_AUTH_DOMAIN`:** الاسم الكامل هو `VITE_FIREBASE_AUTH_DOMAIN`، وليس `VITE_FIREBASE_AUTH_D`.
- **`VITE_FIREBASE_DATABASE_ID`:** هذا المتغير اختياري؛ اتركه فارغًا عند استخدام قاعدة Firestore الافتراضية. الاسم الكامل ينتهي بـ `DATABASE_ID`.
- **Gemini:** ضع مفتاح Gemini API في `GEMINI_API_KEY` على الخادم أو في إعدادات البيئة لدى الاستضافة. لا تسمّه `VITE_GEMINI_API_KEY` لأن متغيرات `VITE_*` تُضمّن في كود المتصفح.
- **`GEMINI_MODEL`:** القيمة الافتراضية في القالب هي `gemini-3.8-flash`. إذا رفض مزود Gemini هذا المعرّف لحسابك، استخدم معرّف نموذج متاحًا في إعدادات API لديك.

المستودع لا يحتوي على قيم Firebase الفعلية أو مفتاح Gemini؛ يجب إدخالها من حساباتك. إذا كانت متغيرات Firebase غير مكتملة، فقد يعمل التطبيق محليًا لكن تُعطّل وظائف Firebase السحابية. وإذا لم يوجد `GEMINI_API_KEY` فلن تعمل وظائف Gemini التي تحتاج إلى المفتاح.

## أوامر المشروع

```bash
npm run dev      # خادم التطوير
npm run build    # بناء الإنتاج
npm run preview  # معاينة البناء
npm run lint     # فحص TypeScript
npm run clean    # حذف مخرجات البناء
```

## بنية البيانات السحابية

يستخدم التطبيق المسار التالي فقط:

```text
users/{userId}/data/{docId}
```

المستندات المستخدمة هي:
- `config` ويحتوي على `config`
- `annualDist` ويحتوي على `items`
- `curriculum` ويحتوي على `lessons`
- `logbook` ويحتوي على `data`

## نشر قواعد Firestore

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

تأكد من ربط Firebase بالمشروع الصحيح قبل النشر. يجب اختبار قواعد Firestore في بيئة مناسبة قبل اعتمادها.

## الأمان

- ملفات `.env.local` مستثناة من Git.
- لا تضع مفاتيح Gemini السرية في ملفات المصدر أو متغيرات `VITE_*`.
- يجب تدوير أي مفتاح ظهر في تاريخ Git سابقًا.
- مفاتيح Firebase الخاصة بالعميل ليست بديلًا عن قواعد Firestore؛ الحماية الفعلية تعتمد على Authentication وFirestore Rules.

## الدعم

افتح Issue من صفحة المستودع:
https://github.com/snv14/snv-edu-pro/issues
