(() => {
  window.ELR = window.ELR || {};
  window.ELR.escape = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  window.requireAuth = async function (admin=false) {
    if (!window.elrfaeySupabase) {
      alert('اربط Supabase من js/supabase-config.js أولًا.');
      return null;
    }
    const {data,error} = await window.elrfaeySupabase.auth.getUser();
    if (error || !data?.user) {
      location.href = admin ? '../ahmed/login.html?next=../admin/index.html' : 'login.html';
      return null;
    }
    if (admin) {
      const {data: p, error: pe} = await window.elrfaeySupabase.from('profiles').select('role,full_name').eq('id',data.user.id).single();
      if (pe || p?.role !== 'admin') { alert('هذه الصفحة متاحة للإدارة فقط.'); location.href='../ahmed/dashboard.html'; return null; }
      window.currentProfile=p;
    }
    return data.user;
  };

  window.logActivity = async function(eventType, targetId='', details={}) {
    try {
      if (!window.elrfaeySupabase) return;
      const {data:{user}} = await window.elrfaeySupabase.auth.getUser();
      if (!user) return;
      const {error} = await window.elrfaeySupabase.rpc('log_user_activity',{p_event_type:eventType,p_target_id:String(targetId||''),p_details:details||{}});
      if (error) console.warn('activity log failed',error.message);
      const {data:{session}} = await window.elrfaeySupabase.auth.getSession();
      if (session?.access_token) {
        fetch('/api/discord?action=log',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({event_type:eventType,target_id:String(targetId||''),details:details||{}})}).catch(()=>{});
      }
    } catch(e) { console.warn('activity log unavailable',e); }
  };
  window.toast = (msg, ok=true) => { const el=document.getElementById('toast'); if(el){el.textContent=msg;el.className='toast show '+(ok?'ok':'bad');setTimeout(()=>el.className='toast',3000);} else alert(msg); };
  window.formatDate = value => value ? new Intl.DateTimeFormat('ar-EG',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) : '—';
  window.signOut = async () => { if(window.elrfaeySupabase) await window.elrfaeySupabase.auth.signOut(); location.href='../ahmed/login.html'; };
})();