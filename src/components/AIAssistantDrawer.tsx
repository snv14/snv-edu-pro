import React, { useEffect, useMemo, useState } from 'react';
import { LessonMemo } from '../types';
import { askSmartAi } from '../services/smartAi';
import { ExpertLabBlock, setPendingExpertLabBlock } from '../services/expertLabStore';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  BookOpen,
  FlaskConical,
  HelpCircle,
  CheckCircle2,
  Trash2,
  Paperclip,
  Globe2,
  FileText,
  PlusCircle,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  category?: string;
  sources?: { title: string; uri: string }[];
}

interface AssistantAttachment {
  name: string;
  mimeType: string;
  dataUrl: string;
}

const QUICK_PROMPTS = [
  'استخرج عناوين الأنشطة الموثقة لهذا المورد من المنهاج والمذكرات، ثم اقترح بدائل منفصلة.',
  'ما الرسومات أو المخططات أو السندات التي يحتاجها هذا الدرس؟ أعطني مخططاً ووصفاً جاهزاً للرسم.',
  'اقترح تجربة مدرسية آمنة لهذا المورد مع الأدوات والخطوات والنتائج وبدائل عند غياب الوسائل.',
  'ابحث في الويب عن ملفات أو صور أو وثائق تعليمية مناسبة لهذا الموضوع، واذكر المصادر.',
  'أجب عن هذا السؤال العلمي بمستوى مناسب لـ 1AM/2AM/3AM/4AM مع تفسير واضح.',
  'حل هذا التمرين خطوة بخطوة، ثم أنشئ جواباً مختصراً يصلح للتلميذ.',
  'قارن بين الأنشطة المتاحة واختر بدائل بحسب الزمن والوسائل المتوفرة في القسم.',
  'أنشئ وضعية مشكلة وسندات وتعليمات تقود إلى مسعى تقصي دون الخروج عن التدرج.',
  'اقترح تقويماً ختامياً مع أسئلة ومؤشرات تصحيح مرتبطة بالهدف.',
  'حلل الملف المرفق واستخرج المعلومات التي يمكن استعمالها في الحصة مع ذكر مصدر كل معلومة.',
  'ابحث عن مذكرات وأدلة أساتذة وموارد تعليمية حول هذا المورد، وافصل الرسمي عن التكميلي.',
  'راجع إجابتي أو مذكرتي وحدد الأخطاء والتعارضات وما يحتاج إلى مراجعة الأستاذ.',
];

