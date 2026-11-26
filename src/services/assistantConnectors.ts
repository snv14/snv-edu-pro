import type { LessonMemo } from '../types';
import type { TeacherKnowledgeDoc, KnowledgeLevel } from '../types/knowledge';
import type { KnowledgeReference } from './knowledgeBase';
import { prepareKnowledge } from './smartAi';
import { loadKnowledgeSettings, type KnowledgeSettings } from './knowledgeLibraryStore';
import {
  searchSpace,
  type KnowledgeSpace,
  type SpaceSearchHit,
} from './knowledgeSpaces';
import type { AssistantPlan, ConnectorId, ContextNode } from './assistantTypes';
import { sortReferencesByAuthority } from './assistantEvidence';

/**
 * نظام Connectors قابل للتوسع: كل Connector يعرّف قدراته وأذوناته وصحته
 * ويوفّر search/retrieve، والـOrchestrator يختار ما يناسب السؤال.
 */

export type ConnectorState = 'available' | 'degraded' | 'offline';
export type ConnectorType = 'official' | 'documents' | 'web';

export interface ConnectorHealth {
  state: ConnectorState;
  detail: string;
  checkedAt: string;
}

export interface ConnectorMetadata {
  label: string;
  description: string;
  type: ConnectorType;
  capabilities: string[];
  permissions: { requiresAuth: boolean; scope: 'public' | 'user' };
}

export interface ConnectorHealthContext {
  space?: KnowledgeSpace | null;
  online?: boolean;
  aiConfigured?: boolean | null;
}

export interface ConnectorSearchContext {
  question: string;
  plan: AssistantPlan;
  lesson?: LessonMemo | null;
  curriculum: LessonMemo[];
  space?: KnowledgeSpace | null;
  settings?: KnowledgeSettings;
  extraDocs?: TeacherKnowledgeDoc[];
}

export interface ConnectorSearchOutput {
  references: KnowledgeReference[];
  spaceHits?: SpaceSearchHit[];
  notes?: string[];
}

export interface AssistantConnector {
  id: ConnectorId;
  name: string;
  metadata(): ConnectorMetadata;
  healthCheck(context?: ConnectorHealthContext): ConnectorHealth;
  search(context: ConnectorSearchContext): Promise<ConnectorSearchOutput>;
  retrieve?(context: ConnectorSearchContext): Promise<ConnectorSearchOutput>;
  analyze?(context: ConnectorSearchContext): Promise<string>;
}

const now = () => new Date().toISOString();

export function spaceReferencesOf(space: KnowledgeSpace, hits: SpaceSearchHit[]): KnowledgeReference[] {
  return hits.map((hit, index) => ({
    id: `space-${hit.source.id}-${hit.chunk.id}`,
    kind: 'teacherDocument',
    kindLabel: 'وثيقة الأستاذ',
    title: hit.source.name,
    section: `مقطع ${index + 1}${hit.chunk.page ? ` — ص ${hit.chunk.page}` : ''}`,
    facet: 'reference',
    facetLabel: 'مرجع',
    level: (space.level || 'all') as KnowledgeLevel,
    status: 'teacher',
    statusLabel: 'موثق من ملف الأستاذ',
    sourceLabel: `مساحة المعرفة: ${space.title}`,
    page: hit.chunk.page,
    snippet: hit.snippet,
    score: hit.score,
    scopeLabel: space.title,
  }));
}

/** Connector 01 — قاعدة المنصة الرسمية (المنهاج، التدرج، الدليل، الوثيقة، المذكرات). */
export const platformConnector: AssistantConnector = {
  id: 'platform',
  name: 'SNV Platform Knowledge',
  metadata: () => ({
    label: 'SNV Platform',
    description: 'قاعدة المنصة الرسمية: المنهاج، التدرج، دليل الأستاذ، الوثيقة المرافقة، والمذكرات.',
    type: 'official',
    capabilities: ['search', 'retrieve', 'cite', 'metadata-filter'],
    permissions: { requiresAuth: false, scope: 'public' },
  }),
  healthCheck: () => ({
    state: 'available',
    detail: 'قاعدة المنصة الرسمية جاهزة للبحث.',
    checkedAt: now(),
  }),
  async search(context) {
    const settings = context.settings || loadKnowledgeSettings();
    try {
      const prepared = prepareKnowledge({
        question: context.question,
        lesson: context.lesson || null,
        curriculum: context.curriculum,
        level: context.plan.level === 'all' ? undefined : context.plan.level,
        knowledge: {
          enabled: true,
          settings,
          extraDocs: context.extraDocs || [],
        },
      });
      return {
        references: prepared?.references || [],
        notes: prepared ? [] : ['قاعدة المنصة لم تُرجع نتائج لهذا السؤال.'],
      };
    } catch (error) {
      console.warn('[connector:platform] search failed', error);
      return { references: [], notes: ['تعذر البحث في قاعدة المنصة لهذا الطلب.'] };
    }
  },
};

