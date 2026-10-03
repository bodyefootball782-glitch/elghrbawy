# AHMED ELGHRBAWY FINAL — التشغيل مرة واحدة

## 1) Supabase
أنشئ مشروع Supabase جديدًا.

## 2) Authentication
لا يحتاج الطالب إلى Email أو Phone أو OTP. نظام التسجيل الجديد يعمل من خلال API آمن على Vercel ثم ينشئ جلسة Supabase. لا تضع أي Secret داخل ملفات الواجهة.

## 3) Database + Storage
افتح SQL Editor والصق **كل** ملف `supabase/schema.sql` ثم Run.
هذا ينشئ الجداول والصلاحيات وStorage ودوال تصحيح الامتحان.

## 4) مفاتيح المشروع
الواجهة تستخدم Project URL + Publishable key فقط.

على Vercel افتح Project → Settings → Environment Variables وأضف:
- `SUPABASE_URL` = Project URL
- `SUPABASE_SERVICE_ROLE_KEY` = Service Role Key

ثم اعمل Redeploy.

**ممنوع تمامًا وضع `SUPABASE_SERVICE_ROLE_KEY` داخل JavaScript أو HTML.**

## 5) أول Admin
سجّل حسابًا عاديًا من `ahmed/register.html`، ثم نفّذ في SQL Editor:

```sql
select id, full_name, login_email from public.profiles order by created_at desc;

update public.profiles set role='admin' where id='PASTE-USER-ID-HERE';
```

بعدها افتح `admin/index.html`.

## 6) بعد ذلك
لن تحتاج تعديل الملفات في كل مرة. الإدارة تتم من لوحة Admin:
- إضافة/حذف فيديوهات وصور ورفع الملفات إلى Storage.
- إنشاء ونشر الامتحانات.
- إضافة الأسئلة من قاعدة البيانات/واجهة الامتحان.
- قبول/رفض طلبات فتح المحتوى.

## نظام الدخول الجديد
- لا يوجد رقم هاتف ولا OTP.
- التسجيل: الاسم الرباعي + المرحلة (ابتدائية/إعدادية/ثانوية) + الصف + كلمة سر من 10 أحرف أو أرقام أو رموز بالضبط، بدون مسافات.
- يوجد حقل تأكيد لكلمة السر أثناء التسجيل.
- الدخول: كلمة السر فقط.
- كلمة السر تُستخدم كمعرف الحساب من خلال معرف داخلي غير ظاهر للطالب، بينما تخزين والتحقق من كلمة السر يتم عبر Supabase Auth.
- كل كلمة سر يجب أن تكون مختلفة بين الحسابات، لأن كلمة السر هي مفتاح تحديد الحساب.
- مشاهدة النتائج والطلاب.

### إضافة أسئلة امتحان
من SQL Editor يمكن إضافة مجموعة أسئلة مثل:
```sql
insert into public.exam_questions(exam_id,question,options,correct_index,sort_order)
values
(1,'2 + 2 = ؟','["3","4","5","6"]'::jsonb,1,0),
(1,'عاصمة مصر؟','["القاهرة","الإسكندرية","طنطا","أسوان"]'::jsonb,0,1);
```
الطالب لا يحصل على `correct_index`؛ التصحيح يتم داخل Supabase عبر `submit_exam`.
