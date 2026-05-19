import { useState } from "react";
import { useParams } from "wouter";
import { Search, Tag, Plus } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListListings, useListCategories } from "@workspace/api-client-react";
import ListingCard from "@/components/ListingCard";

const categoryNamesAr: Record<string, string> = {
  "real-estate": "عقارات",
  "livestock": "مواشي",
  "birds": "طيور",
  "vegetables": "خضروات",
  "clothes": "ملابس",
  "home-appliances": "أجهزة منزلية",
  "doctors": "مواعيد طبية",
};

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: result, isLoading } = useListListings(
    { category: slug, search: search || undefined, limit: 50 },
    { query: { queryKey: ["listings", slug, search] } }
  );

  const categoryName = categoryNamesAr[slug ?? ""] ?? slug ?? "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const listings = result?.listings ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-category-title">{categoryName}</h1>
        <p className="text-muted-foreground">
          {isLoading ? "..." : `${result?.total ?? 0} إعلان في هذا التصنيف`}
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-md">
        <Input
          type="search"
          placeholder={`ابحث في ${categoryName}...`}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          data-testid="input-category-search"
        />
        <Button type="submit" className="gap-2" data-testid="button-category-search">
          <Search className="h-4 w-4" />
          بحث
        </Button>
        {search && (
          <Button type="button" variant="ghost" onClick={() => { setSearch(""); setSearchInput(""); }}>
            مسح
          </Button>
        )}
      </form>

      {/* Listings Grid */}
      {isLoading ? (
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
            }} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Tag className="h-14 w-14 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-medium mb-2">لا توجد إعلانات</p>
          <p className="text-sm mb-6">
            {search ? `لا توجد نتائج لـ "${search}"` : `لا توجد إعلانات في ${categoryName} بعد`}
          </p>
          <Link href="/add-listing">
            <Button className="gap-2" data-testid="button-empty-category-add">
              <Plus className="h-4 w-4" />
              أضف أول إعلان
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
