/**
 * تطهير مستند الـ HTML المنسوخ لـ html2canvas لتفادي أخطاء تحليل الألوان الحديثة:
 * "Attempting to parse an unsupported color function 'oklab'"
 * "Attempting to parse an unsupported color function 'oklch'"
 * "Attempting to parse an unsupported color function 'color-mix'"
 * الناتجة عن دوال الألوان الحديثة في Tailwind CSS v4 وتدرجات CSS المتقدمة.
 */

let canvasContext: CanvasRenderingContext2D | null = null;

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!canvasContext) {
    try {
      const cvs = document.createElement('canvas');
      cvs.width = 1;
      cvs.height = 1;
      canvasContext = cvs.getContext('2d');
    } catch {
      canvasContext = null;
    }
  }
  return canvasContext;
}

/**
 * تحويل أي صيغة لون حديثة (oklab, oklch, color-mix, lab, lch) إلى صيغة RGB/HEX قياسية
 * يفهمها محرك html2canvas دون أي أخطاء.
 */
function resolveColorToStandardRgb(colorExpr: string, fallback = '#0f766e'): string {
  try {
    const ctx = getCanvasContext();
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = colorExpr;
      const resolved = ctx.fillStyle;
      if (
        resolved &&
        !resolved.includes('okl') &&
        !resolved.includes('color-mix') &&
        !resolved.includes('lab')
      ) {
        return resolved;
      }
    }
  } catch {
    // تجاهل الأخطاء واستخدام اللون البديل الآمن
  }
  return fallback;
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
    const resolved = resolveColorToStandardRgb(fullCall, fallback);
    result += resolved;
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

  // 1. تفكيك دوال color-mix أولاً لأنها غالباً ما تحتوي على oklab أو oklch كمعامل
  sanitized = replaceBalancedFunctionCall(sanitized, 'color-mix', 'rgba(15, 118, 110, 0.5)');

  // 2. تفكيك دوال oklab و oklch المستقلة
  sanitized = replaceBalancedFunctionCall(sanitized, 'oklab', '#0f766e');
  sanitized = replaceBalancedFunctionCall(sanitized, 'oklch', '#0f766e');

  // 3. تفكيك دوال lab و lch و light-dark
  sanitized = replaceBalancedFunctionCall(sanitized, 'lab', '#0f766e');
  sanitized = replaceBalancedFunctionCall(sanitized, 'lch', '#0f766e');
  sanitized = replaceBalancedFunctionCall(sanitized, 'light-dark', '#0f766e');

  // 4. مرشح أمان نهائي للتأكد من عدم بقاء أي تعبير oklab / oklch / color-mix
  sanitized = sanitized
    .replace(/color-mix\s*\([^;}]*\)/gi, '#0f766e')
    .replace(/oklab\s*\([^;}]*\)/gi, '#0f766e')
    .replace(/oklch\s*\([^;}]*\)/gi, '#0f766e')
    .replace(/lab\s*\([^;}]*\)/gi, '#0f766e')
    .replace(/lch\s*\([^;}]*\)/gi, '#0f766e')
    .replace(/in\s+oklab/gi, 'in srgb')
    .replace(/in\s+oklch/gi, 'in srgb');

  return sanitized;
}

/**
 * تنظيف كامل للمستند المنسوخ لـ html2canvas قبل البدء في الرسم
 */
export const sanitizeOklchForHtml2Canvas = (clonedDoc: Document): void => {
  try {
    // 1. تطهير كافة وسوم <style> في المستند المنسوخ
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach((styleTag) => {
      if (styleTag.textContent) {
        styleTag.textContent = sanitizeCssString(styleTag.textContent);
      }
    });

    // 2. تحويل وتطهير وسوم <link rel="stylesheet"> لتجنب قراءة html2canvas لقواعد غير مطهرة
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
                // تجاهل قيود الأمان عبر النطاقات إن وُجدت
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

    // 4. تأمين المتغيرات اللونية الأساسية لـ Tailwind v4 في :root و body
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
      };

      for (const [prop, val] of Object.entries(safeColorPalette)) {
        rootEl.style.setProperty(prop, val);
      }
    }

    // 5. فحص مباشر للخصائص اللونية على كافة عناصر الجسم المنسوخ
    const colorProperties = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'] as const;
    const allElements = clonedDoc.querySelectorAll<HTMLElement>('*');
    allElements.forEach((el) => {
      for (const prop of colorProperties) {
        const val = el.style[prop];
        if (val && /okl|color-mix|lab\(|lch\(/i.test(val)) {
          el.style[prop] = resolveColorToStandardRgb(val, '#0f766e');
        }
      }
    });
  } catch (err) {
    console.warn('html2canvas color sanitize warning:', err);
  }
};

export const sanitizeColorsForHtml2Canvas = sanitizeOklchForHtml2Canvas;
