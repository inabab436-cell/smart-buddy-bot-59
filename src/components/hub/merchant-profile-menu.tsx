import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Trash2, Crown, UserRound } from "lucide-react";

import { getSessionInfo, logout, deleteAccount } from "@/lib/auth.functions";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function MerchantProfileMenu({ subscribed = false }: { subscribed?: boolean }) {
  const fetchSession = useServerFn(getSessionInfo);
  const doLogout = useServerFn(logout);
  const doDelete = useServerFn(deleteAccount);
  const [email, setEmail] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchSession().then((s) => setEmail(s.email)).catch(() => {});
  }, [fetchSession]);

  const initial = (email ?? "?").charAt(0).toUpperCase();

  const onLogout = async () => {
    await doLogout().catch(() => {});
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

  return (
    <>
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger
          className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-2 ring-border transition hover:ring-primary/40"
          aria-label="الملف الشخصي"
        >
          {initial}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-3 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              <UserRound className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">حساب التاجر</span>
              <span className="hub-latin block truncate text-xs font-normal text-muted-foreground">{email ?? "—"}</span>
            </span>
          </DropdownMenuLabel>
          <div className="px-2 pb-2">
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${
                subscribed ? "bg-dashboard-green-soft text-dashboard-green" : "bg-dashboard-amber-soft text-dashboard-amber"
              }`}
            >
              <Crown className="h-4 w-4" />
              {subscribed ? "مشترك — ابدأ فورًا" : "غير مشترك"}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setConfirmOpen(true); }}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> حذف الحساب
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
