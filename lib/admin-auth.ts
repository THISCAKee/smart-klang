import { supabaseAdmin } from "@/lib/supabase-admin";

export interface AdminUser {
  id: string;
  email: string | null;
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
}

function adminEmailAllowed(email: string | null) {
  const configuredEmails = process.env.ADMIN_EMAILS;
  if (!configuredEmails) return true;
  if (!email) return false;

  const allowed = configuredEmails
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.toLowerCase());
}

export async function requireAdmin(req: Request): Promise<AdminUser | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const email = data.user.email ?? null;
  if (!adminEmailAllowed(email)) return null;

  return {
    id: data.user.id,
    email,
  };
}
