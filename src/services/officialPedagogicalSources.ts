import sourceRegistry from '../../data/pedagogicalOfficialSources.json';

export type OfficialPedagogicalSourceKind =
  | 'curriculum'
  | 'progression'
  | 'companionDocument'
  | 'teacherGuide'
  | 'memo'
  | 'attachment'
  | 'web'
  | 'library'
  | 'ai';

export interface OfficialPedagogicalSource {
  id: string;
  kind: OfficialPedagogicalSourceKind;
  title: string;
  authority: string;
  url: string;
  status: 'official' | 'teacherProvided' | 'supplementary';
  role: string;
}

export function getOfficialPedagogicalSources(kind?: OfficialPedagogicalSourceKind) {
  const sources = sourceRegistry.sources as OfficialPedagogicalSource[];
  return kind ? sources.filter((source) => source.kind === kind) : sources;
}

export function getSourceById(id: string) {
  return getOfficialPedagogicalSources().find((source) => source.id === id);
}

export function buildOfficialSourceContext() {
  return getOfficialPedagogicalSources().map((source) => ({
    id: source.id,
    kind: source.kind,
    title: source.title,
    authority: source.authority,
    url: source.url,
    role: source.role,
  }));
}
