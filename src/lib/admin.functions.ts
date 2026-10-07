/**
 * Platform admin console. Only ADMIN_EMAIL with the ADMIN_PASSWORD secret can
 * sign in. Every handler re-checks the admin session server-side.
 */
import { createServerFn } from "@tanstack/react-start";

export const ADMIN_EMAIL = "maiapdalmotalib@gmail.com";

export interface AdminMerchant {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastSignInAt: string | null;
  restricted: boolean;
  subscribed: boolean;
}

async function adminSessionConfig() {
  const secret = process.env.CUPAI_APP_SESSION_SECRET;
  if (!secret) throw new Error("إعدادات الخادم غير مكتملة.");
  return {
    password: secret,
    name: "cupai_admin",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "strict" as const, path: "/" },
  };
}

async function requireAdmin() {
  const { getSession } = await import("@tanstack/react-start/server");
  const s = await getSession<{ admin?: boolean; email?: string }>(await adminSessionConfig());
  if (!s.data?.admin || s.data.email !== ADMIN_EMAIL) throw new Error("غير مصرح.");
}

async function admin() {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return getSupabaseAdmin();
}

function str(v: unknown, max = 200) {
  return String(v ?? "").trim().slice(0, max);
}
function email(v: unknown) {
  const s = str(v, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new Error("البريد غير صالح.");
  return s;
}
function uuid(v: unknown) {
  const s = str(v, 60);
  if (!/^[0-9a-f-]{36}$/i.test(s)) throw new Error("معرّف غير صالح.");
  return s;
}

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await requireAdmin();
    return { signedIn: true };
  } catch {
    return { signedIn: false };
  }
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) => ({
    email: str(d?.email, 254).toLowerCase(),
    password: String(d?.password ?? "").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) return { ok: false, message: "لم يتم ضبط كلمة مرور المدير بعد." };
    const { createHash, timingSafeEqual } = await import("node:crypto");
    const h = (x: string) => createHash("sha256").update(x, "utf8").digest();
    const passOk = timingSafeEqual(h(data.password.trim()), h(expected.trim()));
    const emailOk = timingSafeEqual(h(data.email), h(ADMIN_EMAIL));
    if (!passOk || !emailOk) {
      await new Promise((r) => setTimeout(r, 600));
      return { ok: false, message: "بيانات الدخول غير صحيحة." };
    }
    const { updateSession } = await import("@tanstack/react-start/server");
    await updateSession(await adminSessionConfig(), { admin: true, email: ADMIN_EMAIL });
    return { ok: true, message: "" };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { clearSession } = await import("@tanstack/react-start/server");
  await clearSession(await adminSessionConfig());
  return { ok: true };
});

export const listMerchants = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminMerchant[]> => {
    await requireAdmin();
    const sb = await admin();
    const out: AdminMerchant[] = [];
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error("تعذّر جلب الحسابات.");
      for (const u of data.users) {
        const banned = (u as { banned_until?: string | null }).banned_until;
        out.push({
          id: u.id,
          email: u.email ?? "",
          name: String(u.user_metadata?.full_name ?? ""),
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at ?? null,
          restricted: !!banned && new Date(banned).getTime() > Date.now(),
          subscribed: u.app_metadata?.subscribed === true,
        });
      }
      if (data.users.length < 200) break;
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
);

export const createMerchant = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; name: string; password: string }) => {
    const password = String(d?.password ?? "");
    if (password.length < 8 || password.length > 72) throw new Error("كلمة المرور 8 أحرف على الأقل.");
    return { email: email(d?.email), name: str(d?.name, 80), password };
  })
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await (await admin()).auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name },
    });
    if (error) throw new Error("تعذّر إنشاء الحساب: " + error.message);
    return { ok: true };
  });

export const updateMerchant = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { id: string; email?: string; name?: string; password?: string; restricted?: boolean; subscribed?: boolean }) => {
      const password = d?.password ? String(d.password) : undefined;
      if (password && (password.length < 8 || password.length > 72)) {
        throw new Error("كلمة المرور 8 أحرف على الأقل.");
      }
      return {
        id: uuid(d?.id),
        email: d?.email ? email(d.email) : undefined,
        name: d?.name !== undefined ? str(d.name, 80) : undefined,
        password,
        restricted: typeof d?.restricted === "boolean" ? d.restricted : undefined,
        subscribed: typeof d?.subscribed === "boolean" ? d.subscribed : undefined,
      };
    },
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const sb = await admin();
    const attrs: Record<string, unknown> = {};
    if (data.email) { attrs.email = data.email; attrs.email_confirm = true; }
    if (data.password) attrs.password = data.password;
    if (data.name !== undefined) attrs.user_metadata = { full_name: data.name };
    if (data.restricted !== undefined) attrs.ban_duration = data.restricted ? "876000h" : "none";
    if (data.subscribed !== undefined) {
      const { data: cur } = await sb.auth.admin.getUserById(data.id);
      attrs.app_metadata = { ...(cur.user?.app_metadata ?? {}), subscribed: data.subscribed };
    }
    const { error } = await sb.auth.admin.updateUserById(data.id, attrs);
    if (error) throw new Error("تعذّر التعديل: " + error.message);
    return { ok: true };
  });

export const deleteMerchant = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => ({ id: uuid(d?.id) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await (await admin()).auth.admin.deleteUser(data.id);
    if (error) throw new Error("تعذّر الحذف: " + error.message);
    return { ok: true };
  });

/** Open a merchant's dashboard as them (no password) — admin only. */
export const impersonateMerchant = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => ({ id: uuid(d?.id) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { data: u, error } = await (await admin()).auth.admin.getUserById(data.id);
    if (error || !u.user) throw new Error("الحساب غير موجود.");
    const { updateSession } = await import("@tanstack/react-start/server");
    const { getSessionConfig } = await import("@/lib/session.server");
    await updateSession(getSessionConfig(), { userId: u.user.id, email: u.user.email ?? "" });
    const { ensureProfile } = await import("@/lib/profile.server");
    await ensureProfile(u.user.id);
    return { ok: true };
  });
