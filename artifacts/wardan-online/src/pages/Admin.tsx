import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard, List, Clock, CheckCircle, XCircle, Tag,
  Stethoscope, Trash2, Check, X, LogOut, Star,
  Menu, ChevronLeft, Plus, MapPin, DollarSign,
  AlertCircle, Loader2, Search, MessageCircle,
  Shield, UserPlus, KeyRound, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useGetAdminStats, useAdminListListings, useApproveListing, useRejectListing,
  useListAppointments, useCreateAppointment,
  useListCategories,
  getAdminListListingsQueryKey, getGetAdminStatsQueryKey,
  getListAppointmentsQueryKey,
} from "@workspace/api-client-react";
import type { AdminStats } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminToken, adminLogout, isAdminLoggedIn,
  inviteAdmin, changeAdminPassword, authFetch,
} from "@/lib/adminAuth";

// ─── helpers ─────────────────────────────────────────────────────────────────

function authHeaders() {
  const t = getAdminToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function apiFetch(path: string, method = "GET", body?: object) {
  const res = await authFetch(path, method, body);
  if (res.status === 204) return null;
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Error");
  return res.json();
}

function relativeTime(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "اليوم";
  if (d === 1) return "أمس";
  if (d < 30)  return `منذ ${d} يوم`;
  return `منذ ${Math.floor(d / 30)} شهر`;
}

const CAT_COLORS: Record<string, string> = {
  "real-estate":    "bg-[#E85530]/10 text-[#E85530]",
  "livestock":      "bg-[#F5A020]/10 text-[#F5A020]",
  "birds":          "bg-[#4A91C8]/10 text-[#4A91C8]",
  "vegetables":     "bg-[#3DAA82]/10 text-[#3DAA82]",
  "clothes":        "bg-pink-100 text-pink-700",
  "home-appliances":"bg-indigo-100 text-indigo-700",
  "doctors":        "bg-[#3DAA82]/10 text-[#3DAA82]",
};

const CAT_BAR_COLORS: Record<string, string> = {
  "real-estate":    "bg-[#E85530]",
  "livestock":      "bg-[#F5A020]",
  "birds":          "bg-[#4A91C8]",
  "vegetables":     "bg-[#3DAA82]",
  "clothes":        "bg-pink-500",
  "home-appliances":"bg-indigo-500",
  "doctors":        "bg-teal-500",
};

// ─── nav config ──────────────────────────────────────────────────────────────

type Section = "overview" | "pending" | "listings" | "categories" | "appointments" | "users";

const NAV: { id: Section; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "overview",     label: "نظرة عامة",       icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "pending",      label: "بانتظار الموافقة", icon: <Clock className="h-5 w-5" /> },
  { id: "listings",     label: "كل الإعلانات",     icon: <List className="h-5 w-5" /> },
  { id: "categories",   label: "التصنيفات",        icon: <Tag className="h-5 w-5" /> },
  { id: "appointments", label: "المواعيد الطبية",  icon: <Stethoscope className="h-5 w-5" /> },
  { id: "users",        label: "المسؤولون",        icon: <Shield className="h-5 w-5" /> },
];

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, loading }: {
  label: string; value: number | undefined; icon: React.ReactNode;
  color: string; loading: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        {loading ? <Skeleton className="h-7 w-12 mb-1" /> : (
          <p className="text-2xl font-black">{value ?? 0}</p>
        )}
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">موافق</Badge>;
  if (status === "rejected") return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">مرفوض</Badge>;
  return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs">مراجعة</Badge>;
}

// ─── sections ─────────────────────────────────────────────────────────────────

