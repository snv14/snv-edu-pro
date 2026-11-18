import { TextRun } from 'docx';

export type HandwritingFontId =
  | 'playpen'
  | 'harmattan'
  | 'lateef'
  | 'marhey'
  | 'tajawal'
  | 'cairo';

export type PenRole =
  | 'titleBlue'
  | 'subRed'
  | 'defGreen'
  | 'bodyBlack'
  | 'termPurple'
  | 'noteOrange';

export type HandwritingScope = 'all' | 'logbook' | 'memos';

export interface PenPalette {
  titleBlue: string;
  subRed: string;
  defGreen: string;
  bodyBlack: string;
  termPurple: string;
  noteOrange: string;
}

export interface HandwritingStyleSettings {
  enabled: boolean;
  fontId: HandwritingFontId;
  fontSizeScale: number; // 0.92 - 1.12 (safe inside A4)
  ruledLines: boolean;
  scope: HandwritingScope;
  palette: PenPalette;
  activePresetId?: string;
}

export interface SavedHandwritingPreset {
  id: string;
  name: string;
  settings: HandwritingStyleSettings;
}

export interface HandwritingFontMeta {
  id: HandwritingFontId;
  label: string;
  subtitle: string;
  cssFamily: string;
  wordFontName: string;
  wordArabicFallback: string;
  lineHeight: number;
  wordSpacing: string;
  sampleText: string;
}

export const HANDWRITING_FONTS: Record<HandwritingFontId, HandwritingFontMeta> = {
  playpen: {
    id: 'playpen',
    label: 'خط الكراس اليدوي (Playpen)',
    subtitle: 'خط يدوي مدرسي طبيعي وواضح جداً للأستاذ والتلميذ',
    cssFamily: "'Playpen Sans Arabic', 'Harmattan', 'Tajawal', 'Cairo', sans-serif",
    wordFontName: 'Playpen Sans Arabic',
    wordArabicFallback: 'Sakkal Majalla',
    lineHeight: 1.55,
    wordSpacing: '0.03em',
    sampleText: 'يمتص النبات الأخضر المحلول المعدني بواسطة الأوبار الماصة.',
  },
  harmattan: {
    id: 'harmattan',
    label: 'خط القلم المدرسي (Harmattan)',
    subtitle: 'خط نسخ حبري أنيق وسهل القراءة في صفحات A4',
    cssFamily: "'Harmattan', 'Playpen Sans Arabic', 'Tajawal', 'Cairo', sans-serif",
    wordFontName: 'Harmattan',
    wordArabicFallback: 'Traditional Arabic',
    lineHeight: 1.52,
    wordSpacing: '0.02em',
    sampleText: 'تتحول الأغذية تدريجياً في الأنبوب الهضمي بتدخل الإنزيمات النوعية.',
  },
  lateef: {
    id: 'lateef',
    label: 'خط القلم المتصل (Lateef)',
    subtitle: 'محاكاة قريبة لقلم الحبر السائل في الكراسات الرسمية',
    cssFamily: "'Lateef', 'Harmattan', 'Tajawal', 'Cairo', sans-serif",
    wordFontName: 'Lateef',
    wordArabicFallback: 'Simplified Arabic',
    lineHeight: 1.52,
    wordSpacing: '0.02em',
    sampleText: 'الزغابة المعوية هي مقر امتصاص المغذيات وانتقالها نحو الدم واللمف.',
  },
  marhey: {
    id: 'marhey',
    label: 'خط السبورة والملاحظات (Marhey)',
    subtitle: 'خط يدوي حيوي مناسب للعناوين والملخصات التربوية',
    cssFamily: "'Marhey', 'Playpen Sans Arabic', 'Tajawal', 'Cairo', sans-serif",
    wordFontName: 'Marhey',
    wordArabicFallback: 'Sakkal Majalla',
    lineHeight: 1.56,
    wordSpacing: '0.03em',
    sampleText: 'الوثائق والرسومات التخطيطية تساعد على بناء الاستنتاج العلمي بدقة.',
  },
  tajawal: {
    id: 'tajawal',
    label: 'الخط الأكاديمي النظيف (Tajawal)',
    subtitle: 'خط مرتب خفيف مع نظام الألوان المدرسي للأقلام',
    cssFamily: "'Tajawal', 'Cairo', 'Noto Sans Arabic', sans-serif",
    wordFontName: 'Tajawal',
    wordArabicFallback: 'Arial',
    lineHeight: 1.48,
    wordSpacing: '0em',
    sampleText: 'المقارنة بين تركيب الهواء الداخل والخارج تكشف المبادلات الغازية.',
  },
  cairo: {
    id: 'cairo',
    label: 'الخط الأصلي للمنصة (Cairo)',
    subtitle: 'التنسيق الكلاسيكي الأصلي للمنصة',
    cssFamily: "'Cairo', 'Tajawal', 'Noto Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif",
    wordFontName: 'Cairo',
    wordArabicFallback: 'Arial',
    lineHeight: 1.5,
    wordSpacing: '0em',
    sampleText: 'التنسيق الأصلي للمنصة التعليمية لعلوم الطبيعة والحياة.',
  },
};

