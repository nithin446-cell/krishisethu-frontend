
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const url = 'https://nywdzfjizwgwhowuozei.supabase.co';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55d2R6Zmppendnd2hvd3VvemVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTE3MDEsImV4cCI6MjA4NjU4NzcwMX0.OzK6N5EnYQDjwLmORMSyb4RIyngGTWFKkal7uaghyQA';
  const supabase = createClient(url, key);

  console.log('Logging in...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'riovr0605@gmail.com',
    password: 'Krishisethu@123'
  });

  if (error) {
    console.error('Login error:', error.message);
    return;
  }

  const token = data.session.access_token;
  console.log('Token obtained.');

  const endpoints = [
    'http://localhost:10000/api/admin/stats',
    'http://localhost:10000/api/admin/users?search=&role=all',
    'http://localhost:10000/api/admin/payouts?status=bank_pending',
    'http://localhost:10000/api/admin/payouts?status=history',
    'http://localhost:10000/api/admin/verifications',
    'http://localhost:10000/api/schemes',
    'http://localhost:10000/api/traders'
  ];

  for (const ep of endpoints) {
    console.log(`Testing ${ep}...`);
    try {
      const res = await fetch(ep, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`Status: ${res.status}`);
      const json = await res.json();
      console.log(`Response: ${JSON.stringify(json).substring(0, 200)}`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
  }
}

test();
