import type { NextFunction, Request, Response } from 'express';

const isProd = () => process.env.NODE_ENV === 'production';

/** ترويسات أمان عامة (بدون اعتماد على helmet) */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups'); // مطلوب لنافذة تسجيل الدخول Google
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  if (isProd()) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    // CSP في الإنتاج فقط (Vite في التطوير يحتاج سكربتات مضمنة)
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' https://apis.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://www.googleapis.com",
      "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; '));
  }
  next();
};

interface Bucket { count: number; resetAt: number }

/** محدد معدّل بسيط في الذاكرة لكل عنوان IP (يحمي مفاتيح الذكاء الاصطناعي من الاستنزاف) */
export const createRateLimiter = (options: { windowMs: number; max: number; message?: string }) => {
  const buckets = new Map<string, Bucket>();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  }, options.windowMs);
  (timer as unknown as { unref?: () => void }).unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > options.max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: options.message || 'عدد الطلبات كبير جداً. حاول بعد قليل.' });
    }
    return next();
  };
};

/** رسالة خطأ آمنة للعميل: تُزال المفاتيح والرموز والروابط الداخلية وتُقصّ */
export const publicError = (message: unknown, fallback = 'تعذر إكمال الطلب. حاول مرة أخرى لاحقاً.'): string => {
  const text = String(message ?? '').trim();
  if (!text) return fallback;
  const redacted = text
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted]')
    .replace(/\b(sk|hf|key)[-_][A-Za-z0-9_-]{16,}/gi, '[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/([?&](?:key|api_key|token)=)[^&\s]+/gi, '$1[redacted]')
    .replace(/\/(?:home|root|app|usr|var|Users)\/[^\s'"]+/g, '[path]');
  return redacted.length > 300 ? redacted.slice(0, 300) + '…' : redacted;
};
