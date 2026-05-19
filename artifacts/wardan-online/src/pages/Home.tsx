import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Home as HomeIcon, Beef, Bird, Leaf, Shirt, Tv, Stethoscope, Plus, Tag, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useListCategories, useListFeaturedListings } from "@workspace/api-client-react";
import ListingCard from "@/components/ListingCard";
import EgyptMap from "@/components/EgyptMap";

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
  const [mapGovernorate, setMapGovernorate] = useState<string | null>(null);

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

      {/* Map Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">تصفح حسب المحافظة</h2>
          </div>
          {mapGovernorate && (
            <button
              onClick={() => setMapGovernorate(null)}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              إلغاء التحديد
            </button>
          )}
        </div>
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <div className="rounded-2xl border bg-card p-3 shadow-sm">
              <EgyptMap
                selectedGovernorate={mapGovernorate}
                onSelectGovernorate={setMapGovernorate}
                className="w-full"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              انقر على محافظة لاستعراض إعلاناتها
            </p>
          </div>
          <div className="flex-1 w-full">
            {mapGovernorate ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-semibold text-sm px-3 py-1.5 rounded-full">
                    <MapPin className="h-3.5 w-3.5" />
                    {mapGovernorate}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  اضغط على زر "عرض الإعلانات" لرؤية كل الإعلانات في هذه المحافظة، أو اختر تصنيفاً محدداً من القائمة أدناه.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/search?city=${encodeURIComponent(mapGovernorate)}`}>
                    <Button className="gap-2" data-testid="button-map-view-all">
                      <Search className="h-4 w-4" />
                      عرض كل إعلانات {mapGovernorate}
                    </Button>
                  </Link>
                  <Link href={`/category/real-estate?city=${encodeURIComponent(mapGovernorate)}`}>
                    <Button variant="outline" className="gap-1.5">
                      <HomeIcon className="h-4 w-4" />
                      عقارات
                    </Button>
                  </Link>
                  <Link href={`/category/livestock?city=${encodeURIComponent(mapGovernorate)}`}>
                    <Button variant="outline" className="gap-1.5">
                      <Beef className="h-4 w-4" />
                      مواشي
                    </Button>
                  </Link>
                  <Link href={`/category/birds?city=${encodeURIComponent(mapGovernorate)}`}>
                    <Button variant="outline" className="gap-1.5">
                      <Bird className="h-4 w-4" />
                      طيور
                    </Button>
                  </Link>
                  <Link href={`/category/vegetables?city=${encodeURIComponent(mapGovernorate)}`}>
                    <Button variant="outline" className="gap-1.5">
                      <Leaf className="h-4 w-4" />
                      خضروات
                    </Button>
                  </Link>
                  <Link href={`/category/clothes?city=${encodeURIComponent(mapGovernorate)}`}>
                    <Button variant="outline" className="gap-1.5">
                      <Shirt className="h-4 w-4" />
                      ملابس
                    </Button>
                  </Link>
                  <Link href={`/category/home-appliances?city=${encodeURIComponent(mapGovernorate)}`}>
                    <Button variant="outline" className="gap-1.5">
                      <Tv className="h-4 w-4" />
                      أجهزة
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 rounded-2xl border border-dashed bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">اختر محافظة من الخريطة</p>
                  <p className="text-sm mt-1">لعرض الإعلانات المتاحة في منطقتك</p>
                </div>
              </div>
            )}
          </div>
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
                city: listing.city ?? null,
                location: listing.location ?? null,
                sellerName: listing.sellerName ?? null,
                imageUrl: listing.imageUrl ?? null,
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
