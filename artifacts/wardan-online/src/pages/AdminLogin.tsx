import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Lock, Eye, EyeOff, Loader2, ArrowRight, KeyRound, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminLogin, setAdminToken,
  requestPasswordReset, checkSetupStatus,
} from "@/lib/adminAuth";

type View = "login" | "reset" | "reset-done";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [view, setView] = useState<View>("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state
  const [resetEmail, setResetEmail] = useState("");
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Redirect to setup if no admins configured yet
  useEffect(() => {
    checkSetupStatus().then(({ configured }) => {
      if (!configured) setLocation("/admin/setup");
    });
  }, [setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken } = await adminLogin(email, password);
      setAdminToken(accessToken);
      setLocation("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);
    try {
      const { link } = await requestPasswordReset(resetEmail);
      setResetLink(link);
      setView("reset-done");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1D2B50] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/logo.jpeg" alt="Wardan" className="h-14 w-14 rounded-2xl object-cover shadow-lg" />
            <div className="text-white text-right">
              <p className="font-black text-2xl tracking-wide">WARDAN</p>
              <p className="text-white/60 text-sm">وردان أونلاين</p>
            </div>
          </div>
          <p className="text-white/50 text-sm">لوحة الإدارة</p>
        </div>

        {/* ── Login form ── */}
        {view === "login" && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg">تسجيل الدخول</h2>
                <p className="text-xs text-muted-foreground">أدخل بيانات حساب الإدارة</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  dir="ltr"
                  className="h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-admin-email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    dir="ltr"
                    className="h-11 pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-admin-password"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3 border border-destructive/20" data-testid="text-login-error">
                  ⚠️ {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base gap-2"
                disabled={loading}
                data-testid="button-admin-login"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> جاري الدخول...</>
                ) : (
                  "دخول للوحة الإدارة"
                )}
              </Button>
            </form>

            <button
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => { setView("reset"); setResetEmail(email); setResetError(null); }}
            >
              نسيت كلمة المرور؟
            </button>
          </div>
        )}

        {/* ── Password reset request ── */}
        {view === "reset" && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-amber-100">
                <KeyRound className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg">استعادة كلمة المرور</h2>
                <p className="text-xs text-muted-foreground">أدخل بريدك الإلكتروني</p>
              </div>
            </div>

            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="admin@example.com"
                  dir="ltr"
                  className="h-11"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>

              {resetError && (
                <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3 border border-destructive/20">
                  ⚠️ {resetError}
                </div>
              )}

              <Button type="submit" className="w-full h-11 gap-2" disabled={resetLoading}>
                {resetLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري المعالجة...</> : "إرسال رابط الاستعادة"}
              </Button>
            </form>

            <button
              className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setView("login")}
            >
              <ArrowRight className="h-3.5 w-3.5" /> العودة لتسجيل الدخول
            </button>
          </div>
        )}

        {/* ── Reset link ready ── */}
        {view === "reset-done" && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-green-100">
                <KeyRound className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg">رابط الاستعادة</h2>
              </div>
            </div>

            {resetLink ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  انقر على الرابط أدناه لإعادة تعيين كلمة المرور. صالح لمرة واحدة فقط.
                </p>
                <a
                  href={resetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full justify-center rounded-xl bg-primary text-white px-4 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  افتح رابط إعادة التعيين
                </a>
                <p className="text-xs text-muted-foreground text-center">
                  بعد إعادة التعيين، عد هنا لتسجيل الدخول بكلمة المرور الجديدة.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                لم يُعثر على حساب مرتبط بهذا البريد الإلكتروني.
              </p>
            )}

            <button
              className="mt-5 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setView("login")}
            >
              <ArrowRight className="h-3.5 w-3.5" /> العودة لتسجيل الدخول
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
