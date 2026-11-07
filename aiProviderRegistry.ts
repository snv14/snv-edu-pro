export type AIProviderId = 'gemini' | 'openai' | 'anthropic' | 'huggingface';

export interface AIProviderInfo {
  id: AIProviderId;
  label: string;
  mode: 'primary' | 'optional' | 'local-compatible';
  configuredEnv: string;
  supportsVision: boolean;
  supportsWeb: boolean;
}

export const AI_PROVIDERS: AIProviderInfo[] = [
  { id: 'gemini', label: 'Gemini', mode: 'primary', configuredEnv: 'GEMINI_API_KEY', supportsVision: true, supportsWeb: true },
  { id: 'openai', label: 'OpenAI-compatible', mode: 'optional', configuredEnv: 'OPENAI_API_KEY', supportsVision: true, supportsWeb: false },
  { id: 'anthropic', label: 'Claude', mode: 'optional', configuredEnv: 'ANTHROPIC_API_KEY', supportsVision: true, supportsWeb: false },
  { id: 'huggingface', label: 'Hugging Face', mode: 'local-compatible', configuredEnv: 'HF_TOKEN', supportsVision: false, supportsWeb: false },
];

export const getConfiguredProviderIds = (): AIProviderId[] =>
  AI_PROVIDERS.filter(provider => Boolean((import.meta as any).env?.[provider.configuredEnv])).map(provider => provider.id);

export const getSourcePriority = (type: string): number => ({
  curriculum: 1,
  progression: 1,
  companionDocument: 2,
  teacherGuide: 3,
  memo: 4,
  attachment: 5,
  web: 6,
  library: 7,
  ai: 8,
}[type] ?? 8);
