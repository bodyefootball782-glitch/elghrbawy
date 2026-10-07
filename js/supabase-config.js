/* Public Supabase browser configuration.
   IMPORTANT: never put SUPABASE_SERVICE_ROLE_KEY in this file. */
window.AHMED_ELGHRBAWY_SUPABASE_URL = 'https://mpoxvwefpxtaounnfcsp.supabase.co';
window.AHMED_ELGHRBAWY_SUPABASE_KEY = 'sb_publishable_9Fm2MuMRYmUWGiMl5LuaRQ_HTPhRESj';

(function () {
  if (!window.supabase) {
    console.error('Supabase JS library did not load.');
    return;
  }
  const url = window.AHMED_ELGHRBAWY_SUPABASE_URL;
  const key = window.AHMED_ELGHRBAWY_SUPABASE_KEY;
  if (!url || !key || url.startsWith('YOUR_') || key.startsWith('YOUR_')) {
    console.error('Supabase browser configuration is missing.');
    return;
  }
  window.elrfaeySupabase = window.supabase.createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
})();
