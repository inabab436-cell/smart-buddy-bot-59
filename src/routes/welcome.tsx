import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, ArrowRight, Check, CreditCard, ImagePlus, Loader2,
  Package, PartyPopper, Sparkles, Store, Truck,
} from "lucide-react";

import logo from "@/assets/cupai-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { completeSetup } from "@/lib/auth.functions";
import { getSiteState, updateWebsiteIdentity, uploadWebsiteLogo } from "@/lib/website.functions";
import { ONBOARDING_DONE_KEY } from "@/lib/onboarding";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "أهلاً بك في coopai · جهّز متجرك" },
      { name: "description", content: "خطوات بسيطة لتجهيز متجرك والبدء في البيع مع coopai." },
      { property: "og:title", content: "أهلاً بك في coopai · جهّز متجرك" },
      { property: "og:description", content: "جهّز هوية متجرك وأساسيات البيع في دقائق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WelcomePage,
});

const STEPS = ["أهلاً بك", "هوية متجرك", "أساسيات البيع", "جاهز"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? "");
      res(s.slice(s.indexOf(",") + 1));
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function WelcomePage() {
  const loadSite = useServerFn(getSiteState);
  const saveIdentity = useServerFn(updateWebsiteIdentity);
  const uploadLogo = useServerFn(uploadWebsiteLogo);
  const finishSetup = useServerFn(completeSetup);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSite()
      .then((s) => {
        setName(s.brand_name ?? "");
        setDescription(s.description ?? "");
        setLogoUrl(s.logo_url ?? "");
        setPublicUrl(s.public_url);
      })
      .catch(() => {});
  }, [loadSite]);

  const finish = async () => {
    setBusy(true);
    try { window.localStorage.setItem(ONBOARDING_DONE_KEY, "1"); } catch { /* ignore */ }
    try { await finishSetup(); } catch { /* local flag is enough to stop repeats */ }
    window.location.replace("/dashboard");
  };

  const saveAndNext = async () => {
    if (name.trim().length < 2) return setError("اكتب اسم متجرك (حرفان على الأقل).");
    setBusy(true);
    setError(null);
    try {
      const s = await saveIdentity({ data: { brand_name: name.trim(), description, logo_url: logoUrl || undefined } });
      setPublicUrl(s.public_url);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحفظ، حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  const onLogo = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadLogo({ data: { file_name: file.name, mime_type: file.type, base64: await fileToBase64(file) } });
      setLogoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر رفع الشعار.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div dir="rtl" className="hub hub-dashboard flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src={logo.url} alt="coopai" className="h-9 w-9 rounded-lg" />
            <span className="text-sm font-bold">coopai</span>
          </div>
          {step < 3 ? (
            <button type="button" onClick={finish} disabled={busy} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              تخطَّ الآن
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-10">
        <Progress step={step} />

        <div key={step} className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {step === 0 && (
            <section className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-8 w-8" />
              </div>
              <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">أهلاً بك في coopai 👋</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                خلال دقيقتين سنجهّز متجرك معًا. كل خطوة يمكنك تعديلها لاحقًا في أي وقت.
              </p>
              <div className="mt-8 grid gap-3 text-right sm:grid-cols-2">
                <Feature icon={<Store className="h-5 w-5" />} title="متجر إلكتروني" text="رابط جاهز لمشاركته مع عملائك" />
                <Feature icon={<Package className="h-5 w-5" />} title="إدارة كاملة" text="المنتجات والطلبات والشحن بمكان واحد" />
              </div>
              <Button size="lg" className="mt-8 w-full sm:w-auto sm:px-10" onClick={() => setStep(1)}>
                لنبدأ <ArrowLeft className="mr-1 h-4 w-4" />
              </Button>
            </section>
          )}

          {step === 1 && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
              <h1 className="text-xl font-extrabold">ما اسم متجرك؟</h1>
              <p className="mt-1 text-sm text-muted-foreground">هذا ما سيراه عملاؤك أولاً.</p>

              <div className="mt-6 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition hover:border-primary hover:text-primary"
                  aria-label="رفع الشعار"
                >
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : logoUrl ? (
                    <img src={logoUrl} alt="الشعار" className="h-full w-full object-cover" />
                  ) : <ImagePlus className="h-6 w-6" />}
                </button>
                <div className="text-sm">
                  <p className="font-semibold">شعار المتجر</p>
                  <p className="text-xs text-muted-foreground">اختياري · اضغط لرفع صورة</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onLogo(f);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="store-name">اسم المتجر</Label>
                  <Input id="store-name" value={name} maxLength={80} placeholder="مثال: متجر الورد" onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="store-desc">نبذة قصيرة <span className="text-xs font-normal text-muted-foreground">(اختياري)</span></Label>
                  <Textarea id="store-desc" rows={3} value={description} placeholder="ماذا تبيع؟ جملة واحدة تكفي." onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>

              {error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}

              <StepNav onBack={() => setStep(0)} onNext={saveAndNext} busy={busy || uploading} nextLabel="حفظ ومتابعة" />
            </section>
          )}

          {step === 2 && (
            <section>
              <h1 className="text-xl font-extrabold">جهّز أساسيات البيع</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                ثلاث خطوات تجعل متجرك جاهزًا لاستقبال الطلبات. يمكنك إكمالها الآن أو لاحقًا من لوحة التحكم.
              </p>
              <div className="mt-6 space-y-3">
                <Task to="/products" n={1} icon={<Package className="h-5 w-5" />} tone="bg-dashboard-green-soft text-dashboard-green" title="أضف منتجاتك" text="الأسماء والأسعار والصور والكميات" />
                <Task to="/shipping" n={2} icon={<Truck className="h-5 w-5" />} tone="bg-dashboard-blue-soft text-dashboard-blue" title="حدّد مناطق الشحن" text="أين توصّل وكم التكلفة" />
                <Task to="/settings/payment-methods" n={3} icon={<CreditCard className="h-5 w-5" />} tone="bg-dashboard-rose-soft text-dashboard-rose" title="فعّل طرق الدفع" text="كيف تستلم أموالك من العملاء" />
              </div>
              <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="متابعة" />
            </section>
          )}

          {step === 3 && (
            <section className="text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-dashboard-green-soft text-dashboard-green">
                <PartyPopper className="h-10 w-10" />
              </div>
              <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">متجرك جاهز{name ? `، ${name}` : ""}!</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                كل شيء في مكانه. من لوحة التحكم تتابع طلباتك ومحادثاتك وتكمل أي إعداد متبقٍ.
              </p>
              {publicUrl ? (
                <a href={publicUrl} target="_blank" rel="noreferrer" className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-primary shadow-card hover:border-primary/40">
                  <Store className="h-4 w-4" /> شاهد متجرك
                </a>
              ) : null}
              <div className="mt-8">
                <Button size="lg" className="w-full sm:w-auto sm:px-10" onClick={finish} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>الذهاب إلى لوحة التحكم <ArrowLeft className="mr-1 h-4 w-4" /></>}
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-primary">{STEPS[step]}</span>
        <span className="text-muted-foreground">الخطوة {step + 1} من {STEPS.length}</span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 rounded-full transition-colors duration-500 ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <p className="mt-3 text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function Task({ to, n, icon, tone, title, text }: { to: string; n: number; icon: React.ReactNode; tone: string; title: string; text: string }) {
  return (
    <Link to={to as never} target="_blank" className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{n}. {title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{text}</span>
      </span>
      <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
    </Link>
  );
}

function StepNav({ onBack, onNext, busy, nextLabel }: { onBack: () => void; onNext: () => void; busy?: boolean; nextLabel: string }) {
  return (
    <div className="mt-7 flex items-center justify-between gap-3">
      <Button variant="ghost" onClick={onBack} disabled={busy}>
        <ArrowRight className="ml-1 h-4 w-4" /> رجوع
      </Button>
      <Button size="lg" onClick={onNext} disabled={busy} className="px-8">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{nextLabel} <Check className="mr-1 h-4 w-4" /></>}
      </Button>
    </div>
  );
}
