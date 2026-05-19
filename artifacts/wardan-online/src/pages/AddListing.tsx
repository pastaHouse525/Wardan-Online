import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  Plus, CheckCircle, ImagePlus, Loader2, Trash2,
  MapPin, Phone, MessageCircle, DollarSign, Tag, FileText, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateListing, getListFeaturedListingsQueryKey, getListListingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { uploadListingImage } from "@/lib/supabase";

const MAX_IMAGES = 5;

const schema = z.object({
  titleAr: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
  categorySlug: z.string().min(1, "اختر التصنيف"),
  descriptionAr: z.string().optional(),
  price: z.string().optional(),
  priceUnit: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional(),
  sellerName: z.string().optional(),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().min(7, "رقم واتساب غير صحيح"),
});

type FormData = z.infer<typeof schema>;

const categories = [
  { slug: "real-estate",     nameAr: "عقارات",        icon: "🏠" },
  { slug: "livestock",       nameAr: "مواشي",         icon: "🐄" },
  { slug: "birds",           nameAr: "طيور",          icon: "🦜" },
  { slug: "vegetables",      nameAr: "خضروات",        icon: "🥦" },
  { slug: "clothes",         nameAr: "ملابس",         icon: "👗" },
  { slug: "home-appliances", nameAr: "أجهزة منزلية", icon: "📺" },
  { slug: "doctors",         nameAr: "مواعيد طبية",  icon: "🩺" },
];

const egyptCities = [
  "وردان", "منوف", "شبين الكوم", "المنوفية", "بركة السبع",
  "أشمون", "السادات", "القاهرة", "الإسكندرية", "الجيزة",
  "طنطا", "المنصورة", "الزقازيق", "دمياط", "بني سويف",
];

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  url: string | null;
  uploading: boolean;
  error: string | null;
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h2 className="font-bold text-lg text-foreground">{title}</h2>
    </div>
  );
}

