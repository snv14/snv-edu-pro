import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot, Check, Clipboard, Database, Layers, Loader2, MessageSquarePlus, Paperclip,
  Send, Sparkles, User, X,
} from 'lucide-react';
import { LessonMemo } from '../types';
import type { TeacherKnowledgeDoc } from '../types/knowledge';
import { askSmartAi, SmartAiMessage, SmartAiSource } from '../services/smartAi';
import { clearConversation, conversationContext, loadConversation, saveConversation } from '../services/conversationHistory';
import { loadKnowledgeSettings, saveKnowledgeSettings, type KnowledgeSettings } from '../services/knowledgeLibraryStore';
import { loadOcrSupplement } from '../services/knowledgeSupplements';
import { preloadOfficialSources } from '../services/knowledgeOfficialSources';
import { buildQuickTaskPrompt, describeScope, KNOWLEDGE_QUICK_TASKS } from '../services/knowledgeQuickTasks';
import type { KnowledgeReference } from '../services/knowledgeBase';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';

interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
}

interface ChatEntry {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  sources?: SmartAiSource[];
  notice?: string;
  failed?: boolean;
  knowledge?: KnowledgeReference[];
  scopeLabel?: string;
  fromKnowledgeBase?: boolean;
}

const MAX_ATTACHMENTS = 4;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const ACCEPTED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const GREETING = [
  'مرحباً زميلي الأستاذ(ة). أنا مساعدك البيداغوجي في محادثة مباشرة: اسأل كما تشاء أو ارفع صورة/PDF/Word لورقة تقويم.',
  'أجيب من قاعدة المنصة: المنهاج، الوثيقة المرافقة، دليل الأستاذ، والمذكرات المعتمدة — وأعرض المصادر مع كل جواب.',
].join('\n');

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const clock = (date = new Date()) => date.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });

const readAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(reader.error || new Error('تعذر قراءة الملف'));
  reader.readAsDataURL(file);
});

const toEntries = (messages: SmartAiMessage[]): ChatEntry[] => messages.map(message => ({
  id: makeId(),
  sender: message.role === 'user' ? 'user' : 'ai',
  text: message.text,
  time: clock(),
}));

/** عرض مبسّط لعناصر Markdown الشائعة داخل فقاعات المحادثة (بلا مكتبات). */
const renderInline = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g).filter(part => part !== '');
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key} className="font-black text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={key} className="rounded bg-slate-100 px-1 py-0.5 text-[11.5px] font-mono text-teal-900">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
};

export const ChatRichText: React.FC<{ text: string }> = ({ text }) => {
  const lines = String(text || '').split('\n');
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={`my-1 space-y-1 pr-4 ${list.ordered ? 'list-decimal' : 'list-disc'}`}
      >
        {list.items.map((item, index) => (
          <li key={index} className="leading-relaxed">{renderInline(item, `li-${blocks.length}-${index}`)}</li>
        ))}
      </Tag>
    );
    list = null;
  };

  lines.forEach((raw, index) => {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) {
      flush();
      return;
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flush();
      const level = heading[1].length;
      blocks.push(
        <p
          key={`h-${index}`}
          className={`mt-2 mb-1 font-black text-slate-900 ${level <= 2 ? 'text-[14px]' : 'text-[13px]'}`}
        >
          {renderInline(heading[2], `h-${index}`)}
        </p>
      );
      return;
    }
    if (/^(?:---|—{3,}|\*{3,})$/.test(line.trim())) {
      flush();
      blocks.push(<hr key={`hr-${index}`} className="my-2 border-slate-200" />);
      return;
    }
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      if (!list || list.ordered) {
        flush();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
      return;
    }
    const ordered = line.match(/^\s*(\d{1,2})[.)]\s+(.*)$/);
    if (ordered) {
      if (!list || !list.ordered) {
        flush();
        list = { ordered: true, items: [] };
      }
      list.items.push(ordered[2]);
      return;
    }
    if (/^>\s?/.test(line)) {
      flush();
      blocks.push(
        <p key={`q-${index}`} className="my-1 border-r-4 border-teal-300 bg-teal-50/60 px-2 py-1 text-[12.5px] text-slate-700">
          {renderInline(line.replace(/^>\s?/, ''), `q-${index}`)}
        </p>
      );
      return;
    }
    flush();
    blocks.push(
      <p key={`p-${index}`} className="leading-relaxed">{renderInline(line, `p-${index}`)}</p>
    );
  });
  flush();

  return <div className="space-y-0.5">{blocks}</div>;
};

