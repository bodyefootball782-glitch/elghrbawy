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
      <label class="upload-box">${isVideo?'غلاف الفيديو (اختياري)':'الصورة الرئيسية'}<input id="cThumb" type="file" accept="image/*"></label>
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
        let storage_path=null,thumbnail_path=null;
        let thumbFile=document.getElementById('cThumb').files[0];
        if(isVideo && file && !thumbFile){
          try{
            const makePoster=()=>new Promise((resolve,reject)=>{const v=document.createElement('video');const u=URL.createObjectURL(file);v.preload='metadata';v.muted=true;v.playsInline=true;v.onloadeddata=()=>{try{v.currentTime=Math.min(0.2,Math.max(0,v.duration/10||0));}catch(_){capture()}};v.onseeked=()=>capture();v.onerror=()=>reject(new Error('تعذر استخراج غلاف الفيديو'));function capture(){try{const c=document.createElement('canvas');const w=Math.min(v.videoWidth||1280,1280),h=Math.round(w*(v.videoHeight||720)/(v.videoWidth||1280));c.width=w;c.height=h;c.toBlob(b=>{URL.revokeObjectURL(u);if(b)resolve(new File([b],'auto-video-cover.jpg',{type:'image/jpeg'}));else reject(new Error('تعذر إنشاء الغلاف'));},'image/jpeg',.86)}catch(e){reject(e)}}v.src=u;});
            thumbFile=await makePoster();
          }catch(_){thumbFile=null}
        }
        if(file){const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');storage_path=`${type}/${crypto.randomUUID()}-${safe}`;const {error:e}=await sb.storage.from('content').upload(storage_path,file,{upsert:false,contentType:file.type});if(e){console.error(e);window.toast('فشل رفع الملف: '+e.message,false);return}}
        if(thumbFile){const safeT=thumbFile.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');thumbnail_path=`${type}/${crypto.randomUUID()}-${safeT}`;const {error:te}=await sb.storage.from('content-thumbnails').upload(thumbnail_path,thumbFile,{upsert:false,contentType:thumbFile.type});if(te){if(storage_path)await sb.storage.from('content').remove([storage_path]);window.toast('فشل رفع الغلاف: '+te.message,false);return}const pub=sb.storage.from('content-thumbnails').getPublicUrl(thumbnail_path);thumbnail_path=pub.data.publicUrl;}
        if(isVideo && !thumbnail_path && external){try{const u=new URL(external);let vid=u.searchParams.get('v');if(!vid&&u.hostname.includes('youtu.be'))vid=u.pathname.slice(1).split(/[?&]/)[0];if(!vid&&u.pathname.includes('/shorts/'))vid=u.pathname.split('/shorts/')[1].split(/[?&]/)[0];if(vid)thumbnail_path=`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;}catch(_){}}
        const payload={type,title,description:document.getElementById('cDesc').value.trim(),stage:document.getElementById('cStage').value||null,grade:document.getElementById('cGrade').value.trim()||null,thumbnail_path,price:free?0:Number(document.getElementById('cPrice').value||0),is_free:free,storage_path,external_url:external||null,created_by:user.id};
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
    const [a,r]=await Promise.all([
      sb.from('activity_logs').select('id,event_type,target_id,details,created_at').order('created_at',{ascending:false}).limit(300),
      sb.from('results').select('id,score,total,percentage,created_at,profiles(full_name,phone),exams(title)').order('created_at',{ascending:false}).limit(200)
    ]);
    const wrap=document.querySelector('.panel');if(!wrap)return;
    const rows=[];
    (a.data||[]).forEach(x=>{const d=x.details||{};rows.push({t:x.event_type,name:d.name||'—',extra:`${d.operation||''} • ${x.target_id||''}`,date:x.created_at,icon:x.event_type.includes('profiles')?'👤':x.event_type.includes('content')?'🎥':x.event_type.includes('results')?'📝':x.event_type.includes('exams')?'📋':x.event_type.includes('purchases')?'🛒':'⚙️'})});
    (r.data||[]).forEach(x=>rows.push({t:'نتيجة امتحان',name:x.profiles?.full_name||'—',extra:`${x.exams?.title||'—'} • ${x.score}/${x.total} • ${Number(x.percentage).toFixed(1)}% • ${x.profiles?.phone||'بدون رقم'}`,date:x.created_at,icon:'🏆'}));
    rows.sort((a,b)=>new Date(b.date)-new Date(a.date));
    wrap.innerHTML=`<div class="logs-head"><div><h2>Logs</h2><p>تسجيلات الحسابات، نشر المحتوى، الامتحانات، النتائج، والطلبات.</p></div><div class="logs-actions"><span class="badge ok">${rows.length} سجل</span><button id="discordLogsBtn" class="btn btn-ghost small">🔗 ربط Discord</button></div></div><div class="discord-note">لما تكون جاهز، حط Webhook غرفة <b>لوج المنصة</b> من الإعدادات، وسنفعّل الإرسال التلقائي للسجلات بدون تغيير النظام.</div><div class="logs-list">${rows.map(x=>`<article class="log-item"><span class="log-icon">${x.icon}</span><div><b>${esc(x.t)}</b><strong>${esc(x.name||'—')}</strong><small>${esc(x.extra||'')}</small></div><time>${window.formatDate(x.date)}</time></article>`).join('')||'<p>لا توجد سجلات بعد.</p>'}</div>`;
    document.getElementById('discordLogsBtn')?.addEventListener('click',()=>location.href='settings.html#discord');
  }
  async function settings(){
    const wrap=document.querySelector('.panel');if(!wrap)return;
    let data={};try{const {data:r,error}=await sb.from('site_settings').select('data').eq('id',1).single();if(error)throw error;data=r?.data||{};}catch(e){return window.toast('إعدادات المنصة غير متاحة: '+e.message,false)}
    const esc=v=>window.ELR.escape(v||'');
    wrap.innerHTML=`<div class="settings-v3"><div class="settings-intro"><span>CONTROL CENTER</span><h2>مركز تحكم المنصة</h2><p>من هنا تتحكم في الهوية، الصور، الروابط، الخلفية، وكروت HELPER / ADMIN بدون تعديل الكود.</p></div><div class="settings-grid">
      <div class="setting-group wide"><h3>👨‍🏫 هوية الأستاذ</h3><label>صورة الأستاذ الحالية<div class="settings-preview"><img id="teacherPreview" src="${esc(data.teacher_image||'../assets/images/teacher-placeholder.svg')}" onerror="this.src='../assets/images/teacher-placeholder.svg'"></div><input id="teacherImageFile" type="file" accept="image/*"></label></div>
      <label>رقم الأستاذ<input id="sTeacher" value="${esc(data.teacher_phone)}"></label><label>رقم الدعم<input id="sSupport" value="${esc(data.support_phone)}"></label><label>رقم المبرمج / الديزاينر<input id="sDev" value="${esc(data.developer_phone)}"></label><label>WhatsApp<input id="sWa" value="${esc(data.whatsapp)}"></label><label>TikTok<input id="sTik" value="${esc(data.tiktok)}"></label><label>YouTube<input id="sYou" value="${esc(data.youtube)}"></label>
      <label>خلفية الموقع (رابط)<input id="sBg" value="${esc(data.background_image)}"></label><label>رفع خلفية من الجهاز<input id="sBgFile" type="file" accept="image/*"></label>
      <label>عنوان الرئيسية<input id="sHero" value="${esc(data.hero_title||'الفيزياء مش حفظ… الفيزياء فهم.')}"/></label><label class="wide">وصف الرئيسية<textarea id="sSub">${esc(data.hero_subtitle)}</textarea></label>
      <div class="setting-group"><h3>🛟 HELPER</h3><label>الصورة<input id="hImage" type="file" accept="image/*"></label><div class="mini-preview"><img id="hPreview" src="${esc(data.helper_image||'../assets/images/teacher-placeholder.svg')}"></div><label>الاسم<input id="hName" value="${esc(data.helper_name||'HELPER')}"></label><label>الوصف<input id="hTitle" value="${esc(data.helper_title||'مساعدة ودعم الطلاب')}"></label><label>الهاتف<input id="hPhone" value="${esc(data.helper_phone)}"></label></div>
      <div class="setting-group"><h3>👑 ADMIN</h3><label>الصورة<input id="aImage" type="file" accept="image/*"></label><div class="mini-preview"><img id="aPreview" src="${esc(data.admin_image||'../assets/images/teacher-placeholder.svg')}"></div><label>الاسم<input id="aName" value="${esc(data.admin_name||'ADMIN')}"></label><label>الوصف<input id="aTitle" value="${esc(data.admin_title||'إدارة المنصة')}"></label><label>الهاتف<input id="aPhone" value="${esc(data.admin_phone)}"></label></div>
      <div class="setting-group wide" id="discord"><h3>💬 Discord Logs</h3><p>ضع Webhook غرفة «لوج المنصة» عندما تكون جاهزًا.</p><input id="sDiscord" value="${esc(data.discord_webhook)}" placeholder="Discord Webhook URL"></div>
      </div><div class="settings-bottom"><button id="saveSettings" class="btn btn-primary">حفظ كل الإعدادات <i class="fa-solid fa-floppy-disk"></i></button><button id="logoutAdmin" class="btn btn-ghost">تسجيل الخروج</button></div></div>`;
    const preview=(file,id)=>{if(file){const r=new FileReader();r.onload=()=>document.getElementById(id).src=r.result;r.readAsDataURL(file)}};
    document.getElementById('teacherImageFile').onchange=e=>preview(e.target.files[0],'teacherPreview');document.getElementById('hImage').onchange=e=>preview(e.target.files[0],'hPreview');document.getElementById('aImage').onchange=e=>preview(e.target.files[0],'aPreview');
    async function uploadImage(file,folder){if(!file)return null;const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');const path=`${folder}/${crypto.randomUUID()}-${safe}`;const up=await sb.storage.from('site-assets').upload(path,file,{upsert:false,contentType:file.type});if(up.error)throw up.error;return sb.storage.from('site-assets').getPublicUrl(path).data.publicUrl}
    document.getElementById('saveSettings').onclick=async()=>{const btn=document.getElementById('saveSettings');btn.disabled=true;try{
      let bg=document.getElementById('sBg').value.trim();const bgFile=document.getElementById('sBgFile').files[0];if(bgFile)bg=await uploadImage(bgFile,'backgrounds');
      let teacher_image=data.teacher_image||'',helper_image=data.helper_image||'',admin_image=data.admin_image||'';const tf=document.getElementById('teacherImageFile').files[0],hf=document.getElementById('hImage').files[0],af=document.getElementById('aImage').files[0];if(tf)teacher_image=await uploadImage(tf,'teacher');if(hf)helper_image=await uploadImage(hf,'helper');if(af)admin_image=await uploadImage(af,'admin');
      const payload={...data,teacher_image,helper_image,admin_image,background_image:bg,teacher_phone:document.getElementById('sTeacher').value.trim(),support_phone:document.getElementById('sSupport').value.trim(),developer_phone:document.getElementById('sDev').value.trim(),whatsapp:document.getElementById('sWa').value.trim(),tiktok:document.getElementById('sTik').value.trim(),youtube:document.getElementById('sYou').value.trim(),hero_title:document.getElementById('sHero').value.trim(),hero_subtitle:document.getElementById('sSub').value.trim(),helper_name:document.getElementById('hName').value.trim(),helper_title:document.getElementById('hTitle').value.trim(),helper_phone:document.getElementById('hPhone').value.trim(),admin_name:document.getElementById('aName').value.trim(),admin_title:document.getElementById('aTitle').value.trim(),admin_phone:document.getElementById('aPhone').value.trim(),discord_webhook:document.getElementById('sDiscord').value.trim()};
      const {error}=await sb.from('site_settings').upsert({id:1,data:payload,updated_at:new Date().toISOString()});if(error)throw error;Object.assign(data,payload);window.toast('تم حفظ إعدادات المنصة بنجاح.');
    }catch(e){window.toast('تعذر الحفظ: '+e.message,false)}finally{btn.disabled=false}};
    document.getElementById('logoutAdmin')?.addEventListener('click',window.signOut);
  }

})();