/**
 * ألوان الأقلام الستة المضبوطة لتباين ممتاز في الشاشة والطباعة الملونة والطباعة بالأبيض والأسود.
 */
export const DEFAULT_PEN_PALETTE: PenPalette = {
  titleBlue: '#1d4ed8',   // الأزرق: العناوين الرئيسية وعناوين الدروس
  subRed: '#b91c1c',      // الأحمر: العناوين الفرعية والكلمات المهمة والتنبيهات
  defGreen: '#15803d',    // الأخضر: التعريفات والملاحظات العلمية والاستنتاجات
  bodyBlack: '#18181b',   // الأسود: الشرح والنصوص الأساسية
  termPurple: '#6d28d9',  // البنفسجي: المصطلحات العلمية والتسميات المهمة
  noteOrange: '#c2410c',  // البرتقالي: الأمثلة والملاحظات الإضافية
};

export const PEN_ROLE_META: Record<
  PenRole,
  { label: string; shortLabel: string; description: string; swatches: string[] }
> = {
  titleBlue: {
    label: 'الأزرق — العناوين الرئيسية',
    shortLabel: 'أزرق (عنوان)',
    description: 'العناوين الرئيسية وعناوين الدروس والموارد والمقاطع',
    swatches: ['#1d4ed8', '#0369a1', '#1e40af', '#2563eb'],
  },
  subRed: {
    label: 'الأحمر — العناوين الفرعية والتنبيهات',
    shortLabel: 'أحمر (فرعي)',
    description: 'العناوين الفرعية والمشكلة العلمية والكلمات المهمة والتنبيهات',
    swatches: ['#b91c1c', '#dc2626', '#9f1239', '#be123c'],
  },
  defGreen: {
    label: 'الأخضر — التعريفات والاستنتاجات',
    shortLabel: 'أخضر (تعريف)',
    description: 'إرساء الموارد، التعريفات، الملاحظات العلمية والاستنتاجات',
    swatches: ['#15803d', '#0f766e', '#166534', '#047857'],
  },
  bodyBlack: {
    label: 'الأسود — الشرح والنصوص الأساسية',
    shortLabel: 'أسود (نص)',
    description: 'الشرح العام والأسئلة والفقرات الأساسية',
    swatches: ['#18181b', '#0f172a', '#1f2937', '#27272a'],
  },
  termPurple: {
    label: 'البنفسجي — المصطلحات العلمية',
    shortLabel: 'بنفسجي (مصطلح)',
    description: 'المصطلحات العلمية، الرموز والمركبات والتسميات الدقيقة',
    swatches: ['#6d28d9', '#7c3aed', '#5b21b6', '#86198f'],
  },
  noteOrange: {
    label: 'البرتقالي — الأمثلة والملاحظات',
    shortLabel: 'برتقالي (مثال)',
    description: 'الأمثلة التوضيحية، التطبيقات، والملاحظات الإضافية',
    swatches: ['#c2410c', '#ea580c', '#b45309', '#9a3412'],
  },
};

