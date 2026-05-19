import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { Search, SlidersHorizontal, Plus, X, ChevronDown, LayoutGrid, LayoutList } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useListListings } from "@workspace/api-client-react";
import ListingCard from "@/components/ListingCard";

const CATEGORIES: Record<string, { nameAr: string; emoji: string; gradient: string; description: string }> = {
  "real-estate":    { nameAr: "عقارات",        emoji: "🏠", gradient: "from-[#E85530] to-[#C94420]",  description: "شقق، فلل، أراضي، محلات تجارية" },
  "livestock":      { nameAr: "مواشي",         emoji: "🐄", gradient: "from-[#F5A020] to-[#D98810]",  description: "أبقار، أغنام، ماعز، إبل وغيرها" },
  "birds":          { nameAr: "طيور",          emoji: "🦜", gradient: "from-[#4A91C8] to-[#3578B0]",  description: "طيور زينة، حمام، دواجن وغيرها" },
  "vegetables":     { nameAr: "خضروات",        emoji: "🥦", gradient: "from-[#3DAA82] to-[#2A8F6A]",  description: "خضروات وفواكه طازجة" },
  "clothes":        { nameAr: "ملابس",         emoji: "👗", gradient: "from-pink-500 to-pink-700",     description: "ملابس رجالية ونسائية وأطفال" },
  "home-appliances":{ nameAr: "أجهزة منزلية", emoji: "📺", gradient: "from-[#4A91C8] to-[#2B6FAA]",  description: "أجهزة كهربائية ومنزلية" },
  "doctors":        { nameAr: "مواعيد طبية",  emoji: "🩺", gradient: "from-[#3DAA82] to-[#2A8F6A]",  description: "أطباء متخصصون في مختلف المجالات" },
};

const SORT_OPTIONS = [
  { value: "newest",     label: "الأحدث أولاً" },
  { value: "oldest",     label: "الأقدم أولاً" },
  { value: "price_asc",  label: "السعر: الأقل" },
  { value: "price_desc", label: "السعر: الأعلى" },
];

const EGYPT_CITIES = [
  "الكل", "وردان", "منوف", "شبين الكوم", "المنوفية", "بركة السبع",
  "أشمون", "السادات", "القاهرة", "الإسكندرية", "الجيزة",
  "طنطا", "المنصورة", "الزقازيق", "دمياط",
];

function CardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const cat = CATEGORIES[slug ?? ""];

  const [searchInput, setSearchInput]   = useState("");
  const [searchQuery, setSearchQuery]   = useState("");
  const [sort, setSort]                 = useState("newest");
  const [city, setCity]                 = useState("الكل");
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [viewMode, setViewMode]         = useState<"grid" | "list">("grid");

  // Debounced live search
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setSort("newest");
    setCity("الكل");
  }, []);

  const hasFilters = searchQuery || sort !== "newest" || city !== "الكل";

  const { data: result, isLoading } = useListListings(
    { category: slug, search: searchQuery || undefined, limit: 60 },
    { query: { queryKey: ["listings", slug, searchQuery] } }
  );

  // Client-side sort + city filter
  let listings = result?.listings ?? [];

  if (city !== "الكل") {
    listings = listings.filter((l) => {
      const loc = [l.city, l.location].filter(Boolean).join(" ");
      return loc.includes(city);
    });
  }

  if (sort === "oldest") {
    listings = [...listings].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sort === "price_asc") {
    listings = [...listings].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  } else if (sort === "price_desc") {
    listings = [...listings].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  }

  const total = result?.total ?? 0;
  const nameAr = cat?.nameAr ?? slug ?? "";

  return (
    <div>
      {/* ── Category Hero ─────────────────────────── */}
      <div className={`bg-gradient-to-l ${cat?.gradient ?? "from-primary to-primary/70"} text-white`}>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center gap-4">
            <div className="text-6xl drop-shadow">{cat?.emoji ?? "📋"}</div>
            <div>
              <h1 className="text-3xl font-black mb-1" data-testid="text-category-title">
                {nameAr}
              </h1>
              <p className="text-white/80 text-sm">{cat?.description ?? ""}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── Sticky Filter Bar ─────────────────────── */}
        <div className="sticky top-[5.5rem] z-30 bg-background/95 backdrop-blur border-b mb-6 pb-4 -mx-4 px-4">

          {/* Search row */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder={`ابحث في ${nameAr}...`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pr-10 h-11"
                data-testid="input-category-search"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={() => setFiltersOpen(!filtersOpen)}
              data-testid="button-toggle-filters"
            >
              <SlidersHorizontal className={`h-4 w-4 ${filtersOpen ? "text-primary" : ""}`} />
            </Button>
            <div className="hidden sm:flex gap-1 border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="button-view-grid"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="button-view-list"
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Expanded filters */}
          {filtersOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 p-3 bg-muted/40 rounded-xl border">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">ترتيب النتائج</label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-10" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">المحافظة</label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-10" data-testid="select-city-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {EGYPT_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Stats + active chips row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                {isLoading ? "جاري التحميل..." : `${listings.length} إعلان`}
                {!isLoading && total > listings.length && ` (من ${total})`}
              </span>

              {/* Active filter chips */}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
                  بحث: {searchQuery}
                  <button onClick={() => { setSearchInput(""); setSearchQuery(""); }} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {city !== "الكل" && (
                <span className="inline-flex items-center gap-1 bg-[#E85530]/10 text-[#E85530] text-xs px-2.5 py-1 rounded-full">
                  📍 {city}
                  <button onClick={() => setCity("الكل")} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {sort !== "newest" && (
                <span className="inline-flex items-center gap-1 bg-[#F5A020]/10 text-[#F5A020] text-xs px-2.5 py-1 rounded-full">
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  <button onClick={() => setSort("newest")} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                  مسح الكل
                </button>
              )}
            </div>
            <Link href="/add-listing">
              <Button size="sm" className="gap-1.5 h-8 text-xs" data-testid="button-add-listing-cat">
                <Plus className="h-3.5 w-3.5" />
                أضف إعلان
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Listings ──────────────────────────────── */}
        {isLoading ? (
          <div className={
            viewMode === "list"
              ? "grid grid-cols-1 gap-4"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          }>
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : listings.length > 0 ? (
          <div className={
            viewMode === "list"
              ? "grid grid-cols-1 gap-4"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          }>
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{
                  ...listing,
                  price: listing.price ?? null,
                  descriptionAr: listing.descriptionAr ?? null,
                  categoryNameAr: listing.categoryNameAr ?? null,
                  priceUnit: listing.priceUnit ?? null,
                  city: (listing as { city?: string | null }).city ?? null,
                  location: listing.location ?? null,
                  phoneNumber: (listing as { phoneNumber?: string | null }).phoneNumber ?? null,
                  sellerName: listing.sellerName ?? null,
                  imageUrl: listing.imageUrl ?? null,
                  imageUrls: (listing as { imageUrls?: string[] }).imageUrls ?? [],
                }}
              />
            ))}
          </div>
        ) : (
          /* ── Empty State ── */
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
              <span className="text-5xl">{cat?.emoji ?? "📋"}</span>
            </div>
            <h2 className="text-xl font-bold mb-2">
              {hasFilters ? "لا توجد نتائج" : `لا توجد إعلانات في ${nameAr} بعد`}
            </h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
              {hasFilters
                ? "جرّب تغيير معايير البحث أو المسح ومحاولة مرة أخرى"
                : "كن أول من يضيف إعلاناً في هذا التصنيف"}
            </p>
            <div className="flex gap-3 justify-center">
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters-empty">
                  مسح الفلاتر
                </Button>
              )}
              <Link href="/add-listing">
                <Button className="gap-2" data-testid="button-empty-category-add">
                  <Plus className="h-4 w-4" />
                  أضف أول إعلان
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ── Load more hint ────────────────────────── */}
        {!isLoading && listings.length >= 60 && (
          <div className="text-center mt-10 text-sm text-muted-foreground">
            يتم عرض أول 60 إعلاناً · استخدم البحث لتضييق النتائج
          </div>
        )}
      </div>
    </div>
  );
}
