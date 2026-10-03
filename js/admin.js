(async()=>{
  const user=await window.requireAuth(true); if(!user)return;
  const sb=window.elrfaeySupabase;
  const path=location.pathname.split('/').pop();
  if(path==='index.html')await dashboard();
  if(path==='students.html')await students();
  if(path==='videos.html'||path==='vedios.html'||path==='images.html')await content(path==='videos.html'||path==='vedios.html'?'video':'image');
  if(path==='exams.html')await exams();
  if(path==='purchases.html')await purchases();
  if(path==='results.html')await results();
  if(path==='logs.html')await logs();
  if(path==='settings.html')settings();
  function esc(v){return window.ELR.escape(v)}
  function table(sel,html){const t=document.querySelector(sel);if(t)t.innerHTML=html}
  async function dashboard(){
    const [students,content,exams,purchases,results]=await Promise.all([
      sb.from('profiles').select('id',{count:'exact',head:true}).eq('role','student'),
      sb.from('content').select('id',{count:'exact',head:true}),
      sb.from('exams').select('id',{count:'exact',head:true}),
      sb.from('purchases').select('id',{count:'exact',head:true}).eq('status','pending'),
      sb.from('results').select('id',{count:'exact',head:true})
    ]);
    document.querySelectorAll('.admin-stat b').forEach((e,i)=>e.textContent=[students,content,exams,purchases,results][i]?.count??0);
  }
  async function students(){
    const {data,error}=await sb.from('profiles').select('id,full_name,stage,grade,role,phone,xp,created_at').order('created_at',{ascending:false});
    if(error)return window.toast(error.message,false);
    table('#studentsTable',`<tr><th>الاسم</th><th>النوع</th><th>المرحلة</th><th>الصف</th><th>الهاتف</th><th>الصلاحية</th><th>XP</th><th></th></tr>`+(data||[]).map(x=>`<tr><td>${esc(x.full_name)}</td><td>${esc(x.role==='admin'?'Admin':'طالب')}</td><td>${esc(x.stage||'—')}</td><td>${esc(x.grade||'—')}</td><td>${esc(x.phone||'—')}</td><td><span class="badge ${x.role==='admin'?'ok':''}">${esc(x.role||'student')}</span></td><td>${x.xp||0}</td><td>${x.role!=='admin'?`<button class="btn btn-ghost small" onclick="makeAdmin('${x.id}')">Admin</button>`:''}</td></tr>`).join(''));
    window.makeAdmin=async id=>{if(!confirm('تحويل هذا الحساب إلى Admin؟'))return;const {error:e}=await sb.from('profiles').update({role:'admin'}).eq('id',id);if(e)window.toast(e.message,false);else location.reload()};
  }
  async function content(type){
    const {data,error}=await sb.from('content').select('*').eq('type',type).order('created_at',{ascending:false});
    if(error)return window.toast(error.message,false);
    const title=type==='video'?'الفيديوهات':'الصور', isVideo=type==='video';
    const wrap=document.querySelector('.panel'); if(!wrap)return;
    wrap.innerHTML=`<div class="admin-form">
      <h2>إضافة ${title}</h2>
      <input id="cTitle" placeholder="عنوان ${title}">
      <textarea id="cDesc" placeholder="الوصف"></textarea>
      <select id="cStage"><option value="">كل المراحل</option><option>ابتدائية</option><option>إعدادية</option><option>ثانوية</option></select>
      <input id="cGrade" placeholder="الصف (اختياري)">
      <input id="cPrice" type="number" min="0" step="1" placeholder="السعر بالجنيه">
      <label><input id="cFree" type="checkbox" checked> مجاني</label>
      <input id="cFile" type="file" accept="${isVideo?'video/*':'image/*'}">
      <div class="or-line">أو استخدم رابط ${isVideo?'YouTube':'صورة'} مباشر</div>
      <input id="cUrl" type="url" placeholder="https://...">
      <button class="btn btn-primary" id="addContent">نشر ${title}</button>
      <small class="form-note">لو استخدمت رابطًا، مش لازم ترفع ملف. والفيديوهات تقبل روابط YouTube.</small>
    </div><div class="table-wrap"><table class="table" id="contentTable"></table></div>`;
    document.getElementById('addContent').onclick=async()=>{
      const btn=document.getElementById('addContent');btn.disabled=true;btn.textContent='جاري النشر...';
      try{
        const title=document.getElementById('cTitle').value.trim(),file=document.getElementById('cFile').files[0],external=document.getElementById('cUrl').value.trim(),free=document.getElementById('cFree').checked;
        if(!title){window.toast('اكتب العنوان.',false);return}
        if(!file&&!external){window.toast('ارفع ملفًا أو ضع رابطًا.',false);return}
        let storage_path=null;
        if(file){const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');storage_path=`${type}/${crypto.randomUUID()}-${safe}`;const {error:e}=await sb.storage.from('content').upload(storage_path,file,{upsert:false,contentType:file.type});if(e){console.error(e);window.toast('فشل رفع الملف: '+e.message,false);return}}
        const payload={type,title,description:document.getElementById('cDesc').value.trim(),stage:document.getElementById('cStage').value||null,grade:document.getElementById('cGrade').value.trim()||null,price:free?0:Number(document.getElementById('cPrice').value||0),is_free:free,storage_path,external_url:external||null,created_by:user.id};
        const {error:e}=await sb.from('content').insert(payload);
        if(e){if(storage_path)await sb.storage.from('content').remove([storage_path]);window.toast('لم يتم النشر: '+e.message,false);return}
        window.toast(`تم نشر ${title} للطلبة بنجاح.`);setTimeout(()=>location.reload(),500);
      }finally{btn.disabled=false;btn.textContent=`نشر ${title}`}
    };
    table('#contentTable',`<tr><th>العنوان</th><th>المصدر</th><th>السعر</th><th>التاريخ</th><th></th></tr>`+(data||[]).map(x=>`<tr><td>${esc(x.title)}</td><td>${x.external_url?'رابط':'ملف'}</td><td>${x.is_free?'مجاني':Number(x.price).toFixed(0)+' جنيه'}</td><td>${window.formatDate(x.created_at)}</td><td><button class="btn btn-ghost small" onclick="deleteContent(${x.id},'${esc(x.storage_path||'').replace(/'/g,"\\'")}')">حذف</button></td></tr>`).join(''));
    window.deleteContent=async(id,p)=>{if(!confirm('حذف المحتوى؟'))return;const {error:e}=await sb.from('content').delete().eq('id',id);if(e)return window.toast(e.message,false);if(p)await sb.storage.from('content').remove([p]);location.reload()};
  }
  async function exams(){
    const {data,error}=await sb.from('exams').select('id,title,description,stage,grade,is_published,created_at,exam_questions(count)').order('created_at',{ascending:false});
    if(error)return window.toast(error.message,false);
    const wrap=document.querySelector('.panel'); if(!wrap)return;
    wrap.innerHTML=`<div class="admin-form"><h2>إنشاء امتحان</h2><input id="eTitle" placeholder="اسم الامتحان"><textarea id="eDesc" placeholder="الوصف"></textarea><select id="eStage"><option value="">كل المراحل</option><option>ابتدائية</option><option>إعدادية</option><option>ثانوية</option></select><input id="eGrade" placeholder="الصف (اختياري)"><label><input id="ePub" type="checkbox" checked> نشر الامتحان فورًا</label><button class="btn btn-primary" id="addExam">إنشاء الامتحان</button></div>
    <div class="admin-form question-builder"><h2>إضافة سؤال</h2><select id="qExam"><option value="">اختار الامتحان</option>${(data||[]).map(x=>`<option value="${x.id}">${esc(x.title)}</option>`).join('')}</select><textarea id="qText" placeholder="اكتب السؤال هنا"></textarea><input id="q1" placeholder="الاختيار الأول"><input id="q2" placeholder="الاختيار الثاني"><input id="q3" placeholder="الاختيار الثالث"><input id="q4" placeholder="الاختيار الرابع"><select id="qCorrect"><option value="0">الإجابة الصحيحة: الأول</option><option value="1">الثاني</option><option value="2">الثالث</option><option value="3">الرابع</option></select><button class="btn btn-primary" id="addQuestion">إضافة السؤال</button><small class="form-note">املأ بيانات الامتحان أولًا واضغط إنشاء، ثم اختاره من القائمة وأضف الأسئلة. مش لازم تعيد كتابة بيانات الامتحان.</small></div>
    <div class="table-wrap"><table class="table" id="examTable"></table></div>`;
    document.getElementById('addExam').onclick=async()=>{const title=document.getElementById('eTitle').value.trim();if(!title)return window.toast('اكتب اسم الامتحان.',false);const {data:e,error:er}=await sb.from('exams').insert({title,description:document.getElementById('eDesc').value.trim(),stage:document.getElementById('eStage').value||null,grade:document.getElementById('eGrade').value.trim()||null,is_published:document.getElementById('ePub').checked,created_by:user.id}).select().single();if(er)return window.toast('تعذر إنشاء الامتحان: '+er.message,false);window.toast('تم إنشاء الامتحان. أضف الأسئلة الآن.');setTimeout(()=>location.reload(),500)};
    document.getElementById('addQuestion').onclick=async()=>{const examId=document.getElementById('qExam').value,question=document.getElementById('qText').value.trim(),options=[1,2,3,4].map(n=>document.getElementById('q'+n).value.trim());if(!examId)return window.toast('اختار الامتحان من القائمة.',false);if(!question)return window.toast('اكتب نص السؤال.',false);if(options.some(x=>!x))return window.toast('اكتب الاختيارات الأربعة.',false);const {data:count}=await sb.from('exam_questions').select('id',{count:'exact',head:true}).eq('exam_id',examId);const {error:e}=await sb.from('exam_questions').insert({exam_id:Number(examId),question,options,correct_index:Number(document.getElementById('qCorrect').value),sort_order:count||0});if(e)return window.toast('تعذر إضافة السؤال: '+e.message,false);window.toast('تمت إضافة السؤال بنجاح.');document.getElementById('qText').value='';['q1','q2','q3','q4'].forEach(id=>document.getElementById(id).value='');};
    table('#examTable',`<tr><th>الامتحان</th><th>الأسئلة</th><th>الحالة</th><th>التاريخ</th><th></th></tr>`+(data||[]).map(x=>`<tr><td>${esc(x.title)}</td><td>${x.exam_questions?.[0]?.count||0}</td><td><span class="badge ${x.is_published?'ok':'warn'}">${x.is_published?'منشور':'مسودة'}</span></td><td>${window.formatDate(x.created_at)}</td><td><button class="btn btn-ghost small" onclick="toggleExam(${x.id},${!x.is_published})">${x.is_published?'إخفاء':'نشر'}</button> <button class="btn btn-ghost small" onclick="deleteExam(${x.id})">حذف</button></td></tr>`).join(''));
    window.toggleExam=async(id,v)=>{const {error:e}=await sb.from('exams').update({is_published:v}).eq('id',id);if(e)window.toast(e.message,false);else location.reload()};
    window.deleteExam=async id=>{if(!confirm('حذف الامتحان وكل أسئلته ونتائجه؟'))return;const {error:e}=await sb.from('exams').delete().eq('id',id);if(e)window.toast(e.message,false);else location.reload()};
  }
  async function purchases(){const {data,error}=await sb.from('purchases').select('id,amount,status,created_at,profiles(full_name),content(title)').order('created_at',{ascending:false});if(error)return window.toast(error.message,false);table('#purchasesTable',`<tr><th>الطالب</th><th>المحتوى</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th><th></th></tr>`+(data||[]).map(x=>`<tr><td>${esc(x.profiles?.full_name||'')}</td><td>${esc(x.content?.title||'')}</td><td>${Number(x.amount).toFixed(0)} جنيه</td><td>${x.status}</td><td>${window.formatDate(x.created_at)}</td><td>${x.status==='pending'?`<button class="btn btn-primary small" onclick="purchase(${x.id},'approved')">قبول</button> <button class="btn btn-ghost small" onclick="purchase(${x.id},'rejected')">رفض</button>`:''}</td></tr>`).join(''));window.purchase=async(id,status)=>{const {error:e}=await sb.from('purchases').update({status}).eq('id',id);if(e)window.toast(e.message,false);else location.reload()}}
  async function results(){const {data,error}=await sb.from('results').select('id,score,total,percentage,created_at,profiles(full_name,phone),exams(title)').order('created_at',{ascending:false});if(error)return window.toast(error.message,false);table('#resultsTable',`<tr><th>الطالب</th><th>الهاتف</th><th>الامتحان</th><th>النتيجة</th><th>النسبة</th><th>التاريخ</th></tr>`+(data||[]).map(x=>`<tr><td>${esc(x.profiles?.full_name||'')}</td><td>${esc(x.profiles?.phone||'—')}</td><td>${esc(x.exams?.title||'')}</td><td>${x.score}/${x.total}</td><td>${Number(x.percentage).toFixed(1)}%</td><td>${window.formatDate(x.created_at)}</td></tr>`).join(''))}
  async function logs(){
    const [p,r,c,b]=await Promise.all([
      sb.from('profiles').select('id,full_name,phone,stage,grade,role,created_at').order('created_at',{ascending:false}).limit(200),
      sb.from('results').select('id,score,total,percentage,created_at,profiles(full_name,phone),exams(title)').order('created_at',{ascending:false}).limit(200),
      sb.from('content').select('id,title,type,created_at').order('created_at',{ascending:false}).limit(200),
      sb.from('purchases').select('id,status,amount,created_at,profiles(full_name),content(title)').order('created_at',{ascending:false}).limit(200)
    ]);
    const wrap=document.querySelector('.panel');if(!wrap)return;
    const rows=[];
    (p.data||[]).forEach(x=>rows.push({t:'تسجيل حساب',name:x.full_name,extra:[x.phone,x.stage,x.grade,x.role].filter(Boolean).join(' • '),date:x.created_at,icon:'👤'}));
    (r.data||[]).forEach(x=>rows.push({t:'امتحان',name:x.profiles?.full_name||'—',extra:`${x.exams?.title||'—'} • ${x.score}/${x.total} • ${Number(x.percentage).toFixed(1)}% • ${x.profiles?.phone||'بدون رقم'}`,date:x.created_at,icon:'📝'}));
    (c.data||[]).forEach(x=>rows.push({t:'نشر محتوى',name:x.title,extra:x.type==='video'?'فيديو':x.type==='image'?'صورة':'محتوى',date:x.created_at,icon:x.type==='video'?'🎥':'🖼️'}));
    (b.data||[]).forEach(x=>rows.push({t:'طلب شراء',name:x.profiles?.full_name||'—',extra:`${x.content?.title||'—'} • ${x.status} • ${x.amount} جنيه`,date:x.created_at,icon:'🛒'}));
    rows.sort((a,b)=>new Date(b.date)-new Date(a.date));
    wrap.innerHTML=`<div class="logs-head"><div><h2>Logs</h2><p>كل التسجيلات والامتحانات والنتائج ونشر المحتوى والطلبات في مكان واحد.</p></div><span class="badge ok">${rows.length} سجل</span></div><div class="logs-list">${rows.map(x=>`<article class="log-item"><span class="log-icon">${x.icon}</span><div><b>${esc(x.t)}</b><strong>${esc(x.name||'—')}</strong><small>${esc(x.extra||'')}</small></div><time>${window.formatDate(x.date)}</time></article>`).join('')||'<p>لا توجد سجلات بعد.</p>'}</div>`;
  }
  function settings(){const el=document.querySelector('.panel');if(el)el.innerHTML=`<div class="admin-form"><h2>إعدادات سريعة</h2><p>رقم الأستاذ: <a href="tel:01000000000">01000000000</a></p><p>الدعم الفني والإدارة: <a href="tel:01105638650">01105638650</a></p><p>المبرمج / الديزاينر: <a href="tel:01105638650">01105638650</a></p><p>الواتساب: <a href="https://wa.me/01000000000" target="_blank" rel="noopener">تواصل على WhatsApp</a></p><p>TikTok: <a href="https://www.tiktok.com/@AHMED_ELGHRBAWY" target="_blank" rel="noopener">@AHMED_ELGHRBAWY</a></p></div>`}
})();
