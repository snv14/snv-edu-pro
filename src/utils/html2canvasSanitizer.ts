/**
 * تطهير مستند الـ HTML المنسوخ لـ html2canvas لتفادي أخطاء تحليل الألوان الحديثة:
 * "Attempting to parse an unsupported color function 'oklab'"
 * "Attempting to parse an unsupported color function 'oklch'"
 * "Attempting to parse an unsupported color function 'color-mix'"
 * الناتجة عن دوال الألوان الحديثة في Tailwind CSS v4 وتدرجات CSS المتقدمة.
 */
import html2canvas from 'html2canvas';

/**
 * تحويل ألوان OKLAB بدقة إلى قيم sRGB القياسية
 */
function oklabToRgbStringValues(L: number, a: number, b: number, alpha = 1): string {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const toRgb255 = (c: number): number => {
    const abs = Math.abs(c);
    const sign = c < 0 ? -1 : 1;
    const val = abs <= 0.0031308 ? 12.92 * abs : 1.055 * Math.pow(abs, 1 / 2.4) - 0.055;
    return Math.min(255, Math.max(0, Math.round(sign * val * 255)));
  };

  const r = toRgb255(rLin);
  const g = toRgb255(gLin);
  const bVal = toRgb255(bLin);

  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${bVal}, ${Math.round(alpha * 100) / 100})`;
  }
  return `rgb(${r}, ${g}, ${bVal})`;
}

/**
 * تحويل دقيق لصيغة oklch(L C H [/ A]) إلى rgb(r, g, b) أو rgba(r, g, b, a)
 * يدعم قيم none للألوان المحايدة في Tailwind v4 (مثل zinc-50، zinc-900، الأبيض، الأسود)
 */
export function oklchToRgbString(oklchStr: string): string {
  try {
    const inner = oklchStr.replace(/^oklch\(\s*/i, '').replace(/\s*\)$/, '').trim();
    if (!inner) return '#ffffff';

    const [colorPart, alphaPart] = inner.split(/\s*\/\s*/);
    const tokens = colorPart.trim().split(/\s+/);
    if (tokens.length < 3) return '#ffffff';

    // Token 0: Lightness L (0..1 أو نسبة مئوية 0%..100%)
    let L = 1;
    if (tokens[0] !== 'none') {
      L = parseFloat(tokens[0]);
      if (tokens[0].endsWith('%')) L /= 100;
    }
    if (isNaN(L)) L = 1;

    // Token 1: Chroma C (0..0.4 أو نسبة أو none)
    let C = 0;
    if (tokens[1] !== 'none') {
      C = parseFloat(tokens[1]);
      if (tokens[1].endsWith('%')) C = (C / 100) * 0.4;
    }
    if (isNaN(C) || C < 0) C = 0;

    // Token 2: Hue H (درجات زاوية، rad، turn أو none)
    let H = 0;
    const isAchromatic = tokens[2] === 'none' || C === 0;
    if (!isAchromatic) {
      const hStr = tokens[2];
      H = parseFloat(hStr);
      if (hStr.endsWith('rad')) H = (H * 180) / Math.PI;
      else if (hStr.endsWith('turn')) H = H * 360;
      if (isNaN(H)) H = 0;
    }

    // Alpha
    let alpha = 1;
    if (alphaPart && alphaPart !== 'none') {
      alpha = parseFloat(alphaPart);
      if (alphaPart.endsWith('%')) alpha /= 100;
      if (isNaN(alpha)) alpha = 1;
    }

    // تحويل مباشر وسريع للألوان المحايدة (الرماديات، الأسود، الأبيض)
    if (isAchromatic) {
      const linear = Math.max(0, Math.min(1, Math.pow(L, 3)));
      const s = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
      const val = Math.min(255, Math.max(0, Math.round(s * 255)));
      if (alpha < 1) {
        return `rgba(${val}, ${val}, ${val}, ${Math.round(alpha * 100) / 100})`;
      }
      return `rgb(${val}, ${val}, ${val})`;
    }

    const hRad = (H * Math.PI) / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    return oklabToRgbStringValues(L, a, b, alpha);
  } catch {
    return '#ffffff';
  }
}

/**
 * تحويل دقيق لصيغة oklab(L a b [/ A]) إلى rgb(r, g, b) أو rgba(r, g, b, a)
 */
export function oklabToRgbString(oklabStr: string): string {
  try {
    const inner = oklabStr.replace(/^oklab\(\s*/i, '').replace(/\s*\)$/, '').trim();
    if (!inner) return '#ffffff';

    const [colorPart, alphaPart] = inner.split(/\s*\/\s*/);
    const tokens = colorPart.trim().split(/\s+/);
    if (tokens.length < 3) return '#ffffff';

    let L = 1;
    if (tokens[0] !== 'none') {
      L = parseFloat(tokens[0]);
      if (tokens[0].endsWith('%')) L /= 100;
    }
    if (isNaN(L)) L = 1;

    let a = 0;
    if (tokens[1] !== 'none') {
      a = parseFloat(tokens[1]);
      if (tokens[1].endsWith('%')) a = (a / 100) * 0.4;
    }
    if (isNaN(a)) a = 0;

    let b = 0;
    if (tokens[2] !== 'none') {
      b = parseFloat(tokens[2]);
      if (tokens[2].endsWith('%')) b = (b / 100) * 0.4;
    }
    if (isNaN(b)) b = 0;

    let alpha = 1;
    if (alphaPart && alphaPart !== 'none') {
      alpha = parseFloat(alphaPart);
      if (alphaPart.endsWith('%')) alpha /= 100;
      if (isNaN(alpha)) alpha = 1;
    }

    if (a === 0 && b === 0) {
      const linear = Math.max(0, Math.min(1, Math.pow(L, 3)));
      const s = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
      const val = Math.min(255, Math.max(0, Math.round(s * 255)));
      if (alpha < 1) {
        return `rgba(${val}, ${val}, ${val}, ${Math.round(alpha * 100) / 100})`;
      }
      return `rgb(${val}, ${val}, ${val})`;
    }

    return oklabToRgbStringValues(L, a, b, alpha);
  } catch {
    return '#ffffff';
  }
}

/**
 * تطهير أي قيمة لون أو ظل (color, backgroundColor, borderColor, boxShadow)
 * تحتوي على oklch أو oklab أو color-mix إلى صيغة rgb/rgba قياسية
 */
export function sanitizeColorString(val: string): string {
  if (!val || typeof val !== 'string') return val;
  if (!/okl|color-mix|lab\(|lch\(|light-dark\(/i.test(val)) return val;

  return val
    .replace(/oklch\([^)]+\)/gi, (m) => oklchToRgbString(m))
    .replace(/oklab\([^)]+\)/gi, (m) => oklabToRgbString(m))
    .replace(/color-mix\([^)]+\)/gi, 'rgba(2, 132, 199, 0.15)')
    .replace(/light-dark\([^)]+\)/gi, '#ffffff')
    .replace(/lab\([^)]+\)/gi, '#18181b')
    .replace(/lch\([^)]+\)/gi, '#18181b');
}

/**
 * استبدال استدعاءات دوال CSS المتداخلة مع احترام الأقواس (Balanced Parentheses)
 */
function replaceBalancedFunctionCall(
  cssText: string,
  funcName: string,
  fallback = '#ffffff'
): string {
  const prefix = funcName.toLowerCase() + '(';
  let result = '';
  let i = 0;
  const lower = cssText.toLowerCase();

  while (i < cssText.length) {
    const idx = lower.indexOf(prefix, i);
    if (idx === -1) {
      result += cssText.slice(i);
      break;
    }

    result += cssText.slice(i, idx);
    let depth = 1;
    let j = idx + prefix.length;

    while (j < cssText.length && depth > 0) {
      if (cssText[j] === '(') depth++;
      else if (cssText[j] === ')') depth--;
      j++;
    }

    const fullCall = cssText.slice(idx, j);
    if (funcName.toLowerCase() === 'oklch') {
      result += oklchToRgbString(fullCall);
    } else if (funcName.toLowerCase() === 'oklab') {
      result += oklabToRgbString(fullCall);
    } else {
      result += fallback;
    }
    i = j;
  }

  return result;
}

/**
 * تطهير شامل لنص CSS من جميع دوال الألوان الحديثة غير المدعومة في html2canvas
 */
export function sanitizeCssString(css: string): string {
  if (!css || !/okl|color-mix|lab\(|lch\(|light-dark\(/i.test(css)) {
    return css;
  }

  let sanitized = css;
  sanitized = replaceBalancedFunctionCall(sanitized, 'color-mix', 'rgba(2, 132, 199, 0.15)');
  sanitized = replaceBalancedFunctionCall(sanitized, 'oklch', '#ffffff');
  sanitized = replaceBalancedFunctionCall(sanitized, 'oklab', '#ffffff');
  sanitized = replaceBalancedFunctionCall(sanitized, 'lab', '#18181b');
  sanitized = replaceBalancedFunctionCall(sanitized, 'lch', '#18181b');
  sanitized = replaceBalancedFunctionCall(sanitized, 'light-dark', '#ffffff');

  sanitized = sanitized
    .replace(/oklch\([^)]+\)/gi, (m) => oklchToRgbString(m))
    .replace(/oklab\([^)]+\)/gi, (m) => oklabToRgbString(m))
    .replace(/color-mix\([^)]+\)/gi, 'rgba(2, 132, 199, 0.15)')
    .replace(/light-dark\([^)]+\)/gi, '#ffffff')
    .replace(/lab\([^)]+\)/gi, '#18181b')
    .replace(/lch\([^)]+\)/gi, '#18181b')
    .replace(/in\s+oklab/gi, 'in srgb')
    .replace(/in\s+oklch/gi, 'in srgb');

  return sanitized;
}

/**
 * اعتراض آمن وديناميكي لدالة getComputedStyle في نافذة المستند لمنع وصول أي صيغة oklch لمحرك html2canvas
 */
export function patchWindowGetComputedStyleForHtml2Canvas(targetWindow: Window = window): () => void {
  if (!targetWindow || typeof targetWindow.getComputedStyle !== 'function') {
    return () => {};
  }

  const originalGetComputedStyle = targetWindow.getComputedStyle.bind(targetWindow);

  targetWindow.getComputedStyle = function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
    const style = originalGetComputedStyle(elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return function (propName: string) {
            try {
              const propVal = target.getPropertyValue(propName);
              if (
                typeof propVal === 'string' &&
                (propVal.includes('oklch') ||
                  propVal.includes('oklab') ||
                  propVal.includes('color-mix') ||
                  propVal.includes('light-dark') ||
                  propVal.includes('lab(') ||
                  propVal.includes('lch('))
              ) {
                return sanitizeColorString(propVal);
              }
              return propVal;
            } catch {
              return '';
            }
          };
        }

        try {
          const val = (target as any)[prop];
          if (typeof val === 'function') {
            return val.bind(target);
          }
          if (
            typeof val === 'string' &&
            (val.includes('oklch') ||
              val.includes('oklab') ||
              val.includes('color-mix') ||
              val.includes('light-dark') ||
              val.includes('lab(') ||
              val.includes('lch('))
          ) {
            return sanitizeColorString(val);
          }
          return val;
        } catch {
          return undefined;
        }
      },
    });
  };

  return () => {
    try {
      targetWindow.getComputedStyle = originalGetComputedStyle;
    } catch {
      // ignore
    }
  };
}

/**
 * إبطال تباعد الحروف (letter-spacing) داخل المستند المنسوخ.
 *
 * html2canvas v1.4 يقسّم النص إلى "غرافيمات" (حرف إلكتروني واحد) كلما كان
 * letter-spacing لا يساوي صفراً ثم يرسم كل حرف على حدة بـ ctx.fillText.
 * وبما أن المتصفح لا يملك سياقاً نصياً لربط الحروف المتجاورة فإن كل حرف
 * يُرسم بشكله المنفصل (isolated form)، والمسافات تُرسم في الموضع الخاطئ في
 * اتجاه RTL، فتتحول الجملة العربية إلى «الجمهوريةالجزائرية...» وتختفي
 * التشكيلات ووصلات الحروف.
 *
 * الحل: تصفير letter-spacing في نسخة التصدير فقط (لا في الشاشة) حتى يسلك
 * النص المسار العادي fillText(fullRun) فيحافظ html2canvas على تشكيل العربية
 * كما تراه في المعاينة.
 */
export const NEUTRALIZE_LETTER_SPACING_CLASS = 'export-letter-spacing-normal';

const LETTER_SPACING_CSS = `
  .${NEUTRALIZE_LETTER_SPACING_CLASS},
  .${NEUTRALIZE_LETTER_SPACING_CLASS} * {
    letter-spacing: normal !important;
    word-spacing: normal !important;
    text-rendering: optimizeLegibility !important;
    font-kerning: normal !important;
  }
  svg text, text {
    letter-spacing: normal !important;
  }
