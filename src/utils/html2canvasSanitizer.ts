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
 */
export function oklchToRgbString(oklchStr: string): string {
  const match = oklchStr.match(
    /oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([-\d.]+(?:deg|rad|turn)?)\s*(?:\/\s*([\d.]+%?))?\s*\)/i
  );
  if (!match) return 'rgb(15, 118, 110)';

  let L = parseFloat(match[1]);
  if (match[1].endsWith('%')) L /= 100;

  let C = parseFloat(match[2]);
  if (match[2].endsWith('%')) C = (C / 100) * 0.4;

  let H = parseFloat(match[3]);
  if (match[3].endsWith('rad')) H = (H * 180) / Math.PI;
  else if (match[3].endsWith('turn')) H = H * 360;

  let alpha = 1;
  if (match[4]) {
    alpha = parseFloat(match[4]);
    if (match[4].endsWith('%')) alpha /= 100;
  }

  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  return oklabToRgbStringValues(L, a, b, alpha);
}

/**
 * تحويل دقيق لصيغة oklab(L a b [/ A]) إلى rgb(r, g, b) أو rgba(r, g, b, a)
 */
export function oklabToRgbString(oklabStr: string): string {
  const match = oklabStr.match(
    /oklab\(\s*([\d.]+%?)\s+([-\d.]+%?)\s+([-\d.]+%?)\s*(?:\/\s*([\d.]+%?))?\s*\)/i
  );
  if (!match) return 'rgb(15, 118, 110)';

  let L = parseFloat(match[1]);
  if (match[1].endsWith('%')) L /= 100;
  let a = parseFloat(match[2]);
  if (match[2].endsWith('%')) a /= 100;
  let b = parseFloat(match[3]);
  if (match[3].endsWith('%')) b /= 100;

  let alpha = 1;
  if (match[4]) {
    alpha = parseFloat(match[4]);
    if (match[4].endsWith('%')) alpha /= 100;
  }

  return oklabToRgbStringValues(L, a, b, alpha);
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
    .replace(/color-mix\([^)]+\)/gi, 'rgba(15, 118, 110, 0.5)')
    .replace(/light-dark\([^)]+\)/gi, '#ffffff')
    .replace(/lab\([^)]+\)/gi, 'rgb(15, 118, 110)')
    .replace(/lch\([^)]+\)/gi, 'rgb(15, 118, 110)');
}

/**
 * استبدال استدعاءات دوال CSS المتداخلة مع احترام الأقواس (Balanced Parentheses)
 */
function replaceBalancedFunctionCall(
  cssText: string,
  funcName: string,
  fallback = '#0f766e'
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
  sanitized = replaceBalancedFunctionCall(sanitized, 'color-mix', 'rgba(15, 118, 110, 0.5)');
  sanitized = replaceBalancedFunctionCall(sanitized, 'oklch', '#0f766e');
  sanitized = replaceBalancedFunctionCall(sanitized, 'oklab', '#0f766e');
  sanitized = replaceBalancedFunctionCall(sanitized, 'lab', '#0f766e');
  sanitized = replaceBalancedFunctionCall(sanitized, 'lch', '#0f766e');
  sanitized = replaceBalancedFunctionCall(sanitized, 'light-dark', '#ffffff');

  sanitized = sanitized
    .replace(/oklch\([^)]+\)/gi, (m) => oklchToRgbString(m))
    .replace(/oklab\([^)]+\)/gi, (m) => oklabToRgbString(m))
    .replace(/color-mix\([^)]+\)/gi, 'rgba(15, 118, 110, 0.5)')
    .replace(/light-dark\([^)]+\)/gi, '#ffffff')
    .replace(/lab\([^)]+\)/gi, '#0f766e')
    .replace(/lch\([^)]+\)/gi, '#0f766e')
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
      get(target, prop, receiver) {
        const val = Reflect.get(target, prop, receiver);
        if (
          typeof val === 'string' &&
          (val.includes('oklch') ||
            val.includes('oklab') ||
            val.includes('color-mix') ||
            val.includes('light-dark'))
        ) {
          return sanitizeColorString(val);
        }
        if (prop === 'getPropertyValue') {
          return function (propName: string) {
            const propVal = target.getPropertyValue(propName);
            if (
              typeof propVal === 'string' &&
              (propVal.includes('oklch') ||
                propVal.includes('oklab') ||
                propVal.includes('color-mix') ||
                propVal.includes('light-dark'))
            ) {
              return sanitizeColorString(propVal);
            }
            return propVal;
          };
        }
        return typeof val === 'function' ? val.bind(target) : val;
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
 * تنظيف كامل للمستند المنسوخ لـ html2canvas قبل البدء في الرسم
 */
export const sanitizeOklchForHtml2Canvas = (clonedDoc: Document): void => {
  try {
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
export async function safeHtml2Canvas(element: HTMLElement, options: any = {}): Promise<HTMLCanvasElement> {
  const restoreWindow = patchWindowGetComputedStyleForHtml2Canvas(window);
  const userOnClone = options.onclone;

  const mergedOptions = {
    ...options,
    onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
      sanitizeOklchForHtml2Canvas(clonedDoc);
      if (typeof userOnClone === 'function') {
        userOnClone(clonedDoc, clonedEl);
      }
    },
  };

  try {
    return await html2canvas(element, mergedOptions);
  } finally {
    restoreWindow();
  }
}
export default safeHtml2Canvas;
