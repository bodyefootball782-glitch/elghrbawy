/* ضع هنا بيانات مشروع Supabase فقط.
   لا تضع service_role أو secret key هنا. هذا الملف يعمل في المتصفح. */
window.AHMED ELGHRBAWY_SUPABASE_URL = 'https://mpoxvwefpxtaounnfcsp.supabase.co';
window.AHMED ELGHRBAWY_SUPABASE_KEY = 'sb_publishable_9Fm2MuMRYmUWGiMl5LuaRQ_HTPhRESj';

if (window.supabase && !window.AHMED ELGHRBAWY_SUPABASE_URL.startsWith('YOUR_')) {
  window.elrfaeySupabase = window.supabase.createClient(
    window.AHMED ELGHRBAWY_SUPABASE_URL,
    window.AHMED ELGHRBAWY_SUPABASE_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );
}