export const DEFAULT_HANDWRITING_SETTINGS: HandwritingStyleSettings = {
  enabled: true,
  fontId: 'playpen',
  fontSizeScale: 1,
  ruledLines: false,
  scope: 'all',
  palette: { ...DEFAULT_PEN_PALETTE },
};

export const HANDWRITING_STORAGE_KEY = 'snv_handwriting_style_v1';
export const HANDWRITING_PRESETS_KEY = 'snv_handwriting_presets_v1';
export const HANDWRITING_UPDATED_EVENT = 'handwriting-style-updated';

const isHexColor = (val: unknown): val is string =>
  typeof val === 'string' && /^#[0-9a-fA-F]{6}$/.test(val.trim());

export function normalizeHandwritingSettings(raw: Partial<HandwritingStyleSettings> | null | undefined): HandwritingStyleSettings {
  const fontId: HandwritingFontId =
    raw?.fontId && raw.fontId in HANDWRITING_FONTS ? raw.fontId : DEFAULT_HANDWRITING_SETTINGS.fontId;
  const scale = Number(raw?.fontSizeScale);
  const clampedScale = Number.isFinite(scale) ? Math.min(1.12, Math.max(0.92, scale)) : 1;
  const scope: HandwritingScope =
    raw?.scope === 'logbook' || raw?.scope === 'memos' || raw?.scope === 'all' ? raw.scope : 'all';

  const palette: PenPalette = {
    titleBlue: isHexColor(raw?.palette?.titleBlue) ? raw!.palette!.titleBlue : DEFAULT_PEN_PALETTE.titleBlue,
    subRed: isHexColor(raw?.palette?.subRed) ? raw!.palette!.subRed : DEFAULT_PEN_PALETTE.subRed,
    defGreen: isHexColor(raw?.palette?.defGreen) ? raw!.palette!.defGreen : DEFAULT_PEN_PALETTE.defGreen,
    bodyBlack: isHexColor(raw?.palette?.bodyBlack) ? raw!.palette!.bodyBlack : DEFAULT_PEN_PALETTE.bodyBlack,
    termPurple: isHexColor(raw?.palette?.termPurple) ? raw!.palette!.termPurple : DEFAULT_PEN_PALETTE.termPurple,
    noteOrange: isHexColor(raw?.palette?.noteOrange) ? raw!.palette!.noteOrange : DEFAULT_PEN_PALETTE.noteOrange,
  };

  return {
    enabled: typeof raw?.enabled === 'boolean' ? raw.enabled : true,
    fontId,
    fontSizeScale: Math.round(clampedScale * 100) / 100,
    ruledLines: Boolean(raw?.ruledLines),
    scope,
    palette,
    activePresetId: typeof raw?.activePresetId === 'string' ? raw.activePresetId : undefined,
  };
}

export function loadHandwritingSettings(): HandwritingStyleSettings {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_HANDWRITING_SETTINGS, palette: { ...DEFAULT_PEN_PALETTE } };
    const raw = localStorage.getItem(HANDWRITING_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_HANDWRITING_SETTINGS, palette: { ...DEFAULT_PEN_PALETTE } };
    return normalizeHandwritingSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_HANDWRITING_SETTINGS, palette: { ...DEFAULT_PEN_PALETTE } };
  }
}

export function applyHandwritingCssVars(settings: HandwritingStyleSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const fontMeta = HANDWRITING_FONTS[settings.fontId] || HANDWRITING_FONTS.playpen;

  root.style.setProperty('--hw-font', settings.enabled ? fontMeta.cssFamily : HANDWRITING_FONTS.cairo.cssFamily);
  root.style.setProperty('--hw-scale', String(settings.enabled ? settings.fontSizeScale : 1));
  root.style.setProperty('--hw-line-height', String(settings.enabled ? fontMeta.lineHeight : 1.48));
  root.style.setProperty('--hw-word-spacing', settings.enabled ? fontMeta.wordSpacing : '0em');
  root.style.setProperty('--hw-blue', settings.palette.titleBlue);
  root.style.setProperty('--hw-red', settings.palette.subRed);
  root.style.setProperty('--hw-green', settings.palette.defGreen);
  root.style.setProperty('--hw-black', settings.palette.bodyBlack);
  root.style.setProperty('--hw-purple', settings.palette.termPurple);
  root.style.setProperty('--hw-orange', settings.palette.noteOrange);

  root.dataset.hwEnabled = settings.enabled ? 'true' : 'false';
  root.dataset.hwScope = settings.scope;
  root.dataset.hwRuled = settings.enabled && settings.ruledLines ? 'true' : 'false';
  root.dataset.hwFont = settings.fontId;
}

