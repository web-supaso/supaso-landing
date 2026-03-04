import { createClient } from "@supabase/supabase-js";
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const envLines = envFile.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';

envLines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRAG() {
    const { data, error } = await supabase.from("sofia_knowledge").select("*");
    fs.writeFileSync('test_rag_out.json', JSON.stringify(data, null, 2));
}

testRAG();
