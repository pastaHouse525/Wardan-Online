import { useState } from "react";
import { useLocation } from "wouter";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin, setAdminToken } from "@/lib/adminAuth";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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

        {/* Card */}
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

          <form onSubmit={handleSubmit} className="space-y-5">
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
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          يُرجى استخدام بيانات حساب Supabase للدخول
        </p>
      </div>
    </div>
  );
}
