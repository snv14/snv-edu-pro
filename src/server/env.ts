/** فحص المتغيرات البيئية عند إقلاع الخادم وطباعة تقرير واضح (دون طباعة أي قيمة سرية) */
const has = (name: string) => Boolean(process.env[name]?.trim());

export interface EnvReport { errors: string[]; warnings: string[]; info: string[] }

export const checkServerEnv = (): EnvReport => {
  const report: EnvReport = { errors: [], warnings: [], info: [] };
  const geminiKey = has('GEMINI_API_KEY') || has('GOOGLE_API_KEY');
  const fallbacks = [
    has('OPENAI_API_KEY') && 'openai',
    has('ANTHROPIC_API_KEY') && 'anthropic',
    has('HF_TOKEN') && 'huggingface',
  ].filter(Boolean) as string[];

  if (!geminiKey && fallbacks.length === 0) {
    report.warnings.push('لا يوجد أي مفتاح ذكاء اصطناعي (GEMINI_API_KEY ...): ميزات المساعد والتوليد ستكون معطّلة.');
  } else if (!geminiKey) {
    report.warnings.push('GEMINI_API_KEY غير مضبوط: تحليل الصور وPDF والبحث في الويب غير متاح، وسيُستعمل: ' + fallbacks.join('، '));
  } else {
    report.info.push('Gemini مفعّل' + (fallbacks.length ? ` (احتياطي: ${fallbacks.join('، ')})` : ''));
  }

  const port = process.env.PORT;
  if (port && (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)) {
    report.errors.push(`PORT غير صالح: "${port}"`);
  }

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    report.warnings.push(`NODE_ENV قيمته غير معتادة: "${nodeEnv}"`);
  }

  const model = process.env.GEMINI_MODEL || '';
  if (/(^|-)(1\.5|2\.0|2\.5)(-|$)/.test(model)) {
    report.warnings.push(`GEMINI_MODEL="${model}" قديم وسيُستبدل بالنموذج الافتراضي.`);
  }

  if (nodeEnv === 'production' && !has('TRUST_PROXY')) {
    report.info.push('TIP: خلف وسيط عكسي (Nginx/Cloud Run) اضبط TRUST_PROXY=1 ليعمل تحديد المعدّل لكل مستخدم.');
  }

  const firebaseMissing = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'].filter((n) => !has(n));
  if (firebaseMissing.length) {
    report.info.push('Firebase غير مفعّل (المزامنة السحابية متوقفة): ينقص ' + firebaseMissing.join(', '));
  }
  return report;
};

export const printEnvReport = (): void => {
  const report = checkServerEnv();
  for (const m of report.info) console.log('[env] ' + m);
  for (const m of report.warnings) console.warn('[env] تحذير: ' + m);
  for (const m of report.errors) console.error('[env] خطأ: ' + m);
  if (report.errors.length) process.exit(1);
};
