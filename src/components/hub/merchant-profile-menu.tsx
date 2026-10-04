import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ChevronDown, Copy, Crown, ExternalLink, Globe2, LogOut, Mail, ShieldCheck, Trash2,
} from "lucide-react";

import { getSessionInfo, logout, deleteAccount } from "@/lib/auth.functions";
import { getSiteState } from "@/lib/website.functions";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PLAN_NAME = "ابدأ فورًا";
const PLAN_PRICE = "299ج";

function useSite() {
  return useQuery({ queryKey: ["site-state"], queryFn: () => getSiteState() });
}

function DetailRow({
  icon, label, value, mono, action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] leading-none text-muted-foreground">{label}</span>
        <span
          dir={mono ? "ltr" : undefined}
          className={`mt-1.5 block truncate text-sm font-semibold ${mono ? "hub-latin text-left" : ""}`}
        >
          {value}
        </span>
      </span>
      {action}
    </div>
  );
}

function AccountBody({
  email, subscribed, site, onLogout, onRequestDelete, busy,
}: {
  email: string | null;
  subscribed: boolean;
  site: ReturnType<typeof useSite>["data"];
  onLogout: () => void;
  onRequestDelete: () => void;
  busy: boolean;
}) {
  const storePath = site?.brand_slug ? `/c/${site.brand_slug}` : null;
  const storeUrl = storePath && typeof window !== "undefined"
    ? `${window.location.host}${storePath}`
    : null;

  const copyLink = () => {
    if (!storePath || typeof window === "undefined") return;
    navigator.clipboard?.writeText(`${window.location.origin}${storePath}`);
    toast.success("تم نسخ رابط المتجر");
  };

  return (
    <div className="hub-dashboard text-right" dir="rtl">
      {/* Identity */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-1">
        <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-muted">
          {site?.logo_url ? (
            <img src={site.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-extrabold text-primary">
              {(site?.brand_name ?? email ?? "؟").charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-extrabold leading-tight">
            {site?.brand_name || "متجرك"}
          </span>
          <span className="hub-latin mt-1 block truncate text-left text-xs text-muted-foreground" dir="ltr">
            {email ?? "—"}
          </span>
        </span>
      </div>

      {/* Subscription */}
      <div className="px-4">
        <div
          className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
            subscribed ? "bg-dashboard-green-soft" : "bg-dashboard-amber-soft"
          }`}
        >
          <Crown
            className={`h-5 w-5 shrink-0 ${subscribed ? "text-dashboard-green" : "text-dashboard-amber"}`}
          />
          <span className="min-w-0 flex-1">
            <span
              className={`block text-sm font-extrabold ${
                subscribed ? "text-dashboard-green" : "text-dashboard-amber"
              }`}
            >
              {subscribed ? "مشترك" : "غير مشترك"}
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              باقة {PLAN_NAME} — {PLAN_PRICE}
            </span>
          </span>
          {!subscribed && (
            <a
              href="/login"
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition hover:opacity-90"
            >
              اشترك
            </a>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mt-3 divide-y divide-border border-y border-border">
        <DetailRow
          icon={<Mail className="h-4 w-4" />}
          label="البريد الإلكتروني"
          value={email ?? "—"}
          mono
        />
        <DetailRow
          icon={<ShieldCheck className="h-4 w-4" />}
          label="حالة الاشتراك"
          value={subscribed ? "مشترك — باقة ابدأ فورًا" : "غير مشترك"}
        />
        <DetailRow
          icon={<Globe2 className="h-4 w-4" />}
          label="حالة المتجر"
          value={
            site?.site_status === "published"
              ? "منشور — ظاهر للعملاء"
              : site?.site_created
                ? "غير منشور"
                : "لم يُنشأ بعد"
          }
        />
        <DetailRow
          icon={<ExternalLink className="h-4 w-4" />}
          label="رابط المتجر"
          value={storeUrl ?? "—"}
          mono
          action={storePath ? (
            <button
              type="button"
              onClick={copyLink}
              aria-label="نسخ رابط المتجر"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          ) : undefined}
        />
      </div>

      {/* Actions */}
      <div className="space-y-2 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
        >
          <LogOut className="h-4 w-4" /> تسجيل الخروج
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRequestDelete}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" /> حذف الحساب
        </button>
      </div>
    </div>
  );
}

export function MerchantProfileMenu({ subscribed = false }: { subscribed?: boolean }) {
  const isMobile = useIsMobile();
  const fetchSession = useServerFn(getSessionInfo);
  const doLogout = useServerFn(logout);
  const doDelete = useServerFn(deleteAccount);
  const { data: site } = useSite();
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchSession().then((s) => setEmail(s.email)).catch(() => {});
  }, [fetchSession]);

  const onLogout = () => {
    void doLogout().catch(() => {});
    window.location.replace("/");
  };

  const onDelete = async () => {
    setBusy(true);
    try {
      await doDelete();
      window.location.replace("/");
    } catch {
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  const trigger = (
    <button
      type="button"
      className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pe-2.5 ps-1 shadow-card transition-colors hover:border-primary/40 hover:bg-muted/60"
      aria-label="حسابك"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
        {site?.logo_url ? (
          <img src={site.logo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-extrabold">
            {(site?.brand_name ?? email ?? "؟").charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="text-sm font-bold">حسابك</span>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );

  const body = (
    <AccountBody
      email={email}
      subscribed={subscribed}
      site={site}
      onLogout={onLogout}
      onRequestDelete={() => { setOpen(false); setConfirmOpen(true); }}
      busy={busy}
    />
  );

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent dir="rtl" className="hub-dashboard mx-auto max-h-[88vh] max-w-lg overflow-y-auto rounded-t-3xl border-border pb-2">
            <DrawerHeader className="p-0 pb-1 pt-2 text-center">
              <DrawerTitle className="sr-only">حسابك</DrawerTitle>
            </DrawerHeader>
            {body}
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={10}
            className="w-[22rem] rounded-2xl border-border bg-card p-0 shadow-card"
          >
            {body}
          </PopoverContent>
        </Popover>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الحساب نهائيًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف حسابك وكل بيانات متجرك، ولا يمكن التراجع عن ذلك.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => { e.preventDefault(); void onDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? "جارٍ الحذف..." : "حذف الحساب"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