/** Connector 02 — مساحة معرفة الأستاذ (ملفات محلية مقسّمة إلى مقاطع وصفحات). */
export const spaceConnector: AssistantConnector = {
  id: 'space',
  name: 'Knowledge Spaces',
  metadata: () => ({
    label: 'Knowledge Spaces',
    description: 'وثائق الأستاذ الخاصة داخل مساحة معرفة، محفوظة على جهازه فقط.',
    type: 'documents',
    capabilities: ['search', 'retrieve', 'cite-pages', 'compare'],
    permissions: { requiresAuth: false, scope: 'user' },
  }),
  healthCheck: (context) => {
    const space = context?.space;
    if (!space) return { state: 'degraded', detail: 'لا توجد مساحة معرفة نشطة.', checkedAt: now() };
    const ready = space.sources.filter(source => source.status === 'ready').length;
    if (!ready) return { state: 'degraded', detail: 'المساحة موجودة لكن لا مصدر جاهزًا فيها.', checkedAt: now() };
    return { state: 'available', detail: `${ready} مصدر جاهز للبحث في «${space.title}».`, checkedAt: now() };
  },
  async search(context) {
    if (!context.space) return { references: [], spaceHits: [] };
    const hits = searchSpace(context.space, context.question, 6);
    return { references: spaceReferencesOf(context.space, hits), spaceHits: hits };
  },
};

/** Connector 03 — البحث الخارجي؛ يُنفَّذ فعليًا عبر بوابة الخادم عند الحاجة. */
export const webConnector: AssistantConnector = {
  id: 'web',
  name: 'Web Search',
  metadata: () => ({
    label: 'Web Search',
    description: 'مصادر خارجية عند طلب الأستاذ أو عند نقص المصادر الداخلية فقط.',
    type: 'web',
    capabilities: ['search', 'verify', 'external-sources'],
    permissions: { requiresAuth: false, scope: 'public' },
  }),
  healthCheck: (context) => {
    if (context?.online === false) {
      return { state: 'offline', detail: 'لا يوجد اتصال بالإنترنت حاليًا.', checkedAt: now() };
    }
    if (context?.aiConfigured === false) {
      return { state: 'degraded', detail: 'البحث الخارجي يحتاج مزود بحث/ذكاء اصطناعي مضبوطًا على الخادم.', checkedAt: now() };
    }
    return { state: 'available', detail: 'يُستدعى تلقائيًا عند الحاجة فقط.', checkedAt: now() };
  },
  async search() {
    return {
      references: [],
      notes: ['البحث الخارجي يُنفَّذ عبر بوابة الخادم ويُعرض مع روابطه وسبب استخدامه.'],
    };
  },
};

export const CONNECTORS: AssistantConnector[] = [platformConnector, spaceConnector, webConnector];

export const connectorById = (id: ConnectorId): AssistantConnector | undefined =>
  CONNECTORS.find(connector => connector.id === id);

export interface ConnectorRunResult {
  references: KnowledgeReference[];
  spaceHits: SpaceSearchHit[];
  health: Record<ConnectorId, ConnectorHealth>;
  notes: string[];
}

/** تشغيل الـConnectors المختارة فقط، مع عزل فشل أي واحد منها. */
export async function collectConnectorEvidence(context: ConnectorSearchContext): Promise<ConnectorRunResult> {
  const health = {} as Record<ConnectorId, ConnectorHealth>;
  const references: KnowledgeReference[] = [];
  const spaceHits: SpaceSearchHit[] = [];
  const notes: string[] = [];

  for (const connector of CONNECTORS) {
    health[connector.id] = connector.healthCheck({
      space: context.space,
      online: typeof navigator === 'undefined' ? true : navigator.onLine,
      aiConfigured: null,
    });
  }

  const searchable = context.plan.connectors
    .filter(id => id !== 'web')
    .map(connectorById)
    .filter((connector): connector is AssistantConnector => Boolean(connector));

  for (const connector of searchable) {
    try {
      const result = await connector.search(context);
      references.push(...result.references);
      if (result.spaceHits?.length) spaceHits.push(...result.spaceHits);
      if (result.notes?.length) notes.push(...result.notes);
      health[connector.id] = connector.healthCheck({
        space: context.space,
        online: typeof navigator === 'undefined' ? true : navigator.onLine,
        aiConfigured: null,
      });
    } catch (error) {
      console.warn(`[connector:${connector.id}] failed`, error);
      health[connector.id] = {
        state: 'degraded',
        detail: 'تعذر هذا المصدر مؤقتًا؛ بقية المصادر تعمل.',
        checkedAt: now(),
      };
      notes.push(`تعذر ${connector.metadata().label} مؤقتًا.`);
    }
  }

  const seen = new Set<string>();
  const deduped = references.filter(reference => {
    if (!reference?.id || seen.has(reference.id)) return false;
    seen.add(reference.id);
    return true;
  });

  return {
    references: sortReferencesByAuthority(deduped),
    spaceHits,
    health,
    notes,
  };
}

export interface ConnectorHealthRow {
  id: ConnectorId;
  label: string;
  state: ConnectorState;
  detail: string;
  metadata: ConnectorMetadata;
}

export function connectorHealthList(context: ConnectorHealthContext = {}): ConnectorHealthRow[] {
  return CONNECTORS.map(connector => {
    const health = connector.healthCheck(context);
    return {
      id: connector.id,
      label: connector.metadata().label,
      state: health.state,
      detail: health.detail,
      metadata: connector.metadata(),
    };
  });
}

/** عقدة الرسم المعرفي التربوي (Level → … → Resource) — تُعرض في الواجهة. */
export type { ContextNode };
