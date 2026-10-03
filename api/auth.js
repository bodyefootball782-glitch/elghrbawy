const crypto = require('crypto');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password, 'utf8').digest('hex');
}

function validPassword(password) {
  return typeof password === 'string' && password.length === 10 && !/\s/.test(password);
}

function validName(name) {
  return typeof name === 'string' && name.trim().split(/\s+/).filter(Boolean).length === 4;
}

const accountTypes = ['student','teacher','admin'];

const stages = {
  'ابتدائية': ['الأول الابتدائي','الثاني الابتدائي','الثالث الابتدائي','الرابع الابتدائي','الخامس الابتدائي','السادس الابتدائي'],
  'إعدادية': ['الأول الإعدادي','الثاني الإعدادي','الثالث الإعدادي'],
  'ثانوية': ['الأول الثانوي','الثاني الثانوي','الثالث الثانوي']
};

async function supabaseFetch(path, options = {}) {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error('Server authentication is not configured.');
  const headers = Object.assign({
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json'
  }, options.headers || {});
  return fetch(`${base}${path}`, Object.assign({}, options, { headers }));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const action = String(req.query?.action || 'login');
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const password = body.password;

    if (!validPassword(password)) return json(res, 400, { error: 'كلمة السر يجب أن تكون 10 أحرف/أرقام/رموز بالضبط، ومن غير مسافات.' });

    const digest = hashPassword(password);
    // Internal identifier only. The student never sees or enters this address.
    // example.com is a reserved, syntactically valid domain and no email is sent.
    const internalEmail = `student_${digest}@example.com`;

    if (action === 'register') {
      const accountType = String(body.account_type || '').trim();
      const isAdminSignup = accountType === 'admin';
      const fullName = String(body.full_name || '').trim();
      const stage = String(body.stage || '').trim();
      const grade = String(body.grade || '').trim();
      if (!['student','admin'].includes(accountType)) return json(res, 400, { error: 'اختار نوع الحساب: طالب أو Admin.' });
      if (!isAdminSignup) {
        if (!validName(fullName)) return json(res, 400, { error: 'اكتب الاسم الرباعي كاملًا.' });
        if (!stages[stage] || !stages[stage].includes(grade)) return json(res, 400, { error: 'المرحلة أو الصف غير صحيح.' });
      }

      const create = await supabaseFetch('/auth/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: internalEmail,
          password,
          email_confirm: true,
          user_metadata: { full_name: isAdminSignup ? 'Admin' : fullName, stage: isAdminSignup ? null : stage, grade: isAdminSignup ? null : grade, account_type: accountType }
        })
      });
      const createData = await create.json().catch(() => ({}));
      if (!create.ok) {
        const text = JSON.stringify(createData).toLowerCase();
        if (text.includes('already') || text.includes('registered')) return json(res, 409, { error: 'كلمة السر دي مستخدمة بالفعل. اختار كلمة سر مختلفة.' });
        console.error('create user failed', createData);
        return json(res, 400, { error: 'لم يتم إنشاء الحساب. تأكد من إعداد Supabase ثم جرّب مرة أخرى.' });
      }
      const user = createData.user || createData;

      // The database trigger creates the profile. The update below is a safety net.
      // Keep the existing profiles schema untouched. Account type is stored only
      // in Supabase Auth user metadata; it never grants permissions.
      const profile = await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ full_name: isAdminSignup ? 'Admin' : fullName, stage: isAdminSignup ? null : stage, grade: isAdminSignup ? null : grade, login_email: internalEmail, account_type: accountType })
      });
      if (!profile.ok) console.warn('profile sync warning', await profile.text().catch(() => ''));

      const login = await supabaseFetch('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email: internalEmail, password })
      });
      const session = await login.json().catch(() => ({}));
      if (!login.ok) {
        console.error('post-register login failed', session);
        return json(res, 500, { error: 'تم إنشاء الحساب لكن تعذر تسجيل الدخول تلقائيًا. جرّب الدخول من الصفحة.' });
      }
      return json(res, 200, { session });
    }

    if (action === 'login') {
      const login = await supabaseFetch('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email: internalEmail, password })
      });
      const session = await login.json().catch(() => ({}));
      if (!login.ok) return json(res, 401, { error: 'كلمة السر غير صحيحة أو الحساب غير موجود.' });
      return json(res, 200, { session });
    }

    return json(res, 400, { error: 'Unknown action' });
  } catch (err) {
    console.error(err);
    return json(res, 500, { error: 'حدث خطأ في الخادم. راجع إعدادات Vercel وSupabase.' });
  }
};
