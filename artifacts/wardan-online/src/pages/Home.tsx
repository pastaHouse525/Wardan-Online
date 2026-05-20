import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Search, ShoppingBag, Wrench, Plus, Star, ArrowLeft,
  Home as HomeIcon, Beef, Bird, Leaf, Shirt, Tv,
  UtensilsCrossed, BookOpen, Store, Briefcase, Truck, GraduationCap, Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useListCategories, useListFeaturedListings } from "@workspace/api-client-react";
import ListingCard from "@/components/ListingCard";

const MARKETPLACE_META: Record<string, { icon: React.ReactNode; gradient: string; emoji: string }> = {
  "real-estate":     { icon: <HomeIcon className="h-7 w-7" />, gradient: "from-orange-500 to-red-600",    emoji: "🏠" },
  "livestock":       { icon: <Beef className="h-7 w-7" />,     gradient: "from-amber-500 to-orange-600",  emoji: "🐄" },
  "birds":           { icon: <Bird className="h-7 w-7" />,     gradient: "from-sky-500 to-blue-600",      emoji: "🦜" },
  "vegetables":      { icon: <Leaf className="h-7 w-7" />,     gradient: "from-emerald-500 to-green-700", emoji: "🥦" },
  "clothes":         { icon: <Shirt className="h-7 w-7" />,    gradient: "from-pink-500 to-rose-600",     emoji: "👗" },
  "home-appliances": { icon: <Tv className="h-7 w-7" />,       gradient: "from-violet-500 to-purple-700", emoji: "📺" },
};