const SourceChip: React.FC<{ reference: KnowledgeReference }> = ({ reference }) => (
  <details className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-2 py-1">
    <summary className="cursor-pointer list-none text-[10.5px] font-bold text-emerald-900 truncate">
      {reference.kindLabel} · {reference.facetLabel} — {reference.section}
    </summary>
    <p className="mt-1 text-[10.5px] text-slate-700 whitespace-pre-line leading-relaxed">{reference.snippet}</p>
    <p className="mt-1 text-[9.5px] text-slate-500">
      {reference.title}{reference.scopeLabel ? ` — ${reference.scopeLabel}` : ''} [{reference.statusLabel}]
      {reference.url ? (
        <a href={reference.url} target="_blank" rel="noreferrer" className="mr-1 text-blue-700 hover:underline">فتح المصدر</a>
      ) : null}
    </p>
  </details>
);

export const AIAssistantDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedLevel?: string;
  currentLesson?: LessonMemo | null;
  curriculumLessons?: LessonMemo[];
}> = ({ isOpen, onClose, selectedLevel, currentLesson, curriculumLessons = [] }) => {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [fileError, setFileError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [knowledgeSettings, setKnowledgeSettings] = useState<KnowledgeSettings>(() => loadKnowledgeSettings());
  const [ocrDocs, setOcrDocs] = useState<TeacherKnowledgeDoc[]>([]);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const stored = loadConversation(selectedLevel);
    const restored = stored ? toEntries(stored.messages) : [];
    setEntries(restored.length ? restored : [{ id: 'greeting', sender: 'ai', text: GREETING, time: clock() }]);
  }, [isOpen, selectedLevel]);

  useEffect(() => {
    if (!isOpen) return;
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [entries, pending, isOpen, showKnowledge]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!isOpen || !knowledgeSettings.includeOcrSupplement) {
      setOcrDocs([]);
      return;
    }
    let active = true;
    void loadOcrSupplement().then(doc => { if (active) setOcrDocs(doc ? [doc] : []); });
    void preloadOfficialSources();
    return () => { active = false; };
  }, [isOpen, knowledgeSettings.includeOcrSupplement]);

  const taskScope = useMemo(() => ({
    level: selectedLevel || currentLesson?.level,
    midan: currentLesson?.midan,
    maqta: currentLesson?.maqta,
    mawrid: currentLesson?.mawrid,
    ta3alom: currentLesson?.ta3alom,
  }), [selectedLevel, currentLesson]);

  const useQuickTask = (taskId: string) => {
    const task = KNOWLEDGE_QUICK_TASKS.find(item => item.id === taskId);
    if (!task) return;
    setDraft(buildQuickTaskPrompt(task, taskScope));
    setShowKnowledge(false);
    setShowTools(false);
    inputRef.current?.focus();
  };

  const askSolutionFromDb = () => {
    setDraft(`اقترح حلولاً من قاعدة بيانات المنصة لـ${describeScope(taskScope)}: أسئلة التقويم مع الأجوبة المرتقبة وسلّم تنقيط مختصر. اعتمد على المصادر الموثقة فقط، وضع أي إضافة جديدة تحت وسم «اقتراح تربوي — يحتاج مراجعة الأستاذ».`);
    setShowKnowledge(false);
    setShowTools(false);
    inputRef.current?.focus();
  };

  const history = useMemo<SmartAiMessage[]>(() => conversationContext(
    entries
      .filter(entry => entry.id !== 'greeting' && !entry.failed)
      .map(entry => ({ role: entry.sender === 'user' ? 'user' : 'assistant', text: entry.text }))
  ), [entries]);

  if (!isOpen) return null;

  const persist = (next: ChatEntry[]) => {
    saveConversation(
      next
        .filter(entry => entry.id !== 'greeting' && !entry.failed)
        .map(entry => ({ role: entry.sender === 'user' ? 'user' : 'assistant', text: entry.text })),
      selectedLevel
    );
  };

  const updateEntries = (updater: (previous: ChatEntry[]) => ChatEntry[]) => {
    setEntries(previous => {
      const next = updater(previous);
      persist(next);
      return next;
    });
  };

  const resetConversation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearConversation(selectedLevel);
    setAttachments([]);
    setFileError('');
    setDraft('');
    setPending(false);
    setEntries([{ id: 'greeting', sender: 'ai', text: GREETING, time: clock() }]);
    inputRef.current?.focus();
  };

  const addFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setFileError('');
    const incoming = Array.from(files).slice(0, MAX_ATTACHMENTS - attachments.length);
    const accepted: ChatAttachment[] = [];
    for (const file of incoming) {
      const type = file.type || '';
      if (!ACCEPTED_TYPES.has(type)) {
        setFileError(`نوع الملف «${file.name}» غير مدعوم. المدعوم: صور، PDF، Word، TXT.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`حجم الملف «${file.name}» يتجاوز 15 ميغابايت.`);
        continue;
      }
      try {
        accepted.push({ id: makeId(), name: file.name, mimeType: type, dataUrl: await readAsDataUrl(file) });
      } catch {
        setFileError(`تعذر قراءة الملف «${file.name}».`);
      }
    }
    if (accepted.length) setAttachments(previous => [...previous, ...accepted].slice(0, MAX_ATTACHMENTS));
  };

  const send = async () => {
    const question = draft.trim();
    if (!question || pending) return;

    const outgoingAttachments = attachments;
    const previousHistory = history;

    setDraft('');
    setAttachments([]);
    setFileError('');
    setPending(true);
    updateEntries(previous => [...previous, { id: makeId(), sender: 'user', text: question, time: clock() }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const reply = await askSmartAi({
        question,
        lesson: currentLesson,
        curriculum: curriculumLessons,
        attachments: outgoingAttachments.map(({ name, mimeType, dataUrl }) => ({ name, mimeType, dataUrl })),
        useWeb: true,
        level: selectedLevel,
        expertMode: true,
        history: previousHistory,
        signal: controller.signal,
        knowledge: {
          enabled: true,
          settings: knowledgeSettings,
          extraDocs: ocrDocs,
          topK: knowledgeSettings.topK,
        },
      });

      const text = (reply?.text || '').trim();
      if (!text) {
        updateEntries(previous => [...previous, {
          id: makeId(),
          sender: 'ai',
          text: 'لم يصل رد من المزود. أعد الإرسال، وإن تكرر التحقق من إعداد مفتاح الخدمة على الخادم.',
          time: clock(),
          failed: true,
        }]);
        return;
      }

      updateEntries(previous => [...previous, {
        id: makeId(),
        sender: 'ai',
        text,
        time: clock(),
        sources: reply?.sources?.length ? reply.sources : undefined,
        notice: reply?.fallbackNotice,
        knowledge: reply?.knowledge?.length ? reply.knowledge : undefined,
        scopeLabel: reply?.extraction?.scopeLabel || undefined,
        fromKnowledgeBase: reply?.localAnswer,
      }]);
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error && error.message
        ? error.message
        : 'تعذر الحصول على رد الآن. تحقق من اتصال الخادم بمزود الذكاء الاصطناعي.';
      updateEntries(previous => [...previous, { id: makeId(), sender: 'ai', text: message, time: clock(), failed: true }]);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setPending(false);
      inputRef.current?.focus();
    }
  };

  const copyEntry = async (entry: ChatEntry) => {
    try {
      await navigator.clipboard.writeText(entry.text);
      setCopiedId(entry.id);
      window.setTimeout(() => setCopiedId(current => (current === entry.id ? null : current)), 1500);
    } catch {
      setCopiedId(null);
    }
  };

  const contextLabel = currentLesson?.ta3alom
    ? `المورد: ${currentLesson.ta3alom}`
    : (selectedLevel ? `المستوى: ${selectedLevel}` : 'بدون مورد محدد');

  const conversationStarted = entries.some(entry => entry.sender === 'user');
  const lastEntry = entries[entries.length - 1];

  const quickTaskList = (
    <div className="space-y-1">
      <button
        type="button"
        onClick={askSolutionFromDb}
        className="w-full text-right inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-2 text-[11.5px] font-black text-teal-900 hover:bg-teal-100 transition"
      >
        <Database className="w-3.5 h-3.5 shrink-0" />
        حلول من قاعدة البيانات
      </button>
      {KNOWLEDGE_QUICK_TASKS.map(task => (
        <button
          key={task.id}
          type="button"
          onClick={() => useQuickTask(task.id)}
          title={task.hint}
          className="w-full text-right inline-flex items-center gap-2 rounded-xl border border-transparent px-2.5 py-1.5 text-[11.5px] font-bold text-slate-700 hover:bg-slate-100 transition"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
          <span className="truncate">{task.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div
      id="ai-assistant-chat"
      className="fixed inset-0 z-50 bg-[#eef3f1] flex"
      dir="rtl"
      aria-label="محادثة المساعد التربوي"
    >
      {/* شريط الأدوات الجانبي (سطح المكتب) */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
        <div className="px-3 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center"><Bot className="w-5 h-5" /></div>
            <div className="min-w-0">
              <p className="text-[13px] font-black text-slate-900">المساعد التربوي</p>
              <p className="text-[10px] text-slate-500 truncate">دردشة مع قاعدة المنصة</p>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2">
          <button
            type="button"
            onClick={resetConversation}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-3 py-2 text-[12px] font-black text-white hover:bg-teal-800 transition"
          >
            <MessageSquarePlus className="w-4 h-4" /> محادثة جديدة
          </button>
          <button
            type="button"
            onClick={() => setShowKnowledge(open => !open)}
            aria-expanded={showKnowledge}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-black transition ${showKnowledge ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}`}
          >
            <Database className="w-4 h-4" /> قاعدة المعرفة
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
            <p className="text-[10px] font-black text-slate-400">النطاق الحالي</p>
            <p className="text-[11.5px] font-bold text-slate-800 mt-0.5">{contextLabel}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{describeScope(taskScope)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <p className="px-2 pb-1 text-[10px] font-black text-slate-400">مهام سريعة</p>
          {quickTaskList}
        </div>

        <div className="p-3 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={() => setKnowledgeSettings(saveKnowledgeSettings({ localFirst: !knowledgeSettings.localFirst }))}
            aria-pressed={knowledgeSettings.localFirst}
            className={`w-full inline-flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-[11px] font-black transition ${knowledgeSettings.localFirst ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-200 text-slate-600'}`}
          >
            <span className="inline-flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> استخراج مباشر</span>
            <span className={`h-2 w-2 rounded-full ${knowledgeSettings.localFirst ? 'bg-teal-600' : 'bg-slate-300'}`} />
          </button>
          <p className="text-[9.5px] leading-relaxed text-slate-400">
            المصادر: المنهاج، الوثيقة المرافقة، دليل الأستاذ، والمذكرات. التدرج السنوي مستثنى.
          </p>
        </div>
      </aside>

      {/* عمود المحادثة */}
      <section className="flex-1 min-w-0 flex flex-col h-full bg-white lg:bg-transparent" aria-label="نافذة الدردشة">
        <header className="shrink-0 px-2.5 sm:px-5 py-2 bg-white border-b border-slate-200 flex items-center gap-2">
          <button type="button" onClick={onClose} aria-label="إغلاق المحادثة" className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition shrink-0">
            <X className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1 text-center sm:text-right">
            <h2 className="font-black text-[13px] leading-tight text-slate-900 truncate">المحادثة التربوية</h2>
            <p className="text-[10px] text-slate-500 truncate">{contextLabel}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowTools(open => !open)}
              title="أدوات المحادثة والمهام السريعة"
              aria-label="أدوات المحادثة"
              aria-expanded={showTools}
              className="lg:hidden p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowKnowledge(open => !open)}
              title="قاعدة المعرفة: المنهاج، الوثيقة المرافقة، دليل الأستاذ، المذكرات"
              aria-label="قاعدة المعرفة"
              aria-pressed={showKnowledge}
              className={`inline-flex items-center gap-1 px-2 py-2 rounded-lg text-[10.5px] font-bold transition ${showKnowledge ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <Database className="w-4 h-4" /> <span className="hidden sm:inline">القاعدة</span>
            </button>
            <button
              type="button"
              onClick={resetConversation}
              title="محادثة جديدة"
              aria-label="محادثة جديدة"
              className="inline-flex items-center gap-1 px-2 py-2 rounded-lg text-[10.5px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <MessageSquarePlus className="w-4 h-4" /> <span className="hidden sm:inline">جديدة</span>
            </button>
          </div>
        </header>

        {showTools && !showKnowledge && (
          <div className="lg:hidden shrink-0 border-b border-slate-200 bg-white px-3 py-2 space-y-2 max-h-[45vh] overflow-y-auto">
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
              <p className="text-[10px] font-black text-slate-400">النطاق الحالي</p>
              <p className="text-[11.5px] font-bold text-slate-800">{contextLabel}</p>
              <p className="text-[10px] text-slate-500">{describeScope(taskScope)}</p>
            </div>
            {quickTaskList}
            <button
              type="button"
              onClick={() => setKnowledgeSettings(saveKnowledgeSettings({ localFirst: !knowledgeSettings.localFirst }))}
              aria-pressed={knowledgeSettings.localFirst}
              className={`w-full inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[11px] font-black ${knowledgeSettings.localFirst ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-200 text-slate-600'}`}
            >
              <Database className="w-3.5 h-3.5" /> استخراج مباشر
            </button>
          </div>
        )}

        {showKnowledge ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <KnowledgeBasePanel
              selectedLevel={selectedLevel || currentLesson?.level}
              lessons={curriculumLessons}
              extraDocs={ocrDocs}
              settings={knowledgeSettings}
              onSettingsChange={setKnowledgeSettings}
              onUseQuery={text => {
                setDraft(text);
                setShowKnowledge(false);
                inputRef.current?.focus();
              }}
              onClose={() => setShowKnowledge(false)}
            />
          </div>
        ) : (
          <div ref={threadRef} className="flex-1 min-h-0 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-3 sm:px-5 py-4 space-y-4">
              {!conversationStarted && (
                <div className="rounded-2xl border border-teal-100 bg-gradient-to-l from-teal-50 to-white p-4">
                  <div className="flex items-center gap-2 text-teal-900">
                    <Sparkles className="w-4 h-4" />
                    <p className="text-[13px] font-black">اكتب سؤالك أو اختر مهمة جاهزة</p>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">
                    اسأل عن أي مورد أو مقطع، أو ارفع صورة/PDF/Word لورقة تقويم. سأجيب من قاعدة المنصة وأعرض المصادر مع كل جواب.
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {KNOWLEDGE_QUICK_TASKS.slice(0, 4).map(task => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => useQuickTask(task.id)}
                        className="text-right rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:border-teal-300 hover:bg-teal-50 transition"
                      >
                        {task.label}
                        <span className="block text-[9.5px] font-normal text-slate-400 mt-0.5">{task.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {entries.filter(entry => conversationStarted || entry.id !== 'greeting').map(entry => (
                <article key={entry.id} className={`flex gap-2 ${entry.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${entry.sender === 'user' ? 'bg-slate-800 text-white' : 'bg-teal-700 text-white'}`}>
                    {entry.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`min-w-0 max-w-[86%] ${entry.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`w-full rounded-2xl px-3.5 py-2.5 text-[13px] shadow-2xs ${
                      entry.sender === 'user'
                        ? 'bg-slate-900 text-white rounded-tl-md'
                        : entry.failed
                          ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tr-md'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tr-md'
                    }`}>
                      {entry.notice && (
                        <p className="mb-2 text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">{entry.notice}</p>
                      )}
                      {entry.sender === 'ai' && entry.id !== 'greeting'
                        ? <ChatRichText text={entry.text} />
                        : <p className="whitespace-pre-line leading-relaxed">{entry.text}</p>}
                      {entry.fromKnowledgeBase && (
                        <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                          <Database className="w-3.5 h-3.5" />
                          استخراج مباشر من قاعدة المعرفة (دون مزود ذكاء اصطناعي)
                        </p>
                      )}
                      {entry.scopeLabel && (
                        <p className="mt-1.5 text-[9.5px] font-bold text-slate-500">النطاق: {entry.scopeLabel}</p>
                      )}
                      {entry.knowledge && entry.knowledge.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-emerald-100 space-y-1">
                          <p className="text-[10px] font-black text-emerald-800">من قاعدة المعرفة ({entry.knowledge.length}):</p>
                          {entry.knowledge.slice(0, 6).map(reference => (
                            <SourceChip key={reference.id} reference={reference} />
                          ))}
                        </div>
                      )}
                      {entry.sources && entry.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                          <p className="text-[10px] font-black text-teal-700">مصادر الويب:</p>
                          {entry.sources.map(source => (
                            <a key={source.uri} href={source.uri} target="_blank" rel="noreferrer" className="block text-[10.5px] text-blue-700 hover:underline truncate" title={source.uri}>
                              {source.title || source.uri}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-1 text-[9.5px] text-slate-400">
                      <span>{entry.time}</span>
                      {entry.sender === 'ai' && entry.id !== 'greeting' && (
                        <button
                          type="button"
                          onClick={() => void copyEntry(entry)}
                          title="نسخ الرد"
                          aria-label="نسخ الرد"
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition"
                        >
                          {copiedId === entry.id ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}

              {pending && (
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 px-1">
                  <Loader2 className="w-4 h-4 text-teal-700 animate-spin" />
                  <span>جارٍ كتابة الرد…</span>
                </div>
              )}

              {!pending && lastEntry?.sender === 'ai' && lastEntry.id !== 'greeting' && !showKnowledge && (
                <div className="flex flex-wrap gap-1.5 pr-10">
                  {KNOWLEDGE_QUICK_TASKS.slice(0, 3).map(task => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => useQuickTask(task.id)}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:border-teal-300 hover:text-teal-800 transition"
                    >
                      {task.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={askSolutionFromDb}
                    className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-900 hover:bg-teal-100 transition"
                  >
                    حلول من قاعدة البيانات
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!showKnowledge && (
          <footer className="shrink-0 border-t border-slate-200 bg-white px-3 sm:px-5 py-2.5">
            <div className="mx-auto w-full max-w-3xl space-y-2">
              {fileError && <p className="text-[10.5px] font-bold text-red-700">{fileError}</p>}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {attachments.map(file => (
                    <span key={file.id} className="inline-flex items-center gap-1 max-w-full rounded-lg bg-teal-50 border border-teal-200 px-2 py-1 text-[10px] text-teal-900">
                      <span className="truncate max-w-[170px]">{file.name}</span>
                      <button type="button" onClick={() => setAttachments(previous => previous.filter(item => item.id !== file.id))} aria-label={`إزالة ${file.name}`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-1.5">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={pending || attachments.length >= MAX_ATTACHMENTS}
                  title="إرفاق صورة أو PDF أو Word"
                  aria-label="إرفاق ملف"
                  className="p-2 rounded-xl text-slate-500 hover:text-teal-800 hover:bg-teal-50 disabled:opacity-40 transition"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,image/jpeg,image/png,image/webp,image/gif"
                  onChange={event => { void addFiles(event.target.files); event.target.value = ''; }}
                />
                <textarea
                  ref={inputRef}
                  value={draft}
                  rows={1}
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="اكتب رسالتك… (Enter للإرسال، Shift+Enter لسطر جديد)"
                  className="flex-1 resize-none max-h-32 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!draft.trim() || pending}
                  aria-label="إرسال"
                  title="إرسال"
                  className="p-2 rounded-xl bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40 transition"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </div>
              <p className="text-center text-[9.5px] text-slate-400">
                كل ما هو من قاعدة المنصة موثّق ومصادره معروضة، والاقتراحات الجديدة تبقى بوسم «يحتاج مراجعة الأستاذ».
              </p>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
};
