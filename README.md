# AHMED ELGHRBAWY — PHYSICS LAB V3

منصة فيزياء بهوية بصرية جديدة بالكامل، مع الحفاظ على Core System: تسجيل، محتوى، فيديوهات، صور، امتحانات، نتائج، Logs، Admin، وإعدادات المنصة.

## أهم التغييرات
- الصفحة الرئيسية متاحة للجميع بدون تسجيل.
- الزائر يقدر يشوف بطاقات المحتوى، لكن الفيديو/الامتحان/المحتوى المقفول لا يفتح إلا بعد تسجيل الدخول.
- تسجيل الحساب على 3 مراحل:
  1. طالب أو Admin.
  2. الاسم، وللطالب المرحلة والصف.
  3. كلمة السر + التأكيد.
- الطالب: ابتدائي أولى–سادسة، إعدادي أولى–ثالثة، ثانوي أولى–ثالثة.
- Admin: الاسم + كلمة السر فقط. اختيار Admin لا يمنح صلاحية Admin تلقائيًا؛ الصلاحية الحقيقية هي `profiles.role='admin'`.
- كلمة السر 10 خانات بالضبط، حروف/أرقام/رموز بدون مسافات.
- دخول الحساب بكلمة السر فقط.
- واجهة جديدة داكنة بالكامل، مع حركة فيزيائية وخلفية نجوم/مدارات/معادلات.
- شات داخل الصفحة الرئيسية مع ردود مساعدة سريعة.
- كارت HELPER وكارت ADMIN قابلان للتعديل من لوحة الإدارة.
- إعدادات Admin لتغيير الأرقام، الروابط، عناوين الصفحة، خلفية الموقع، بيانات HELPER/ADMIN، وإعداد Webhook للـDiscord Logs مستقبلًا.
- صفحة Logs تجمع نشاط الحسابات والمحتوى والامتحانات والنتائج والمشتريات.
- منع الطالب من إعادة نفس الامتحان على مستوى قاعدة البيانات.
- واجهة محسنة للموبايل والتابلت والديسكتوب والتلفاز.

## Supabase — مرة واحدة للمشروع الجديد
شغّل الملف:
`supabase/schema.sql`
داخل Supabase → SQL Editor → Run.

الملف ينشئ الجداول الأساسية + `site_settings` + `activity_logs` + التخزين + سياسات الأمان.

## Vercel
أضف Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

ثم Redeploy.

**مهم:** Service Role Key سرّي جدًا ولا يوضع في GitHub أو JavaScript الخاص بالمتصفح.

## الصور والخلفية
يمكنك وضع الصور في:
`assets/images/`

أو من Admin → Settings رفع خلفية مباشرة من الجهاز.

## Discord Logs
صفحة Admin → Logs تحتوي زر ربط Discord، وصفحة Settings بها مكان Webhook غرفة `لوج المنصة`. الربط التلقائي يمكن تفعيله لاحقًا من Backend/Discord Bot بدون تغيير Core System.

## FINAL V4 notes
- Teacher photo: put the real photo in `assets/images/teacher.jpg` (PNG/WebP also supported).
- If no photo is supplied, the site shows `assets/images/teacher-placeholder.svg` instead of a blank card.
- Browser uses the publishable Supabase key only; the service-role key must remain in Vercel server environment variables for `/api/stats`.
- Required Vercel server variables: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Admin access is controlled only by `profiles.role = 'admin'`; choosing Admin during registration does NOT grant admin privileges.
