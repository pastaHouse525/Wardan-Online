import { useState } from "react";
import { Search as SearchIcon, Tag, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useListListings } from "@workspace/api-client-react";
import ListingCard from "@/components/ListingCard";
import { EGYPT_GOVERNORATES } from "@/lib/governorates";

export default function Search() {
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") ?? "";
  const initialCity = (() => {
    const c = params.get("city");
    return c && EGYPT_GOVERNORATES.includes(c) ? c : "الكل";
  })();

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);

  const hasFilter = !!query || city !== "الكل";

  const { data: result, isLoading } = useListListings(
    {
      search: query || undefined,
      city: city !== "الكل" ? city : undefined,
      limit: 60,
    },
    {
      query: {
        enabled: hasFilter,
        queryKey: ["search-listings", query, city],
      },
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    setQuery(trimmed);
    const urlParams = new URLSearchParams();
    if (trimmed) urlParams.set("q", trimmed);
    if (city !== "الكل") urlParams.set("city", city);
    const search = urlParams.toString();
    window.history.replaceState({}, "", search ? `?${search}` : window.location.pathname);
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    const urlParams = new URLSearchParams();
    if (query) urlParams.set("q", query);
    if (newCity !== "الكل") urlParams.set("city", newCity);
    const search = urlParams.toString();
    window.history.replaceState({}, "", search ? `?${search}` : window.location.pathname);
  };

  const listings = result?.listings ?? [];
  const total = result?.total ?? 0;

  const resultLabel = (() => {
    if (isLoading) return "جاري البحث...";
    const count = `${listings.length} إعلان`;
    if (query && city !== "الكل") return `${count} لـ "${query}" في ${city}`;
    if (query) return `${count} لـ "${query}"`;
    if (city !== "الكل") return `${count} في ${city}`;
    return count;
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6" data-testid="text-search-title">نتائج البحث</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4 max-w-xl">
        <Input
          type="search"
          placeholder="ابحث عن إعلانات..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 h-12"
          data-testid="input-search-page"
        />
        <Button type="submit" className="h-12 px-6 gap-2" data-testid="button-search-page">
          <SearchIcon className="h-4 w-4" />
          بحث
        </Button>
      </form>

      {/* Governorate filter */}
      <div className="flex items-center gap-3 mb-6 max-w-xl">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">تصفية بالمحافظة:</label>
        <Select value={city} onValueChange={handleCityChange}>
          <SelectTrigger className="h-10 flex-1" data-testid="select-search-city-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {EGYPT_GOVERNORATES.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {city !== "الكل" && (
          <button
            onClick={() => handleCityChange("الكل")}
            className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1.5 rounded-full hover:opacity-80"
            data-testid="button-clear-city-filter"
          >
            <MapPin className="h-3 w-3" />
            {city}
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {hasFilter && (
        <p className="text-muted-foreground mb-6" data-testid="text-search-query">
          {resultLabel}
          {!isLoading && total > listings.length && ` (من ${total})`}
        </p>
      )}

      {!hasFilter ? (
        <div className="text-center py-20 text-muted-foreground">
          <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-xl">اكتب ما تبحث عنه أو اختر محافظة للبدء</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={{
              ...listing,
              price: listing.price ?? null,
              descriptionAr: listing.descriptionAr ?? null,
              categoryNameAr: listing.categoryNameAr ?? null,
              priceUnit: listing.priceUnit ?? null,
              location: listing.location ?? null,
              sellerName: listing.sellerName ?? null,
              imageUrl: listing.imageUrl ?? null,
              featured: listing.featured ?? false,
            }} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Tag className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-medium mb-2">لا توجد نتائج</p>
          <p className="text-sm">
            {query && city !== "الكل"
              ? `لا توجد إعلانات لـ "${query}" في ${city}`
              : query
              ? "جرب كلمات بحث مختلفة"
              : `لا توجد إعلانات في ${city} بعد`}
          </p>
        </div>
      )}
    </div>
  );
}
