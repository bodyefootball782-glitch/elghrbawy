const crypto = require('crypto');
function json(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
function validPassword(p){return typeof p==='string'&&p.length===10&&!/\s/.test(p)}
function validName(n){return typeof n==='string'&&n.trim().split(/\s+/).filter(Boolean).length===4}
const stages={'ابتدائية':['الأول الابتدائي','الثاني الابتدائي','الثالث الابتدائي','الرابع الابتدائي','الخامس الابتدائي','السادس الابتدائي'],'إعدادية':['الأول الإعدادي','الثاني الإعدادي','الثالث الإعدادي'],'ثانوية':['الأول الثانوي','الثاني الثانوي','الثالث الثانوي']};
function lookupKey(password){const secret=process.env.AUTH_LOOKUP_SECRET||process.env.SUPABASE_SERVICE_ROLE_KEY||'change-me';return crypto.createHmac('sha256',secret).update(password,'utf8').digest('hex')}
function legacyEmail(password,host){const digest=crypto.createHash('sha256').update(password,'utf8').digest('hex');return `student_${digest}@students.elghrbawy.com`}
async function supabaseFetch(path,options={}){const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!base||!key)throw new Error('Server authentication is not configured.');const headers=Object.assign({apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},options.headers||{});return fetch(`${base}${path}`,Object.assign({},options,{headers}))}
async function getProfileByLookup(key){const r=await supabaseFetch(`/rest/v1/profiles?password_lookup=eq.${encodeURIComponent(key)}&select=id,login_email,role,full_name&limit=1`);if(!r.ok)return null;const a=await r.json().catch(()=>[]);return a[0]||null}
async function loginByEmail(email,password){const r=await supabaseFetch('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});const d=await r.json().catch(()=>({}));return {ok:r.ok,data:d}}
module.exports=async(req,res)=>{if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});try{const action=String(req.query?.action||'login');const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});const password=body.password;if(!validPassword(password))return json(res,400,{error:'كلمة السر يجب أن تكون 10 أحرف/أرقام/رموز بالضبط، ومن غير مسافات.'});const base=process.env.SUPABASE_URL;const host=new URL(base).hostname;const key=lookupKey(password);
if(action==='register'){
 const accountType=String(body.account_type||'').trim(),fullName=String(body.full_name||'').trim(),stage=String(body.stage||'').trim(),grade=String(body.grade||'').trim(),phone=String(body.phone||'').trim();
 if(!['student','admin'].includes(accountType))return json(res,400,{error:'اختار نوع الحساب: طالب أو Admin.'});
 const isAdmin=accountType==='admin';
 if(!fullName||fullName.length<2)return json(res,400,{error:'اكتب اسم الأدمن.'});
 if(!isAdmin&&!validName(fullName))return json(res,400,{error:'اكتب الاسم الرباعي كاملًا.'});
 if(!isAdmin&&(!stages[stage]||!stages[stage].includes(grade)))return json(res,400,{error:'المرحلة أو الصف غير صحيح.'});
 if(!isAdmin&&!/^01[0-2,5]\d{8}$/.test(phone.replace(/\s+/g,'')))return json(res,400,{error:'اكتب رقم هاتف مصري صحيح.'});
 const existing=await getProfileByLookup(key);if(existing)return json(res,409,{error:'كلمة السر دي مستخدمة بالفعل. اختار كلمة سر مختلفة.'});
 const legacyCheck=await loginByEmail(legacyEmail(password,host),password);if(legacyCheck.ok)return json(res,409,{error:'كلمة السر دي مستخدمة بالفعل. اختار كلمة سر مختلفة.'});
 const internalEmail=`u${crypto.randomBytes(18).toString('hex')}@${host}`;
 const create=await supabaseFetch('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email:internalEmail,password,email_confirm:true,user_metadata:{full_name:fullName,stage:isAdmin?null:stage,grade:isAdmin?null:grade,phone:isAdmin?null:phone,account_type:accountType}})});
 const createData=await create.json().catch(()=>({}));if(!create.ok){console.error('create user failed',createData);return json(res,400,{error:'لم يتم إنشاء الحساب. راجع إعدادات Supabase ثم جرّب مرة أخرى.'})}
 const user=createData.user||createData;
 const patch=await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({full_name:fullName,stage:isAdmin?null:stage,grade:isAdmin?null:grade,phone:isAdmin?null:phone,login_email:internalEmail,password_lookup:key,account_type:accountType})});if(!patch.ok)console.warn('profile sync warning',await patch.text().catch(()=>''));
 const login=await loginByEmail(internalEmail,password);if(!login.ok)return json(res,500,{error:'تم إنشاء الحساب لكن تعذر تسجيل الدخول تلقائيًا.'});return json(res,200,{session:login.data});
}
if(action==='login'){
 let profile=await getProfileByLookup(key);let login;
 if(profile?.login_email) login=await loginByEmail(profile.login_email,password);
 if(!login?.ok){const legacy=legacyEmail(password,host);login=await loginByEmail(legacy,password)}
 if(!login?.ok)return json(res,401,{error:'كلمة السر غير صحيحة أو الحساب غير موجود.'});
 return json(res,200,{session:login.data});
}
return json(res,400,{error:'Unknown action'});
}catch(err){console.error(err);return json(res,500,{error:'حدث خطأ في الخادم. راجع إعدادات Vercel وSupabase.'})}};
