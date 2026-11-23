import {
  type AgentMemoryHint,
} from './agentMemoryStore';
import { readFileAsDataUrl } from './correctionMemoImport';
import type { AgentReadResponse, AgentStatusResponse } from './documentAgent';
import { loadKnowledgeDocs } from './knowledgeLibraryStore';

/** نداءات وكيل المستندات: الخادم يقرأ محليًا ويعيد التحليل والاستشهادات. */

export async function fetchAgentStatus(): Promise<AgentStatusResponse | null> {
  try {
    const response = await fetch('/api/agent/status');
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export interface ReadWithAgentArgs {
  file?: File | null;
  text?: string;
  examType?: string;
  level?: string;
  memory?: AgentMemoryHint[];
}

export async function readWithAgent(args: ReadWithAgentArgs): Promise<AgentReadResponse> {
  const body: Record<string, unknown> = {
    examType: args.examType || '',
    level: args.level || '',
    memory: args.memory || [],
    teacherDocs: loadKnowledgeDocs().slice(0, 12).map(doc => ({
      id: doc.id,
      title: doc.title,
      kind: doc.kind,
      level: doc.level,
      text: doc.text.slice(0, 20_000),
    })),
  };

  if (args.file) {
    body.name = args.file.name;
    body.mimeType = args.file.type;
    body.dataUrl = await readFileAsDataUrl(args.file);
  } else {
    body.name = 'نص-يدوي.txt';
    body.text = String(args.text || '');
  }

  const response = await fetch('/api/agent/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload?.error === 'string' ? payload.error : 'تعذر قراءة الملف وتحليله.');
  }
  return payload as AgentReadResponse;
}