export default function AddListing() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titleAr: "", categorySlug: "", descriptionAr: "",
      price: "", priceUnit: "جنيه", city: "وردان", location: "",
      sellerName: "", phoneNumber: "", whatsappNumber: "",
    },
  });

  const createListing = useCreateListing();
  const isUploading = images.some((img) => img.uploading);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);

    if (files.length > remaining) {
      toast({ title: `الحد الأقصى ${MAX_IMAGES} صور`, variant: "destructive" });
    }

    const newImages: UploadedImage[] = toAdd.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      url: null,
      uploading: true,
      error: null,
    }));

    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    for (const img of newImages) {
      try {
        const url = await uploadListingImage(img.file);
        setImages((prev) =>
          prev.map((i) => i.id === img.id ? { ...i, url, uploading: false } : i)
        );
      } catch {
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id
              ? { ...i, uploading: false, error: "فشل الرفع" }
              : i
          )
        );
      }
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const onSubmit = (data: FormData) => {
    const uploadedUrls = images.filter((i) => i.url).map((i) => i.url as string);

    createListing.mutate(
      {
        data: {
          titleAr: data.titleAr,
          categorySlug: data.categorySlug,
          whatsappNumber: data.whatsappNumber,
          descriptionAr: data.descriptionAr || undefined,
          price: data.price ? Number(data.price) : undefined,
          priceUnit: data.priceUnit || undefined,
          location: data.city
            ? `${data.city}${data.location ? ` - ${data.location}` : ""}`
            : data.location || undefined,
          sellerName: data.sellerName || undefined,
          imageUrl: uploadedUrls[0] || undefined,
          // Pass extra fields via the existing body — the server accepts them
          ...({ phoneNumber: data.phoneNumber || undefined } as object),
          ...({ city: data.city || undefined } as object),
          ...({ imageUrls: uploadedUrls.length ? uploadedUrls : undefined } as object),
        } as Parameters<typeof createListing.mutate>[0]["data"],
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFeaturedListingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() });
          setSubmitted(true);
        },
        onError: () => {
          toast({ title: "حدث خطأ", description: "تعذر إرسال الإعلان. حاول مرة أخرى.", variant: "destructive" });
        },
      }
    );
  };

  // ── Success screen ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="relative inline-flex mb-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-14 w-14 text-primary" />
            </div>
            <span className="absolute -top-1 -right-1 text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold mb-3">تم إرسال إعلانك بنجاح!</h2>
          <p className="text-muted-foreground mb-2">سيتم مراجعة إعلانك من قِبل الإدارة</p>
          <p className="text-sm text-muted-foreground mb-8">
            وسيظهر في الموقع بعد الموافقة عليه
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                form.reset();
                setImages([]);
              }}
              data-testid="button-add-another"
            >
              أضف إعلاناً آخر
            </Button>
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" data-testid="text-add-listing-title">
          أضف إعلانك
        </h1>
        <p className="text-muted-foreground">أضف إعلانك مجاناً وتواصل مع المشترين مباشرة عبر واتساب</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* ── Section 1: Category & Title ───────── */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <SectionHeader icon={<Tag className="h-4 w-4" />} title="معلومات الإعلان" />
            <div className="space-y-5">

              <FormField control={form.control} name="categorySlug" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">التصنيف *</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => field.onChange(cat.slug)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          field.value === cat.slug
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/40 hover:bg-muted"
                        }`}
                        data-testid={`button-cat-${cat.slug}`}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span>{cat.nameAr}</span>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="titleAr" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">عنوان الإعلان *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: شقة للبيع في وردان - 3 غرف"
                      className="h-12 text-base"
                      {...field}
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="descriptionAr" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> وصف الإعلان
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="اكتب وصفاً تفصيلياً للإعلان... (المواصفات، الحالة، ملاحظات مهمة)"
                      className="min-h-[120px] text-base resize-none"
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* ── Section 2: Price ─────────────────── */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <SectionHeader icon={<DollarSign className="h-4 w-4" />} title="السعر" />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>المبلغ</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      className="h-12 text-base"
                      {...field}
                      data-testid="input-price"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priceUnit" render={({ field }) => (
                <FormItem>
                  <FormLabel>العملة / الوحدة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12" data-testid="select-price-unit">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="جنيه">جنيه مصري</SelectItem>
                      <SelectItem value="جنيه/شهر">جنيه / شهر</SelectItem>
                      <SelectItem value="جنيه/رأس">جنيه / رأس</SelectItem>
                      <SelectItem value="جنيه/كيلو">جنيه / كيلو</SelectItem>
                      <SelectItem value="للتفاوض">للتفاوض</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* ── Section 3: Location ───────────────── */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <SectionHeader icon={<MapPin className="h-4 w-4" />} title="الموقع" />
            <div className="space-y-4">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>المحافظة / المدينة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12" data-testid="select-city">
                        <SelectValue placeholder="اختر المحافظة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {egyptCities.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>الحي / القرية (اختياري)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: حي الروضة، قرية الحصن..."
                      className="h-12"
                      {...field}
                      data-testid="input-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* ── Section 4: Images ─────────────────── */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <SectionHeader icon={<ImagePlus className="h-4 w-4" />} title={`الصور (${images.length}/${MAX_IMAGES})`} />

            {/* Upload area */}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl p-8 text-center transition-colors cursor-pointer mb-4"
                data-testid="button-upload-images"
              >
                <ImagePlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-foreground mb-1">اضغط لرفع الصور</p>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG حتى 5 ميغابايت لكل صورة · الحد الأقصى {MAX_IMAGES} صور
                </p>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-file-images"
            />

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative rounded-xl overflow-hidden border bg-muted aspect-square"
                    data-testid={`image-preview-${idx}`}
                  >
                    <img
                      src={img.preview}
                      alt={`صورة ${idx + 1}`}
                      className={`w-full h-full object-cover transition-opacity ${img.uploading ? "opacity-50" : "opacity-100"}`}
                    />

                    {/* Overlay */}
                    {img.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                    {img.error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                        <span className="text-xs text-destructive font-bold">{img.error}</span>
                      </div>
                    )}
                    {idx === 0 && !img.uploading && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                        رئيسية
                      </span>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute top-2 left-2 bg-black/60 hover:bg-destructive text-white rounded-full p-1.5 transition-colors"
                      data-testid={`button-remove-image-${idx}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add more slot */}
                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus className="h-8 w-8 mb-1" />
                    <span className="text-xs">إضافة</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Section 5: Contact ────────────────── */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <SectionHeader icon={<Phone className="h-4 w-4" />} title="معلومات التواصل" />
            <div className="space-y-4">
              <FormField control={form.control} name="sellerName" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" /> اسم البائع
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="اسمك الكريم" className="h-12" {...field} data-testid="input-seller-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> رقم الهاتف
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="7XXXXXXXX"
                        dir="ltr"
                        className="h-12 text-left"
                        {...field}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center gap-2 text-[#25D366]">
                        <MessageCircle className="h-4 w-4" /> رقم واتساب *
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="201XXXXXXXXX"
                        dir="ltr"
                        className="h-12 text-left border-[#25D366]/40 focus-visible:ring-[#25D366]"
                        {...field}
                        data-testid="input-whatsapp"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          </div>

          {/* ── Submit ───────────────────────────── */}
          <div className="sticky bottom-4">
            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg gap-3 shadow-lg bg-primary hover:bg-primary/90"
              disabled={createListing.isPending || isUploading}
              data-testid="button-submit-listing"
            >
              {createListing.isPending ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> جاري الإرسال...</>
              ) : isUploading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> جاري رفع الصور...</>
              ) : (
                <><Plus className="h-5 w-5" /> نشر الإعلان مجاناً</>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-2">
              سيتم مراجعة إعلانك قبل النشر
            </p>
          </div>

        </form>
      </Form>
    </div>
  );
}
