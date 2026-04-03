import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Read .env file manually for this test script
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Connecting to Supabase at", supabaseUrl);
  // A simple test is to query the profiles table or just get auth session
  // or fetch any public data
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  
  if (error) {
    console.error("Connection failed! Error:", error.message);
  } else {
    console.log("Connection successful! Supabase is working.");
    console.log("Received data (first row):", data.length > 0 ? data[0] : "No rows found, but table exists.");
  }
}

testConnection();
