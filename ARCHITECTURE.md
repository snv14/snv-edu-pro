# بنية المنصة (محدّثة لتطابق الشيفرة الفعلية)

## الطبقات
- **العميل**: React 19 + TypeScript + Tailwind v4 (Vite). نقطة الدخول `src/main.tsx` ← `ErrorBoundary` ← `AuthProvider` ← `App`.
- **الخادم**: `server.ts` (Express) يركّب `src/server/api.ts` (واجهة الذكاء الاصطناعي) ويخدم `dist/` في الإنتاج أو Vite في التطوير.
- **الخدمات الخارجية**: Firebase (Auth وFirestore للمزامنة) وGoogle Gemini (+ مزودات احتياطية: OpenAI وAnthropic وHugging Face).

## الشجرة
```
.
├── server.ts                 # خادم Express (التطوير: Vite middleware / الإنتاج: dist)
├── index.html, vite.config.ts, tsconfig.json
├── firestore.rules           # قواعد الأمان (5 مستندات فقط لكل مستخدم)
├── data/aiKnowledge.json     # لقطة معرفة المساعد (تُحدَّث بـ npm run refresh:ai-knowledge)
├── scripts/                  # أدوات صيانة
├── archive/                  # ملفات مصدرية قديمة غير مستعملة في التشغيل
├── public/                   # favicon وصور ثابتة
└── src/
    ├── main.tsx, App.tsx, types.ts, index.css, vite-env.d.ts
    ├── components/           # 23 مكوّنًا
    ├── services/             # 12 ملفًا: الذكاء الاصطناعي ومعرفة المساعد
    ├── utils/                # 13 ملفًا: التصدير (Word/PDF) والتعقيم والتوزيع
    ├── server/               # api.ts وaiGateway.ts وsecurity.ts وenv.ts
    ├── data/                 # 42 ملفًا: المنهاج والتدرج والدفتر
    └── types/                # أنواع إضافية
```

## الملفات
- **components**: `AIAssistantDrawer.tsx`, `AccountSettings.tsx`, `AnnualDistribution.tsx`, `Auth.tsx`, `CalendarAdjustmentModal.tsx`, `CorrectionMemoDrawer.tsx`, `CurriculumDatabaseManager.tsx`, `DailyLogSheetTemplate.tsx`, `DailyLogbook.tsx`, `ErrorBoundary.tsx`, `FirebaseDataSync.tsx`, `InteractiveMaqta1.tsx`, `LevelsHomePage.tsx`, `MemoSheet.tsx`, `OfficialAnnualDistribution.tsx`, `PedagogicalNoteModal.tsx`, `PlatformInfoModal.tsx`, `PlatformNavigationDrawer.tsx`, `PreviewModal.tsx`, `SidebarControls.tsx`, `SourceMemo1AMViewer.tsx`, `TeacherOfficialStamp.tsx`, `UserProfile.tsx`
- **services**: `aiProviderRegistry.ts`, `aiSourcePriority.ts`, `correctionMemoAi.ts`, `expertLabStore.ts`, `geminiPedagogicalService.ts`, `geminiPrompts.ts`, `memoAttachmentStore.ts`, `memoLearningStore.ts`, `memoSuggestionEngine.ts`, `officialPedagogicalSources.ts`, `scienceMemoModelLibrary.ts`, `smartAi.ts`
- **utils**: `annualDistributionDateUtils.ts`, `annualDistributionGenerator.ts`, `correctionMemoExport.ts`, `dailyLogbookGenerator.ts`, `designerPhoto.ts`, `docxExport.ts`, `docxExportDistribution.ts`, `docxExportLogbook.ts`, `html2canvasSanitizer.ts`, `pdfExport.ts`, `pdfExportDistribution.ts`, `pdfExportLogbook.ts`, `sanitize.ts`
- **server**: `aiGateway.ts`, `api.ts`, `env.ts`, `security.ts`

## تدفق البيانات
1. الحالة والإعدادات في `localStorage` (مفاتيح `algeria_sciences_*` و`mizaniyati_*` و`daftar_*`).
2. عند تسجيل الدخول: `FirebaseDataSync` يقارن `updatedAt` السحابي بوقت آخر حفظ محلي ولا يستبدل الأحدث، ويوفّر `window.syncToCloud(type, data)` للأنواع: `config` و`annualDist` و`curriculum` و`logbook` و`timetable`.
3. طلبات الذكاء الاصطناعي تمر عبر `/api/gemini/*` (تحديد معدّل + تحقق من المرفقات + أخطاء منقّاة)، ولا تصل مفاتيح الخادم إلى المتصفح أبدًا.

## المتغيرات البيئية
| المتغير | الجهة | الغرض |
|---|---|---|
| `GEMINI_API_KEY` (أو `GOOGLE_API_KEY`) | خادم | مزود الذكاء الاصطناعي الرئيسي |
| `GEMINI_MODEL` | خادم | النموذج (الافتراضي `gemini-3.8-flash`) |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `HF_TOKEN` (+ `*_MODEL`) | خادم | مزودات احتياطية نصية |
| `AI_PROVIDER`, `AI_PROVIDER_FALLBACKS` | خادم | ترتيب المزودات |
| `AI_RATE_LIMIT_PER_MINUTE` | خادم | حد طلبات الذكاء الاصطناعي لكل IP (20) |
| `TRUST_PROXY` | خادم | عدد الوسطاء الموثوقين لقراءة IP الحقيقي |
| `PORT`, `NODE_ENV` | خادم | المنفذ والبيئة |
| `VITE_FIREBASE_*` | عميل | إعدادات Firebase (عامة بطبيعتها؛ الحماية عبر `firestore.rules`) |

عند إقلاع الخادم يطبع `src/server/env.ts` تقريرًا عن المتغيرات الناقصة أو غير الصالحة دون كشف أي قيمة سرية.

## التشغيل
`npm install` ← انسخ `.env.example` إلى `.env.local` ← `npm run dev` (تطوير) أو `npm run build && npm start` (إنتاج).
