# 🤝 CONTRIBUTING.md - دليل المساهمة

شكراً لاهتمامك بالمساهمة في منصة المذكرة البيداغوجية! 🎉

هذا المستند يوفر إرشادات واضحة لكيفية المساهمة في المشروع.

---

## 📋 محتويات الدليل

1. [قواعس السلوك](#قواعس-السلوك)
2. [كيفية البدء](#كيفية-البدء)
3. [عملية المساهمة](#عملية-المساهمة)
4. [معايير الكود](#معايير-الكود)
5. [اختبار التغييرات](#اختبار-التغييرات)
6. [كتابة رسائل الـ Commit](#كتابة-رسائل-الـ-commit)
7. [فتح Pull Request](#فتح-pull-request)
8. [مراجعة الكود](#مراجعة-الكود)

---

## ✨ قواعس السلوك

### التزامنا
نحن ملتزمون بتوفير بيئة ترحيبية وآمنة للجميع، بغض النظر عن:
- العمر والجنس والنوع الاجتماعي
- الأصل والإثنية والديانة
- الحالة الاجتماعية والقدرات الجسدية
- الخبرة والمستوى التعليمي

### السلوكيات المتوقعة
✅ استخدم لغة محترمة وشاملة
✅ استقبل النقد البناء بصدر رحب
✅ ركز على ما هو أفضل للمجتمع
✅ احترم آراء الآخرين حتى لو اختلفت

### السلوكيات غير مقبولة
❌ التحرش بأي شكل من الأشكال
❌ الإساءة والتنمر
❌ النشر المعلومات الشخصية بدون إذن
❌ أي سلوك قد يعتبر غير مهني

### الإبلاغ عن الانتهاكات
إذا شهدت سلوكاً غير مقبول:
- 📧 البريد الإلكتروني: conduct@mizaniyati.dev
- 🔒 جميع الإبلاغات سرية وسيتم التحقيق فيها

---

## 🚀 كيفية البدء

### 1. إعداد بيئة التطوير

```bash
# استنساخ المستودع
git clone https://github.com/Snv05/mizaniyati-3.git
cd mizaniyati-3

# تثبيت المعتمديات
npm install

# إنشاء فرع للميزة الجديدة
git checkout -b feature/your-feature-name
```

### 2. فهم المشروع

قبل البدء، اقرأ:
- [README.md](README.md) - نظرة عامة على المشروع
- [ARCHITECTURE.md](ARCHITECTURE.md) - البنية المعمارية
- [SECURITY.md](SECURITY.md) - سياسات الأمان

### 3. ضبط IDE

**VS Code (موصى به):**
```bash
# تثبيت الإضافات المقترحة
# - ESLint
# - Prettier
# - TypeScript Vue Plugin
# - Tailwind CSS IntelliSense
# - Firebase Explorer
```

**الملفات الموصى بها:**
```bash
# .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 📝 عملية المساهمة

### أنواع المساهمات المرحب بها

#### 🐛 إصلاح الأخطاء (Bug Fixes)
- ابحث عن [issues مفتوحة مع تصنيف `bug`](https://github.com/Snv05/mizaniyati-3/labels/bug)
- أضف تعليق "أعمل على هذا" للادعاء به
- اتبع معايير الكود أدناه

#### ✨ ميزات جديدة (Features)
- اقترح الميزة أولاً في [Discussion](https://github.com/Snv05/mizaniyati-3/discussions)
- انتظر الموافقة من الفريق
- اتبع [معايير الكود](#معايير-الكود)

#### 📚 توثيق (Documentation)
- إصلاح الأخطاء الإملائية
- توضيح التعليمات
- إضافة أمثلة وحالات استخدام

#### 🧪 اختبارات (Tests)
- كتابة اختبارات للميزات الجديدة
- تحسين تغطية الاختبارات
- اختبار حالات الأخطاء

### مثال: إصلاح خطأ

```bash
# 1. انسخ الخطأ على جهازك المحلي
# 2. أنشئ فرع جديد
git checkout -b fix/bug-description

# 3. قم بالتغييرات اللازمة
# 4. اختبر التغييرات
npm run test

# 5. اكتب رسالة commit واضحة
git commit -m "fix: description of the fix"

# 6. ادفع التغييرات
git push origin fix/bug-description

# 7. افتح Pull Request
```

---

## 💻 معايير الكود

### TypeScript

✅ **افعل هذا:**
```typescript
// استخدم أنواع واضحة
interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

// استخدم const بدلاً من let
const handleSave = (memo: Memo): Promise<void> => {
  return saveMemo(memo);
};

// استخدم early returns
function validateMemo(memo: Memo): boolean {
  if (!memo.title || memo.title.length === 0) {
    return false;
  }
  if (memo.title.length > 500) {
    return false;
  }
  return true;
}
```

❌ **لا تفعل هذا:**
```typescript
// تجنب any
let data: any = getMemo(); // ❌

// تجنب console.log في الكود النهائي
console.log(memo); // ❌

// تجنب nested callbacks (استخدم async/await)
fetchMemo().then(memo => {
  updateMemo(memo).then(result => {
    saveMemo(result); // ❌ Callback hell
  });
});
```

### React

✅ **افعل هذا:**
```typescript
// استخدم Functional Components
const MemoEditor: React.FC<Props> = ({ memo, onSave }) => {
  const [title, setTitle] = useState(memo.title);
  
  const handleSave = useCallback(() => {
    onSave({ ...memo, title });
  }, [memo, title, onSave]);
  
  return (
    <div>
      <input value={title} onChange={e => setTitle(e.target.value)} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};
```

❌ **لا تفعل هذا:**
```typescript
// تجنب Class Components
class MemoEditor extends React.Component { // ❌

// تجنب Side Effects خارج useEffect
const MyComponent = () => {
  fetchData(); // ❌ يحدث في كل render
};

// تجنب Prop Drilling
<Level1 user={user}>
  <Level2 user={user}>
    <Level3 user={user} /> {/* ❌ */}
  </Level2>
</Level1>
```

### التنسيق

```bash
# استخدم Prettier
npm run format

# استخدم ESLint
npm run lint

# إصلاح الأخطاء تلقائياً
npm run lint -- --fix
```

### التعليقات

```typescript
// ✅ استخدم تعليقات واضحة
// حساب عدد الأنشطة المكتملة
const completedCount = activities.filter(a => a.completed).length;

// ❌ تجنب التعليقات الواضحة
// زيادة العداد
counter++; // ❌
```

---

## 🧪 اختبار التغييرات

### تشغيل الاختبارات

```bash
# اختبارات الوحدة (Unit Tests)
npm run test

# اختبارات قوانين Firestore
npm run test:firestore

# اختبارات التكامل
npm run test:integration

# تغطية الاختبارات
npm run test:coverage
```

### الاختبار اليدوي

```bash
# 1. ابدأ خادم التطوير
npm run dev

# 2. افتح المتصفح
http://localhost:3000

# 3. اختبر الميزة الجديدة
# - تحقق من الحالات الطبيعية
# - اختبر رسائل الأخطاء
# - تحقق من التوافق مع المتصفحات المختلفة

# 4. تحقق من وحدة التحكم للأخطاء
F12 -> Console tab
```

### قائمة اختبار شاملة

قبل فتح PR، تأكد من:

- [ ] الكود يعمل محلياً (`npm run dev`)
- [ ] جميع الاختبارات تمر (`npm run test`)
- [ ] لا توجد رسائل تحذير (`npm run lint`)
- [ ] اختبرت جميع الحالات الطبيعية
- [ ] اختبرت حالات الأخطاء
- [ ] تحقق من الأداء
- [ ] تحقق من التوافق مع الأجهزة المختلفة

---

## 📝 كتابة رسائل الـ Commit

استخدم صيغة الـ Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### الأنواع المقبولة

| النوع | الوصف | مثال |
|--------|-------|-------|
| `feat` | ميزة جديدة | `feat(memos): add export to Word` |
| `fix` | إصلاح خطأ | `fix(auth): resolve login issue` |
| `docs` | تحديث التوثيق | `docs(README): update setup guide` |
| `style` | تنسيق الكود | `style: format code with Prettier` |
| `refactor` | إعادة هيكلة الكود | `refactor(components): split large component` |
| `perf` | تحسين الأداء | `perf(firestore): optimize query` |
| `test` | إضافة اختبارات | `test(memos): add validation tests` |
| `chore` | تحديثات البناء | `chore: update dependencies` |

### أمثلة على رسائل صحيحة

```bash
# ميزة جديدة
git commit -m "feat(export): add PDF export functionality

- Add PDF export button to memo view
- Support Arabic text rendering
- Include images and tables in export"

# إصلاح خطأ
git commit -m "fix(auth): prevent multiple login attempts

- Add rate limiting for login endpoint
- Clear tokens on logout
- Fixes #123"

# توثيق
git commit -m "docs(README): clarify Firebase setup steps"

# إعادة هيكلة
git commit -m "refactor(components): extract MemoForm to separate file

- Improve component organization
- Enhance testability
- No functional changes"
```

---

## 🔀 فتح Pull Request

### قبل فتح PR

```bash
# 1. تحديث الفرع الرئيسي
git fetch origin
git rebase origin/main

# 2. التأكد من عدم وجود conflicts
# إذا كان هناك conflicts، حلها يدوياً

# 3. تشغيل الاختبارات والفحوصات
npm run lint
npm run test
npm run build

# 4. ادفع التغييرات
git push origin your-branch-name
```

### نموذج Pull Request

عند فتح PR، استخدم هذا النموذج:

```markdown
## الوصف
وصف موجز لما تفعله هذه PR.

## نوع التغيير
- [ ] إصلاح خطأ (Bug fix)
- [ ] ميزة جديدة (New feature)
- [ ] تحديث التوثيق (Documentation)
- [ ] تحسين الأداء (Performance)
- [ ] إعادة هيكلة (Refactoring)

## الإصدارات المغلقة
Fixes #123
Fixes #456

## اختبر التغييرات
- [ ] اختبرت محلياً
- [ ] اختبرت على أجهزة مختلفة
- [ ] أضفت اختبارات

## معايير الجودة
- [ ] الكود يتبع معايير المشروع
- [ ] جميع الاختبارات تمر
- [ ] لا توجد رسائل تحذير
- [ ] وثقت التغييرات
- [ ] لم أضف مكتبات خارجية غير ضرورية

## ملاحظات إضافية
أي معلومات إضافية مفيدة للمراجع.
```

### نصائح مهمة

✅ **افعل هذا:**
- PR صغير ومركزة (< 400 سطر)
- رسالة واضحة ووصف كامل
- ارجع إلى الـ issue ذي الصلة
- أضف اختبارات مع الكود الجديد
- استقبل النقد بصدر رحب

❌ **لا تفعل هذا:**
- PR ضخمة تجمع عدة ميزات
- رسالة غامضة أو فارغة
- دفع الملفات الشخصية أو المؤقتة
- تنسي اختبارات الكود الجديد
- رد دفاعي على النقد البناء

---

## 👀 مراجعة الكود

### معايير المراجعة

المراجعون سيفحصون:

1. **الجودة:**
   - هل الكود نظيف وقابل للقراءة؟
   - هل يتبع معايير المشروع؟

2. **الوظيفة:**
   - هل تحل المشكلة بشكل صحيح؟
   - هل تغطي جميع الحالات؟

3. **الأداء:**
   - هل هناك مشاكل في الأداء؟
   - هل يمكن تحسين الكفاءة؟

4. **الأمان:**
   - هل هناك ثغرات أمنية؟
   - هل تم التحقق من المدخلات؟

5. **الاختبارات:**
   - هل الاختبارات كافية؟
   - هل تغطي الحالات الطبيعية والخاصة؟

### الرد على التعليقات

```markdown
# ✅ موافق
تم إصلاح المشكلة في الـ commit abc1234.

# ❓ سؤال
هل تقصد استخدام `useMemo` هنا؟ دعني أتحقق من الأداء.

# 🤔 غير موافق
اختلف هنا لأن... [اشرح السبب]
هل نناقش الخيارات؟
```

### الموافقة على PR

بعد الموافقة على التغييرات:

```bash
# يمكن للفريق دمج PR
git merge pull/123/head
git push origin main
```

---

## 📊 قائمة التحقق النهائية

قبل إرسال PR:

- [ ] الفرع محدث من `main`
- [ ] الكود يتبع معايير المشروع
- [ ] جميع الاختبارات تمر
- [ ] أضفت اختبارات جديدة
- [ ] وثقت التغييرات
- [ ] رسالة commit واضحة
- [ ] لا توجد ملفات غير مرغوبة
- [ ] اختبرت محلياً
- [ ] فحصت الأداء

---

## 📞 طلب المساعدة

إذا احتجت مساعدة:

- 📝 [اسأل في Discussions](https://github.com/Snv05/mizaniyati-3/discussions)
- 🐛 [ابحث عن issues موجودة](https://github.com/Snv05/mizaniyati-3/issues)
- 💬 [اتصل بالفريق](mailto:team@mizaniyati.dev)

---

## 🎉 شكراً!

شكراً لمساهمتك في تحسين منصة المذكرة البيداغوجية!

كل مساهمة، مهما كانت صغيرة، تساعد في تحسين التطبيق وتقديم قيمة أكبر للمعلمين والطلاب.

---

**آخر تحديث:** 29 أغسطس 2026

للأسئلة والاستفسارات: [إفتح Issue](https://github.com/Snv05/mizaniyati-3/issues/new)
