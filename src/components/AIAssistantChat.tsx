import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot, Check, Clipboard, Database, Layers, Loader2, MessageSquarePlus, Paperclip,
  Send, Sparkles, X,
} from 'lucide-react';
import { LessonMemo } from '../types';
import type { TeacherKnowledgeDoc } from '../types/knowledge';
import { askSmartAi, SmartAiMessage, SmartAiSource } from '../services/smartAi';
import { clearConversation, conversationContext, loadUnifiedConversation, saveConversation } from '../services/conversationHistory';
import { loadKnowledgeSettings, type KnowledgeSettings } from '../services/knowledgeLibraryStore';
import { loadOcrSupplement } from '../services/knowledgeSupplements';
import { preloadOfficialSources } from '../services/knowledgeOfficialSources';
import { KNOWLEDGE_QUICK_TASKS } from '../services/knowledgeQuickTasks';
import type { KnowledgeReference } from '../services/knowledgeBase';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';
import { assistantVisibility, presentAssistantAnswer } from '../services/assistantConversationPolicy';
import { wantsMemoInsertion, type AssistantMemoField } from '../services/assistantMemoInsertion';
import { AssistantMemoInsertion } from './AssistantMemoInsertion';

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
  showSources?: boolean;
}

const MAX_ATTACHMENTS = 4;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const ACCEPTED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const GREETING = 'مرحباً، كيف أساعدك اليوم؟ اكتب ما تريد وسنتابع العمل عليه معاً.';

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const clock = (date = new Date()) => date.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });

const readAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(reader.error || new Error('تعذر قراءة الملف'));
  reader.readAsDataURL(file);
});