`;

/**
 * استبدال أدوات Tailwind v4 `rotate-*` بـ transform كلاسيكي.
 *
 * Tailwind v4 لم يعد يكتب `transform: rotate(45deg)` بل خاصية `rotate` المنفصلة
 * (`rotate: 45deg`). وhtml2canvas v1 يقرأ `transform` فقط ولا يعرف `rotate`،
 * فيرسم المعيّنات الصغيرة (◆) كمربعات غير مدوّرة تغطي النص فوقها — وهو ما
 * ظهر على شكل مربّع أزرق فوق كلمة «التربية» في رأس صفحات الدفتر.
 *
 * الحل: تحويل `rotate` إلى `transform: rotate(...)` داخل نسخة التصدير فقط،
 * بعد ضربها في `scale` إن وُجد حتى لا يتغيّر الحجم.
 */
export const convertTailwindRotateInClone = (clonedDoc: Document): void => {
  try {
    const win = clonedDoc.defaultView;
    if (!win) return;

    const targetList = win.document.querySelectorAll<HTMLElement>('[class*="rotate-"]');
    targetList.forEach((el) => {
      const cs = win.getComputedStyle(el);
      const rotate = (cs as any).rotate as string | undefined;
      if (!rotate || rotate === 'none') return;

      const scale = (cs as any).scale as string | undefined;
      const scalePart = scale && scale !== 'none' ? ` scale(${scale})` : '';
      // rotate قد تأتي "45deg" أو "0 0 1 45deg" أو مصفوفة
      const angleMatch = rotate.match(/(-?\d*\.?\d+)deg/);
      if (!angleMatch) return;
      const angle = parseFloat(angleMatch[1]);
      // html2canvas v1 لا يدعم الدالة rotate() إطلاقاً (يقبل matrix/matrix3d
      // فقط، وأي دالة أخرى يرفع عنها استثناءً ويتجاهل التحويل). لذلك نحسب
      // مصفوفة الدوران بأنفسنا ونمرّرها بصيغة matrix(a b c d e f).
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const k = scalePart ? parseFloat(scale as string) || 1 : 1;
      el.style.setProperty(
        'transform',
        `matrix(${(cos * k).toFixed(6)}, ${(sin * k).toFixed(6)}, ${(-sin * k).toFixed(6)}, ${(cos * k).toFixed(6)}, 0, 0)`,
        'important'
      );
      el.style.setProperty('rotate', 'none', 'important');
    });
  } catch (err) {
    console.warn('html2canvas rotate conversion warning:', err);
  }
};

export const neutralizeLetterSpacingInClone = (clonedDoc: Document): void => {
  try {
    const styleId = 'html2canvas-letter-spacing-fix';
    if (!clonedDoc.getElementById(styleId)) {
      const styleEl = clonedDoc.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = LETTER_SPACING_CSS;
      (clonedDoc.head || clonedDoc.documentElement).appendChild(styleEl);
    }

    if (clonedDoc.body) {
      clonedDoc.body.classList.add(NEUTRALIZE_LETTER_SPACING_CLASS);
    }

    // الشبكة الاحتياطية: بعض العناصر تُطبّق التباعد عبر style مضمن يتفوق
    // على أي قاعدة CSS، لذلك نصفّره مباشرة أيضاً.
    clonedDoc.querySelectorAll<HTMLElement>('[style*="letter-spacing"]').forEach((el) => {
      el.style.setProperty('letter-spacing', 'normal', 'important');
      el.style.setProperty('word-spacing', 'normal', 'important');
    });

    clonedDoc.querySelectorAll<HTMLElement>('[class*="tracking-"]').forEach((el) => {
      el.style.setProperty('letter-spacing', 'normal', 'important');
    });
  } catch (err) {
    console.warn('html2canvas letter-spacing neutralize warning:', err);
  }
};

/**
 * تنظيف كامل للمستند المنسوخ لـ html2canvas قبل البدء في الرسم
 */
export const sanitizeOklchForHtml2Canvas = (clonedDoc: Document): void => {
  try {
    // إبطال تباعد الحروف قبل أي شيء آخر حتى لا يجزّئ html2canvas الكلمات العربية
    neutralizeLetterSpacingInClone(clonedDoc);
    // تحويل rotate (Tailwind v4) إلى transform كلاسيكي حتى لا تظهر المعيّنات مربعات
    convertTailwindRotateInClone(clonedDoc);
    // تصحيح قياس خط الأساس حتى لا تُرسم العناوين منخفضة فتتراكب
    stabilizeBaselineMeasurement(clonedDoc);

    // 0. اعتراض getComputedStyle في نافذة المستند المنسوخ إن وُجدت
    if (clonedDoc.defaultView) {
      patchWindowGetComputedStyleForHtml2Canvas(clonedDoc.defaultView);
    }

    // 1. تطهير كافة وسوم <style> في المستند المنسوخ
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach((styleTag) => {
      if (styleTag.textContent) {
        styleTag.textContent = sanitizeCssString(styleTag.textContent);
      }
    });

    // 2. تحويل وتطهير وسوم <link rel="stylesheet"> لتجنب قراءة قواعد غير مطهرة
    const linkTags = clonedDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
    linkTags.forEach((link) => {
      try {
        let cssText = '';
        if (typeof document !== 'undefined') {
          for (let i = 0; i < document.styleSheets.length; i++) {
            const sheet = document.styleSheets[i];
            if (
              sheet.href === link.href ||
              (sheet.ownerNode && (sheet.ownerNode as HTMLLinkElement).href === link.href)
            ) {
              try {
                const rules = sheet.cssRules;
                if (rules) {
                  cssText = Array.from(rules)
                    .map((r) => r.cssText)
                    .join('\n');
                }
              } catch {
                // cross-origin
              }
              break;
            }
          }
        }

        if (cssText) {
          const inlineStyle = clonedDoc.createElement('style');
          inlineStyle.textContent = sanitizeCssString(cssText);
          link.parentNode?.replaceChild(inlineStyle, link);
        }
      } catch (err) {
        console.warn('html2canvas stylesheet inline warning:', err);
      }
    });

    // 3. فحص وتطهير الأنماط المضمنة في عناصر الصفحة (inline styles)
    const elementsWithInlineStyles = clonedDoc.querySelectorAll<HTMLElement>('[style]');
    elementsWithInlineStyles.forEach((el) => {
      const styleAttr = el.getAttribute('style');
      if (styleAttr && /okl|color-mix|lab\(|lch\(/i.test(styleAttr)) {
        el.setAttribute('style', sanitizeCssString(styleAttr));
      }
    });

    // 4. تأمين المتغيرات اللونية الأساسية لـ Tailwind v4 في :root
    const rootEl = clonedDoc.documentElement;
    if (rootEl) {
      const safeColorPalette: Record<string, string> = {
        '--color-emerald-50': '#ecfdf5',
        '--color-emerald-100': '#d1fae5',
        '--color-emerald-200': '#a7f3d0',
        '--color-emerald-300': '#6ee7b7',
        '--color-emerald-400': '#34d399',
        '--color-emerald-500': '#10b981',
        '--color-emerald-600': '#059669',
        '--color-emerald-700': '#047857',
        '--color-emerald-800': '#065f46',
        '--color-emerald-900': '#064e3b',
        '--color-teal-50': '#f0fdfa',
        '--color-teal-100': '#ccfbf1',
        '--color-teal-200': '#99f6e4',
        '--color-teal-300': '#5eead4',
        '--color-teal-400': '#2dd4bf',
        '--color-teal-500': '#14b8a6',
        '--color-teal-600': '#0d9488',
        '--color-teal-700': '#0f766e',
        '--color-teal-800': '#115e59',
        '--color-teal-900': '#134e4a',
        '--color-slate-50': '#f8fafc',
        '--color-slate-100': '#f1f5f9',
        '--color-slate-200': '#e2e8f0',
        '--color-slate-300': '#cbd5e1',
        '--color-slate-400': '#94a3b8',
        '--color-slate-500': '#64748b',
        '--color-slate-600': '#475569',
        '--color-slate-700': '#334155',
        '--color-slate-800': '#1e293b',
        '--color-slate-900': '#0f172a',
        '--color-gray-50': '#f9fafb',
        '--color-gray-100': '#f3f4f6',
        '--color-gray-200': '#e5e7eb',
        '--color-gray-300': '#d1d5db',
        '--color-gray-400': '#9ca3af',
        '--color-gray-500': '#6b7280',
        '--color-gray-600': '#4b5563',
        '--color-gray-700': '#374151',
        '--color-gray-800': '#1f2937',
        '--color-gray-900': '#111827',
        // Zinc palette
        '--color-zinc-50': '#fafafa',
        '--color-zinc-100': '#f4f4f5',
        '--color-zinc-200': '#e4e4e7',
        '--color-zinc-300': '#d4d4d8',
        '--color-zinc-400': '#a1a1aa',
        '--color-zinc-500': '#71717a',
        '--color-zinc-600': '#52525b',
        '--color-zinc-700': '#3f3f46',
        '--color-zinc-800': '#27272a',
        '--color-zinc-900': '#18181b',
        '--color-zinc-950': '#09090b',
        // Sky palette (Daily log official template theme)
        '--color-sky-50': '#f0f9ff',
        '--color-sky-100': '#e0f2fe',
        '--color-sky-200': '#bae6fd',
        '--color-sky-300': '#7dd3fc',
        '--color-sky-400': '#38bdf8',
        '--color-sky-500': '#0ea5e9',
        '--color-sky-600': '#0284c7',
        '--color-sky-700': '#0369a1',
        '--color-sky-800': '#075985',
        '--color-sky-900': '#0c4a6e',
        '--color-sky-950': '#082f49',
        // Blue palette
        '--color-blue-50': '#eff6ff',
        '--color-blue-100': '#dbeafe',
        '--color-blue-200': '#bfdbfe',
        '--color-blue-300': '#93c5fd',
        '--color-blue-400': '#60a5fa',
        '--color-blue-500': '#3b82f6',
        '--color-blue-600': '#2563eb',
        '--color-blue-700': '#1d4ed8',
        '--color-blue-800': '#1e40af',
        '--color-blue-900': '#1e3a8a',
        // Amber palette
        '--color-amber-50': '#fffbeb',
        '--color-amber-100': '#fef3c7',
        '--color-amber-200': '#fde68a',
        '--color-amber-300': '#fcd34d',
        '--color-amber-400': '#fbbf24',
        '--color-amber-500': '#f59e0b',
        '--color-amber-600': '#d97706',
        '--color-amber-700': '#b45309',
        '--color-amber-800': '#92400e',
        '--color-amber-900': '#78350f',
        // Red palette
        '--color-red-50': '#fef2f2',
        '--color-red-100': '#fee2e2',
        '--color-red-200': '#fecaca',
        '--color-red-300': '#fca5a5',
        '--color-red-400': '#f87171',
        '--color-red-500': '#ef4444',
        '--color-red-600': '#dc2626',
        '--color-red-700': '#b91c1c',
        '--color-red-800': '#991b1b',
        '--color-red-900': '#7f1d1d',
        '--color-white': '#ffffff',
        '--color-black': '#000000',
      };

      for (const [prop, val] of Object.entries(safeColorPalette)) {
        rootEl.style.setProperty(prop, val);
      }
    }

    // 5. فحص الخصائص اللونية لعناصر المستند وتثبيت قيم RGB الآمنة
    const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'] as const;
    const allElements = clonedDoc.querySelectorAll<HTMLElement>('*');
    allElements.forEach((el) => {
      for (const prop of colorProps) {
        const val = el.style[prop];
        if (val && /okl|color-mix|lab\(|lch\(/i.test(val)) {
          el.style[prop] = sanitizeColorString(val);
        }
      }
    });
  } catch (err) {
    console.warn('html2canvas color sanitize warning:', err);
  }
};

export const sanitizeColorsForHtml2Canvas = sanitizeOklchForHtml2Canvas;

/**
 * غلاف شامل وآمن لـ html2canvas يعترض تلقائياً أي دوال ألوان حديثة
 * (oklch, oklab, color-mix) ويمنع أي انهيار في التصيير والطباعة والتصدير.
 */
/**
 * تحميل كل أوزان/عائلات الخطوط المستخدمة في الصفحة داخل المستند الأصلي.
 *
 * لماذا هذا ضروري:
 * html2canvas ينسخ الصفحة إلى iframe ثم ينتظر `documentClone.fonts.ready`.
 * سجلات الخطوط في المستند المنسوخ تبدأ بحالة "loading" و`fonts.ready` يُحلّ
 * فوراً في تلك اللحظة، فيُكمل الرسم قبل جهوزية الخط. النتيجة: النص يُرسم بخط
 * احتياطي ذي مقاييس مختلفة، فتتراكب العناوين (مثل «الدفتر اليومي للأستاذ»
 * فوق شارتها). لذلك نُجبر كل الأوجه على التحميل في المستند الأصلي أولاً؛
 * وعندها تُنسخ حالة "loaded" وتصبح القياسات صحيحة.
 */
export async function ensureExportFontsReady(root: HTMLElement | Document = document): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;

  const specs = new Set<string>();
  const scope = root instanceof Document ? root.body : root;

  if (scope) {
    scope.querySelectorAll<HTMLElement>('*').forEach((el) => {
      // نتخطى العناصر التي لا تحمل نصاً محسوساً لتقليل عدد الطلبات
      if (!el.textContent || !el.textContent.trim()) return;
      const cs = getComputedStyle(el);
      const family = (cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim();
      if (!family) return;
      specs.add(`${cs.fontStyle || 'normal'} ${cs.fontWeight || '400'} 16px "${family}"`);
    });
  }

  // أوزان الخطوط المستخدمة في قوالب الدفتر بغض النظر عن الحالة الحالية
  ['400', '500', '700', '800', '900'].forEach((weight) => {
    specs.add(`normal ${weight} 16px "Tajawal"`);
    specs.add(`normal ${weight} 16px "Cairo"`);
  });

  await Promise.all(
    Array.from(specs).map(async (spec) => {
      try {
        await document.fonts.load(spec);
      } catch {
        /* تجاهل الأوزان غير الموجودة */
      }
    })
  );

  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }
}


/**
 * انتظار جهوزية الخطوط داخل المستند المنسوخ (iframe html2canvas) قبل الرسم.
 */
async function waitForClonedFontsReady(clonedDoc: Document): Promise<void> {
  try {
    const fonts = clonedDoc.fonts;
    const win = clonedDoc.defaultView;
    const specs = new Set<string>(['normal 400 16px "Tajawal"', 'normal 700 16px "Tajawal"', 'normal 900 16px "Tajawal"']);
    clonedDoc.querySelectorAll<HTMLElement>('*').forEach((el) => {
      if (!el.textContent || !el.textContent.trim()) return;
      const cs = win ? win.getComputedStyle(el) : null;
      if (!cs) return;
      const family = (cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim();
      if (family) specs.add(`${cs.fontStyle || 'normal'} ${cs.fontWeight || '400'} 16px "${family}"`);
    });

    if (fonts) {
      await Promise.all(
        Array.from(specs).map(async (spec) => {
          try {
            await fonts.load(spec);
          } catch {
            /* ignore */
          }
        })
      );
      try {
        await fonts.ready;
      } catch {
        /* ignore */
      }
    }

    if (win) {
      await new Promise<void>((resolve) => {
        let frames = 0;
        const tick = () => {
          frames += 1;
          if (frames >= 3) return resolve();
          win.requestAnimationFrame(tick);
        };
        win.requestAnimationFrame(tick);
        setTimeout(resolve, 1500);
      });
    }
  } catch (err) {
    console.warn('html2canvas cloned fonts wait warning:', err);
  }
}


/**
 * إصلاح قياس خط الأساس (baseline) داخل المستند المنسوخ.
 *
 * html2canvas يقيس baseline بإنشاء عنصر قياس داخل `body` المنسوخ، وهذا العنصر
 * يرث `line-height` الخاص بالـ body. عندما يكون line-height أكبر من normal
 * (كما في واجهة المنصة) يُحسب خط الأساس أعمق من الحقيقة، فيُرسم النص منخفضاً
 * عن مكانه فتتراكب العناوين مع العناصر التي تحتها (كما في عنوان الدفتر).
 *
 * الحل: نجعل line-height للـ body في النسخة المنسوخة `normal` (فتصبح القياسات
 * صحيحة) مع تثبيت line-height الأصلي على جذر الصفحة كقيمة مضمنة حتى يبقى
 * التخطيط مطابقاً للمعاينة تماماً.
 */
export const stabilizeBaselineMeasurement = (clonedDoc: Document): void => {
  try {
    // لا نلمس line-height الخاص بـ body إطلاقاً.
    //
    // كان هنا سابقاً `body { line-height: normal !important; }` بهدف تصحيح
    // قياس خط الأساس، لكنه كان يغيّر ارتفاع أسطر كل النصوص الموروثة فيتغيّر
    // التخطيط كله (الشارة والعنوان والقائمة) ويبتعد التصدير عن المعاينة.
    // التصحيح الصحيح هو تعديل موضع العنوان وحده بمقدار محسوب (أدناه).

    // إصلاح إزاحة نص العناوين الكبيرة.
    //
    // html2canvas يقيس خط الأساس بخدعة عنصر قياس (img + span) داخل body،
    // والنتيجة تختلف عن خط الأساس الحقيقي الذي يحسبه المتصفح من مقاييس
    // الخط (ascent/descent) ونصف التباعد (half-leading). النتيجة أن نص
    // العناوين يُرسم أعمق من موضعه الحقيقي فيلامس/يتراكب مع العنصر أسفله
    // (مثل شارة «التعليم المتوسط» تحت عنوان «الدفتر اليومي للأستاذ»).
    //
    // نحسب هنا الفرق Δ = baseline_html2canvas − baseline_الحقيقي لكل عنوان،
    // ثم نرفع محتواه بمقدار Δ بـ position:relative (لا يؤثر على تخطيط
    // الأشقاء) فتصبح الصفحة المصدَّرة مطابقة للمعاينة.
    const win2 = clonedDoc.defaultView;
    if (win2) {
      const canvasCtx = clonedDoc.createElement('canvas').getContext('2d');

      /** يكرّر خوارزمية html2canvas لحساب baseline */
      const html2canvasBaseline = (fontFamily: string, fontSize: string): number => {
        const container = clonedDoc.createElement('div');
        const img = clonedDoc.createElement('img');
        const span = clonedDoc.createElement('span');
        container.style.visibility = 'hidden';
        container.style.fontFamily = fontFamily;
        container.style.fontSize = fontSize;
        container.style.margin = '0';
        container.style.padding = '0';
        container.style.whiteSpace = 'nowrap';
        clonedDoc.body.appendChild(container);
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        img.width = 1;
        img.height = 1;
        img.style.cssText = 'margin:0;padding:0;vertical-align:baseline';
        span.style.cssText = 'margin:0;padding:0';
        span.style.fontFamily = fontFamily;
        span.style.fontSize = fontSize;
        span.appendChild(clonedDoc.createTextNode('Hidden Text'));
        container.appendChild(span);
        container.appendChild(img);
        const value = img.offsetTop - span.offsetTop + 2;
        container.remove();
        return value;
      };

      clonedDoc.querySelectorAll<HTMLElement>('h1,h2,h3').forEach((el) => {
        const text = el.textContent;
        if (!text || !text.trim()) return;
        const cs = win2.getComputedStyle(el);
        const fontSizePx = parseFloat(cs.fontSize) || 0;
        if (fontSizePx < 13) return;

        const h2cBaseline = html2canvasBaseline(cs.fontFamily, cs.fontSize);
        if (!h2cBaseline) return;

        // خط الأساس الحقيقي: half-leading + ascent
        let trueBaseline = h2cBaseline;
        if (canvasCtx) {
          canvasCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          const m = canvasCtx.measureText(text);
          const ascent = m.fontBoundingBoxAscent;
          const descent = m.fontBoundingBoxDescent;
          const lineHeightPx = cs.lineHeight === 'normal' ? ascent + descent : parseFloat(cs.lineHeight);
          if (isFinite(ascent) && isFinite(descent) && ascent > 0) {
            const halfLeading = (lineHeightPx - (ascent + descent)) / 2;
            trueBaseline = halfLeading + ascent;
          }
        }

        const delta = h2cBaseline - trueBaseline;
        if (Math.abs(delta) < 1) return;
        el.style.setProperty('position', 'relative', 'important');
        el.style.setProperty('top', `${(-delta).toFixed(2)}px`, 'important');
      });
    }

    const roots = clonedDoc.querySelectorAll<HTMLElement>(
      '[data-preview-export-page="true"], .print-page'
    );
    roots.forEach((root) => {
      const cs = clonedDoc.defaultView?.getComputedStyle(root);
      if (cs?.lineHeight && cs.lineHeight !== 'normal') {
        root.style.lineHeight = cs.lineHeight;
      }
    });
  } catch (err) {
    console.warn('html2canvas baseline fix warning:', err);
  }
};

export async function safeHtml2Canvas(element: HTMLElement, options: any = {}): Promise<HTMLCanvasElement> {
  await ensureExportFontsReady(element);
  const restoreWindow = patchWindowGetComputedStyleForHtml2Canvas(window);
  const userOnClone = options.onclone;

  const mergedOptions = {
    ...options,
    // onclone غير متزامن عن قصد: html2canvas ينتظر القيمة المُعادة قبل
    // بدء الرسم، وهذا يمنحنا فرصة تحميل الخطوط داخل المستند المنسوخ نفسه
    // (سجلات الخطوط في الـ iframe تبدأ "loading" فيرسم بأشكال حروف خاطئة).
    onclone: async (clonedDoc: Document, clonedEl: HTMLElement) => {
      sanitizeOklchForHtml2Canvas(clonedDoc);
      if (typeof userOnClone === 'function') {
        await userOnClone(clonedDoc, clonedEl);
      }
      await waitForClonedFontsReady(clonedDoc);
    },
  };

  try {
    return await html2canvas(element, mergedOptions);
  } finally {
    restoreWindow();
  }
}
export default safeHtml2Canvas;