const SERVICES_META: Record<string, { icon: React.ReactNode; gradient: string; emoji: string; sub?: string }> = {
  "technicians":    { icon: <Wrench className="h-7 w-7" />,           gradient: "from-teal-500 to-cyan-700",    emoji: "🔧", sub: "كهربائيون، سباكون، نجارون" },
  "restaurants":    { icon: <UtensilsCrossed className="h-7 w-7" />,  gradient: "from-orange-400 to-amber-600", emoji: "🍽️" },
  "quran-teachers": { icon: <BookOpen className="h-7 w-7" />,         gradient: "from-green-600 to-emerald-800",emoji: "📖" },
  "local-shops":    { icon: <Store className="h-7 w-7" />,            gradient: "from-indigo-500 to-blue-700",  emoji: "🏪" },
  "job-vacancies":  { icon: <Briefcase className="h-7 w-7" />,        gradient: "from-slate-500 to-gray-700",   emoji: "💼" },
  "transportation": { icon: <Truck className="h-7 w-7" />,            gradient: "from-yellow-500 to-orange-600",emoji: "🚛" },
  "education":      { icon: <GraduationCap className="h-7 w-7" />,    gradient: "from-blue-500 to-indigo-700",  emoji: "📚" },
  "doctors":        { icon: <Stethoscope className="h-7 w-7" />,      gradient: "from-rose-500 to-pink-700",    emoji: "🩺" },
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const { data: categories, isLoading: catsLoading } = useListCategories();
  const { data: featured, isLoading: featuredLoading } = useListFeaturedListings();

  const marketplaceCats = (categories ?? []).filter((c) => c.section === "marketplace");
  const servicesCats    = (categories ?? []).filter((c) => c.section === "services");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-primary via-primary to-green-900 text-primary-foreground">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
          <div className="absolute top-6 right-10 text-8xl">🛒</div>
          <div className="absolute bottom-4 left-10 text-7xl">🔧</div>
          <div className="absolute top-10 left-1/3 text-6xl">🏠</div>
        </div>
        <div className="relative max-w-3xl mx-auto text-center py-16 px-4">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
            سوق وردان الإلكتروني الشامل
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight" data-testid="text-hero-title">
            بيع، اشتر، وابحث عن الخدمات
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-8">
            سوق بيع وشراء + دليل خدمات في منطقة وردان — كل شيء في مكان واحد
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50 pointer-events-none" />
              <Input
                type="search"
                placeholder="ابحث عن إعلانات وخدمات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-12 text-base bg-white text-foreground placeholder:text-muted-foreground border-0 pr-10"
                data-testid="input-hero-search"
              />
            </div>
            <Button type="submit" variant="secondary" className="h-12 px-6 gap-2 font-bold shrink-0" data-testid="button-hero-search">
              <Search className="h-4 w-4" />
              بحث
            </Button>
          </form>
        </div>
      </section>

      {/* ── Marketplace Section ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground" data-testid="text-marketplace-heading">سوق البيع والشراء</h2>
              <p className="text-sm text-muted-foreground">عقارات، مواشي، طيور، ملابس وأكثر</p>
            </div>
          </div>
          <Link href="/search?section=marketplace">
            <Button variant="ghost" size="sm" className="gap-2 text-primary font-semibold">
              كل الإعلانات
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {catsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {marketplaceCats.map((cat) => {
              const meta = MARKETPLACE_META[cat.slug];
              return (
                <Link key={cat.slug} href={`/category/${cat.slug}`} data-testid={`card-category-${cat.slug}`}>
                  <div className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${meta?.gradient ?? "from-primary to-primary/70"} hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer h-36 flex flex-col justify-between group`}>
                    <div className="opacity-90 group-hover:scale-110 transition-transform">{meta?.icon}</div>
                    <div>
                      <p className="font-black text-sm leading-tight">{cat.nameAr}</p>
                      <p className="text-xs text-white/75 mt-0.5 font-medium">{cat.listingCount} إعلان</p>
                    </div>
                    <div className="absolute top-3 left-3 text-2xl opacity-20 select-none">{meta?.emoji}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Services Section ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pt-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 text-white">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground" data-testid="text-services-heading">دليل الخدمات</h2>
              <p className="text-sm text-muted-foreground">فنيون، مطاعم، تعليم، نقل وأكثر</p>
            </div>
          </div>
          <Link href="/search?section=services">
            <Button variant="ghost" size="sm" className="gap-2 text-teal-700 font-semibold">
              كل الخدمات
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {catsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {servicesCats.map((cat) => {
              const meta = SERVICES_META[cat.slug];
              const href = cat.slug === "doctors" ? "/doctors" : `/category/${cat.slug}`;
              return (
                <Link key={cat.slug} href={href} data-testid={`card-category-${cat.slug}`}>
                  <div className={`relative overflow-hidden rounded-2xl p-4 text-white bg-gradient-to-br ${meta?.gradient ?? "from-teal-500 to-teal-700"} hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer h-32 flex flex-col justify-between group`}>
                    <div className="flex items-start justify-between">
                      <div className="opacity-90 group-hover:scale-110 transition-transform">{meta?.icon}</div>
                      <span className="text-2xl opacity-20 select-none">{meta?.emoji}</span>
                    </div>
                    <div>
                      <p className="font-black text-sm leading-tight">{cat.nameAr}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-white/75 font-medium">{cat.listingCount} إعلان</p>
                        {meta?.sub && <p className="text-xs text-white/50 hidden sm:block truncate">{meta.sub}</p>}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Latest Listings ───────────────────────────────────────── */}
      <section className="bg-muted/40 border-t border-b py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-foreground" data-testid="text-featured-heading">أحدث الإعلانات</h2>
              <p className="text-sm text-muted-foreground mt-0.5">إعلانات حديثة من البيع والشراء والخدمات</p>
            </div>
            <Link href="/search">
              <Button variant="ghost" size="sm" className="gap-2 text-primary font-semibold" data-testid="button-view-all">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={{
                  ...listing,
                  price: listing.price ?? null,
                  descriptionAr: listing.descriptionAr ?? null,
                  categoryNameAr: listing.categoryNameAr ?? null,
                  priceUnit: listing.priceUnit ?? null,
                  city: (listing as { city?: string | null }).city ?? null,
                  location: listing.location ?? null,
                  sellerName: listing.sellerName ?? null,
                  imageUrl: listing.imageUrl ?? null,
                  featured: listing.featured ?? false,
                  categorySection: (listing as { categorySection?: string | null }).categorySection ?? null,
                  workingHours: (listing as { workingHours?: string | null }).workingHours ?? null,
                }} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-lg font-medium mb-2">لا توجد إعلانات بعد</p>
              <p className="text-sm mb-6">كن أول من يضيف إعلاناً في وردان أونلاين</p>
              <Link href="/add-listing">
                <Button className="gap-2" data-testid="button-empty-add">
                  <Plus className="h-4 w-4" />
                  أضف أول إعلان
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Dual CTA ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Marketplace CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-bl from-primary to-green-900 text-primary-foreground p-8">
            <div className="absolute top-4 left-4 text-7xl opacity-10 select-none">🛒</div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="h-5 w-5" />
                <span className="font-bold text-sm uppercase tracking-wide opacity-80">بيع وشراء</span>
              </div>
              <h3 className="text-2xl font-black mb-2">أضف إعلان بيع</h3>
              <p className="text-sm text-primary-foreground/75 mb-5">
                أضف منتجاتك مجاناً وتواصل مع المشترين عبر واتساب مباشرة
              </p>
              <Link href="/add-listing">
                <Button variant="secondary" className="gap-2 font-bold" data-testid="button-cta-add">
                  <Plus className="h-4 w-4" />
                  أضف إعلانك الآن
                </Button>
              </Link>
            </div>
          </div>

          {/* Services CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-bl from-teal-600 to-cyan-900 text-white p-8">
            <div className="absolute top-4 left-4 text-7xl opacity-10 select-none">🔧</div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="h-5 w-5" />
                <span className="font-bold text-sm uppercase tracking-wide opacity-80">خدمات</span>
              </div>
              <h3 className="text-2xl font-black mb-2">سجّل خدمتك</h3>
              <p className="text-sm text-white/75 mb-5">
                سجّل نشاطك التجاري أو خدمتك المهنية ليجدك العملاء بسهولة
              </p>
              <Link href="/add-listing">
                <Button className="gap-2 font-bold bg-white text-teal-800 hover:bg-white/90" data-testid="button-cta-service">
                  <Plus className="h-4 w-4" />
                  سجّل خدمتك مجاناً
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
