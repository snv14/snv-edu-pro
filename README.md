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

أنشئ ملف `.env.local` من النموذج الآمن:

```bash
cp .env.example .env.local
```

يحمّل الخادم `.env.local` أولاً ثم `.env`. متغيرات منصة الاستضافة الموجودة في بيئة العملية لها الأولوية. لا ترفع ملفات البيئة إلى Git.

- `GEMINI_API_KEY` مفتاح خادمي لميزات الذكاء الاصطناعي. لا تسمّه `VITE_GEMINI_API_KEY` ولا تضعه في حزمة المتصفح. يمكن استعمال `GOOGLE_API_KEY` كاسم بديل.
- `GEMINI_MODEL` يختار نموذج Gemini؛ القيمة الافتراضية في الخادم هي `gemini-3.8-flash`.
- مفاتيح `OPENAI_API_KEY` و`ANTHROPIC_API_KEY` و`HF_TOKEN` اختيارية لمزودي الذكاء الاصطناعي البدلاء. اضبط `AI_PROVIDER` و`AI_PROVIDER_FALLBACKS` عند الحاجة.
- قيم `VITE_FIREBASE_*` إعدادات عميل Firebase التي تُضمّن في تطبيق المتصفح، وليست أسراراً. `VITE_FIREBASE_DATABASE_ID` اختياري ويُستخدم فقط مع قاعدة Firestore مسماة. تعتمد حماية البيانات على تسجيل الدخول وقواعد Firestore.
- `PORT` و`DISABLE_HMR` إعدادات تشغيل محلية اختيارية.

املأ القيم التي تحتاجها فقط في `.env.local`؛ لا تضع مفاتيح حقيقية في `.env.example` أو ملفات Git.

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

والمستندات المستخدمة هي:

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

يجب التأكد من ربط Firebase بالمشروع الصحيح قبل النشر. لا يتم تشغيل اختبارات Firestore غير الموجودة في المستودع، لذلك لا يحتوي `package.json` على أمر اختبار وهمي.

## الأمان

- ملفات `.env.local` مستثناة من Git.
- لا تعتمد تهيئة Firebase على ملف إعدادات سري متتبع.
- يجب تدوير أي مفتاح Firebase ظهر في تاريخ Git سابقًا.
- مفاتيح Firebase الخاصة بالعميل ليست بديلًا عن قواعد Firestore؛ الحماية الفعلية تعتمد على Authentication وFirestore Rules.

## الترخيص

راجع ملف `LICENSE` إن كان موجودًا في المستودع.

## الدعم

افتح Issue من صفحة المستودع:
https://github.com/Snv05/mizaniyati5/issues

**آخر تحديث:** 24 سبتمبر 2026
