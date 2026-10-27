// Creates a battalion login + its battalions row (what the admin panel does in stage 3).
//   pnpm battalion:create <username> "<display name>" <password>
import { createClient } from "@supabase/supabase-js";
import { need, usernameToEmail } from "./env.mjs";

const [username, name, password] = process.argv.slice(2);
if (!username || !name || !password) {
  console.error('usage: pnpm battalion:create <username> "<display name>" <password>');
  process.exit(1);
}
if (!/^[a-z0-9_]{3,32}$/.test(username)) {
  console.error("username: 3-32 chars, a-z 0-9 _ only");
  process.exit(1);
}

const admin = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: created, error } = await admin.auth.admin.createUser({
  email: usernameToEmail(username),
  password,
  email_confirm: true,
  app_metadata: { role: "battalion" },
  user_metadata: { username },
});
if (error) { console.error(error.message); process.exit(1); }

const { error: rowErr } = await admin
  .from("battalions")
  .insert({ user_id: created.user.id, username, name });
if (rowErr) {
  await admin.auth.admin.deleteUser(created.user.id);
  console.error(rowErr.message);
  process.exit(1);
}
console.log(`created battalion "${name}" (login: ${username})`);
