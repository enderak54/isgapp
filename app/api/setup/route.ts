import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST() {
  try {
    // Ayarlar tablosunu oluştur
    const { error: ayarlarError } = await supabase.from("ayarlar").select("id").limit(1);
    
    if (ayarlarError?.message.includes("relation") || ayarlarError?.message.includes("does not exist")) {
      await supabase.rpc('exec_sql', { 
        sql: `CREATE TABLE IF NOT EXISTS ayarlar (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          key VARCHAR(50) NOT NULL UNIQUE,
          value TEXT,
          type VARCHAR(50) DEFAULT 'general',
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`
      });
    }
    
    return Response.json({ success: true, message: "Tables ready" });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}