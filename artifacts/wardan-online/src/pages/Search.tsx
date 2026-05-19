import { useState } from "react";
import { Search as SearchIcon, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSearchListings, getSearchListingsQueryKey } from "@workspace/api-client-react";
import ListingCard from "@/components/ListingCard";

const EGYPT_GOVERNORATES = [
  "الكل",
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر",
  "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية",
  "المنيا", "القليوبية", "الوادي الجديد", "السويس", "أسوان",
  "أسيوط", "بني سويف", "بورسعيد", "دمياط", "الشرقية",
  "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر", "قنا",
  "شمال سيناء", "سوهاج",
];

export default function Search() {
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState("الكل");

  const { data: results, isLoading } = useSearchListings(
    { q: query, city: city !== "الكل" ? city : undefined },
    { query: { enabled: !!query, queryKey: getSearchListingsQueryKey({ q: query, city: city !== "الكل" ? city : undefined }) } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput.trim());
      window.history.replaceState({}, "", `?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const filteredResults = results ?? [];

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
        <Select value={city} onValueChange={setCity}>
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
            onClick={() => setCity("الكل")}
            className="inline-flex items-center gap-1 bg-[#E85530]/10 text-[#E85530] text-xs px-2.5 py-1.5 rounded-full hover:opacity-80"
            data-testid="button-clear-city-filter"
          >
            📍 {city}
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {query && (
        <p className="text-muted-foreground mb-6" data-testid="text-search-query">
          {isLoading
            ? "جاري البحث..."
            : `${filteredResults.length} نتيجة لـ "${query}"${city !== "الكل" ? ` في ${city}` : ""}`
          }
        </p>
      )}

      {!query ? (
        <div className="text-center py-20 text-muted-foreground">
          <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-xl">اكتب ما تبحث عنه للبدء</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResults.map((listing) => (
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
          <p className="text-sm">جرب كلمات بحث مختلفة{city !== "الكل" ? " أو اختر محافظة مختلفة" : ""}</p>
        </div>
      )}
    </div>
  );
}