export function saveHandwritingSettings(settings: HandwritingStyleSettings): HandwritingStyleSettings {
  const normalized = normalizeHandwritingSettings(settings);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HANDWRITING_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    // ignore storage quota errors
  }
  applyHandwritingCssVars(normalized);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HANDWRITING_UPDATED_EVENT, { detail: normalized }));
  }
  return normalized;
}

export function resetHandwritingSettings(toOriginalPlatform = false): HandwritingStyleSettings {
  const next: HandwritingStyleSettings = toOriginalPlatform
    ? {
        ...DEFAULT_HANDWRITING_SETTINGS,
        enabled: false,
        fontId: 'cairo',
        palette: { ...DEFAULT_PEN_PALETTE },
      }
    : {
        ...DEFAULT_HANDWRITING_SETTINGS,
        palette: { ...DEFAULT_PEN_PALETTE },
      };
  return saveHandwritingSettings(next);
}

export function loadSavedPresets(): SavedHandwritingPreset[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(HANDWRITING_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
      .map((item) => ({
        id: item.id,
        name: item.name,
        settings: normalizeHandwritingSettings(item.settings),
      }));
  } catch {
    return [];
  }
}

export function saveHandwritingPreset(name: string, settings: HandwritingStyleSettings): SavedHandwritingPreset[] {
  const trimmed = name.trim();
  if (!trimmed) return loadSavedPresets();
  const current = loadSavedPresets();
  const id = `preset-${Date.now().toString(36)}`;
  const entry: SavedHandwritingPreset = {
    id,
    name: trimmed,
    settings: normalizeHandwritingSettings({ ...settings, activePresetId: id }),
  };
  const next = [entry, ...current].slice(0, 12);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HANDWRITING_PRESETS_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore
  }
  return next;
}

export function deleteHandwritingPreset(id: string): SavedHandwritingPreset[] {
  const next = loadSavedPresets().filter((p) => p.id !== id);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HANDWRITING_PRESETS_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore
  }
  return next;
}

export function isHandwritingActiveFor(
  area: 'memos' | 'logbook' | 'general',
  settings: HandwritingStyleSettings = loadHandwritingSettings()
): boolean {
  if (!settings.enabled) return false;
  if (settings.scope === 'all') return true;
  if (area === 'general') return false;
  return settings.scope === area;
}

export function getEffectiveExportFontFamily(
  target: 'pdf' | 'docx',
  settings: HandwritingStyleSettings = loadHandwritingSettings(),
  area: 'memos' | 'logbook' | 'general' | 'all' = 'all'
): string {
  const active =
    area === 'all' ? settings.enabled : isHandwritingActiveFor(area, settings);
  const fontMeta = active
    ? HANDWRITING_FONTS[settings.fontId] || HANDWRITING_FONTS.playpen
    : HANDWRITING_FONTS.cairo;
  return target === 'pdf' ? fontMeta.cssFamily : fontMeta.wordFontName;
}

// ================= نظام التحليل الدلالي للأقلام الملونة (بدون أي تغيير للنص العلمي) =================

export interface SemanticPenToken {
  text: string;
  role: PenRole;
  underline?: boolean;
  bold?: boolean;
}

/**
 * قائمة المصطلحات العلمية والبيولوجية والجيولوجية والكيميائية للمستويات الأربع (1م–4م)
 * تُبرز تلقائياً باللون البنفسجي دون تعديل حرف واحد من النص الأصلي.
 */
