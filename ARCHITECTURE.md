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
├── KNOWLEDGE_BASE.md         # دليل قاعدة معرفة المساعد (المنهاج/الوثيقة المرافقة/دليل الأستاذ/المذكرات)
├── scripts/                  # أدوات صيانة: refresh-ai-knowledge.mjs وingest_official_pdfs.py (تفريغ الوثائق الوزارية)
├── public/                   # favicon وصور وخلفيات ثابتة
└── src/
    ├── main.tsx, App.tsx, types.ts, index.css, vite-env.d.ts
    ├── components/           # 27 مكوّنًا
    ├── services/             # 20 ملفًا: الذكاء الاصطناعي، قاعدة المعرفة، ومصادر المذكرات
    ├── utils/                # 16 ملفًا: التصدير (Word/PDF) والتعقيم والتوزيع
    ├── server/               # api.ts وaiGateway.ts وsecurity.ts وenv.ts
    ├── data/                 # 43 ملفًا: المنهاج والتدرج والدفتر ومرجع قاعدة المعرفة
    │   └── official/         # 13 ملفًا مُولَّدًا: متن الوثائق الوزارية الحرفي (386 صفحة) + البيان والمحمِّلات
    └── types/                # أنواع إضافية (pedagogicalNote.ts وknowledge.ts)
