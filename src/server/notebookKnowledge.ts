import type { TeacherKnowledgeDoc } from '../types/knowledge';

/** Optional administrator-managed bridge, NOT an assumed public NotebookLM API.
 * No browser-provided URL/token; only the contextual search query is sent (no files or student records).
 */
export async function searchNotebookKnowledge(query: string): Promise<TeacherKnowledgeDoc[]> {
  const configured = process.env.NOTEBOOKLM_BRIDGE_URL;
  if (!configured) return [];
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' || url.username || url.password) return [];
    const response = await fetch(url, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(3000),
      headers: { 'Content-Type': 'application/json', ...(process.env.NOTEBOOKLM_BRIDGE_TOKEN ? { Authorization: `Bearer ${process.env.NOTEBOOKLM_BRIDGE_TOKEN}` } : {}) },
      body: JSON.stringify({ query: query.slice(0, 4000), limit: 6 }),
    });
    if (!response.ok) return [];
    const reader = response.body?.getReader();
    if (!reader) return [];
    const parts: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 64000) { await reader.cancel(); return []; }
      parts.push(value);
    }
    const data = JSON.parse(Buffer.concat(parts).toString('utf8'));
    if (!Array.isArray(data.excerpts)) return [];
    return data.excerpts.slice(0, 6).flatMap((item: any, index: number) => {
      if (typeof item?.text !== 'string' || !item.text.trim()) return [];
      return [{ id: `notebook-bridge-${index}`, title: String(item.title || 'مقتطف NotebookLM').slice(0, 160),
        text: item.text.slice(0, 2000), level: 'all' as const, kind: 'teacherDocument' as const,
        url: typeof item.url === 'string' && /^https:\/\//i.test(item.url) ? item.url.slice(0, 500) : undefined,
        source: 'teacher' as const, createdAt: new Date(0).toISOString(),
      }];
    });
  } catch { return []; }
}
