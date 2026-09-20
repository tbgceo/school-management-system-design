/**
 * Is the app talking to Supabase, and is the database still protected?
 *
 *   npm run check:supabase
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env (Node loads it
 * via --env-file; see the npm script). The key is never printed — only whether
 * it is present, and a short fingerprint so two machines can confirm they hold
 * the same value without either revealing it.
 *
 * Three checks, in order of what they would tell you when they fail:
 *
 *   1. reachable   the URL and key form a valid pair and PostgREST answers
 *   2. schema      the migrations have been applied to THIS project
 *   3. rls guard   the anon key cannot read student rows
 *
 * Check 3 is the important one. The anon key ships inside the browser bundle, so
 * the only thing standing between it and 314 students' records is row level
 * security. If that check ever fails, stop and fix the policies.
 */

import { createHash } from 'node:crypto';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let failed = 0;
const pass = (label, note = '') => console.log(`${green('ok  ')} ${label}${note ? dim(`  ${note}`) : ''}`);
const fail = (label, note = '') => { failed += 1; console.log(`${red('FAIL')} ${label}${note ? `  ${note}` : ''}`); };

/** Enough to compare two copies of a key, not enough to reconstruct one. */
const fingerprint = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8);

if (!url || !key) {
  console.log(red('\nVITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set.\n'));
  console.log('  cp .env.example .env     then fill both values from');
  console.log('  Supabase dashboard → Project Settings → API\n');
  process.exit(1);
}

const base = url.replace(/\/+$/, '');
const headers = { apikey: key, Authorization: `Bearer ${key}` };

console.log(`\nProject  ${base}`);
console.log(`Anon key present, fingerprint ${fingerprint(key)}\n`);

async function get(path) {
  const res = await fetch(`${base}/rest/v1/${path}`, { headers });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

try {
  // 1 — reachable
  const root = await fetch(`${base}/rest/v1/`, { headers });
  if (root.ok) pass('reachable', `PostgREST answered ${root.status}`);
  else fail('reachable', `got ${root.status} — check the URL and key are from the same project`);

  // 2 — schema applied. subjects is reference data every screen needs; a 404
  //     here means the migrations went to a different project.
  const subjects = await get('subjects?select=id&limit=1');
  if (subjects.status === 200) pass('schema applied', 'public.subjects exists');
  else if (subjects.status === 404) fail('schema applied', 'public.subjects not found — run the migrations against this project');
  else fail('schema applied', `unexpected ${subjects.status}: ${JSON.stringify(subjects.body).slice(0, 120)}`);

  // 3 — the guard. Anonymous callers must come back empty, not populated.
  const probes = ['students?select=id&limit=1', 'assessments?select=id&limit=1', 'observations?select=id&limit=1'];
  const leaks = [];
  for (const probe of probes) {
    const r = await get(probe);
    const rows = Array.isArray(r.body) ? r.body.length : 0;
    if (rows > 0) leaks.push(probe.split('?')[0]);
  }
  if (leaks.length === 0) {
    pass('rls guard', 'anon key reads no student, mark or observation rows');
  } else {
    fail('rls guard', `ANON CAN READ ${leaks.join(', ')} — row level security is not protecting this data`);
  }
} catch (err) {
  fail('reachable', err.message);
}

console.log('');
if (failed) {
  console.log(red(`${failed} check(s) failed\n`));
  process.exit(1);
}
console.log(green('all checks passed\n'));