const SCIENTIFIC_TERM_PATTERNS: string[] = [
  'الأنبوب الهضمي',
  'الغدد الهاضمة',
  'الإنزيمات الهاضمة',
  'الإنزيمات النوعية',
  'الأميلاز اللعابي',
  'اللعابين',
  'الأميلاز',
  'الإنزيمات',
  'الإنزيم',
  'الغلوكوز',
  'سكر الشعير',
  'المالتوز',
  'الغلوسيدات',
  'البروتينات',
  'البروتياز',
  'البيبتيدات',
  'الأحماض الأمينية',
  'الأحماض الدسمة',
  'الغليسرول',
  'الليباز',
  'الدسم',
  'النشاء',
  'السيليلوز',
  'المغذيات',
  'الكيلوس المعوي',
  'الكيموس',
  'الزغابة المعوية',
  'الزغابات المعوية',
  'الامتصاص المعوي',
  'الوسط الداخلي',
  'الدم',
  'اللمف',
  'السائل البيني',
  'البلازما',
  'المصورة',
  'الكريات الحمراء',
  'الكريات البيضاء',
  'الصفيحات الدموية',
  'الهيموغلوبين',
  'خضاب الدم',
  'التنفس الخلوي',
  'التخمر',
  'الميتوكوندريا',
  'السنخ الرئوي',
  'الأسناخ الرئوية',
  'الحويصل الرئوي',
  'الحويصلات الرئوية',
  'المبادلات الغازية التنفسية',
  'ثنائي أكسيد الكربون',
  'غاز الفحم',
  'الأكسجين',
  'بخار الماء',
  'التركيب الضوئي',
  'النسغ الناقص',
  'النسغ الكامل',
  'اليخضور',
  'الأوبار الماصة',
  'المحلول المعدني',
  'الأملاح المعدنية',
  'الأوعية الخشبية',
  'الأوعية اللحائية',
  'الثغور الورقية',
  'النتح',
  'الانتاش',
  'المستقبل الحسي',
  'المستقبلات الحسية',
  'السيالة العصبية',
  'العصبون',
  'الليف العصبي',
  'المشبك',
  'القوس الانعكاسية',
  'النخاع الشوكي',
  'القشرة المخية',
  'الحركة الإرادية',
  'الحركة اللاإرادية',
  'الفعل المنعكس',
  'الحس الشعوري',
  'المناعة اللانوعية',
  'المناعة النوعية',
  'الخط الدفاعي الأول',
  'الخط الدفاعي الثاني',
  'الخط الدفاعي الثالث',
  'البلعميات',
  'البلعمة',
  'اللمفاويات البائية',
  'اللمفاويات التائية',
  'الأجسام المضادة',
  'المستضد',
  'مولد الضد',
  'الاستجابة المناعية',
  'التلقيح',
  'الاستمصال',
  'المضادات الحيوية',
  'الحساسية',
  'الأمراض المناعية',
  'الخلية',
  'النواة',
  'السيتوبلازم',
  'الغشاء الهيولي',
  'الصبغيات',
  'النمط النووي',
  'الانقسام المنصف',
  'الانقسام الخيطي',
  'الأمشاج',
  'الإلقاح',
  'البويضة الملقحة',
  'الصفات الوراثية',
  'الأمراض الوراثية',
  'الصفائح التكتونية',
  'الظهرات المحيطية',
  'الظهرة المحيطية',
  'الخندق المحيطي',
  'ظاهرة الغوص',
  'التكتونية العامة',
  'الأمواج الزلزالية',
  'الفالق',
  'الصدع',
  'البؤرة',
  'المركز السطحي',
  'البراكين الانفجارية',
  'البراكين الطفحية',
  'الماغما',
  'الليتوسفير',
  'الأستينوسفير',
  'الصخور الرسوبية',
  'الصخور النارية',
  'الصخور المتحولة',
  'المستحاثات',
  'النظام البيئي',
  'السلسلة الغذائية',
  'الشبكة الغذائية',
  'الكتلة الحية',
  'الوسط الحي',
  'المدى الحيوي الجغرافي',
  'التطفل',
  'التكافل',
  'التعايش',
  'التنافس',
  'الافتراس',
  'السبات',
  'الهجرة',
  'الإلقاح الداخلي',
  'الإلقاح الخارجي',
  'الإنسان والصحة',
  'الإنسان والمحيط',
  'CO2',
  'O2',
  'H2O',
  'ADN',
  'ATP',
  'NPK',
];

