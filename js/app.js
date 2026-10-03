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
  window.toast = (msg, ok=true) => { const el=document.getElementById('toast'); if(el){el.textContent=msg;el.className='toast show '+(ok?'ok':'bad');setTimeout(()=>el.className='toast',3000);} else alert(msg); };
  window.formatDate = value => value ? new Intl.DateTimeFormat('ar-EG',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) : '—';
  window.signOut = async () => { if(window.elrfaeySupabase) await window.elrfaeySupabase.auth.signOut(); location.href='../ahmed/login.html'; };
})();