export const AIAssistantDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedLevel?: string;
  currentLesson?: LessonMemo | null;
  curriculumLessons?: LessonMemo[];
  onOpenPedagogicalModal?: () => void;
}> = ({ isOpen, onClose, selectedLevel, currentLesson, curriculumLessons = [], onOpenPedagogicalModal }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `مرحباً بك زميلي الأستاذ(ة)! 🌿\nأنا **المساعد البيداغوجي الذكي** لأساتذة مادة علوم الطبيعة والحياة للتعليم المتوسط.\n\nيمكنني مساعدتك في:\n• صياغة المشكلات العلمية والفرضيات التعليمية.\n• اقتراح خطوات التجارب المخبرية وبدائل الوسائل المتاحة.\n• ضبط صياغة معايير ومؤشرات التقويم والكفاءات الختامية.\n• تكييف الأنشطة البيداغوجية حسب المنهاج الجزائري المعتمد.\n\nكيف يمكنني دعمك اليوم في تحضير حصتك؟`,
      timestamp: 'الآن',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<AssistantAttachment[]>([]);
  const [useWeb, setUseWeb] = useState(true);
    const [assistantSources, setAssistantSources] = useState<Array<{title:string;uri:string}>>([]);
const [expertMode, setExpertMode] = useState(true);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [knowledgeDetails, setKnowledgeDetails] = useState<{ sources: { label: string; url: string; priority?: string }[]; updates: { title: string; summary: string; date: string; sourceTitle?: string; sourceUrl?: string; confidence?: string }[] } | null>(null);
  const [knowledgeStatus, setKnowledgeStatus] = useState<{ updatedAt: string | null; updateCount: number; lastRefresh?: { at?: string; resultCount?: number; searchUsed?: boolean } | null } | null>(null);
  const [assistantStatus, setAssistantStatus] = useState<{ ready: boolean; geminiConfigured: boolean; fallbackConfigured: boolean; webAndFileFeatures: boolean; message: string } | null>(null);

  const [labBlocks, setLabBlocks] = useState<ExpertLabBlock[]>(() => {
    try {
      const raw = localStorage.getItem('expert_lab_blocks_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [labFilter, setLabFilter] = useState<'all' | 'experiment' | 'diagram' | 'activity' | 'image'>('all');

  const makeLabBlock = (
    queryText: string,
    replyText: string,
    sources: { title: string; uri: string }[] = []
  ): ExpertLabBlock => {
    const qText = queryText.toLowerCase();
    let type: ExpertLabBlock['type'] = 'general';
    if (qText.includes('تجربة') || qText.includes('مخبر') || qText.includes('بروتوكول')) {
      type = 'experiment';
    } else if (qText.includes('رسم') || qText.includes('تخطيطي') || qText.includes('مخطط')) {
      type = 'diagram';
    } else if (qText.includes('نشاط') || qText.includes('مهمة') || qText.includes('تعليمات')) {
      type = 'activity';
    } else if (qText.includes('صورة') || qText.includes('وثيقة') || qText.includes('سند') || qText.includes('مصادر')) {
      type = 'image';
    }

    const firstLine = replyText.trim().split('\n')[0].replace(/[#*`]/g, '').trim();
    const title = firstLine.length > 0 && firstLine.length < 60 ? firstLine : queryText.slice(0, 50);

    return {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      content: replyText,
      createdAt: new Date().toISOString(),
      sources,
    };
  };

  const saveLabBlock = (block: ExpertLabBlock) => {
    setLabBlocks((prev) => {
      const updated = [block, ...prev.filter((b) => b.id !== block.id)].slice(0, 20);
      try {
        localStorage.setItem('expert_lab_blocks_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const insertLabBlockIntoMemo = (block: ExpertLabBlock) => {
    setPendingExpertLabBlock(block);
    if (onOpenPedagogicalModal) {
      onOpenPedagogicalModal();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch('/api/gemini/assistant-status')
      .then(async (res) => res.ok ? res.json() : null)
      .then((data) => { if (!cancelled && data) setAssistantStatus(data); })
      .catch(() => { /* status is optional */ });
    fetch('/api/gemini/knowledge-status')
      .then(async (res) => res.ok ? res.json() : null)
      .then((data) => { if (!cancelled && data) setKnowledgeStatus(data); })
      .catch(() => { /* status is optional and must not block the assistant */ });
    return () => { cancelled = true; };
  }, [isOpen]);

  const knowledgeLabel = knowledgeStatus?.updatedAt
    ? `المعرفة: ${new Date(knowledgeStatus.updatedAt).toLocaleDateString('ar-DZ')}`
    : 'المعرفة: في انتظار أول تحديث';

  const loadKnowledgeDetails = async () => {
    try {
      const res = await fetch('/api/gemini/knowledge-status');
      if (!res.ok) return;
      const data = await res.json();
      setKnowledgeDetails({
        sources: Array.isArray(data.sources) ? data.sources : [],
        updates: Array.isArray(data.updates) ? data.updates : [],
      });
      setShowKnowledge(true);
    } catch {
      setShowKnowledge(true);
    }
  };

  const smartContext = useMemo(() => currentLesson ? [
    'المستوى: ' + (selectedLevel || currentLesson.level),
    'الميدان: ' + currentLesson.midan,
    'المقطع: ' + currentLesson.maqta,
    'المورد: ' + currentLesson.mawrid,
    'تعلم المورد: ' + currentLesson.ta3alom,
    'عدد الأنشطة: ' + currentLesson.anshita.length,
    'حالة المصدر: ' + (currentLesson.sourceOfficial ? 'رسمي' : 'عمل')
  ].join(' • ') : 'لا يوجد مورد تعلم محدد حالياً.', [currentLesson, selectedLevel]);

  if (!isOpen) return null;

  const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('تعذر قراءة الملف'));
    reader.readAsDataURL(file);
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const accepted = new Set([
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]);
    const incoming = Array.from(files).slice(0, 4 - attachments.length);
    try {
      const next: AssistantAttachment[] = [];
      for (const file of incoming) {
        if (!accepted.has(file.type)) continue;
        if (file.size > 15 * 1024 * 1024) continue;
        next.push({ name: file.name, mimeType: file.type, dataUrl: await readFileAsDataUrl(file) });
      }
      if (next.length) setAttachments(prev => [...prev, ...next].slice(0, 4));
    } catch (error) {
      console.error('[smart-ai] attachment read failed', error);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText.trim();
    const activeContext = smartContext;
    if (!query) return;
    const q = query.toLowerCase();

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const liveReply = await askSmartAi({
        question: query,
        lesson: currentLesson,
        curriculum: curriculumLessons,
        attachments,
        useWeb,
        level: selectedLevel,
        expertMode,
      });
      let reply = liveReply?.text || '';
      if (reply) {
        saveLabBlock(makeLabBlock(query, reply, liveReply?.sources || []));
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: reply,
          sources: liveReply?.sources || [],
          timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setAttachments([]);
        setIsTyping(false);
        return;
      }
      if ((q.includes('المورد الحالي') || q.includes('السياق الحالي')) && currentLesson) {
        reply = 'السياق الذكي للمورد الحالي:\n' + activeContext + '\n\nالمركبة: ' + (currentLesson.markaba || 'غير محددة') + '\nالمعرفة: ' + (currentLesson.marifa || 'غير محددة') + '\nالمنهجية: ' + (currentLesson.manhaji || 'غير محددة') + '\nالوضعية: ' + (currentLesson.wadiya || 'غير محددة') + '\nالمشكلة: ' + (currentLesson.moshkila || 'غير محددة') + '\nالفرضيات: ' + (currentLesson.faradiyat || 'غير محددة');
      } else if (q.includes('كم نشاط') && currentLesson) {
        reply = 'وفق قاعدة البيانات الحالية، هذا المورد يحتوي على ' + currentLesson.anshita.length + ' نشاط/أنشطة.';
      }
      if (q.includes('وضعية') || q.includes('مشكلة') || q.includes('انطلاق')) {
        reply = `**إرشادات لصياغة وضعية انطلاق فعالة:**\n1. **السياق**: الانطلاق من واقع المتعلم المعيش أو حدث صحي/بيئي ملموس (مثال: وجبة عائلية، ممارسة رياضة، حادث منزلي).\n2. **السندات**: صورة معبرة، نتائج تحاليل دم، أو وثيقة جدولية بسيطة تثير تساؤلاً.\n3. **المشكل العلمي**: صياغة سؤال دقيق يبدأ بـ (كيف..؟ / ما هو دور..؟ / فسر..؟) يحمل تناقضاً ظاهرياً يدفع المتعلم لبناء فرضيات.\n4. **التعليمات**: توجيه المتعلم لاقتراح فرضيات تفسيرية قابلة للتحقق تجريبياً أو وثائقياً.`;
      } else if (q.includes('تجربة') || q.includes('مخبر') || q.includes('نشا') || q.includes('كشف')) {
        reply = `**البروتوكول التجريبي المقترح:**\n• **الكشف عن النشا**: إضافة قطرات من ماء اليود (Lugol) ➔ ظهور لون أزرق بنفسجي دلالة وجود النشا.\n• **الكشف عن السكريات المرجعة**: إضافة محلول فهلنك (A+B) مع التسخين المعتدل ➔ ظهور راسب أحمر آجوري.\n• **الكشف عن البروتينات**: تفاعل حمض الآزوت أو تفاعل البيوري (NaOH + CuSO4) ➔ ظهور لون أصفر أو بنفسجي.\n• **بدائل مدرسية**: استخدام قطع الخبز، زلال البيض المخفف، عصير العنب الطازج.`;
      } else if (q.includes('إرادية') || q.includes('لاإرادية') || q.includes('عصبي')) {
        reply = `**مقارنة بيداغوجية لمستوى 4 متوسط:**\n• **الحركة الإرادية**: مركزها العصبي هو **القشرة المخية** (السطح الحركي)، الرسالة نابذة، الهدف منها تحقيق رغبة شعورية.\n• **الفعل اللاإرادي (المنعكس الفطري)**: مركزه العصبي هو **النخاع الشوكي**، استجابة متماثلة وسريعة لحماية العضوية من الأخطار.\n• **عناصر القوس الانعكاسي**: مستقبل حسي ➔ ناقل حسي (عصب جابذ) ➔ مركز عصبي (نخاع شوكي) ➔ ناقل حركي (عصب نابذ) ➔ عضو منفذ (عضلة).`;
      } else if (q.includes('توقيت') || q.includes('زمن') || q.includes('ساعة')) {
        reply = `**التوزيع الزمني النموذجي لحصة (60 دقيقة):**\n• **وضعية الانطلاق والمشكل العلمي**: 5 إلى 10 دقائق.\n• **مرحلة البحث وتقصي الأنشطة (العمل الميداني/الفوجي)**: 30 إلى 35 دقيقة.\n• **إرساء الموارد وصياغة الخلاصة المعرفية**: 10 إلى 15 دقيقة.\n• **تقويم الموارد والتمرين التطبيقي**: 5 دقائق.`;
      } else {
        const levelCount = curriculumLessons.filter(l => l.level === currentLesson?.level).length;
        reply = `شكراً لسؤالك البيداغوجي القيم! بخصوص **"${query}"**:\n\nبناءً على التدرج البيداغوجي لوزارة التربية الوطنية لمادة علوم الطبيعة والحياة:\n• يُنصح دائماً بربط التعلمات بمؤشرات الكفاءة الختامية وتفعيل أسلوب التقصي وحل المشكلات.\n• يمكنك تضمين هذه الملاحظات في خانة الملاحظات بالدفتر اليومي أو في المذكرة البيداغوجية مباشرة.\n• النظام الذكي مرتبط حالياً بـ ${levelCount} سجل في مستوى المورد الحالي.\n• هل ترغب في اقتراح نشاط صفي مدعم أو وضعية تقويمية محددة لهذا المورد؟`;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    } catch (error) {
      console.error('[smart-ai]', error);
      const errorText = error instanceof Error && error.message
        ? error.message
        : (assistantStatus?.message || 'تعذر الوصول إلى المساعد الذكي حالياً. تحقق من إعداد مفتاح Gemini على الخادم ثم حاول مرة أخرى.');
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: errorText,
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsTyping(false);
    }
  };

  return (
    <div
      id="ai-assistant-drawer"
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-l from-[#0f766e]/10 to-teal-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-gray-900 text-[15px]">المساعد البيداغوجي الذكي</h3>
                <span className="bg-teal-100 text-teal-800 text-[10.5px] font-black px-2 py-0.5 rounded-full">
                  AI
                </span>
              </div>
              <p className="text-[11.5px] text-gray-500 font-medium">
                استشارات المنهاج، الوثيقة المرافقة، المذكرات، التدرجات والمستجدات العلمية
              </p>
              <div className="mt-1 text-[10px] text-emerald-700 font-bold truncate max-w-[340px]">
                السياق الذكي: {currentLesson?.ta3alom || 'لا يوجد مورد محدد'}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[9.5px] font-bold text-slate-500">
                <span>{knowledgeLabel}</span>
                <span>•</span>
                <span>{knowledgeStatus?.updateCount ?? 0} مستجدات</span>
                <span>•</span>
                <span className={assistantStatus?.webAndFileFeatures ? 'text-emerald-700' : 'text-amber-700'}>{assistantStatus?.webAndFileFeatures ? 'ويب + ملفات جاهزان' : 'الويب/الملفات يحتاجان إعداد Gemini'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    id: 'welcome',
                    sender: 'ai',
                    text: 'تمت إعادة تهيئة المحادثة. كيف يمكنني مساعدتك في تحضير حصص علوم الطبيعة والحياة؟',
                    timestamp: 'الآن',
                  },
                ])
              }
              title="مسح المحادثة"
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 font-black text-lg transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center justify-between gap-2">
          <div className="text-[10px] font-bold text-slate-600">
            قاعدة المعرفة المستمرة: المنهاج + الوثائق + المستجدات
          </div>
          <button type="button" onClick={() => void loadKnowledgeDetails()} className="text-[10px] font-black text-teal-700 hover:text-teal-900">
            مركز المعرفة
          </button>
        </div>

        {showKnowledge && (
          <div className="absolute top-[112px] right-0 z-20 w-full max-w-lg max-h-[65vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl rounded-bl-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-black text-gray-900 text-sm">مركز معرفة المساعد</div>
                <div className="text-[10px] text-gray-500">المصدر الرسمي لا يُستبدل تلقائياً بمعلومة من الويب.</div>
              </div>
              <button type="button" onClick={() => setShowKnowledge(false)} className="text-gray-500 font-black">✕</button>
            </div>
            <div className="space-y-3">
              <section>
                <div className="text-[10px] font-black text-emerald-700 mb-1.5">المصادر المعتمدة</div>
                <div className="space-y-1">
                  {(knowledgeDetails?.sources || []).map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-900 hover:underline">
                      {source.label}
                    </a>
                  ))}
                </div>
              </section>
              <section>
                <div className="text-[10px] font-black text-blue-700 mb-1.5">آخر المستجدات</div>
                {(knowledgeDetails?.updates || []).length === 0 ? (
                  <div className="text-[10px] text-gray-500 p-2 bg-gray-50 rounded-lg">لا توجد مستجدات محفوظة بعد. سيُملأ السجل عند تشغيل أول تحديث.</div>
                ) : (
                  <div className="space-y-2">
                    {knowledgeDetails?.updates.map((item, index) => (
                      <article key={item.sourceUrl + item.title + index} className="p-2.5 rounded-lg border border-gray-200 bg-gray-50">
                        <div className="text-[11px] font-black text-gray-800">{item.title}</div>
                        <div className="mt-1 text-[10px] leading-relaxed text-gray-600">{item.summary}</div>
                        <div className="mt-1 text-[9px] text-gray-400">{item.date} • الثقة: {item.confidence || 'متوسطة'}</div>
                        {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-[9px] text-blue-700 hover:underline">{item.sourceTitle || item.sourceUrl}</a>}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* Action Banner to Generate Official Pedagogical Note */}
        {onOpenPedagogicalModal && (
          <div className="p-3 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-b border-emerald-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-emerald-950 block">
                  توليد مذكرة بيداغوجية رسمية بالذكاء الاصطناعي
                </span>
                <span className="text-[10.5px] text-gray-600 block">
                  منهاج الجيل الثاني: الثلاثية، المراحل الأربع، بطاقة العمل، وشبكة BEM
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenPedagogicalModal}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer shrink-0"
            >
              فتح الأداة ✨
            </button>
          </div>
        )}

        <div className="border-b border-emerald-100 bg-emerald-50/60 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-900"><FlaskConical className="w-3.5 h-3.5" /> مختبر التحضير الخبير</div><span className="text-[9px] text-gray-500">{labBlocks.length} مخرجات</span></div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">{([['experiment','🧪 تجربة'],['diagram','📊 رسم'],['activity','📝 نشاط'],['image','🖼️ مصادر']] as const).map(([type,label]) => <button key={type} type="button" onClick={() => setLabFilter(type)} className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${labFilter===type ? 'bg-emerald-700 text-white' : 'bg-white text-gray-700'}`}>{label}</button>)}<button type="button" onClick={() => setLabFilter('all')} className="px-2 py-1 rounded-lg border text-[10px] font-bold bg-white">الكل</button></div>
          {labBlocks.filter(b => labFilter === 'all' || b.type === labFilter).slice(0,3).map(block => <div key={block.id} className="bg-white border border-emerald-100 rounded-xl p-2.5"><div className="text-[10px] font-black">{block.title}</div><div className="mt-1 text-[10px] leading-relaxed text-gray-600 max-h-16 overflow-hidden whitespace-pre-line">{block.content}</div><button type="button" onClick={() => insertLabBlockIntoMemo(block)} className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[10px] font-black"><PlusCircle className="w-3 h-3" /> إدراج في المذكرة</button></div>)}
          {labBlocks.length===0 && <div className="text-[10px] text-gray-500 bg-white border border-dashed border-emerald-200 rounded-lg p-2">اطلب تجربة أو رسماً أو نشاطاً، وسيظهر الناتج هنا.</div>}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                  m.sender === 'user' ? 'bg-gray-800' : 'bg-teal-700'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-[13px] leading-relaxed font-medium shadow-2xs whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-gray-900 text-white rounded-tl-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tr-none'
                }`}
              >
                {m.text}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200 space-y-1.5">
                    <div className="text-[10px] font-black text-teal-700 flex items-center gap-1">
                      <Globe2 className="w-3 h-3" /> مصادر الويب المستخدمة
                    </div>
                    {m.sources.map((source) => (
                      <a
                        key={source.uri}
                        href={source.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-[10px] text-blue-700 hover:underline truncate"
                        title={source.uri}
                      >
                        {source.title}
                      </a>
                    ))}
                  </div>
                )}
                <div
                  className={`text-[10px] mt-1.5 text-left ${
                    m.sender === 'user' ? 'text-gray-400' : 'text-gray-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold p-2">
              <Bot className="w-4 h-4 text-teal-700 animate-spin" />
              <span>المساعد يحلل طلبك ويكتب الإجابة...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="p-3 border-t border-gray-200 bg-white space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>أسئلة ومقترحات سريعة:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-gray-100 hover:bg-teal-50 hover:text-teal-900 border border-gray-200 text-gray-700 font-medium transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-teal-50 border border-gray-200 text-[11px] font-bold text-gray-700 cursor-pointer">
              <Paperclip className="w-3.5 h-3.5" />
              إرفاق منهاج/وثيقة/مذكرة
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => { void handleFiles(e.target.files); e.currentTarget.value = ''; }}
              />
            </label>
            <button
              type="button"
              onClick={() => setUseWeb(v => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition ${useWeb ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
              title="تفعيل البحث في الإنترنت عند الحاجة"
            >
              <Globe2 className="w-3.5 h-3.5" />
              الإنترنت {useWeb ? 'مفعل' : 'متوقف'}
            </button>
            <button
              type="button"
              onClick={() => setExpertMode(v => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition ${expertMode ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              نمط الأستاذ الخبير {expertMode ? 'مفعل' : 'متوقف'}
            </button>
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {attachments.map((file, index) => (
                <span key={file.name + index} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 max-w-full">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[180px]">{file.name}</span>
                  <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="font-black">×</button>
                </span>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اسأل عن المنهاج، المذكرات، الوثيقة المرافقة أو أي موضوع علمي..."
              className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="p-2 bg-teal-700 text-white rounded-xl hover:bg-teal-800 disabled:opacity-40 transition shadow-xs cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
