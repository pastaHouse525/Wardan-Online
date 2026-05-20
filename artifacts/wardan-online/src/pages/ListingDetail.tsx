import { useParams, Link } from "wouter";
import {
  MapPin, DollarSign, MessageCircle, Phone, User, Calendar,
  Tag, ArrowRight, Share2, Clock, Hash, ChevronLeft, Clock3, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetListing, getGetListingQueryKey,
  useListListings, getListListingsQueryKey,
} from "@workspace/api-client-react";
import { formatPriceUnit } from "@/lib/utils";
import ImageGallery from "@/components/ImageGallery";
import ListingCard from "@/components/ListingCard";

// Extra DB fields not yet reflected in generated OpenAPI types
interface ListingExtra {
  imageUrls?: string[];
  city?: string;
  phoneNumber?: string;
  workingHours?: string;
  categorySection?: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d < 30) return `منذ ${d} يوم`;
  return `منذ ${Math.floor(d / 30)} شهر`;
}

/* ── Loading skeleton ───────────────────────────────────────────── */
function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <Skeleton className="h-5 w-56" />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-3">
          <Skeleton className="h-80 rounded-2xl" />
          <div className="flex gap-2">
            {[1,2,3].map(i => <Skeleton key={i} className="w-16 h-16 rounded-xl" />)}
          </div>
          <Skeleton className="h-7 w-2/3 mt-4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ── Contact sidebar card ───────────────────────────────────────── */
