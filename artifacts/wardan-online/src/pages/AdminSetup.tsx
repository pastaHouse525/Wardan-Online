import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkSetupStatus, runFirstTimeSetup } from "@/lib/adminAuth";

export default function AdminSetup() {
  const [, setLocation] = useLocation();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    checkSetupStatus().then(({ configured }) => {
      if (configured) {
        setLocation("/admin/login");
      } else {
        setChecking(false);
      }
    });
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      await runFirstTimeSetup(email, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1D2B50]">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

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
          <p className="text-white/50 text-sm">الإعداد الأولي</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {done ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-xl font-bold">تم إنشاء حساب الإدارة</h2>
              <p className="text-sm text-muted-foreground">
                يمكنك الآن تسجيل الدخول بالبريد الإلكتروني وكلمة المرور اللذين اخترتهما.
              </p>
              <Button className="w-full h-11" onClick={() => setLocation("/admin/login")}>
                انتقل لتسجيل الدخول
              </Button>
            </div>
          ) : (
            /* Setup form */
            <>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">إنشاء حساب المسؤول</h2>
                  <p className="text-xs text-muted-foreground">أول مرة تستخدم فيها النظام</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 mb-5">
                اختر بريداً إلكترونياً وكلمة مرور قوية لحساب المسؤول. لن تُحفظ هذه البيانات في أي مكان آخر.
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="setup-email">البريد الإلكتروني</Label>
                  <Input
                    id="setup-email"
                    type="email"
                    placeholder="admin@yoursite.com"
                    dir="ltr"
                    className="h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-setup-email"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="setup-password">كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="setup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="8 أحرف على الأقل"
                      dir="ltr"
                      className="h-11 pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      data-testid="input-setup-password"
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

                <div className="space-y-1.5">
                  <Label htmlFor="setup-confirm">تأكيد كلمة المرور</Label>
                  <Input
                    id="setup-confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="أعد إدخال كلمة المرور"
                    dir="ltr"
                    className="h-11"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    data-testid="input-setup-confirm"
                  />
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3 border border-destructive/20">
                    ⚠️ {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 gap-2 mt-2"
                  disabled={loading}
                  data-testid="button-setup-submit"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جاري الإنشاء...</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4" /> إنشاء حساب المسؤول</>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
