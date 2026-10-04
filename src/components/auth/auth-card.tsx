import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import logoAsset from "@/assets/cupai-logo.png.asset.json";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div dir="rtl" className="hub grid min-h-screen bg-background lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-brand p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <img src={logoAsset.url} alt="كيوباي" className="h-12 w-12 rounded-xl bg-card object-contain p-1 shadow-elegant" />
          <span className="text-xl font-extrabold text-primary-foreground">كيوباي</span>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold leading-tight text-primary-foreground">متجرك كله<br />في لوحة واحدة</h2>
          <p className="max-w-sm text-base leading-relaxed text-primary-foreground/80">
            المنتجات، الطلبات، الشحن والعملاء — بإدارة بسيطة وواضحة.
          </p>
        </div>
        <span className="text-sm text-primary-foreground/60">© كيوباي</span>
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary-foreground/10 blur-2xl" />
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img src={logoAsset.url} alt="كيوباي" className="h-12 w-12 rounded-xl bg-card object-contain p-1 shadow-elegant" />
            <span className="text-xl font-extrabold tracking-tight text-gradient-brand">كيوباي</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

export function SpamNotice() {
  return (
    <div
      className={cn(
        "rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm font-medium leading-relaxed text-amber-800",
        "dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300",
      )}
    >
      قد تصل الرسالة إلى مجلد الرسائل غير المرغوب فيها (Spam)، يُرجى التحقق منه.
    </div>
  );
}
