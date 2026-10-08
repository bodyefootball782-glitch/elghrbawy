const stage=document.getElementById('stage'),grade=document.getElementById('grade'),accountType=document.getElementById('accountType');
const grades={'ابتدائية':['الأول الابتدائي','الثاني الابتدائي','الثالث الابتدائي','الرابع الابتدائي','الخامس الابتدائي','السادس الابتدائي'],'إعدادية':['الأول الإعدادي','الثاني الإعدادي','الثالث الإعدادي'],'ثانوية':['الأول الثانوي','الثاني الثانوي','الثالث الثانوي']};
function fillGrades(){if(!grade)return;grade.innerHTML='<option value="">اختار الصف</option>';(grades[stage?.value]||[]).forEach(g=>grade.insertAdjacentHTML('beforeend',`<option value="${window.ELR.escape(g)}">${window.ELR.escape(g)}</option>`));grade.disabled=!stage?.value}
stage?.addEventListener('change',fillGrades);fillGrades();
const steps=[...document.querySelectorAll('.reg-step')],stepper=[...document.querySelectorAll('.stepper span')];let current=1;
function showStep(n){current=n;steps.forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===n));stepper.forEach((x,i)=>x.classList.toggle('active',i<n));window.scrollTo({top:0,behavior:'smooth'})}
function msg(t,ok=false){const e=document.getElementById('authMsg');if(e){e.textContent=t;e.className='auth-msg '+(ok?'ok':'bad')}}
function validName(n){return n.split(/\s+/).filter(Boolean).length===4}function validAnyName(n){return n.trim().length>=2}function validPass(p){return typeof p==='string'&&Array.from(p).length===10&&!/\s/.test(p)}
document.querySelectorAll('.account-choice').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.account-choice').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');accountType.value=b.dataset.type;document.getElementById('next1').disabled=false;document.getElementById('studentOnly').style.display=b.dataset.type==='student'?'grid':'none';document.getElementById('fullName').placeholder=b.dataset.type==='admin'?'مثال: أحمد الغرباوي':'مثال: محمد أحمد علي حسن';}));
document.getElementById('next1')?.addEventListener('click',()=>{if(!accountType.value)return msg('اختار نوع الحساب الأول.');showStep(2)});
document.getElementById('next2')?.addEventListener('click',()=>{const type=accountType.value,name=document.getElementById('fullName').value.trim();if(!validAnyName(name))return msg('اكتب الاسم الأول على الأقل.');if(type==='student'&&(!validName(name)||!stage.value||!grade.value))return msg('للطالب: اكتب الاسم الرباعي واختار المرحلة والصف.');msg('');showStep(3)});
document.querySelectorAll('[data-prev]').forEach(b=>b.addEventListener('click',()=>showStep(Number(b.dataset.prev))));
async function ready(){if(!window.elrfaeySupabase){msg('تعذر الاتصال بقاعدة البيانات. حدّث الصفحة أولًا، وإذا استمرت المشكلة راجع إعداد Supabase.');return false}return true}
function internalEmail(password){
  // The student/admin never sees this internal address.
  const bytes=new TextEncoder().encode(password);
  // SHA-256 via Web Crypto keeps the same deterministic identifier used by the API version.
  return crypto.subtle.digest('SHA-256',bytes).then(buf=>{
    const hex=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    return `student_${hex}@students.elghrbawy.com`;
  });
}
async function directRegister({full_name,stage,grade,account_type,password}){
  const email=await internalEmail(password);
  const {data,error}=await window.elrfaeySupabase.auth.signUp({
    email,password,
    options:{data:{full_name,stage:stage||null,grade:grade||null,account_type}}
  });
  if(error){
    const m=(error.message||'').toLowerCase();
    if(m.includes('already registered')||m.includes('already been registered')||m.includes('user already')){
      throw new Error('كلمة السر دي مستخدمة بالفعل. اختار كلمة سر مختلفة.');
    }
    throw new Error('تعذر إنشاء الحساب من Supabase: '+(error.message||'خطأ غير معروف'));
  }
  if(data.session) return data.session;
  // If Supabase is configured to require email confirmation, try a direct login.
  // This also handles accounts that already exist but were not returned with a session.
  const login=await window.elrfaeySupabase.auth.signInWithPassword({email,password});
  if(login.data?.session) return login.data.session;
  const detail=login.error?.message||'لم يتم إنشاء جلسة الدخول.';
  if(/email.*confirm|confirm.*email/i.test(detail)){
    throw new Error('Supabase يطلب تأكيد البريد الإلكتروني. من Supabase افتح Authentication → Providers → Email وأوقف Confirm email، ثم جرّب التسجيل مرة أخرى.');
  }
  throw new Error(detail);
}
async function directLogin(password){
  const email=await internalEmail(password);
  const {data,error}=await window.elrfaeySupabase.auth.signInWithPassword({email,password});
  if(error) throw new Error('كلمة السر غير صحيحة أو الحساب غير موجود.');
  return data.session;
}
async function useSession(session){
  if(!session?.access_token||!session?.refresh_token)throw new Error('تعذر إنشاء جلسة الدخول.');
  const {error}=await window.elrfaeySupabase.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token});
  if(error)throw error;
}
document.getElementById('registerForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!(await ready()))return;
  const type=accountType.value,name=document.getElementById('fullName').value.trim(),p=document.getElementById('password').value,pc=document.getElementById('passwordConfirm').value,s=stage?.value||'',g=grade?.value||'';
  if(!['student','admin'].includes(type))return msg('اختار نوع الحساب.');
  if(!validAnyName(name))return msg('اكتب اسمك.');
  if(type==='student'&&(!validName(name)||!s||!g))return msg('راجع الاسم الرباعي والمرحلة والصف.');
  if(!validPass(p))return msg('كلمة السر لازم تكون 10 خانات بالضبط ومن غير مسافات.');
  if(p!==pc)return msg('تأكيد كلمة السر غير مطابق.');
  msg('جاري إنشاء الحساب...');
  try{
    const session=await directRegister({full_name:name,stage:s,grade:g,account_type:type,password:p});
    await useSession(session);
    msg('تم إنشاء الحساب بنجاح.',true);
    setTimeout(()=>location.href='dashboard.html',400);
  }catch(err){console.error(err);msg(err.message||'لم يتم إنشاء الحساب.')}
});
document.getElementById('loginForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!(await ready()))return;
  const password=document.getElementById('loginPass').value;
  if(!validPass(password))return msg('اكتب كلمة السر المكونة من 10 خانات.');
  msg('جاري تسجيل الدخول...');
  try{
    const session=await directLogin(password);
    await useSession(session);
    const next=new URLSearchParams(location.search).get('next');
    location.href=next||'dashboard.html';
  }catch(err){msg(err.message||'كلمة السر غير صحيحة أو الحساب غير موجود.')}
});
