import { useParams, Link } from "wouter";
import { MapPin, DollarSign, MessageCircle, User, Calendar, Tag, ArrowRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetListing, getGetListingQueryKey } from "@workspace/api-client-react";
import { formatPriceUnit } from "@/lib/utils";
import ImageGallery from "@/components/ImageGallery";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const listingId = parseInt(id ?? "0", 10);

  const { data: listing, isLoading, isError } = useGetListing(
    listingId,
    { query: { enabled: !!listingId, queryKey: getGetListingQueryKey(listingId) } }
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Skeleton className="h-80 rounded-xl" />
            <div className="flex gap-2">
              {[1,2,3].map(i => <Skeleton key={i} className="w-16 h-16 rounded-lg" />)}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
        <h2 className="text-2xl font-bold mb-2">الإعلان غير موجود</h2>
        <p className="text-muted-foreground mb-6">قد يكون الإعلان قد حُذف أو منتهي الصلاحية</p>
        <Link href="/">
          <Button data-testid="button-back-home">العودة للرئيسية</Button>
        </Link>
      </div>
    );
  }

  const whatsappUrl = `https://wa.me/${listing.whatsappNumber.replace(/\D/g, "")}`;
  const formattedDate = new Date(listing.createdAt).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Extra fields not yet in generated types — cast to access them
  const extra = listing as unknown as { imageUrls?: string[]; city?: string };

  // Build the images array: prefer imageUrls if present, otherwise fall back to imageUrl
  const imageUrls: string[] = Array.isArray(extra.imageUrls) && extra.imageUrls.length > 0
    ? extra.imageUrls
    : listing.imageUrl
      ? [listing.imageUrl]
      : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">الرئيسية</Link>
        <ArrowRight className="h-4 w-4" />
        <Link
          href={`/category/${listing.categorySlug}`}
          className="hover:text-foreground transition-colors"
          data-testid="link-breadcrumb-category"
        >
          {listing.categoryNameAr ?? listing.categorySlug}
        </Link>
        <ArrowRight className="h-4 w-4" />
        <span className="text-foreground line-clamp-1">{listing.titleAr}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery */}
        <ImageGallery images={imageUrls} alt={listing.titleAr} />

        {/* Details */}
        <div className="space-y-4">
          <div>
            <Badge variant="secondary" className="mb-3">{listing.categoryNameAr}</Badge>
            <h1 className="text-2xl font-bold text-foreground leading-snug" data-testid="text-listing-title">
              {listing.titleAr}
            </h1>
          </div>

          {listing.price && (
            <div className="flex items-center gap-2 text-primary font-bold text-2xl" data-testid="text-listing-price">
              <DollarSign className="h-6 w-6" />
              <span>{Number(listing.price).toLocaleString("ar-EG")}</span>
              {listing.priceUnit && (
                <span className="text-base font-normal text-muted-foreground">
                  {formatPriceUnit(listing.priceUnit)}
                </span>
              )}
            </div>
          )}

          {(extra.city || listing.location) && (
            <div className="flex items-center gap-2 text-muted-foreground" data-testid="text-listing-location">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
              <span>
                {extra.city && listing.location
                  ? `${extra.city} - ${listing.location}`
                  : extra.city ?? listing.location}
              </span>
            </div>
          )}

          {listing.sellerName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-5 w-5 text-primary flex-shrink-0" />
              <span>{listing.sellerName}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>

          {/* WhatsApp Button */}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid="button-whatsapp-contact">
            <Button size="lg" className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-3 text-lg py-6">
              <MessageCircle className="h-6 w-6" />
              تواصل عبر واتساب
            </Button>
          </a>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => navigator.share?.({ title: listing.titleAr, url: window.location.href })}
            data-testid="button-share"
          >
            <Share2 className="h-4 w-4" />
            مشاركة الإعلان
          </Button>
        </div>
      </div>

      {/* Description */}
      {listing.descriptionAr && (
        <div className="mt-8 bg-card rounded-xl p-6 border">
          <h2 className="text-xl font-bold mb-4">تفاصيل الإعلان</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-listing-description">
            {listing.descriptionAr}
          </p>
        </div>
      )}
    </div>
  );
}
