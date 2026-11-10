import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Check, Clipboard, Database, Paperclip, Send, Sparkles, User, X } from 'lucide-react';
import { LessonMemo } from '../types';
import type { TeacherKnowledgeDoc } from '../types/knowledge';
import { askSmartAi, SmartAiMessage, SmartAiSource } from '../services/smartAi';
import { clearConversation, conversationContext, loadConversation, saveConversation } from '../services/conversationHistory';
import { loadKnowledgeSettings, saveKnowledgeSettings, type KnowledgeSettings } from '../services/knowledgeLibraryStore';
import { loadOcrSupplement } from '../services/knowledgeSupplements';
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
  /** مقاطع قاعدة المعرفة التي استُند إليها الجواب. */
  knowledge?: KnowledgeReference[];
  /** النطاق (المستوى/المقطع/المورد) الذي بُحث فيه. */
  scopeLabel?: string;
  /** الجواب مستخرج محلياً من القاعدة دون مزود ذكاء اصطناعي. */
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
  'مرحباً زميلي الأستاذ(ة). أنا أبحث في قاعدة المعرفة: المنهاج، الوثيقة المرافقة، دليل الأستاذ، والمذكرات المفهرسة.',
  'اسألني مثلاً: «استخرج الأنشطة والتعليمات»، «ما المشكلة والفرضيات؟»، «إرساء الموارد»، «اقترح تمريناً»، أو اختر مهمة جاهزة من الأزرار أسفل.',
  'كل جواب يعرض المصادر التي استُخرج منها، ومعها عدة احتمالات موثقة إن وُجدت.',
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
  }, [entries, pending, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // النص الخام (OCR) يُحمَّل عند الطلب فقط لأنه كبير الحجم.
  useEffect(() => {
    if (!isOpen || !knowledgeSettings.includeOcrSupplement) {
      setOcrDocs([]);
      return;
    }
    let active = true;
    void loadOcrSupplement().then(doc => { if (active) setOcrDocs(doc ? [doc] : []); });
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
    const prompt = buildQuickTaskPrompt(task, taskScope);
    setDraft(prompt);
    setShowKnowledge(false);
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

  return (
    <div
      id="ai-assistant-chat"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
      onClick={onClose}
      dir="rtl"
    >
      <section
        className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col"
        onClick={event => event.stopPropagation()}
        aria-label="محادثة المساعد التربوي"
      >
        <header className="px-4 py-3 border-b border-gray-200 bg-gradient-to-l from-teal-900 to-emerald-700 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><Bot className="w-5 h-5" /></div>
            <div className="min-w-0">
              <h2 className="font-black text-[14px] leading-tight">المحادثة التربوية</h2>
              <p className="text-[10.5px] text-white/75 truncate">{contextLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowKnowledge(open => !open)}
              title="قاعدة المعرفة: المنهاج، الوثيقة المرافقة، دليل الأستاذ، المذكرات"
              aria-label="قاعدة المعرفة"
              aria-expanded={showKnowledge}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold transition ${showKnowledge ? 'bg-white text-emerald-800' : 'bg-white/10 hover:bg-white/20'}`}
            >
              <Database className="w-3.5 h-3.5" />
              القاعدة
            </button>
            <button
              type="button"
              onClick={resetConversation}
              title="محادثة جديدة"
              aria-label="محادثة جديدة"
              className="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-white/10 hover:bg-white/20 transition"
            >
              جديدة
            </button>
            <button type="button" onClick={onClose} aria-label="إغلاق المحادثة" className="p-1.5 rounded-lg hover:bg-white/15 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {showKnowledge && (
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
        )}

        <div ref={threadRef} className={`overflow-y-auto px-3.5 py-4 space-y-3 bg-slate-50 ${showKnowledge ? 'hidden' : 'flex-1'}`}>
          {entries.map(entry => (
            <article key={entry.id} className={`group flex gap-2 ${entry.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${entry.sender === 'user' ? 'bg-slate-800 text-white' : 'bg-emerald-700 text-white'}`}>
                {entry.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line shadow-2xs ${
                entry.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-tl-md'
                  : entry.failed
                    ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tr-md'
                    : 'bg-white border border-gray-200 text-slate-800 rounded-tr-md'
              }`}>
                {entry.notice && (
                  <p className="mb-2 text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">{entry.notice}</p>
                )}
                <p>{entry.text}</p>
                {entry.fromKnowledgeBase && (
                  <p className="mb-2 inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                    <Database className="w-3 h-3" />
                    استخراج مباشر من قاعدة المعرفة (دون مزود ذكاء اصطناعي)
                  </p>
                )}
                {entry.scopeLabel && (
                  <p className="mb-1.5 text-[9.5px] font-bold text-slate-500">النطاق: {entry.scopeLabel}</p>
                )}
                {entry.knowledge && entry.knowledge.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-emerald-100 space-y-1">
                    <p className="text-[10px] font-black text-emerald-800">من قاعدة المعرفة ({entry.knowledge.length}):</p>
                    {entry.knowledge.slice(0, 6).map(reference => (
                      <details key={reference.id} className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-2 py-1">
                        <summary className="cursor-pointer list-none text-[10px] font-bold text-emerald-900 truncate">
                          {reference.kindLabel} · {reference.facetLabel} — {reference.section}
                        </summary>
                        <p className="mt-1 text-[10px] text-slate-700 whitespace-pre-line leading-relaxed">{reference.snippet}</p>
                        <p className="mt-1 text-[9px] text-slate-500">
                          {reference.title}{reference.scopeLabel ? ` — ${reference.scopeLabel}` : ''} [{reference.statusLabel}]
                          {reference.url ? (
                            <a href={reference.url} target="_blank" rel="noreferrer" className="mr-1 text-blue-700 hover:underline">فتح المصدر</a>
                          ) : null}
                        </p>
                      </details>
                    ))}
                  </div>
                )}
                {entry.sources && entry.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                    <p className="text-[10px] font-black text-teal-700">مصادر الويب:</p>
                    {entry.sources.map(source => (
                      <a key={source.uri} href={source.uri} target="_blank" rel="noreferrer" className="block text-[10.5px] text-blue-700 hover:underline truncate" title={source.uri}>
                        {source.title || source.uri}
                      </a>
                    ))}
                  </div>
                )}
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[9.5px] text-slate-400">
                  <span>{entry.time}</span>
                  {entry.sender === 'ai' && entry.id !== 'greeting' && (
                    <button
                      type="button"
                      onClick={() => void copyEntry(entry)}
                      title="نسخ الرد"
                      aria-label="نسخ الرد"
                      className="opacity-40 group-hover:opacity-100 transition text-slate-500 hover:text-slate-800"
                    >
                      {copiedId === entry.id ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {pending && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 px-1">
              <Bot className="w-4 h-4 text-emerald-700 animate-pulse" />
              <span>جارٍ كتابة الرد…</span>
            </div>
          )}
        </div>

        <footer className="border-t border-gray-200 bg-white px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" role="toolbar" aria-label="مهام الاستخراج والاقتراح الجاهزة">
            {KNOWLEDGE_QUICK_TASKS.map(task => (
              <button
                key={task.id}
                type="button"
                onClick={() => useQuickTask(task.id)}
                title={`${task.hint} — ${describeScope(taskScope)}`}
                className="shrink-0 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-900 hover:bg-emerald-100 transition"
              >
                <Sparkles className="w-3 h-3" />
                {task.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setKnowledgeSettings(saveKnowledgeSettings({ localFirst: !knowledgeSettings.localFirst }))}
              title={knowledgeSettings.localFirst
                ? 'الاستخراج المباشر مفعل: الجواب يأتي من قاعدة المعرفة فوراً دون ذكاء اصطناعي'
                : 'تفعيل الاستخراج المباشر من قاعدة المعرفة دون انتظار مزود الذكاء الاصطناعي'}
              aria-pressed={knowledgeSettings.localFirst}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${knowledgeSettings.localFirst
                ? 'border-teal-700 bg-teal-700 text-white'
                : 'border-gray-300 bg-white text-slate-600 hover:border-teal-400'}`}
            >
              <Database className="w-3 h-3" />
              استخراج مباشر
            </button>
          </div>
          {fileError && <p className="text-[10.5px] font-bold text-red-700">{fileError}</p>}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attachments.map(file => (
                <span key={file.id} className="inline-flex items-center gap-1 max-w-full rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[10px] text-emerald-900">
                  <span className="truncate max-w-[170px]">{file.name}</span>
                  <button type="button" onClick={() => setAttachments(previous => previous.filter(item => item.id !== file.id))} aria-label={`إزالة ${file.name}`}>
                    <X className="w-3 h-3" />
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
              className="p-2 rounded-xl text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 disabled:opacity-40 transition"
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
              className="flex-1 resize-none max-h-28 rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!draft.trim() || pending}
              aria-label="إرسال"
              title="إرسال"
              className="p-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
