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
