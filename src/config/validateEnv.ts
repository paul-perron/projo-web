// src/config/validateEnv.ts

export function validateSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const missing: string[] = [];
  if (!url) missing.push('VITE_SUPABASE_URL');
  if (!key) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required Supabase environment variables:\n` +
        missing.map(v => `  - ${v}`).join('\n') +
        `\n\n📝 Create a .env.local file with these values.\n` +
        `💡 See .env.example for the template.`
    );
  }

  return { url, key };
}