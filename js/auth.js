const stage = document.getElementById('stage');
const grade = document.getElementById('grade');
const accountType = document.getElementById('accountType');
const studentFields = document.getElementById('studentFields');
const grades = {
  'ابتدائية':['الأول الابتدائي','الثاني الابتدائي','الثالث الابتدائي','الرابع الابتدائي','الخامس الابتدائي','السادس الابتدائي'],
  'إعدادية':['الأول الإعدادي','الثاني الإعدادي','الثالث الإعدادي'],
  'ثانوية':['الأول الثانوي','الثاني الثانوي','الثالث الثانوي']
};
function fillGrades(){ if(!grade) return; grade.innerHTML='<option value="">اختار الصف</option>'; (grades[stage?.value]||[]).forEach(g=>grade.insertAdjacentHTML('beforeend',`<option value="${window.ELR.escape(g)}">${window.ELR.escape(g)}</option>`)); grade.disabled=!stage?.value; }
function syncAccountType(){ const admin=accountType?.value==='admin'; if(studentFields) studentFields.style.display=admin?'none':'grid'; if(stage){stage.required=!admin; stage.value=admin?'':'';} if(grade){grade.required=!admin; grade.value=admin?'':''; grade.disabled=admin || !stage?.value;} }
stage?.addEventListener('change',fillGrades); accountType?.addEventListener('change',()=>{syncAccountType();fillGrades();}); fillGrades(); syncAccountType();
function msg(t,ok=false){const e=document.getElementById('authMsg');if(e){e.textContent=t;e.className='auth-msg '+(ok?'ok':'bad');}}
function validName(n){return n.split(/\s+/).filter(Boolean).length===4;}
function validPass(p){return typeof p==='string' && Array.from(p).length===10 && !/\s/.test(p);}
async function ready(){if(!window.elrfaeySupabase){msg('المنصة غير مربوطة بقاعدة البيانات.');return false}return true;}
async function apiAuth(action,payload){const r=await fetch(`/api/auth?action=${encodeURIComponent(action)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await r.json().catch(()=>({error:'حدث خطأ غير معروف.'}));if(!r.ok) throw new Error(data.error||'حدث خطأ.');return data;}
async function useSession(session){if(!session?.access_token||!session?.refresh_token)throw new Error('تعذر إنشاء جلسة الدخول.');const {error}=await window.elrfaeySupabase.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token});if(error)throw error;}
document.getElementById('registerForm')?.addEventListener('submit',async e=>{e.preventDefault();if(!(await ready()))return;const type=accountType?.value||'', name=document.getElementById('fullName')?.value.trim()||'', p=document.getElementById('password').value, pc=document.getElementById('passwordConfirm')?.value||'', g=grade?.value||'', s=stage?.value||'';if(!['student','admin'].includes(type)){msg('اختار نوع الحساب أولًا.');return}if(type==='student'){if(!validName(name)){msg('اكتب الاسم الرباعي كاملًا، 4 أسماء.');return}if(!s||!g){msg('اختار المرحلة والصف الدراسي.');return}}if(!validPass(p)){msg('كلمة السر لازم تكون 10 أحرف أو أرقام أو رموز بالضبط، ومن غير مسافات.');return}if(p!==pc){msg('تأكيد كلمة السر غير مطابق.');return}msg('جاري إنشاء الحساب...');try{const data=await apiAuth('register',{full_name:name,stage:s,grade:g,account_type:type,password:p});await useSession(data.session);msg('تم إنشاء الحساب بنجاح.',true);setTimeout(()=>location.href='dashboard.html',350);}catch(err){console.error(err);msg(err.message||'لم يتم إنشاء الحساب.');}});
document.getElementById('loginForm')?.addEventListener('submit',async e=>{e.preventDefault();if(!(await ready()))return;const password=document.getElementById('loginPass').value;if(!validPass(password)){msg('اكتب كلمة السر المكونة من 10 أحرف أو أرقام أو رموز.');return}msg('جاري تسجيل الدخول...');try{const data=await apiAuth('login',{password});await useSession(data.session);location.href=new URLSearchParams(location.search).has('admin')?'../admin/index.html':'dashboard.html';}catch(err){console.error(err);msg(err.message||'كلمة السر غير صحيحة أو الحساب غير موجود.');}});