const toEntries = (messages: SmartAiMessage[]): ChatEntry[] => messages.map((message, index) => {
  const question = [...messages.slice(0, index)].reverse().find(item => item.role === 'user')?.text || '';
  return { id: makeId(), sender: message.role === 'user' ? 'user' : 'ai',
    text: message.role === 'assistant' ? presentAssistantAnswer(message.text, question) : message.text,
    time: clock(), showSources: assistantVisibility(question).sources };
});

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
  onInsertMemoContent?: (lesson: LessonMemo, field: AssistantMemoField, text: string) => void;
}> = ({ isOpen, onClose, selectedLevel, currentLesson, curriculumLessons = [], onInsertMemoContent }) => {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [fileError, setFileError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [directExtraction, setDirectExtraction] = useState(false);
  const [insertionText, setInsertionText] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState('');
  const [knowledgeSettings, setKnowledgeSettings] = useState<KnowledgeSettings>(() => loadKnowledgeSettings());
  const [ocrDocs, setOcrDocs] = useState<TeacherKnowledgeDoc[]>([]);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const stored = loadUnifiedConversation(selectedLevel);
    const restored = stored ? toEntries(stored.messages) : [];
    setEntries(restored.length ? restored : [{ id: 'greeting', sender: 'ai', text: GREETING, time: clock() }]);
  }, [isOpen]);

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
    if (!isOpen) {
      setOcrDocs([]);
      return;
    }
    let active = true;
    void loadOcrSupplement().then(doc => { if (active) setOcrDocs(doc ? [doc] : []); });
    void preloadOfficialSources();
    return () => { active = false; };
  }, [isOpen]);

  const useQuickTask = (taskId: string) => {
    const task = KNOWLEDGE_QUICK_TASKS.find(item => item.id === taskId);
    if (!task) return;
    const topic = [...entries].reverse().find(entry => entry.sender === 'user')?.text || '';
    setDraft(`${task.label}${topic ? ' للموضوع الذي نعمل عليه في الحوار' : ' حول: '}`);
    setShowKnowledge(false); setShowTools(false); inputRef.current?.focus();
  };
  const askSolutionFromDb = () => {
    setDraft('اقترح حلولاً لأسئلة التقويم مع الأجوبة المرتقبة وسلّم تنقيط مختصر حول الموضوع الذي نعمل عليه.');
    setShowKnowledge(false); setShowTools(false); inputRef.current?.focus();
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
        .map(entry => ({ role: entry.sender === 'user' ? 'user' : 'assistant', text: entry.text }))
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
    clearConversation();
    setAttachments([]);
    setFileError('');
    setDraft('');
    setPending(false);
    setInsertionText(null); setActionNotice('');
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
    const question = draft.trim() || (attachments.length ? 'حلّل هذا المرفق وساعدني على العمل عليه.' : '');
    if (!question || pending || abortRef.current) return;

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
        lesson: null,
        curriculum: curriculumLessons,
        attachments: outgoingAttachments.map(({ name, mimeType, dataUrl }) => ({ name, mimeType, dataUrl })),
        useWeb: true,
        level: 'all',
        expertMode: true,
        history: previousHistory,
        signal: controller.signal,
        knowledge: {
          enabled: true,
          settings: knowledgeSettings,
          extraDocs: ocrDocs,
          topK: knowledgeSettings.topK,
          localOnly: directExtraction,
        },
      });

      if (controller.signal.aborted || abortRef.current !== controller) return;
      const text = presentAssistantAnswer(reply?.text || '', question);
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
        showSources: assistantVisibility(question).sources,
      }]);
      if (wantsMemoInsertion(question) && onInsertMemoContent && !reply?.localAnswer) setInsertionText(text);
    } catch (error) {
      if (controller.signal.aborted || abortRef.current !== controller) return;
      const message = error instanceof Error && error.message
        ? error.message
        : 'تعذر الحصول على رد الآن. تحقق من اتصال الخادم بمزود الذكاء الاصطناعي.';
      updateEntries(previous => [...previous, { id: makeId(), sender: 'ai', text: message, time: clock(), failed: true }]);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null; setPending(false); inputRef.current?.focus();
      }
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

  const conversationStarted = entries.some(entry => entry.sender === 'user');
  const stop = () => { abortRef.current?.abort(); abortRef.current = null; setPending(false); };

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
    <div id="ai-assistant-chat" role="dialog" aria-modal="true" aria-label="محادثة المساعد التربوي" dir="rtl" className="fixed inset-0 z-50 bg-white text-slate-800 flex flex-col">
      <header className="shrink-0 border-b border-slate-100 px-3 sm:px-6 py-3 flex items-center gap-3">
        <button type="button" onClick={onClose} aria-label="إغلاق المحادثة" className="rounded-xl p-2 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        <div className="flex-1"><h2 className="font-black text-sm">المساعد التربوي</h2></div>
        <button type="button" onClick={resetConversation} aria-label="محادثة جديدة" title="محادثة جديدة" className="rounded-xl p-2 hover:bg-slate-100"><MessageSquarePlus className="w-5 h-5" /></button>
        <button type="button" onClick={() => setShowTools(value => !value)} aria-label="أدوات المحادثة" aria-expanded={showTools} className="rounded-xl p-2 hover:bg-slate-100"><Layers className="w-5 h-5" /></button>
      </header>
      {showTools && <div aria-label="أدوات اختيارية" className="border-b border-slate-100 p-3 max-h-[40vh] overflow-y-auto bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-2">
          <p className="text-xs text-slate-500">أدوات اختيارية؛ يمكنك دائماً الاكتفاء بكتابة طلبك.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setShowKnowledge(value => !value); setShowTools(false); }} className="rounded-xl border bg-white px-3 py-2 text-xs font-bold"><Database className="w-4 h-4 inline ml-1" />قاعدة المعرفة وإدارة الوثائق</button>
            <button type="button" aria-pressed={directExtraction} onClick={() => setDirectExtraction(value => !value)} className="rounded-xl border bg-white px-3 py-2 text-xs font-bold">استخراج مباشر: {directExtraction ? 'مفعّل لهذه المحادثة' : 'متوقف'}</button>
          </div>
          {quickTaskList}
        </div>
      </div>}
      {showKnowledge ? <div className="flex-1 min-h-0 overflow-y-auto"><KnowledgeBasePanel
        lessons={curriculumLessons} extraDocs={ocrDocs} settings={knowledgeSettings}
        onSettingsChange={setKnowledgeSettings} onUseQuery={text => { setDraft(text); setShowKnowledge(false); }}
        onClose={() => setShowKnowledge(false)} /></div> : <>
        <main ref={threadRef} role="log" aria-label="رسائل المحادثة" aria-live="polite" aria-busy={pending} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-7">
            {!conversationStarted && <div className="py-16 sm:py-24 text-center space-y-4"><Bot className="w-10 h-10 text-teal-700 mx-auto" /><h1 className="text-2xl sm:text-3xl font-black">كيف أساعدك اليوم؟</h1><p className="text-sm text-slate-500 leading-7">اكتب فكرتك، سؤالك أو ما تريد تحضيره، وسنتابع العمل عليه معاً.</p></div>}
            {entries.filter(entry => entry.id !== 'greeting').map(entry => <article key={entry.id} data-chat-sender={entry.sender} className={`group flex ${entry.sender === 'user' ? 'justify-start' : ''}`}>
              <div className={`min-w-0 ${entry.sender === 'user' ? 'max-w-[90%] rounded-3xl bg-slate-100 px-5 py-3' : 'w-full py-1'}`}>
                {entry.sender === 'ai' && <p className="text-xs font-bold text-teal-800 mb-2">المساعد</p>}
                {entry.failed ? <p role="alert" className="text-sm text-amber-800 leading-7">{entry.text}</p> : entry.sender === 'ai' ? <div className="text-sm leading-8"><ChatRichText text={entry.text} /></div> : <p className="whitespace-pre-wrap text-sm leading-7">{entry.text}</p>}
                {entry.notice && <p className="mt-2 text-xs leading-6 text-amber-800">{entry.notice}</p>}
                {entry.showSources && entry.knowledge?.length ? <div className="mt-4 space-y-2" aria-label="المراجع المطلوبة">{entry.knowledge.map(reference => <SourceChip key={reference.id} reference={reference} />)}</div> : null}
                {entry.showSources && entry.sources?.length ? <div className="mt-3 space-y-1">{entry.sources.map(source => <a key={source.uri} href={source.uri} target="_blank" rel="noreferrer" className="block text-xs text-teal-700 underline break-all">{source.title || source.uri}</a>)}</div> : null}
                {entry.sender === 'ai' && <div className="mt-2 flex items-center flex-wrap gap-3 text-xs text-slate-500">
                  <button type="button" onClick={() => void copyEntry(entry)} aria-label="نسخ الرد" className="p-1 hover:text-teal-800">{copiedId === entry.id ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}</button>
                  {entry.failed ? <button type="button" onClick={() => { const index = entries.indexOf(entry); const previous = [...entries.slice(0, index)].reverse().find(item => item.sender === 'user'); setDraft(previous?.text || ''); inputRef.current?.focus(); }}>إعادة المحاولة</button> : onInsertMemoContent && <button type="button" onClick={() => setInsertionText(entry.text)} className="hover:text-teal-800">تجهيز للإدراج في مذكرة</button>}
                </div>}
              </div>
            </article>)}
            {pending && <div role="status" className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin text-teal-700" />جارٍ البحث وإعداد الإجابة…</div>}
            {actionNotice && <p role="status" className="text-sm text-teal-800">{actionNotice}</p>}
            {insertionText !== null && onInsertMemoContent && <AssistantMemoInsertion text={insertionText} lessons={curriculumLessons} initialLesson={currentLesson}
              onCancel={() => setInsertionText(null)} onConfirm={(lesson, field, text) => { onInsertMemoContent(lesson, field, text); setInsertionText(null); setActionNotice('تمت إضافة المحتوى إلى المذكرة بعد تأكيدك.'); }} />}
          </div>
        </main>
        <footer className="shrink-0 bg-white px-3 sm:px-6 pt-2 pb-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="max-w-3xl mx-auto space-y-2">
            {fileError && <p role="alert" className="text-xs text-red-700">{fileError}</p>}
            {attachments.length > 0 && <div className="flex flex-wrap gap-2">{attachments.map(file => <span key={file.id} className="inline-flex items-center gap-2 max-w-full rounded-xl bg-slate-100 px-3 py-2 text-xs"><span className="truncate max-w-[200px]">{file.name}</span><button type="button" onClick={() => setAttachments(previous => previous.filter(item => item.id !== file.id))} aria-label={`إزالة ${file.name}`}><X className="w-3 h-3" /></button></span>)}</div>}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm flex items-end gap-2 focus-within:border-teal-500">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={pending || attachments.length >= MAX_ATTACHMENTS} aria-label="إرفاق ملف" title="صورة أو PDF أو Word أو نص" className="rounded-full p-2.5 text-slate-500 hover:bg-slate-200 disabled:opacity-40"><Paperclip className="w-5 h-5" /></button>
              <input ref={fileRef} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.txt,image/jpeg,image/png,image/webp,image/gif" onChange={event => { void addFiles(event.target.files); event.target.value = ''; }} />
              <textarea ref={inputRef} value={draft} rows={2} aria-label="رسالتك إلى المساعد" onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} placeholder="اكتب ما تريد…" className="flex-1 min-w-0 resize-none max-h-40 bg-transparent border-0 outline-none px-1 py-2 text-sm leading-7" />
              {pending ? <button type="button" onClick={stop} aria-label="إيقاف التوليد" className="rounded-full bg-slate-800 text-white p-2.5"><X className="w-5 h-5" /></button> : <button type="button" onClick={() => void send()} disabled={!draft.trim() && !attachments.length} aria-label="إرسال" className="rounded-full bg-teal-700 text-white p-2.5 hover:bg-teal-800 disabled:opacity-30"><Send className="w-5 h-5 rotate-180" /></button>}
            </div>
            <p className="text-center text-[10px] text-slate-400">قد يخطئ المساعد. راجع المحتوى قبل اعتماده أو إدراجه.</p>
          </div>
        </footer>
      </>}
    </div>
  );
};
