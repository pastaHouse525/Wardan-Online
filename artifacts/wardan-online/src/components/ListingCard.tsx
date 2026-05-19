import { Link } from "wouter";
import { MapPin, MessageCircle, Phone, Clock, Images } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Listing {
  id: number;
  titleAr: string;
  descriptionAr?: string | null;
  categorySlug: string;
  categoryNameAr?: string | null;
  price?: number | null;
  priceUnit?: string | null;
  city?: string | null;
  location?: string | null;
  phoneNumber?: string | null;
  whatsappNumber: string;
  sellerName?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  status: string;
  featured: boolean;
  createdAt: string;
}

interface ListingCardProps {
  listing: Listing;
  showStatus?: boolean;
}

const categoryGradients: Record<string, string> = {
  "real-estate":    "from-[#E85530]/20 to-[#E85530]/5",
  "livestock":      "from-[#F5A020]/20 to-[#F5A020]/5",
  "birds":          "from-[#4A91C8]/20 to-[#4A91C8]/5",
  "vegetables":     "from-[#3DAA82]/20 to-[#3DAA82]/5",
  "clothes":        "from-pink-400/20 to-pink-400/5",
  "home-appliances":"from-[#4A91C8]/20 to-[#4A91C8]/5",
  "doctors":        "from-[#3DAA82]/20 to-[#3DAA82]/5",
};

const categoryEmojis: Record<string, string> = {
  "real-estate":    "🏠",
  "livestock":      "🐄",
  "birds":          "🦜",
  "vegetables":     "🥦",
  "clothes":        "👗",
  "home-appliances":"📺",
  "doctors":        "🩺",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: "موافق عليه", className: "bg-green-100 text-green-800" },
  pending:  { label: "قيد المراجعة", className: "bg-amber-100 text-amber-800" },
  rejected: { label: "مرفوض", className: "bg-red-100 text-red-800" },
};

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

export default function ListingCard({ listing, showStatus = false }: ListingCardProps) {
  const whatsappUrl = `https://wa.me/${listing.whatsappNumber.replace(/\D/g, "")}`;
  const grad = categoryGradients[listing.categorySlug] ?? "from-primary/20 to-primary/5";
  const emoji = categoryEmojis[listing.categorySlug] ?? "📋";
  const imageCount = listing.imageUrls?.length ?? (listing.imageUrl ? 1 : 0);
  const displayLocation = listing.city
    ? (listing.location ? `${listing.city} - ${listing.location}` : listing.city)
    : listing.location;
  const status = statusConfig[listing.status];

  return (
    <div
      className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
      data-testid={`card-listing-${listing.id}`}
    >
      {/* Image */}
      <Link href={`/listing/${listing.id}`} className="block relative">
        <div className="relative h-48 overflow-hidden">
          {listing.imageUrl ? (
            <img
              src={listing.imageUrl}
              alt={listing.titleAr}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
              <span className="text-6xl opacity-60">{emoji}</span>
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {listing.featured && (
            <span className="absolute top-2 right-2 bg-[#F5A020] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              ⭐ مميز
            </span>
          )}

          {showStatus && status && (
            <span className={`absolute top-2 left-2 text-xs font-bold px-2.5 py-1 rounded-full ${status.className}`}>
              {status.label}
            </span>
          )}

          {imageCount > 1 && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              <Images className="h-3 w-3" />
              {imageCount}
            </span>
          )}

          {listing.price != null && (
            <span className="absolute bottom-2 right-2 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full shadow">
              {listing.price.toLocaleString("ar-EG")}
              {listing.priceUnit && <span className="font-normal text-xs mr-1">{listing.priceUnit === "EGP" ? "جنيه مصري" : listing.priceUnit}</span>}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category badge */}
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full self-start mb-2">
          {listing.categoryNameAr ?? listing.categorySlug}
        </span>

        {/* Title */}
        <Link href={`/listing/${listing.id}`}>
          <h3
            className="font-bold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug mb-2 cursor-pointer text-base"
            data-testid={`text-listing-title-${listing.id}`}
          >
            {listing.titleAr}
          </h3>
        </Link>

        {/* Description */}
        {listing.descriptionAr && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {listing.descriptionAr}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-col gap-1.5 mt-auto mb-3">
          {displayLocation && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm" data-testid={`text-location-${listing.id}`}>
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#E85530]" />
              <span className="line-clamp-1">{displayLocation}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground/70">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {relativeTime(listing.createdAt)}
            </span>
            {listing.sellerName && (
              <span className="line-clamp-1 max-w-[50%]">👤 {listing.sellerName}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
            data-testid={`button-whatsapp-${listing.id}`}
          >
            <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 text-sm h-10">
              <MessageCircle className="h-4 w-4" />
              واتساب
            </Button>
          </a>
          {listing.phoneNumber && (
            <a
              href={`tel:${listing.phoneNumber}`}
              data-testid={`button-phone-${listing.id}`}
            >
              <Button variant="outline" size="icon" className="h-10 w-10 border-primary/30 text-primary hover:bg-primary/5">
                <Phone className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