const SORTED_SCIENTIFIC_TERMS = [...SCIENTIFIC_TERM_PATTERNS].sort((a, b) => b.length - a.length);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SCIENTIFIC_TERM_REGEX = new RegExp(
  `(${SORTED_SCIENTIFIC_TERMS.map(escapeRegex).join('|')})`,
  'g'
);

/**
 * تقسيم مقطع نصي واحد إلى رموز مع الحفاظ على الترتيب الحرفي 100% (Lossless)
 * لإبراز المصطلحات العلمية بالبنفسجي دون تغيير حرف واحد.
 */
export function tokenizeScientificTerms(
  text: string,
  baseRole: PenRole = 'bodyBlack',
  baseBold = false,
  baseUnderline = false
): SemanticPenToken[] {
  if (!text) return [];
  const tokens: SemanticPenToken[] = [];
  let lastIndex = 0;

  SCIENTIFIC_TERM_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SCIENTIFIC_TERM_REGEX.exec(text)) !== null) {
    const start = match.index;
    const matched = match[0];

    // Check word boundary cleanly for ASCII tokens like CO2 / O2
    if (/^[A-Za-z0-9]+$/.test(matched)) {
      const before = start > 0 ? text[start - 1] : ' ';
      const after = start + matched.length < text.length ? text[start + matched.length] : ' ';
      if (/[A-Za-z0-9]/.test(before) || /[A-Za-z0-9]/.test(after)) {
        continue;
      }
    }

    if (start > lastIndex) {
      tokens.push({
        text: text.slice(lastIndex, start),
        role: baseRole,
        bold: baseBold,
        underline: baseUnderline,
      });
    }
    tokens.push({
      text: matched,
      role: baseRole === 'titleBlue' ? 'titleBlue' : 'termPurple',
      bold: baseRole === 'titleBlue' ? true : true,
      underline: baseUnderline,
    });
    lastIndex = start + matched.length;
  }

  if (lastIndex < text.length) {
    tokens.push({
      text: text.slice(lastIndex),
      role: baseRole,
      bold: baseBold,
      underline: baseUnderline,
    });
  }

  return tokens;
}

const classifyLabelRole = (labelText: string): { labelRole: PenRole; valueRole: PenRole; underlineLabel: boolean } => {
  const clean = labelText.replace(/[:：\s]/g, '');
  if (
    clean.includes('الميدان') ||
    clean.includes('المقطع') ||
    clean.includes('الموردالتعلمي') ||
    clean.includes('تعلمالمورد') ||
    clean.includes('عنوان')
  ) {
    return { labelRole: 'titleBlue', valueRole: 'titleBlue', underlineLabel: true };
  }
  if (
    clean.includes('المشكلة') ||
    clean.includes('التنبيه') ||
    clean.includes('هام') ||
    clean.includes('ملاحظةهامة') ||
    clean.includes('الفرضيات') ||
    clean.includes('توجيه') ||
    clean.includes('المهمة')
  ) {
    return { labelRole: 'subRed', valueRole: 'bodyBlack', underlineLabel: true };
  }
  if (
    clean.includes('إرساء') ||
    clean.includes('الاستنتاج') ||
    clean.includes('استنتاج') ||
    clean.includes('تعريف') ||
    clean.includes('الخلاصة') ||
    clean.includes('الحصيلة') ||
    clean.includes('النتيجة') ||
    clean.includes('الكفاءة')
  ) {
    return { labelRole: 'defGreen', valueRole: 'defGreen', underlineLabel: true };
  }
  if (clean.includes('المصطلحات') || clean.includes('مصطلح')) {
    return { labelRole: 'termPurple', valueRole: 'termPurple', underlineLabel: true };
  }
  if (
    clean.includes('مثال') ||
    clean.includes('أمثلة') ||
    clean.includes('ملاحظة') ||
    clean.includes('ملاحظات') ||
    clean.includes('التقويم') ||
    clean.includes('تطبيق') ||
    clean.includes('الأنشطة') ||
    clean.includes('النشاط') ||
    clean.includes('عمل')
  ) {
    return { labelRole: 'noteOrange', valueRole: 'bodyBlack', underlineLabel: true };
  }
  return { labelRole: 'subRed', valueRole: 'bodyBlack', underlineLabel: true };
};

