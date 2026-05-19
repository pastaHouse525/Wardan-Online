import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchListings, getSearchListingsQueryKey } from "@workspace/api-client-react";
import ListingCard from "@/components/ListingCard";

export default function Search() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);

  const { data: results, isLoading } = useSearchListings(
    { q: query },
    { query: { enabled: !!query, queryKey: getSearchListingsQueryKey({ q: query }) } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput.trim());
      window.history.replaceState({}, "", `?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6" data-testid="text-search-title">نتائج البحث</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl">
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

      {query && (
        <p className="text-muted-foreground mb-6" data-testid="text-search-query">
          {isLoading
            ? "جاري البحث..."
            : `${results?.length ?? 0} نتيجة لـ "${query}"`
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
      ) : results && results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((listing) => (
            <ListingCard key={listing.id} listing={{
              ...listing,
              price: listing.price ?? null,
              descriptionAr: listing.descriptionAr ?? null,
              categoryNameAr: listing.categoryNameAr ?? null,
              priceUnit: listing.priceUnit ?? null,
              location: listing.location ?? null,
              sellerName: listing.sellerName ?? null,
              imageUrl: listing.imageUrl ?? null,
            }} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Tag className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-medium mb-2">لا توجد نتائج</p>
          <p className="text-sm">جرب كلمات بحث مختلفة</p>
        </div>
      )}
    </div>
  );
}
