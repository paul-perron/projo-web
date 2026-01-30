// src/debug/TestSupabase.tsx
import { useState } from 'react';
import { selectMany } from "@/services/supabase";

export function TestSupabase() {
  const [result, setResult] = useState<string>('Click button to test');

  const testConnection = async () => {
    try {
      //  Fix 1: Use unknown instead of any
      const data = await selectMany<unknown>('workers', null, 'test connection');
      setResult(`✅ Success! Found ${data.length} workers`);
    } catch (err) {
      // Fix 2: Remove type annotation and check if it's an Error
      const message = err instanceof Error ? err.message : String(err);
      setResult(`❌ Error: ${message}`);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <button onClick={testConnection}>Test Supabase Connection</button>
      <p>{result}</p>
    </div>
  );
}