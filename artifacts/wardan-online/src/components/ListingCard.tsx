import { Link } from "wouter";
import { MapPin, DollarSign, MessageCircle, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Listing {
  id: number;
  titleAr: string;
  descriptionAr?: string | null;
  categorySlug: string;
  categoryNameAr?: string | null;
  price?: number | null;
  priceUnit?: string | null;
  location?: string | null;
  whatsappNumber: string;
  sellerName?: string | null;
  imageUrl?: string | null;
  status: string;
  featured: boolean;
  createdAt: string;
}

interface ListingCardProps {
  listing: Listing;
  showStatus?: boolean;
}

const categoryColors: Record<string, string> = {
  "real-estate": "bg-blue-100 text-blue-800",
  "livestock": "bg-amber-100 text-amber-800",
  "birds": "bg-purple-100 text-purple-800",
  "vegetables": "bg-green-100 text-green-800",
  "clothes": "bg-pink-100 text-pink-800",
  "home-appliances": "bg-orange-100 text-orange-800",
  "doctors": "bg-red-100 text-red-800",
};

export default function ListingCard({ listing, showStatus = false }: ListingCardProps) {
  const whatsappUrl = `https://wa.me/${listing.whatsappNumber.replace(/\D/g, "")}`;
  const colorClass = categoryColors[listing.categorySlug] ?? "bg-gray-100 text-gray-800";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group" data-testid={`card-listing-${listing.id}`}>
      {/* Image */}
      <div className="relative h-44 bg-muted overflow-hidden">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.titleAr}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Tag className="h-12 w-12 text-primary/40" />
          </div>
        )}
        {listing.featured && (
          <span className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
            مميز
          </span>
        )}
        <span className={`absolute bottom-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
          {listing.categoryNameAr ?? listing.categorySlug}
        </span>
      </div>

      <CardContent className="p-4">
        <Link href={`/listing/${listing.id}`}>
          <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-2 cursor-pointer" data-testid={`text-listing-title-${listing.id}`}>
            {listing.titleAr}
          </h3>
        </Link>

        {listing.price && (
          <div className="flex items-center gap-1 text-primary font-bold mb-2" data-testid={`text-price-${listing.id}`}>
            <DollarSign className="h-4 w-4" />
            <span>{listing.price.toLocaleString("ar-SA")}</span>
            {listing.priceUnit && <span className="text-sm font-normal text-muted-foreground">{listing.priceUnit}</span>}
          </div>
        )}

        {listing.location && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3" data-testid={`text-location-${listing.id}`}>
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{listing.location}</span>
          </div>
        )}

        {showStatus && (
          <div className="mb-3">
            {listing.status === "approved" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">موافق عليه</Badge>}
            {listing.status === "pending" && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">قيد المراجعة</Badge>}
            {listing.status === "rejected" && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">مرفوض</Badge>}
          </div>
        )}

        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid={`button-whatsapp-${listing.id}`}>
          <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2">
            <MessageCircle className="h-4 w-4" />
            تواصل عبر واتساب
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
