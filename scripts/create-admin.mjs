// Creates (or promotes) a super-admin login.
//   pnpm admin:create <username> <password>
// Admins have app_metadata.role = 'admin' and no battalions row.
import { createClient } from "@supabase/supabase-js";
import { need, usernameToEmail } from "./env.mjs";

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error("usage: pnpm admin:create <username> <password>");
  process.exit(1);
}
if (!/^[a-z0-9_]{3,32}$/.test(username)) {
  console.error("username: 3-32 chars, a-z 0-9 _ only");
  process.exit(1);
}

const admin = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = usernameToEmail(username);
const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
const existing = list?.users.find((u) => u.email === email);

if (existing) {
  const { error } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    app_metadata: { ...existing.app_metadata, role: "admin" },
    user_metadata: { ...existing.user_metadata, username },
  });
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`updated admin "${username}" (password reset, role admin)`);
} else {
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { username },
  });
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`created admin "${username}"`);
}
