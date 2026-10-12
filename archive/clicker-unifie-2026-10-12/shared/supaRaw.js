// Shared Supabase client loader for the consolidated clicker.
// The import is dynamic so the clicker can still start in local/offline mode.
const SUPABASE_URL = 'https://imryukpbtkngsihxfxox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imltcnl1a3BidGtuZ3NpaHhmeG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5OTcwOTMsImV4cCI6MjA2MTU3MzA5M30.2uO9vMH5sFNBXS69Z01Xa4ofLV8rmgjUE-HPKgq9fVY';

let clientPromise = null;

export async function getClient() {
  if (!clientPromise) {
    clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm')
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  }
  return clientPromise;
}
