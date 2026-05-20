import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Home as HomeIcon, Beef, Bird, Leaf, Shirt, Tv, Stethoscope, Plus, Tag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useListCategories, useListFeaturedListings } from "@workspace/api-client-react";
import ListingCard from "@/components/ListingCard";

const categoryIcons: Record<string, React.ReactNode> = {
  "real-estate": <HomeIcon className="h-8 w-8" />,
  "livestock": <Beef className="h-8 w-8" />,
  "birds": <Bird className="h-8 w-8" />,
  "vegetables": <Leaf className="h-8 w-8" />,
  "clothes": <Shirt className="h-8 w-8" />,
  "home-appliances": <Tv className="h-8 w-8" />,
  "doctors": <Stethoscope className="h-8 w-8" />,
};

const categoryGradients: Record<string, string> = {
  "real-estate":    "from-[#E85530] to-[#C94420]",
  "livestock":      "from-[#F5A020] to-[#D98810]",
  "birds":          "from-[#4A91C8] to-[#3578B0]",
  "vegetables":     "from-[#3DAA82] to-[#2A8F6A]",
  "clothes":        "from-[#E85580] to-[#C94068]",
  "home-appliances":"from-[#4A91C8] to-[#2B6FAA]",
  "doctors":        "from-[#3DAA82] to-[#2A8F6A]",
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const { data: categories, isLoading: categoriesLoading } = useListCategories();
  const { data: featured, isLoading: featuredLoading } = useListFeaturedListings();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" data-testid="text-hero-title">
            سوقك الإلكتروني الشامل
          </h1>
          <p className="text-xl text-primary-foreground/80 mb-8">
            ابحث عن العقارات والمواشي والطيور وغيرها في مكان واحد
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <Input
              type="search"
              placeholder="ابحث عن ما تريد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-12 text-lg bg-white text-foreground placeholder:text-muted-foreground border-0"
              data-testid="input-hero-search"
            />
            <Button type="submit" variant="secondary" className="h-12 px-6 gap-2" data-testid="button-hero-search">
              <Search className="h-5 w-5" />
              بحث
            </Button>
          </form>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-categories-heading">التصنيفات</h2>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {(categories ?? []).map((cat) => (
              <Link
                key={cat.slug}
                href={cat.slug === "doctors" ? "/doctors" : `/category/${cat.slug}`}
                data-testid={`card-category-${cat.slug}`}
              >
                <div className={`relative overflow-hidden rounded-xl p-5 text-white bg-gradient-to-br ${categoryGradients[cat.slug] ?? "from-gray-500 to-gray-700"} hover:shadow-lg hover:scale-105 transition-all cursor-pointer h-32 flex flex-col justify-between`}>
                  <div className="opacity-90">{categoryIcons[cat.slug] ?? <Tag className="h-8 w-8" />}</div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{cat.nameAr}</p>
                    <p className="text-xs text-white/80 mt-0.5">{cat.listingCount} إعلان</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-featured-heading">أحدث الإعلانات</h2>
          <Link href="/category/real-estate">
            <Button variant="ghost" className="gap-2 text-primary" data-testid="button-view-all">
              عرض الكل
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
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
              }} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg">لا توجد إعلانات بعد</p>
            <Link href="/add-listing">
              <Button className="mt-4 gap-2" data-testid="button-empty-add">
                <Plus className="h-4 w-4" />
                أضف أول إعلان
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="bg-muted py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-3">هل تريد بيع شيء؟</h3>
          <p className="text-muted-foreground mb-6">أضف إعلانك مجاناً وتواصل مع المشترين عبر واتساب مباشرة</p>
          <Link href="/add-listing">
            <Button size="lg" className="gap-2" data-testid="button-cta-add">
              <Plus className="h-5 w-5" />
              أضف إعلانك الآن مجاناً
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
