# 🆘 TROUBLESHOOTING.md - استكشاف وحل المشاكل

دليل شامل لحل المشاكل الشائعة في منصة المذكرة البيداغوجية.

---

## 📋 جدول المحتويات

1. [مشاكل الإعداد والتثبيت](#مشاكل-الإعداد-والتثبيت)
2. [مشاكل المصادقة والدخول](#مشاكل-المصادقة-والدخول)
3. [مشاكل Firebase والقاعدة البيانات](#مشاكل-firebase-والقاعدة-البيانات)
4. [مشاكل الأداء](#مشاكل-الأداء)
5. [مشاكل الواجهة والعرض](#مشاكل-الواجهة-والعرض)
6. [مشاكل التصدير والملفات](#مشاكل-التصدير-والملفات)
7. [مشاكل أخرى](#مشاكل-أخرى)

---

## 🔧 مشاكل الإعداد والتثبيت

### ❌ خطأ: npm: command not found

**الأعراض:**
```
npm: command not found
```

**الحل:**
```bash
# 1. تأكد من تثبيت Node.js
node --version
npm --version

# 2. إذا لم تكن مثبتة، حمل من:
# https://nodejs.org/

# 3. على Linux/Mac، قد تحتاج تحديث PATH
export PATH="/usr/local/bin:$PATH"

# 4. أعد تشغيل Terminal
```

---

### ❌ خطأ: npm install fails

**الأعراض:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**الحل:**
```bash
# الطريقة 1: حذف package-lock.json
rm -rf node_modules package-lock.json
npm install

# الطريقة 2: استخدام --legacy-peer-deps
npm install --legacy-peer-deps

# الطريقة 3: استخدام --force
npm install --force

# الطريقة 4: استخدام Yarn
yarn install
```

---

### ❌ خطأ: Port 3000 already in use

**الأعراض:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**الحل:**
```bash
# الطريقة 1: استخدم port مختلف
npm run dev -- --port 3001

# الطريقة 2: اقتل العملية على Port 3000 (Linux/Mac)
lsof -i :3000
kill -9 <PID>

# الطريقة 3: اقتل العملية (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

### ❌ خطأ: .env file not found

**الأعراض:**
```
Error: Missing environment variables
```

**الحل:**
```bash
# 1. انسخ ملف المثال
cp .env.example .env.local

# 2. أضف المفاتيح الخاصة بك
nano .env.local

# 3. تأكد من حفظ الملف
cat .env.local
```

---

## 🔐 مشاكل المصادقة والدخول

### ❌ خطأ: Invalid email or password

**الأعراض:**
```
Authentication failed: Invalid email or password
```

**الحل:**
```bash
# 1. تأكد من البريد الإلكتروني
# - هل البريد صحيح؟
# - هل مسجل في Firebase؟

# 2. إعادة تعيين كلمة المرور
# - انقر على "نسيت كلمة المرور"
# - تحقق من بريدك الإلكتروني
# - اتبع التعليمات

# 3. تحقق من وحدة تحكم Firebase
# Console > Authentication > Users
# - هل المستخدم مسجل؟
# - هل البريد مفعل؟
```

---

### ❌ خطأ: User not authenticated

**الأعراض:**
```
Error: User is not authenticated
Cannot access user data
```

**الحل:**
```bash
# 1. تحقق من token
# افتح Developer Tools > Application > Cookies
# ابحث عن: __session أو firebaseToken

# 2. امسح الـ cookies
# - Settings > Clear browsing data
# - Select: Cookies and cached images
# - Clear data

# 3. سجل الدخول مجدداً
# - أعد تحميل الصفحة
# - حاول تسجيل الدخول

# 4. تحقق من وقت النظام
# وقت الخادم والعميل يجب أن يكونا متزامنين
date
```

---

### ❌ خطأ: Token expired

**الأعراض:**
```
Error: ID token has expired
```

**الحل:**
```bash
# 1. سجل الدخول مجدداً
# سيحصل التطبيق تلقائياً على token جديد

# 2. امسح التخزين المحلي
# افتح Console
localStorage.clear()
sessionStorage.clear()
location.reload()

# 3. تحقق من مدة انتهاء الصلاحية
# عادة 1 ساعة، قد تحتاج إلى تسجيل دخول جديد
```

---

## 🔥 مشاكل Firebase والقاعدة البيانات

### ❌ خطأ: Firebase not initialized

**الأعراض:**
```
Error: Firebase not initialized
Cannot read property 'getAuth' of undefined
```

**الحل:**
```bash
# 1. تحقق من متغيرات البيئة
cat .env.local | grep FIREBASE

# 2. تأكد من صحة المفاتيح
# وحدة تحكم Firebase > Project Settings > General
# قارن مع .env.local

# 3. أعد تشغيل الخادم
npm run dev
```

---

### ❌ خطأ: Permission denied reading data

**الأعراض:**
```
Error: PERMISSION_DENIED: Missing or insufficient permissions
```

**الحل:**
```bash
# 1. تحقق من قوانين Firestore
# وحدة تحكم Firebase > Firestore > Rules

# 2. تأكد من أنك مسجل دخول
# افتح Console > auth() > currentUser

# 3. تحقق من ملكية البيانات
// firestore.rules يجب أن يتضمن:
match /users/{userId}/data/{docId} {
  allow read: if isOwner(userId);
}

# 4. اختبر القوانين
firebase rules:test firestore.rules.test.ts

# 5. نشر القوانين الجديدة
firebase deploy --only firestore:rules
```

---

### ❌ خطأ: Document not found

**الأعراض:**
```
Error: No such document!
Cannot find memo with ID
```

**الحل:**
```bash
# 1. تحقق من ID المستند
// في Console
db.collection('users').doc(uid).collection('data').get()

# 2. تأكد من أن المستند موجود
# وحدة تحكم Firebase > Firestore > Browse

# 3. تحقق من مسار المستند
// الصيغة الصحيحة:
/users/{userId}/data/{docId}

# 4. حذف الـ cache
localStorage.clear()
```

---

### ❌ خطأ: Quota exceeded

**الأعراض:**
```
Error: Quota exceeded
Too many requests
```

**الحل:**
```bash
# 1. قلل عدد الطلبات
// استخدم debounce أو throttle
import debounce from 'lodash/debounce';

const handleChange = debounce((value) => {
  saveMemo(value);
}, 1000); // انتظر 1 ثانية قبل الحفظ

# 2. استخدم الـ cache
// احفظ البيانات محلياً أولاً
const [cachedData, setCachedData] = useState({});

# 3. انتظر قليلاً
// الحد الافتراضي يعود بعد 24 ساعة
// للوصول إلى حد أعلى، ارفع الخطة
```

---

## ⚡ مشاكل الأداء

### ❌ المشكلة: التطبيق بطيء جداً

**الأعراض:**
- التطبيق يستغرق وقتاً طويلاً للتحميل
- تأخير في الكتابة والحفظ
- واجهة متجمدة

**الحل:**
```bash
# 1. فحص الأداء
npm run build  # تحقق من حجم البناء

# 2. حلل الأداء في المتصفح
# F12 > Performance > Record
# - سجل الإجراءات
# - حلل الـ Timeline

# 3. قلل عدد الـ re-renders
// استخدم React.memo
const MemoCard = React.memo(({ memo }) => {
  return <div>{memo.title}</div>;
});

# 4. استخدم useMemo و useCallback
const computedValue = useMemo(() => {
  return expensiveOperation(data);
}, [data]);

# 5. استخدم Lazy Loading
const MemoEditor = lazy(() => import('./MemoEditor'));

# 6. تحسين استعلامات Firestore
// بدلاً من:
db.collection('users').get()  // ❌ كبير جداً

// استخدم:
db.collection('users').limit(10)  // ✅ محدود
```

---

### ❌ المشكلة: استهلاك ذاكرة عالي

**الأعراض:**
```
JavaScript heap out of memory
Max call stack size exceeded
```

**الحل:**
```bash
# 1. ابحث عن memory leaks
# DevTools > Memory > Take snapshot

# 2. امسح listeners القديمة
// بدلاً من:
onSnapshot(doc, (snapshot) => {
  setData(snapshot.data());
});

// استخدم cleanup:
useEffect(() => {
  const unsubscribe = onSnapshot(doc, (snapshot) => {
    setData(snapshot.data());
  });
  
  return () => unsubscribe();
}, []);

# 3. تجنب التخزين غير محدود
// بدلاً من حفظ كل شيء:
const [allMemos, setAllMemos] = useState([]);

// استخدم pagination:
const [memos, setMemos] = useState([]);
const [page, setPage] = useState(0);
```

---

## 🎨 مشاكل الواجهة والعرض

### ❌ المشكلة: النص العربي معكوس أو غير صحيح

**الأعراض:**
```
كلمات عربية مقلوبة
نصوص غير قابلة للقراءة
```

**الحل:**
```html
<!-- 1. تحقق من البيانات الأساسية -->
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
  </head>
</html>

<!-- 2. استخدم CSS صحيح -->
<style>
  body {
    direction: rtl;
    text-align: right;
  }
</style>

<!-- 3. استخدم خط عربي مناسب -->
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">

<!-- 4. في Tailwind -->
<div class="text-right" dir="rtl">
  النص العربي
</div>
```

---

### ❌ المشكلة: الأيقونات أو الصور غير مرئية

**الأعراض:**
- صور لم تحمل
- أيقونات فارغة
- Broken image icons

**الحل:**
```bash
# 1. تحقق من مسارات الصور
// بدلاً من:
<img src="image.png" />

// استخدم:
<img src="/public/images/image.png" />

# 2. استخدم صور مدارة من Firebase
import { getStorage, ref, getBytes } from 'firebase/storage';

const storage = getStorage();
const imageRef = ref(storage, 'images/memo.png');

# 3. استخدم CDN للصور الثقيلة
<img src="https://cdn.example.com/image.png" />

# 4. تحقق من حجم الصورة
# - لا تكون أكبر من 5MB
# - استخدم أداة ضغط

# 5. فحص وحدة التحكم عن رسائل الخطأ
# F12 > Console > جميع الأخطاء
```

---

### ❌ المشكلة: التخطيط (Layout) مشوه على الهاتف

**الأعراض:**
- نص يتجاوز الشاشة
- الأزرار غير قابلة للنقر
- تخطيط غير متجاوب

**الحل:**
```html
<!-- 1. أضف viewport meta tag -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- 2. استخدم Tailwind Responsive -->
<div class="w-full md:w-1/2 lg:w-1/3">
  محتوى متجاوب
</div>

<!-- 3. اختبر على أحجام مختلفة -->
<!-- F12 > Toggle device toolbar -->

<!-- 4. استخدم CSS Media Queries -->
<style>
  @media (max-width: 768px) {
    .container {
      padding: 10px;
    }
  }
</style>
```

---

## 📄 مشاكل التصدير والملفات

### ❌ المشكلة: تصدير Word فارغ أو ناقص

**الأعراض:**
- الملف تصدر بدون محتوى
- بعض الأقسام مفقودة
- الصور غير مضمنة

**الحل:**
```bash
# 1. تحقق من بيانات المذكرة
// افتح Console وتحقق:
console.log(memoData);

# 2. تأكد من أن جميع الحقول مملوءة
// يجب أن تحتوي على:
{
  title: "...",
  content: "...",
  activities: [...],
  // إلخ
}

# 3. استخدم docx بشكل صحيح
import { Document, Packer, Paragraph } from 'docx';

const doc = new Document({
  sections: [{
    children: [
      new Paragraph('عنوان')
    ]
  }]
});

# 4. اختبر الملف المصدر
// حاول فتحه في Word
```

---

### ❌ المشكلة: حجم ملف Word كبير جداً

**الأعراض:**
- الملف > 50MB
- التصدير بطيء جداً
- مشاكل في الفتح

**الحل:**
```bash
# 1. ضغط الصور
// استخدم أداة تصغير
# - https://tinypng.com/
# - https://imagecompressor.com/

# 2. قلل الصور المضمنة
// بدلاً من تضمين كل صورة:
// استخدم مراجع خارجية

# 3. استخدم مكتبات أخف
// بدلاً من docx الثقيل
// استخدم pptxgen أو html2pdf

# 4. حد عدد الصفحات
// إذا كان الملف > 100 صفحة
// قسمه إلى عدة ملفات
```

---

## 🔍 مشاكل أخرى

### ❌ المشكلة: "Cannot GET /"

**الأعراض:**
```
Cannot GET /
404 Not Found
```

**الحل:**
```bash
# 1. تأكد من تشغيل الخادم
npm run dev

# 2. تحقق من العنوان
# يجب أن يكون:
http://localhost:3000

# 3. تأكد من وجود index.html
ls -la index.html

# 4. تحقق من vite.config.ts
# يجب أن يحتوي على:
export default defineConfig({
  server: {
    port: 3000
  }
});
```

---

### ❌ المشكلة: CORS errors

**الأعراض:**
```
Access to XMLHttpRequest at 'https://...' has been blocked by CORS policy
```

**الحل:**
```bash
# 1. في التطوير، Vite يتعامل مع CORS
# لا تقلق عادة

# 2. في الإنتاج، تحقق من Firebase CORS
# Console > API Settings > CORS

# 3. أضف headers في الخادم
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

# 4. أضف proxy في vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true
      }
    }
  }
});
```

---

### ❌ المشكلة: بيانات قديمة تظهر بعد التحديث

**الأعراض:**
- بيانات قديمة في الذاكرة المؤقتة
- عدم التزامن بين المتصفحات
- لا تظهر التحديثات الحديثة

**الحل:**
```bash
# 1. امسح الذاكرة المؤقتة
# Ctrl+Shift+Delete أو Cmd+Shift+Delete

# 2. أعد تحميل القاسية
# Ctrl+Shift+R أو Cmd+Shift+R

# 3. امسح service workers
# DevTools > Application > Service Workers > Unregister

# 4. امسح IndexedDB
# DevTools > Application > Storage > Clear site data

# 5. استخدم real-time listeners
import { onSnapshot } from 'firebase/firestore';

onSnapshot(docRef, (doc) => {
  setData(doc.data()); // يحدث تلقائياً
});
```

---

## 🆘 طلب المساعدة

إذا لم تجد الحل:

1. **ابحث في القضايا المغلقة:**
   https://github.com/Snv05/mizaniyati-3/issues?state=closed

2. **فتح issue جديد:**
   https://github.com/Snv05/mizaniyati-3/issues/new

3. **اطرح سؤالاً في المناقشات:**
   https://github.com/Snv05/mizaniyati-3/discussions

4. **تواصل مع الفريق:**
   support@mizaniyati.dev

---

## 📋 معلومات مفيدة لطلب المساعدة

عند طلب المساعدة، أرفق:

```markdown
# البيئة
- نظام التشغيل: Windows/Mac/Linux
- إصدار المتصفح: Chrome 120, Firefox 121, Safari 17
- إصدار Node.js: `node --version`
- إصدار npm: `npm --version`

# الخطأ
الرسالة الدقيقة للخطأ من Console

# خطوات إعادة الإنتاج
1. افعل هذا
2. ثم هذا
3. الخطأ يظهر

# ما حاولت
- [ ] امسح الذاكرة المؤقتة
- [ ] أعد تشغيل الخادم
- [ ] حدث npm
```

---

**آخر تحديث:** 29 أغسطس 2026

للتحديثات الأخيرة، زر: https://github.com/Snv05/mizaniyati-3/wiki