/**
 * تحليل سطر واحد من محتوى الدرس أو الدفتر الرقمي إلى رموز ملونة بالأقلام الستة
 * مع ضمان عدم حذف أو زيادة أي حرف.
 */
export function tokenizePedagogicalLine(
  rawLine: string,
  defaultRole: PenRole = 'bodyBlack'
): SemanticPenToken[] {
  if (!rawLine) return [];

  // 1) Handle explicit <u>Label:</u> rest pattern (from Digital Logbook)
  const uMatch = rawLine.match(/^<u>([^<]+)<\/u>([\s\S]*)$/);
  if (uMatch) {
    const label = uMatch[1];
    const rest = uMatch[2];
    const { labelRole, valueRole, underlineLabel } = classifyLabelRole(label);
    const labelTokens: SemanticPenToken[] = [
      { text: label, role: labelRole, bold: true, underline: underlineLabel },
    ];
    const valueTokens =
      valueRole === 'titleBlue'
        ? [{ text: rest, role: 'titleBlue' as PenRole, bold: true }]
        : tokenizeScientificTerms(rest, valueRole, false, false);
    return [...labelTokens, ...valueTokens];
  }

  // 2) Handle plain prefix labels like "ملاحظة: ..." or "مثال: ..." or "استنتاج: ..." or "تعريف: ..."
  const colonMatch = rawLine.match(/^([^\n:：]{2,32}[:：])([\s\S]*)$/);
  if (colonMatch) {
    const prefix = colonMatch[1];
    const rest = colonMatch[2];
    const { labelRole, valueRole, underlineLabel } = classifyLabelRole(prefix);
    const prefixToken: SemanticPenToken = {
      text: prefix,
      role: labelRole,
      bold: true,
      underline: underlineLabel,
    };
    const valueTokens =
      valueRole === 'titleBlue'
        ? [{ text: rest, role: 'titleBlue' as PenRole, bold: true }]
        : tokenizeScientificTerms(rest, valueRole, false, false);
    return [prefixToken, ...valueTokens];
  }

  // 3) Plain sentence/paragraph -> highlight scientific terms in purple, keep base role
  return tokenizeScientificTerms(rawLine, defaultRole, defaultRole === 'titleBlue', false);
}