function OverviewSection({ stats, statsLoading, onGoPending }: {
  stats: AdminStats | undefined;
  statsLoading: boolean;
  onGoPending: () => void;
}) {
  const statCards = [
    { label: "إجمالي الإعلانات", value: stats?.totalListings,     color: "bg-blue-100 text-blue-600",   icon: <List className="h-5 w-5" /> },
    { label: "بانتظار الموافقة", value: stats?.pendingListings,   color: "bg-amber-100 text-amber-600", icon: <Clock className="h-5 w-5" /> },
    { label: "موافق عليها",       value: stats?.approvedListings,  color: "bg-green-100 text-green-600", icon: <CheckCircle className="h-5 w-5" /> },
    { label: "مرفوضة",            value: stats?.rejectedListings,  color: "bg-red-100 text-red-600",     icon: <XCircle className="h-5 w-5" /> },
    { label: "التصنيفات",         value: stats?.totalCategories,   color: "bg-purple-100 text-purple-600",icon: <Tag className="h-5 w-5" /> },
    { label: "المواعيد الطبية",   value: stats?.totalAppointments, color: "bg-teal-100 text-teal-600",   icon: <Stethoscope className="h-5 w-5" /> },
  ];

  const total = stats?.totalListings || 1;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">نظرة عامة</h2>

      {(stats?.pendingListings ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">
              {stats!.pendingListings} إعلان بانتظار موافقتك
            </p>
            <p className="text-sm text-amber-600">راجع الإعلانات وافقها أو ارفضها</p>
          </div>
          <Button size="sm" onClick={onGoPending} className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
            مراجعة
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} loading={statsLoading} />
        ))}
      </div>

      {stats?.listingsByCategory && stats.listingsByCategory.length > 0 && (
        <div className="bg-card rounded-2xl border p-6">
          <h3 className="font-bold text-lg mb-5">الإعلانات حسب التصنيف</h3>
          <div className="space-y-3">
            {[...stats.listingsByCategory]
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <div key={item.categorySlug} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-muted-foreground truncate text-right flex-shrink-0">
                    {item.categoryNameAr}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${CAT_BAR_COLORS[item.categorySlug] ?? "bg-primary"}`}
                      style={{ width: `${Math.min((item.count / total) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-8 text-left shrink-0">{item.count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PendingSection({ onInvalidate }: { onInvalidate: () => void }) {
  const { toast } = useToast();
  const approveMutation = useApproveListing();
  const rejectMutation  = useRejectListing();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: listings, isLoading } = useAdminListListings(
    { status: "pending" },
    { query: { enabled: isAdminLoggedIn(), queryKey: ["admin-listings-pending"] } }
  );

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id }, {
      onSuccess: () => { onInvalidate(); toast({ title: "✅ تمت الموافقة على الإعلان" }); },
      onError:   () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate({ id }, {
      onSuccess: () => { onInvalidate(); toast({ title: "❌ تم رفض الإعلان" }); },
      onError:   () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان نهائياً؟")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/admin/listings/${id}`, "DELETE");
      onInvalidate();
      toast({ title: "🗑️ تم حذف الإعلان" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)}
    </div>
  );

  if (!listings?.length) return (
    <div className="text-center py-20 text-muted-foreground">
      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-70" />
      <p className="text-xl font-bold text-foreground mb-1">لا توجد إعلانات معلقة</p>
      <p className="text-sm">جميع الإعلانات تمت مراجعتها 🎉</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">بانتظار الموافقة</h2>
        <Badge className="bg-amber-100 text-amber-800 text-sm px-3 py-1">{listings.length} إعلان</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-card rounded-2xl border overflow-hidden" data-testid={`card-pending-${listing.id}`}>
            {/* Image */}
            <div className="relative h-36 bg-muted overflow-hidden">
              {listing.imageUrl ? (
                <img src={listing.imageUrl} alt={listing.titleAr} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">
                  {listing.categorySlug === "real-estate" ? "🏠" :
                   listing.categorySlug === "livestock"   ? "🐄" :
                   listing.categorySlug === "birds"       ? "🦜" :
                   listing.categorySlug === "vegetables"  ? "🥦" :
                   listing.categorySlug === "clothes"     ? "👗" :
                   listing.categorySlug === "doctors"     ? "🩺" : "📺"}
                </div>
              )}
              <span className={`absolute top-2 right-2 text-xs font-medium px-2.5 py-1 rounded-full ${CAT_COLORS[listing.categorySlug] ?? "bg-gray-100 text-gray-700"}`}>
                {listing.categoryNameAr ?? listing.categorySlug}
              </span>
            </div>

            <div className="p-4">
              <h3 className="font-bold line-clamp-1 mb-1" data-testid={`text-pending-title-${listing.id}`}>
                {listing.titleAr}
              </h3>
              {listing.descriptionAr && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{listing.descriptionAr}</p>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-4">
                {listing.price != null && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {listing.price.toLocaleString("ar-EG")} {listing.priceUnit ?? ""}
                  </span>
                )}
                {(listing.location ?? (listing as { city?: string }).city) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {(listing as { city?: string }).city ?? listing.location}
                  </span>
                )}
                {listing.sellerName && <span>👤 {listing.sellerName}</span>}
                <span className="text-muted-foreground/60">{relativeTime(listing.createdAt)}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                  onClick={() => handleApprove(listing.id)}
                  disabled={approveMutation.isPending}
                  data-testid={`button-approve-${listing.id}`}
                >
                  <Check className="h-4 w-4" /> موافقة
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                  onClick={() => handleReject(listing.id)}
                  disabled={rejectMutation.isPending}
                  data-testid={`button-reject-${listing.id}`}
                >
                  <X className="h-4 w-4" /> رفض
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive px-2"
                  onClick={() => handleDelete(listing.id)}
                  disabled={deletingId === listing.id}
                  data-testid={`button-delete-${listing.id}`}
                >
                  {deletingId === listing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllListingsSection({ onInvalidate }: { onInvalidate: () => void }) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter]   = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch]               = useState("");
  const [deletingId, setDeletingId]       = useState<number | null>(null);
  const [featuringId, setFeaturingId]     = useState<number | null>(null);

  const { data: listings, isLoading } = useAdminListListings(
    { status: statusFilter === "all" ? undefined : statusFilter, category: categoryFilter === "all" ? undefined : categoryFilter },
    { query: { enabled: isAdminLoggedIn(), queryKey: getAdminListListingsQueryKey({ status: statusFilter, category: categoryFilter }) } }
  );

  const filtered = (listings ?? []).filter((l) =>
    !search || l.titleAr.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/admin/listings/${id}`, "DELETE");
      onInvalidate();
      toast({ title: "تم الحذف" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally { setDeletingId(null); }
  };

  const handleFeature = async (id: number, featured: boolean) => {
    setFeaturingId(id);
    try {
      await apiFetch(`/api/admin/listings/${id}/feature`, "PATCH", { featured });
      onInvalidate();
      toast({ title: featured ? "⭐ تم تمييز الإعلان" : "تم إلغاء التمييز" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally { setFeaturingId(null); }
  };

  const catNames: Record<string, string> = {
    "real-estate": "عقارات", "livestock": "مواشي", "birds": "طيور",
    "vegetables": "خضروات", "clothes": "ملابس", "home-appliances": "أجهزة منزلية", "doctors": "مواعيد طبية",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">كل الإعلانات</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="بحث بالعنوان..." className="pr-9 h-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-10" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending">قيد المراجعة</SelectItem>
            <SelectItem value="approved">موافق عليها</SelectItem>
            <SelectItem value="rejected">مرفوضة</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 h-10" data-testid="select-category-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع التصنيفات</SelectItem>
            {Object.entries(catNames).map(([s, n]) => <SelectItem key={s} value={s}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <List className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد إعلانات بهذه الفلاتر</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-right p-3 font-semibold text-muted-foreground">الإعلان</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground hidden sm:table-cell">التصنيف</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">الحالة</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground hidden md:table-cell">التاريخ</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((listing) => (
                  <tr key={listing.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-listing-${listing.id}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                          {listing.imageUrl
                            ? <img src={listing.imageUrl} alt="" className="h-full w-full object-cover" />
                            : <div className="h-full w-full flex items-center justify-center text-lg">
                                {catNames[listing.categorySlug]?.[0] ?? "📋"}
                              </div>
                          }
                        </div>
                        <div>
                          <Link href={`/listing/${listing.id}`}>
                            <p className="font-medium line-clamp-1 hover:text-primary cursor-pointer">{listing.titleAr}</p>
                          </Link>
                          {listing.sellerName && <p className="text-xs text-muted-foreground">{listing.sellerName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[listing.categorySlug] ?? "bg-gray-100 text-gray-700"}`}>
                        {listing.categoryNameAr}
                      </span>
                    </td>
                    <td className="p-3"><StatusBadge status={listing.status} /></td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell whitespace-nowrap text-xs">
                      {relativeTime(listing.createdAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => handleFeature(listing.id, !listing.featured)}
                          disabled={featuringId === listing.id}
                          className={`p-1.5 rounded-lg transition-colors ${listing.featured ? "text-amber-500 bg-amber-50" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50"}`}
                          title={listing.featured ? "إلغاء التمييز" : "تمييز"}
                          data-testid={`button-feature-${listing.id}`}
                        >
                          {featuringId === listing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deletingId === listing.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          data-testid={`button-delete-${listing.id}`}
                        >
                          {deletingId === listing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t text-sm text-muted-foreground">
            {filtered.length} إعلان
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesSection() {
  const { data: categories, isLoading } = useListCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [form, setForm] = useState({ nameAr: "", nameEn: "", slug: "", icon: "📋", section: "marketplace" });

  const catEmojis: Record<string, string> = {
    "real-estate": "🏠", "livestock": "🐄", "birds": "🦜",
    "vegetables": "🥦", "clothes": "👗", "home-appliances": "📺", "doctors": "🩺",
  };

  function autoSlug(name: string) {
    return name.trim().toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/admin/categories", "POST", {
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        slug: form.slug || autoSlug(form.nameAr),
        icon: form.icon,
        section: form.section,
      });
      toast({ title: "تم إضافة التصنيف بنجاح" });
      setForm({ nameAr: "", nameEn: "", slug: "", icon: "📋", section: "marketplace" });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["listCategories"] });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "فشل إضافة التصنيف", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(slug: string, listingCount: number) {
    if (listingCount > 0) {
      toast({ title: "لا يمكن حذف تصنيف يحتوي على إعلانات", variant: "destructive" }); return;
    }
    if (!confirm("هل أنت متأكد من حذف هذا التصنيف؟")) return;
    setDeletingSlug(slug);
    try {
      await apiFetch(`/api/admin/categories/${slug}`, "DELETE");
      toast({ title: "تم حذف التصنيف" });
      queryClient.invalidateQueries({ queryKey: ["listCategories"] });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "فشل الحذف", variant: "destructive" });
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">التصنيفات</h2>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> إضافة تصنيف
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-card rounded-2xl border p-5 space-y-4">
          <h3 className="font-bold text-base">تصنيف جديد</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>الاسم بالعربية *</Label>
              <Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value, slug: autoSlug(e.target.value) }))} placeholder="مثال: إلكترونيات" required />
            </div>
            <div className="space-y-1.5">
              <Label>الاسم بالإنجليزية</Label>
              <Input dir="ltr" value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} placeholder="e.g. Electronics" />
            </div>
            <div className="space-y-1.5">
              <Label>المعرّف (slug) *</Label>
              <Input dir="ltr" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="electronics" required />
              <p className="text-xs text-muted-foreground">حروف إنجليزية وأرقام وشرطة فقط</p>
            </div>
            <div className="space-y-1.5">
              <Label>الأيقونة (إيموجي)</Label>
              <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="📋" maxLength={4} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>القسم *</Label>
              <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketplace">سوق البيع والشراء</SelectItem>
                  <SelectItem value="services">دليل الخدمات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin ml-1" /> جاري الحفظ...</> : "حفظ التصنيف"}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(categories ?? []).map((cat) => (
            <div key={cat.slug} className="bg-card rounded-2xl border p-4 hover:shadow-md transition-all flex items-center gap-4">
              <Link href={`/category/${cat.slug}`} className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`text-3xl p-3 rounded-xl shrink-0 ${CAT_COLORS[cat.slug] ?? "bg-gray-100"}`}>
                  {catEmojis[cat.slug] ?? cat.icon ?? "📋"}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-base truncate">{cat.nameAr}</p>
                  <p className="text-xs text-muted-foreground">{cat.listingCount} إعلان · {cat.section === "services" ? "خدمات" : "بيع وشراء"}</p>
                </div>
              </Link>
              <Button
                size="icon" variant="ghost"
                className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                disabled={deletingSlug === cat.slug}
                onClick={() => handleDelete(cat.slug, cat.listingCount)}
              >
                {deletingSlug === cat.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm] = useState({
    doctorNameAr: "", whatsappNumber: "", specialty: "",
    clinicLocation: "", consultationFee: "",
  });

  const { data: appointments, isLoading } = useListAppointments();
  const createMutation = useCreateAppointment();

  const handleDelete = async (id: number) => {
    if (!confirm("حذف هذا الطبيب؟")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/admin/appointments/${id}`, "DELETE");
      queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
      toast({ title: "تم حذف الموعد" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally { setDeletingId(null); }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doctorNameAr || !form.whatsappNumber) return;
    createMutation.mutate(
      {
        data: {
          doctorNameAr:    form.doctorNameAr,
          whatsappNumber:  form.whatsappNumber,
          specialty:       form.specialty   || undefined,
          clinicLocation:  form.clinicLocation || undefined,
          consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
          toast({ title: "✅ تمت إضافة الطبيب" });
          setForm({ doctorNameAr: "", whatsappNumber: "", specialty: "", clinicLocation: "", consultationFee: "" });
          setShowForm(false);
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">المواعيد الطبية</h2>
        <Button className="gap-2" size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-doctor">
          <Plus className="h-4 w-4" />
          {showForm ? "إلغاء" : "إضافة طبيب"}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-card rounded-2xl border p-6">
          <h3 className="font-bold mb-4">إضافة طبيب جديد</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>اسم الطبيب *</Label>
              <Input placeholder="د. محمد علي" value={form.doctorNameAr}
                onChange={(e) => setForm({ ...form, doctorNameAr: e.target.value })}
                required data-testid="input-doctor-name" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم واتساب *</Label>
              <Input placeholder="201XXXXXXXXX" dir="ltr" value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                required data-testid="input-doctor-whatsapp" />
            </div>
            <div className="space-y-1.5">
              <Label>التخصص</Label>
              <Input placeholder="طب عام، أسنان، أطفال..." value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>موقع العيادة</Label>
              <Input placeholder="وردان - الجيزة" value={form.clinicLocation}
                onChange={(e) => setForm({ ...form, clinicLocation: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full gap-2" disabled={createMutation.isPending} data-testid="button-save-doctor">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                حفظ الطبيب
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : !appointments?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Stethoscope className="h-14 w-14 mx-auto mb-3 opacity-30" />
          <p className="font-medium">لا يوجد أطباء مضافون بعد</p>
          <p className="text-sm mt-1">أضف أول طبيب باستخدام الزر أعلاه</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appt) => (
            <div key={appt.id} className="bg-card rounded-2xl border p-4 flex gap-4" data-testid={`card-doctor-${appt.id}`}>
              <div className="h-12 w-12 rounded-xl bg-[#3DAA82]/10 flex items-center justify-center text-2xl shrink-0">🩺</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold">{appt.doctorNameAr}</p>
                {appt.specialty && <p className="text-sm text-primary">{appt.specialty}</p>}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                  {appt.clinicLocation && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{appt.clinicLocation}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <a href={`https://wa.me/${appt.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-1 h-8 text-xs px-3" data-testid={`button-wa-doctor-${appt.id}`}>
                    <MessageCircle className="h-3.5 w-3.5" />
                    واتساب
                  </Button>
                </a>
                <Button
                  size="sm" variant="ghost"
                  className="text-muted-foreground hover:text-destructive h-8 px-3 text-xs"
                  onClick={() => handleDelete(appt.id)}
                  disabled={deletingId === appt.id}
                  data-testid={`button-delete-doctor-${appt.id}`}
                >
                  {deletingId === appt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Admin Users section ──────────────────────────────────────────────────────

function AdminUsersSection() {
  const { toast } = useToast();
  const [users, setUsers] = useState<{ id: number; email: string; role: string; created_at: string }[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [deletingId, setDeletingId]     = useState<number | null>(null);

  // Invite form
  const [showInvite, setShowInvite]     = useState(false);
  const [inviteEmail, setInviteEmail]   = useState("");
  const [invitePass, setInvitePass]     = useState("");
  const [showInvitePass, setShowInvitePass] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError]   = useState<string | null>(null);

  // Change-password form
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw]               = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [showNewPw, setShowNewPw]       = useState(false);
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwError, setChangePwError]     = useState<string | null>(null);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await apiFetch("/api/admin/users");
      setUsers(data ?? []);
    } catch {
      toast({ title: "حدث خطأ في تحميل المستخدمين", variant: "destructive" });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteLoading(true);
    try {
      await inviteAdmin(inviteEmail, invitePass);
      toast({ title: "✅ تمت إضافة المسؤول بنجاح" });
      setInviteEmail(""); setInvitePass("");
      setShowInvite(false);
      loadUsers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المسؤول؟")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/admin/users/${id}`, "DELETE");
      toast({ title: "تم حذف المسؤول" });
      loadUsers();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "حدث خطأ", variant: "destructive" });
    } finally {
      setDeletingId(null); }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwError(null);
    if (newPw !== confirmPw) { setChangePwError("كلمتا المرور غير متطابقتين"); return; }
    if (newPw.length < 8) { setChangePwError("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
    setChangePwLoading(true);
    try {
      await changeAdminPassword(newPw);
      toast({ title: "✅ تم تغيير كلمة المرور بنجاح" });
      setNewPw(""); setConfirmPw(""); setShowChangePw(false);
    } catch (err) {
      setChangePwError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setChangePwLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">المسؤولون</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowChangePw(!showChangePw)}>
            <KeyRound className="h-4 w-4" />
            {showChangePw ? "إلغاء" : "تغيير كلمة المرور"}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowInvite(!showInvite)} data-testid="button-invite-admin">
            <UserPlus className="h-4 w-4" />
            {showInvite ? "إلغاء" : "إضافة مسؤول"}
          </Button>
        </div>
      </div>

      {/* Change own password */}
      {showChangePw && (
        <div className="bg-card rounded-2xl border p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><KeyRound className="h-4 w-4" /> تغيير كلمة المرور</h3>
          <form onSubmit={handleChangePw} className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <Label>كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  type={showNewPw ? "text" : "password"}
                  placeholder="8 أحرف على الأقل"
                  dir="ltr"
                  className="h-10 pl-10"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required minLength={8}
                  data-testid="input-new-password"
                />
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowNewPw(!showNewPw)}>
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>تأكيد كلمة المرور</Label>
              <Input
                type={showNewPw ? "text" : "password"}
                placeholder="أعد الإدخال"
                dir="ltr"
                className="h-10"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                data-testid="input-confirm-password"
              />
            </div>
            {changePwError && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-3 py-2 border border-destructive/20">
                ⚠️ {changePwError}
              </div>
            )}
            <Button type="submit" className="gap-2" disabled={changePwLoading} data-testid="button-save-password">
              {changePwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              حفظ كلمة المرور
            </Button>
          </form>
        </div>
      )}

      {/* Invite new admin */}
      {showInvite && (
        <div className="bg-card rounded-2xl border p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><UserPlus className="h-4 w-4" /> إضافة مسؤول جديد</h3>
          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email" dir="ltr" placeholder="admin@example.com" className="h-10"
                value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                required data-testid="input-invite-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label>كلمة المرور</Label>
              <div className="relative">
                <Input
                  type={showInvitePass ? "text" : "password"}
                  dir="ltr" placeholder="8 أحرف على الأقل" className="h-10 pl-10"
                  value={invitePass} onChange={(e) => setInvitePass(e.target.value)}
                  required minLength={8} data-testid="input-invite-password"
                />
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowInvitePass(!showInvitePass)}>
                  {showInvitePass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {inviteError && (
              <div className="col-span-full bg-destructive/10 text-destructive text-sm rounded-xl px-3 py-2 border border-destructive/20">
                ⚠️ {inviteError}
              </div>
            )}
            <div className="col-span-full">
              <Button type="submit" className="gap-2" disabled={inviteLoading} data-testid="button-save-invite">
                {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                إضافة المسؤول
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      {usersLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : (
        <div className="bg-card rounded-2xl border overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>لا يوجد مسؤولون</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-right p-3 font-semibold text-muted-foreground">البريد الإلكتروني</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground hidden sm:table-cell">الدور</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground hidden md:table-cell">تاريخ الإضافة</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-admin-${u.id}`}>
                    <td className="p-3 font-mono text-sm">{u.email}</td>
                    <td className="p-3 hidden sm:table-cell">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-xs">{u.role}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs hidden md:table-cell">
                      {new Date(u.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId === u.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        data-testid={`button-delete-admin-${u.id}`}
                      >
                        {deletingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-4 py-3 border-t text-xs text-muted-foreground">
            {users.length} مسؤول مسجل
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 text-sm text-blue-700">
        <strong>ملاحظة أمان:</strong> كلمات المرور مشفرة ومحفوظة في Supabase Auth فقط. لا يمكن لأحد رؤيتها.
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function Admin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) setLocation("/admin/login");
  }, [setLocation]);

  const { data: stats, isLoading: statsLoading } = useGetAdminStats({
    query: { enabled: isAdminLoggedIn(), queryKey: getGetAdminStatsQueryKey(), meta: { headers: authHeaders() } },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getAdminListListingsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: ["admin-listings-pending"] });
  };

  const handleLogout = async () => {
    const token = getAdminToken();
    if (token) {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      await fetch(`${base}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("wardan_admin_token");
    queryClient.clear();
    setLocation("/admin/login");
  };

  if (!isAdminLoggedIn()) return null;

  const pendingCount = stats?.pendingListings ?? 0;

  return (
    <div className="flex h-screen bg-background overflow-hidden" data-testid="text-admin-title">

      {/* ── Sidebar ── */}
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed top-0 right-0 h-full w-64 bg-[#1D2B50] text-white z-50 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}>
          {/* Logo */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img src="/logo.jpeg" alt="Wardan" className="h-10 w-10 rounded-xl object-cover" />
              <div>
                <p className="font-black text-base tracking-wide">WARDAN</p>
                <p className="text-xs text-white/50">لوحة الإدارة</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => { setSection(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  section === item.id
                    ? "bg-[#3DAA82] text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
                data-testid={`nav-${item.id}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === "pending" && pendingCount > 0 && (
                  <span className="mr-auto bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] text-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="p-3 border-t border-white/10 space-y-2">
            <Link href="/">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                <ChevronLeft className="h-4 w-4" />
                العودة للموقع
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </div>
        </aside>
      </>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-bold">{NAV.find((n) => n.id === section)?.label}</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {section === "overview"     && <OverviewSection stats={stats} statsLoading={statsLoading} onGoPending={() => setSection("pending")} />}
            {section === "pending"      && <PendingSection onInvalidate={invalidateAll} />}
            {section === "listings"     && <AllListingsSection onInvalidate={invalidateAll} />}
            {section === "categories"   && <CategoriesSection />}
            {section === "appointments" && <AppointmentsSection />}
            {section === "users"        && <AdminUsersSection />}
          </div>
        </main>
      </div>
    </div>
  );
}
