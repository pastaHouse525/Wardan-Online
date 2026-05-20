import { useState, useEffect, useRef, useCallback } from "react";
import { Search as SearchIcon, Tag, X, MapPin, SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useListListings, useListCategories } from "@workspace/api-client-react";
import ListingCard from "@/components/ListingCard";
import { EGYPT_GOVERNORATES } from "@/lib/governorates";

/* ── URL helpers ─────────────────────────────────────────────────── */
function readParam(key: string, fallback = "") {
  return new URLSearchParams(window.location.search).get(key) ?? fallback;
}
function syncUrl(filters: Record<string, string>) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
  const qs = p.toString();
  window.history.replaceState({}, "", qs ? `?${qs}` : window.location.pathname);
}

/* ── Debounce hook ───────────────────────────────────────────────── */
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Category emoji map ──────────────────────────────────────────── */
const CAT_EMOJI: Record<string, string> = {
  "real-estate":    "🏠",
  "livestock":      "🐄",
  "birds":          "🦜",
  "vegetables":     "🥦",
  "clothes":        "👗",
  "home-appliances":"📺",
  "doctors":        "🩺",
};

/* ── Active filter chip ──────────────────────────────────────────── */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-primary/60 transition-colors" aria-label="حذف">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function Search() {
  /* ── State ── */
  const [searchInput, setSearchInput]   = useState(() => readParam("q"));
  const [category,    setCategory]      = useState(() => readParam("cat"));
  const [city,        setCity]          = useState(() => {
    const c = readParam("city");
    return EGYPT_GOVERNORATES.includes(c) ? c : "";
  });
  const [priceMin,    setPriceMin]      = useState(() => readParam("min"));
  const [priceMax,    setPriceMax]      = useState(() => readParam("max"));
  const [sortBy,      setSortBy]        = useState<string>(() => readParam("sort", "newest"));
  const [filtersOpen, setFiltersOpen]   = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);

  const { data: categoriesData } = useListCategories();
  const categories = categoriesData ?? [];

  /* ── Sync URL whenever any filter changes ── */
  useEffect(() => {
    syncUrl({
      q:    debouncedSearch,
      cat:  category,
      city: city,
      min:  priceMin,
      max:  priceMax,
      sort: sortBy !== "newest" ? sortBy : "",
    });
  }, [debouncedSearch, category, city, priceMin, priceMax, sortBy]);

  /* ── Query params ── */
  const hasFilter = !!(debouncedSearch || category || city || priceMin || priceMax);

  const queryParams = {
    search:   debouncedSearch || undefined,
    category: category        || undefined,
    limit:    60,
    sortBy:   sortBy as "newest" | "oldest" | "price_asc" | "price_desc",
    ...(city     ? { city }                        : {}),
    ...(priceMin ? { priceMin: Number(priceMin) }  : {}),
    ...(priceMax ? { priceMax: Number(priceMax) }  : {}),
  };

  const { data: result, isLoading, isFetching } = useListListings(
    queryParams,
    {
      query: {
        enabled: hasFilter,
        queryKey: ["search-listings", debouncedSearch, category, city, priceMin, priceMax, sortBy],
      },
    }
  );

  const listings = result?.listings ?? [];
  const total    = result?.total    ?? 0;

  /* ── Clear helpers ── */
  const clearAll = useCallback(() => {
    setSearchInput(""); setCategory(""); setCity("");
    setPriceMin("");    setPriceMax(""); setSortBy("newest");
  }, []);

  const activeFilters = [
    category && { key: "category", label: categories.find(c => c.slug === category)?.nameAr ?? category, clear: () => setCategory("") },
    city     && { key: "city",     label: city,                                                           clear: () => setCity("") },
    priceMin && { key: "min",      label: `من ${Number(priceMin).toLocaleString("ar-EG")} جنيه`,         clear: () => setPriceMin("") },
    priceMax && { key: "max",      label: `حتى ${Number(priceMax).toLocaleString("ar-EG")} جنيه`,        clear: () => setPriceMax("") },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  /* ── Result label ── */
  const resultLabel = (() => {
    if (isLoading) return "جاري البحث…";
    const n = total.toLocaleString("ar-EG");
    if (debouncedSearch) return `${n} نتيجة لـ "${debouncedSearch}"`;
    return `${n} إعلان`;
  })();

  /* ── Sort options ── */
  const sortOptions = [
    { value: "newest",     label: "الأحدث أولاً" },
    { value: "oldest",     label: "الأقدم أولاً" },
    { value: "price_asc",  label: "السعر: من الأقل" },
    { value: "price_desc", label: "السعر: من الأعلى" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-5" data-testid="text-search-title">البحث في الإعلانات</h1>

      {/* ── Search bar ── */}
      <div className="relative mb-4">
        <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="ابحث عن عقارات، مواشي، طيور، ملابس…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-13 pr-12 pl-4 text-base rounded-xl border-2 focus:border-primary/50"
          data-testid="input-search-page"
          autoFocus
        />
        {searchInput && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchInput("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isFetching && hasFilter && (
          <span className="absolute left-10 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        )}
      </div>

      {/* ── Category pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          onClick={() => setCategory("")}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            !category
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          }`}
          data-testid="btn-cat-all"
        >
          الكل
        </button>
        {categories.map(cat => (
          <button
            key={cat.slug}
            onClick={() => setCategory(prev => prev === cat.slug ? "" : cat.slug)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              category === cat.slug
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
            data-testid={`btn-cat-${cat.slug}`}
          >
            <span>{CAT_EMOJI[cat.slug] ?? "📋"}</span>
            {cat.nameAr}
          </button>
        ))}
      </div>

      {/* ── Advanced filters toggle row ── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 ${filtersOpen ? "border-primary/50 text-primary" : ""}`}
          onClick={() => setFiltersOpen(o => !o)}
          data-testid="btn-toggle-filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          فلاتر متقدمة
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </Button>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-9 w-48 text-sm gap-1" data-testid="select-sort">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilters.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 mr-auto"
            data-testid="btn-clear-all"
          >
            مسح الكل
          </button>
        )}
      </div>

      {/* ── Advanced filters panel ── */}
      {filtersOpen && (
        <div className="bg-muted/40 border rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* City */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">المحافظة</label>
            <Select value={city || "__all__"} onValueChange={v => setCity(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-10" data-testid="select-city">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
                <SelectValue placeholder="كل المحافظات" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="__all__">كل المحافظات</SelectItem>
                {EGYPT_GOVERNORATES.slice(1).map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price min */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">السعر من (جنيه)</label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={priceMin}
              onChange={e => setPriceMin(e.target.value)}
              className="h-10"
              data-testid="input-price-min"
            />
          </div>

          {/* Price max */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">السعر حتى (جنيه)</label>
            <Input
              type="number"
              min={0}
              placeholder="غير محدود"
              value={priceMax}
              onChange={e => setPriceMax(e.target.value)}
              className="h-10"
              data-testid="input-price-max"
            />
          </div>
        </div>
      )}

      {/* ── Active filter chips ── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map(f => (
            <FilterChip key={f.key} label={f.label} onRemove={f.clear} />
          ))}
        </div>
      )}

      {/* ── Result count ── */}
      {hasFilter && (
        <p className="text-sm text-muted-foreground mb-4" data-testid="text-search-query">
          {resultLabel}
        </p>
      )}

      {/* ── Results ── */}
      {!hasFilter ? (
        <div className="text-center py-20 text-muted-foreground">
          <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-xl font-medium mb-2">ابدأ بحثك</p>
          <p className="text-sm">اكتب كلمة في مربع البحث أو اختر تصنيفاً من الأعلى</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={{
                  ...listing,
                  price:         listing.price         ?? null,
                  descriptionAr: listing.descriptionAr ?? null,
                  categoryNameAr:listing.categoryNameAr?? null,
                  priceUnit:     listing.priceUnit      ?? null,
                  city:          (listing as unknown as { city?: string | null }).city ?? null,
                  location:      listing.location       ?? null,
                  sellerName:    listing.sellerName      ?? null,
                  imageUrl:      listing.imageUrl        ?? null,
                  featured:      listing.featured        ?? false,
                }}
              />
            ))}
          </div>
          {total > listings.length && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              عرض {listings.length} من أصل {total.toLocaleString("ar-EG")} إعلان
            </p>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Tag className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-xl font-medium mb-2">لا توجد نتائج</p>
          <p className="text-sm mb-6">
            {debouncedSearch
              ? `لا توجد إعلانات تطابق "${debouncedSearch}"`
              : "جرب تغيير الفلاتر المحددة"}
          </p>
          <Button variant="outline" size="sm" onClick={clearAll}>مسح الفلاتر</Button>
        </div>
      )}
    </div>
  );
}