export function tokenizePedagogicalText(
  text: string,
  defaultRole: PenRole = 'bodyBlack'
): SemanticPenToken[][] {
  if (!text) return [];
  return String(text)
    .split('\n')
    .map((line) => tokenizePedagogicalLine(line, defaultRole));
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * تحويل النص التعليمي إلى HTML آمن بألوان الأقلام الستة.
 * عند تعطيل الوضع اليدوي (`enabled === false`) يعود للتنسيق الأصلي فقط.
 */
export function formatSemanticHtml(
  rawText: string,
  settings: HandwritingStyleSettings,
  options: { defaultRole?: PenRole; allowUTags?: boolean } = {}
): string {
  const safeInput = String(rawText ?? '');
  const { defaultRole = 'bodyBlack', allowUTags = true } = options;

  if (!settings.enabled) {
    const escaped = escapeHtml(safeInput);
    return allowUTags ? escaped.replace(/&lt;u&gt;/g, '<u>').replace(/&lt;\/u&gt;/g, '</u>') : escaped;
  }

  const lines = safeInput.split('\n');
  return lines
    .map((line) => {
      const tokens = tokenizePedagogicalLine(line, defaultRole);
      return tokens
        .map((tok) => {
          const color = settings.palette[tok.role] || settings.palette.bodyBlack;
          const escaped = escapeHtml(tok.text);
          const isBlueUnderlinedRed = tok.role === 'titleBlue' && tok.underline;
          const styleParts = [`color:${color}`];
          if (tok.bold) styleParts.push('font-weight:700');
          if (tok.underline) {
            styleParts.push(
              isBlueUnderlinedRed
                ? `text-decoration:underline;text-decoration-color:${settings.palette.subRed};text-underline-offset:3px`
                : 'text-decoration:underline;text-underline-offset:3px'
            );
          }
          return `<span class="hw-pen-${tok.role}" style="${styleParts.join(';')}">${escaped}</span>`;
        })
        .join('');
    })
    .join('\n');
}

/**
 * تحويل النص التعليمي إلى مصفوفة TextRun قابلة للتعديل في ملفات Word (.docx)
 * بنفس ألوان الأقلام الستة وبخط عربي متوافق مع RTL.
 */
export function buildDocxTextRuns(
  rawText: string,
  settings: HandwritingStyleSettings,
  options: {
    size?: number;
    bold?: boolean;
    defaultRole?: PenRole;
    fallbackColorHex?: string;
    fontName?: string;
  } = {}
): TextRun[] {
  const safeInput = String(rawText ?? '');
  const size = options.size ?? 22;
  const fontMeta = settings.enabled
    ? HANDWRITING_FONTS[settings.fontId] || HANDWRITING_FONTS.playpen
    : HANDWRITING_FONTS.cairo;
  const wordFont = options.fontName || fontMeta.wordFontName;
  const fontAttrs = {
    ascii: wordFont,
    hAnsi: wordFont,
    cs: wordFont,
    hint: 'cs',
  };

  const stripHash = (hex: string) => hex.replace(/^#/, '').toUpperCase();
  const lines = safeInput.split('\n');

  return lines.flatMap((line, lineIdx) => {
    const runs: TextRun[] = [];
    if (!settings.enabled) {
      const parts = line.split(/(<u>.*?<\/u>)/g);
      parts.forEach((part) => {
        const isU = part.startsWith('<u>') && part.endsWith('</u>');
        const text = isU ? part.slice(3, -4) : part;
        if (!text) return;
        runs.push(
          new TextRun({
            text,
            bold: options.bold,
            underline: isU ? { type: 'single', color: options.fallbackColorHex || '000000' } : undefined,
            color: options.fallbackColorHex || '000000',
            rightToLeft: true,
            size,
            font: fontAttrs,
          })
        );
      });
    } else {
      const tokens = tokenizePedagogicalLine(line, options.defaultRole || 'bodyBlack');
      tokens.forEach((tok) => {
        if (!tok.text) return;
        const hex = stripHash(settings.palette[tok.role] || settings.palette.bodyBlack);
        runs.push(
          new TextRun({
            text: tok.text,
            bold: options.bold || tok.bold,
            underline: tok.underline
              ? {
                  type: 'single',
                  color:
                    tok.role === 'titleBlue'
                      ? stripHash(settings.palette.subRed)
                      : hex,
                }
              : undefined,
            color: hex,
            rightToLeft: true,
            size,
            font: fontAttrs,
          })
        );
      });
    }

    if (lineIdx < lines.length - 1) {
      runs.push(new TextRun({ break: 1 }));
    }
    return runs;
  });
}

/**
 * تطبيق لون القلم المختار مباشرة على النص المظلّل من طرف الأستاذ (في المذكرة أو الدفتر)
 */
export function applyPenColorToSelection(
  role: PenRole,
  palette: PenPalette,
  underline = false
): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false;

  const range = selection.getRangeAt(0);
  if (!range.toString().trim()) return false;

  const span = document.createElement('span');
  span.className = `hw-custom-pen hw-pen-${role}`;
  span.style.color = palette[role];
  if (role === 'titleBlue' || role === 'subRed' || role === 'termPurple') {
    span.style.fontWeight = '700';
  }
  if (underline) {
    span.style.textDecoration = 'underline';
    span.style.textUnderlineOffset = '3px';
    if (role === 'titleBlue') {
      span.style.textDecorationColor = palette.subRed;
    }
  }

  try {
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
    selection.removeAllRanges();
    return true;
  } catch {
    return false;
  }
}

export function clearPenFormattingInSelection(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  const text = range.toString();
  if (!text) return false;

  try {
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    selection.removeAllRanges();
    return true;
  } catch {
    return false;
  }
}