interface ContactCardProps {
  whatsappUrl: string;
  phoneNumber?: string;
  sellerName?: string | null;
  titleAr: string;
}
function ContactCard({ whatsappUrl, phoneNumber, sellerName, titleAr }: ContactCardProps) {
  const callUrl = phoneNumber ? `tel:+${phoneNumber.replace(/\D/g, "")}` : null;

  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-3 sticky top-4">
      {/* Seller */}
      {sellerName && (
        <div className="flex items-center gap-3 pb-3 border-b">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">البائع</p>
            <p className="font-semibold text-foreground">{sellerName}</p>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center">
        {sellerName ? `تواصل مع ${sellerName}` : "تواصل مباشرةً"}
      </p>

      {/* WhatsApp */}
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid="button-whatsapp-contact" className="block">
        <Button size="lg" className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 text-base py-5">
          <MessageCircle className="h-5 w-5 shrink-0" />
          واتساب
        </Button>
      </a>

      {/* Phone */}
      {callUrl && (
        <a href={callUrl} data-testid="button-phone-contact" className="block">
          <Button size="lg" variant="outline" className="w-full gap-2 text-base py-5 border-primary/30 hover:bg-primary/5">
            <Phone className="h-5 w-5 shrink-0 text-primary" />
            اتصال مباشر
          </Button>
        </a>
      )}

      {/* Share */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigator.share?.({ title: titleAr, url: window.location.href })}
        data-testid="button-share"
      >
        <Share2 className="h-4 w-4" />
        مشاركة الإعلان
      </Button>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────── */
export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const listingId = parseInt(id ?? "0", 10);

  const { data: listing, isLoading, isError } = useGetListing(
    listingId,
    { query: { enabled: !!listingId, queryKey: getGetListingQueryKey(listingId) } }
  );

  // Related listings — same category, up to 6, loaded after main listing resolves
  const { data: relatedData } = useListListings(
    { category: listing?.categorySlug ?? "", limit: 7 },
    {
      query: {
        enabled: !!listing?.categorySlug,
        queryKey: getListListingsQueryKey({ category: listing?.categorySlug ?? "", limit: 7 }),
      },
    }
  );

  if (isLoading) return <DetailSkeleton />;

  if (isError || !listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
        <h2 className="text-2xl font-bold mb-2">الإعلان غير موجود</h2>
        <p className="text-muted-foreground mb-6">قد يكون الإعلان قد حُذف أو منتهي الصلاحية</p>
        <Link href="/"><Button data-testid="button-back-home">العودة للرئيسية</Button></Link>
      </div>
    );
  }

  const extra = listing as unknown as ListingExtra;
  const isService = extra.categorySection === "services";
  const whatsappUrl = `https://wa.me/${listing.whatsappNumber.replace(/\D/g, "")}`;
  const callUrl = extra.phoneNumber ? `tel:+${extra.phoneNumber.replace(/\D/g, "")}` : null;

  const imageUrls: string[] = Array.isArray(extra.imageUrls) && extra.imageUrls.length > 0
    ? extra.imageUrls
    : listing.imageUrl ? [listing.imageUrl] : [];

  const formattedDate = new Date(listing.createdAt).toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  });

  // Exclude current listing from related
  const related = (relatedData?.listings ?? [])
    .filter(l => l.id !== listingId)
    .slice(0, 6);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28 md:pb-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">الرئيسية</Link>
        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        <Link
          href={`/category/${listing.categorySlug}`}
          className="hover:text-foreground transition-colors"
          data-testid="link-breadcrumb-category"
        >
          {listing.categoryNameAr ?? listing.categorySlug}
        </Link>
        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-foreground line-clamp-1 max-w-[200px]">{listing.titleAr}</span>
      </nav>

      {/* ── Two-column layout ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">

        {/* LEFT — gallery + info */}
        <div className="space-y-5">
          <ImageGallery images={imageUrls} alt={listing.titleAr} />

          {/* Title + meta */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <Badge variant="secondary" className="mb-2">{listing.categoryNameAr}</Badge>
                <h1
                  className="text-2xl sm:text-3xl font-bold text-foreground leading-snug"
                  data-testid="text-listing-title"
                >
                  {listing.titleAr}
                </h1>
              </div>
              {listing.price != null && (
                <div
                  className="bg-primary/10 rounded-xl px-4 py-2 text-right shrink-0"
                  data-testid="text-listing-price"
                >
                  <p className="text-xs text-muted-foreground">السعر</p>
                  <p className="text-xl font-bold text-primary leading-tight">
                    {Number(listing.price).toLocaleString("ar-EG")}
                    {listing.priceUnit && (
                      <span className="text-sm font-normal text-muted-foreground mr-1">
                        {formatPriceUnit(listing.priceUnit)}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Meta pills row */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {isService && (
                <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold px-2.5 py-1 rounded-full">
                  <Wrench className="h-3.5 w-3.5" /> دليل الخدمات
                </span>
              )}
              {(extra.city || listing.location) && (
                <span className="flex items-center gap-1.5" data-testid="text-listing-location">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  {extra.city && listing.location
                    ? `${extra.city} — ${listing.location}`
                    : extra.city ?? listing.location}
                </span>
              )}
              {extra.workingHours && (
                <span className="flex items-center gap-1.5" data-testid="text-listing-hours">
                  <Clock3 className="h-4 w-4 text-teal-600 shrink-0" />
                  {extra.workingHours}
                </span>
              )}
              {listing.sellerName && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  {listing.sellerName}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0" />
                {relativeTime(listing.createdAt)}
              </span>
              <span className="flex items-center gap-1.5 text-xs opacity-60">
                <Hash className="h-3.5 w-3.5 shrink-0" />
                {listing.id}
              </span>
            </div>
          </div>

          {/* Working hours block for services */}
          {isService && extra.workingHours && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
              <h2 className="font-bold text-base flex items-center gap-2 text-teal-800 mb-2">
                <Clock3 className="h-4 w-4" />
                ساعات العمل
              </h2>
              <p className="text-teal-700 font-medium">{extra.workingHours}</p>
            </div>
          )}

          {/* Description */}
          {listing.descriptionAr && (
            <div className="bg-card rounded-2xl p-5 border space-y-2">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                {isService ? "تفاصيل الخدمة" : "تفاصيل الإعلان"}
              </h2>
              <p
                className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base"
                data-testid="text-listing-description"
              >
                {listing.descriptionAr}
              </p>
            </div>
          )}

          {/* Listing info card */}
          <div className="bg-card rounded-2xl p-5 border">
            <h2 className="font-bold text-base mb-3">معلومات الإعلان</h2>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">رقم الإعلان</dt>
                <dd className="font-medium">#{listing.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">التصنيف</dt>
                <dd className="font-medium">{listing.categoryNameAr ?? listing.categorySlug}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">تاريخ النشر</dt>
                <dd className="font-medium">{formattedDate}</dd>
              </div>
              {(extra.city || listing.location) && (
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">الموقع</dt>
                  <dd className="font-medium">
                    {extra.city && listing.location
                      ? `${extra.city} — ${listing.location}`
                      : extra.city ?? listing.location}
                  </dd>
                </div>
              )}
              {listing.sellerName && (
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">البائع</dt>
                  <dd className="font-medium">{listing.sellerName}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* RIGHT — contact sidebar (desktop only) */}
        <div className="hidden md:block">
          <ContactCard
            whatsappUrl={whatsappUrl}
            phoneNumber={extra.phoneNumber}
            sellerName={listing.sellerName}
            titleAr={listing.titleAr}
          />
        </div>
      </div>

      {/* ── Related listings ────────────────────────── */}
      {related.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">إعلانات مشابهة</h2>
            <Link
              href={`/category/${listing.categorySlug}`}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              عرض الكل <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map(l => (
              <ListingCard
                key={l.id}
                listing={{
                  ...l,
                  price: l.price ?? null,
                  descriptionAr: l.descriptionAr ?? null,
                  categoryNameAr: l.categoryNameAr ?? null,
                  priceUnit: l.priceUnit ?? null,
                  city: (l as unknown as { city?: string | null }).city ?? null,
                  location: l.location ?? null,
                  sellerName: l.sellerName ?? null,
                  imageUrl: l.imageUrl ?? null,
                  featured: l.featured ?? false,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Mobile sticky bottom contact bar ────────── */}
      <div className="fixed bottom-0 inset-x-0 md:hidden z-40 bg-background/95 backdrop-blur border-t p-3">
        <div className={`grid gap-2 ${callUrl ? "grid-cols-2" : "grid-cols-1"}`}>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid="button-whatsapp-contact-mobile">
            <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 py-5">
              <MessageCircle className="h-5 w-5 shrink-0" />
              واتساب
            </Button>
          </a>
          {callUrl && (
            <a href={callUrl} data-testid="button-phone-contact-mobile">
              <Button variant="outline" className="w-full gap-2 py-5 border-primary/40 hover:bg-primary/5">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                اتصال
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
