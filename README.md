# AHMED ELGHRBAWY — FINAL PREMIUM

## نظام الحسابات
- لا يوجد رقم هاتف ولا OTP.
- إنشاء الحساب: الاسم الرباعي + المرحلة + الصف + كلمة سر من 10 أحرف/أرقام/رموز بالضبط، بدون مسافات.
- تسجيل الدخول: كلمة السر فقط.
- كلمة السر لا تظهر في قاعدة البيانات كبيانات ملف شخصي؛ Supabase Auth يتولى تخزين والتحقق من كلمة السر.
- الحسابات تستخدم معرف بريد داخليًا فقط حتى يعمل Supabase Auth، والطالب لا يراه ولا يدخله.

## مراحل الدراسة
- ابتدائية: الأول إلى السادس.
- إعدادية: الأول إلى الثالث.
- ثانوية: الأول إلى الثالث.

## Vercel — مطلوب مرة واحدة
أضف Environment Variables إلى مشروع Vercel:
- `SUPABASE_URL` = رابط مشروع Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` = Service Role Key الخاص بالمشروع.

**لا تضع Service Role Key داخل أي ملف JavaScript يعمل في المتصفح.**

بعد إضافة المتغيرات اعمل Redeploy.

## Supabase
1. شغّل `supabase/schema.sql` في SQL Editor.
2. لا تحتاج لإدخال Email أو Phone للطلاب.
3. يمكن أن يظل Email/Phone provider غير مستخدم للطلاب؛ التسجيل يتم عبر `/api/auth` باستخدام Service Role على الخادم ثم إنشاء جلسة Supabase.
4. لإنشاء Admin: أنشئ حسابًا عاديًا أولًا، ثم نفّذ في SQL Editor:

```sql
select id, full_name from public.profiles order by created_at desc;
update public.profiles set role='admin' where id='USER-ID-HERE';
```

## ملاحظة
الـService Role Key سرّي جدًا ويجب أن يبقى في Environment Variables على Vercel فقط.


## التعديلات الأخيرة
- نوع الحساب في التسجيل: طالب / مدرس / Admin (تعريفي فقط). لا يمنح أي صلاحية؛ الصلاحية الحقيقية من `profiles.role` فقط.
- زر ADMIN يظهر للحساب الذي `role='admin'` فقط.
- تم إصلاح مسارات لوحة الإدارة باستخدام Vercel rewrites.
- أضيفت قناة WhatsApp وTikTok ورقم المساعدة 01105638650، وتم حذف رابط YouTube.
- بعد التحديث شغّل `supabase/schema.sql` مرة أخرى في SQL Editor لتطبيق عمود `account_type` وتحديث Trigger التسجيل.


FINAL FIX: Admin pages use direct .html links to avoid Vercel rewrite/page-not-found issues. Registration supports only Student or Admin; Admin registration requires password only.