```

## الملفات
- **components**: `AIAssistantChat.tsx`, `KnowledgeBasePanel.tsx`, `AccountSettings.tsx`, `AnnualDistribution.tsx`, `Auth.tsx`, `CalendarAdjustmentModal.tsx`, `CorrectionMemoDrawer.tsx`, `CurriculumDatabaseManager.tsx`, `DailyLogSheetTemplate.tsx`, `DailyLogbook.tsx`, `ErrorBoundary.tsx`, `FirebaseDataSync.tsx`, `InteractiveMaqta1.tsx`, `LevelsHomePage.tsx`, `MemoSheet.tsx`, `OfficialAnnualDistribution.tsx`, `PedagogicalNoteModal.tsx`, `PlatformInfoModal.tsx`, `PlatformNavigationDrawer.tsx`, `PreviewModal.tsx`, `SidebarControls.tsx`, `SourceMemo1AMViewer.tsx`, `TeacherOfficialStamp.tsx`, `UserProfile.tsx`
- **services**: `aiProviderRegistry.ts`, `aiSourcePriority.ts`, `conversationHistory.ts`, `correctionMemoAi.ts`, `correctionMemoImport.ts`, `correctionMemoModel.ts`, `expertLabStore.ts`, `geminiPedagogicalService.ts`, `geminiPrompts.ts`, `knowledgeBase.ts`, `knowledgeLibraryStore.ts`, `knowledgeOfficialSources.ts`, `knowledgeQuickTasks.ts`, `knowledgeSupplements.ts`, `memoAttachmentStore.ts`, `memoLearningStore.ts`, `memoSuggestionEngine.ts`, `officialPedagogicalSources.ts`, `scienceMemoModelLibrary.ts`, `smartAi.ts`
- **types**: `pedagogicalNote.ts`, `knowledge.ts` (عائلات المصادر، أنواع المعلومة، نتائج الاستخراج)
- **data (قاعدة المعرفة)**: `knowledgeBaseCorpus.ts` (المرجع المنهجي للمنهاج والوثيقة المرافقة ودليل الأستاذ وبنية المذكرة)، و`official/` (مُولَّد بـ `scripts/ingest_official_pdfs.py`: `types.ts` + `index.ts` فيه `OFFICIAL_SOURCES_MANIFEST` و`OFFICIAL_SOURCE_LOADERS` بمحمِّلات `import()` كسولة + 11 وحدة صفحات حرفية)
- **utils**: `annualDistributionDateUtils.ts`, `annualDistributionGenerator.ts`, `correctionMemoExport.ts`, `dailyLogbookGenerator.ts`, `designerPhoto.ts`, `docxExport.ts`, `docxExportDistribution.ts`, `docxExportLogbook.ts`, `html2canvasSanitizer.ts`, `pdfExport.ts`, `pdfExportDistribution.ts`, `pdfExportLogbook.ts`, `sanitize.ts`
- **server**: `aiGateway.ts`, `api.ts`, `env.ts`, `security.ts`

## تدفق البيانات
1. الحالة والإعدادات في `localStorage` (مفاتيح `algeria_sciences_*` و`mizaniyati_*` و`daftar_*`).
2. عند تسجيل الدخول: `FirebaseDataSync` يقارن `updatedAt` السحابي بوقت آخر حفظ محلي ولا يستبدل الأحدث، ويوفّر `window.syncToCloud(type, data)` للأنواع: `config` و`annualDist` و`curriculum` و`logbook` و`timetable`.
3. **قاعدة معرفة المساعد**: طبقتان — **نص رسمي حرفي** مُفرَّغ من 11 وثيقة وزارية (386 صفحة، ≈469 ألف حرف، حالة `official`، مُستشهدٌ به برقم الصفحة) و**قاعدة بنيوية** من بيانات المنصة والملخصات المنهجية (`reference`). يُفهرس الكل (≈2703 مقاطع في 27 وثيقة) في الذاكرة بفهرس مقلوب عربي (توحيد الحروف + TF‑IDF) في ≈100 ms ويُخزَّن بتوقيع. الوثائق الرسمية تُحمَّل كسولياً (`knowledgeOfficialSources.ts`) مع عزل فشل أي وثيقة، والخادم يحمّلها بنفسه فلا يُرسل العميل المتن في كل طلب. لكل سؤال: يُحدَّد النطاق (المستوى ← المقطع ← المورد ← تعلم المورد) ونوع المعلومة المطلوب، ثم تُسترجع المقاطع وتُعرض كاحتمالات موثقة أو تُرسل كسياق مُرقّم يقتبس منه النموذج. التفاصيل في [KNOWLEDGE_BASE.md](KNOWLEDGE_BASE.md).
4. طلبات الذكاء الاصطناعي تمر عبر `/api/gemini/*` (تحديد معدّل + تحقق من المرفقات + أخطاء منقّاة)، ولا تصل مفاتيح الخادم إلى المتصفح أبدًا.
5. نقاط `/api/knowledge/*` (status/search/extract) بحث محلي بلا ذكاء اصطناعي، وتستعمل نفس الوحدة `services/knowledgeBase.ts` على الخادم والعميل؛ وعند غياب أي مزود AI يجيب المساعد من قاعدة المعرفة بدل الخطأ.

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

## واجهات الخادم

| المسار | الوظيفة |
|---|---|
| `POST /api/gemini/generate` | توليد المذكرة البيداغوجية (JSON) |
| `POST /api/gemini/smart-assistant` | المساعد الخبير (نص + مرفقات + بحث ويب + قاعدة المعرفة) |
| `POST /api/gemini/analyze-correction-source` | تحليل ورقة الفرض/الاختبار |
| `POST /api/gemini/generate-pedagogical-note` | توليد المذكرة عبر المزودات الاحتياطية |
| `GET /api/gemini/assistant-status` · `GET /api/gemini/knowledge-status` · `GET /api/ai/providers` | حالات المزودات ولقطة المعرفة |
| `GET /api/knowledge/status` | أحجام فهرس قاعدة المعرفة ووثائقه + كتلة `officialSources` (بيان الوثائق الرسمية وصفحاتها وجودتها) |
| `POST /api/knowledge/search` | بحث حر في قاعدة المعرفة |
| `POST /api/knowledge/extract` | استخراج موجه يعيد عدة احتمالات موثقة |

## قواعد نظافة المستودع

الشيفرة الحيّة كلها داخل `src/` (+ `server.ts` و`vite.config.ts`)، و`tsconfig.json` يفحص
`["src", "server.ts", "vite.config.ts"]` فقط. لذلك:

- **لا تُنشئ نسخاً من ملفات `src/` عند جذر المستودع.** كان هناك 100 ملف جذري قديم (نسخ مطابقة
  ونسخ أقدم من `src/`) لا تُفحَص ولا تُحزَم ولا تُستورد، وأُزيلت؛ وكانت مصيدة تحرير: من يفتح
  `DailyLogbook.tsx` الجذري (188 ك.ب) يضيّع عمله لأن الحيّ هو `src/components/DailyLogbook.tsx` (204 ك.ب).
- **`src/data/official/` مولَّد** — مصدر الحقيقة `scripts/ingest_official_pdfs.py`.
- **`src/data/lessons*.ts` و`src/data/official_*.ts` و`curriculumDb.ts` مدخلات لخط التفريغ**: يبني منها
  `load_vocabulary()` مفردات المادة (12 109 كلمة) المستخدمة في قياس الجودة وإصلاح «امل». بعضها غير
  مستورد وقت التشغيل (مثل `lessons3am_maqta1..4.ts`) لكنه **ليس ميتاً** — حذفه يغيّر ناتج التفريغ.
- بيانات س1 غير الموصولة حالياً (`validate1am.ts`، `diagramSources1am.ts`، `diagrams1am.ts`) محفوظة
  عمداً: محتواها يخص قاعدة بيانات السنة الأولى وقد يُوصَل لاحقاً.

## التشغيل
`npm install` ← انسخ `.env.example` إلى `.env.local` ← `npm run dev` (تطوير) أو `npm run build && npm start` (إنتاج).

التقرير التفصيلي لقاعدة بيانات السنة الأولى متوسط وسجل التنظيف: [DATA_REPORT_1AM.md](DATA_REPORT_1AM.md).
