import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  Plus, CheckCircle, ImagePlus, Loader2, Trash2,
  MapPin, Phone, MessageCircle, DollarSign, Tag, FileText, User, ShieldCheck,
  Wrench, Clock3, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateListing, useListCategories, getListFeaturedListingsQueryKey, getListListingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { uploadListingImage } from "@/lib/supabase";
import { PRICE_UNIT_OPTIONS } from "@/lib/utils";

const MAX_IMAGES = 5;

const DISCLAIMER_TEXT =
  "أتعهد بأن جميع المعلومات والصور المضافة صحيحة، وأتحمل كامل المسؤولية القانونية عنها، ولا يتحمل موقع وردان أونلاين أي مسؤولية عن عمليات البيع أو الشراء أو أي حالات غش أو نصب أو معلومات غير صحيحة.";

const schema = z.object({
  titleAr: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
  categorySlug: z.string().min(1, "اختر التصنيف"),
  descriptionAr: z.string().optional(),
  price: z.string().optional(),
  priceUnit: z.string().optional(),
  workingHours: z.string().optional(),
  city: z.string().min(1, "اختر المحافظة"),
  location: z.string().optional(),
  sellerName: z.string().optional(),
  phoneNumber: z.string().min(7, "رقم الهاتف غير صحيح — يجب أن يكون 7 أرقام على الأقل"),
  whatsappNumber: z.string().min(7, "رقم واتساب غير صحيح"),
  disclaimerAccepted: z.literal(true, {
    errorMap: () => ({ message: "يجب قبول إقرار المسؤولية للمتابعة" }),
  }),
});

type FormData = z.infer<typeof schema>;

const EGYPT_GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية",
  "الدقهلية", "البحيرة", "الغربية", "المنوفية", "كفر الشيخ",
  "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء",
  "جنوب سيناء", "الفيوم", "بني سويف", "المنيا", "أسيوط",
  "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر",
  "الوادي الجديد", "مطروح",
];

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  url: string | null;
  uploading: boolean;
  error: string | null;
  phase?: "compressing" | "uploading";
  percent?: number;
}

function SectionHeader({ icon, title, accent }: { icon: React.ReactNode; title: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
      <div className={`p-2 rounded-lg ${accent ? "bg-teal-50 text-teal-600" : "bg-primary/10 text-primary"}`}>{icon}</div>
      <h2 className="font-bold text-lg text-foreground">{title}</h2>
    </div>
  );
}

const SERVICE_SLUGS = new Set([
  "technicians", "restaurants", "quran-teachers", "local-shops",
  "job-vacancies", "transportation", "education", "doctors",
]);

export default function AddListing() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: apiCategories, isLoading: catsLoading } = useListCategories();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titleAr: "", categorySlug: "", descriptionAr: "",
      price: "", priceUnit: "EGP", workingHours: "",
      city: "", location: "", sellerName: "",
      phoneNumber: "", whatsappNumber: "",
      disclaimerAccepted: false as unknown as true,
    },
  });

  const selectedSlug = form.watch("categorySlug");
  const isService = SERVICE_SLUGS.has(selectedSlug);

  const marketplaceCats = (apiCategories ?? []).filter((c) => c.section === "marketplace");
  const servicesCats    = (apiCategories ?? []).filter((c) => c.section === "services");

  const CATEGORY_ICONS: Record<string, string> = {
    "real-estate": "🏠", "livestock": "🐄", "birds": "🦜", "vegetables": "🥦",
    "clothes": "👗", "home-appliances": "📺",
    "technicians": "🔧", "restaurants": "🍽️", "quran-teachers": "📖",
    "local-shops": "🏪", "job-vacancies": "💼", "transportation": "🚛",
    "education": "📚", "doctors": "🩺",
  };

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
      phase: "compressing" as const,
      percent: 0,
    }));

    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    await Promise.all(
      newImages.map(async (img) => {
        try {
          const url = await uploadListingImage(img.file, ({ phase, percent }) => {
            setImages((prev) =>
              prev.map((i) => i.id === img.id ? { ...i, phase, percent } : i)
            );
          });
          setImages((prev) =>
            prev.map((i) => i.id === img.id ? { ...i, url, uploading: false, phase: undefined, percent: undefined } : i)
          );
        } catch {
          setImages((prev) =>
            prev.map((i) =>
              i.id === img.id ? { ...i, uploading: false, error: "فشل الرفع", phase: undefined } : i
            )
          );
        }
      })
    );
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
          price: (!isService && data.price) ? Number(data.price) : undefined,
          priceUnit: (!isService && data.priceUnit) ? data.priceUnit : undefined,
          location: data.location || undefined,
          sellerName: data.sellerName || undefined,
          imageUrl: uploadedUrls[0] || undefined,
          disclaimerAcceptedAt: new Date().toISOString(),
          ...({ phoneNumber: data.phoneNumber || undefined } as object),
          ...({ city: data.city || undefined } as object),
          ...({ imageUrls: uploadedUrls.length ? uploadedUrls : undefined } as object),
          ...({ workingHours: (isService && data.workingHours) ? data.workingHours : undefined } as object),
        } as Parameters<typeof createListing.mutate>[0]["data"],
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFeaturedListingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() });
          setSubmitted(true);
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
          toast({
            title: "حدث خطأ",
            description: msg || "تعذر إرسال الإعلان. حاول مرة أخرى.",
            variant: "destructive",
          });
        },
      }
    );
  };

  // ── Success screen ──────────────────────────────────────────────────────────
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
          <p className="text-sm text-muted-foreground mb-8">وسيظهر في الموقع بعد الموافقة عليه</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="outline" onClick={() => { setSubmitted(false); form.reset(); setImages([]); }} data-testid="button-add-another">
              أضف إعلاناً آخر
            </Button>
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">العودة للرئيسية</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  const accentClass = isService ? "bg-teal-600 hover:bg-teal-700" : "";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {isService
            ? <div className="flex items-center gap-2 text-teal-700 font-bold"><Wrench className="h-5 w-5" /> دليل الخدمات</div>
            : <div className="flex items-center gap-2 text-primary font-bold"><ShoppingBag className="h-5 w-5" /> سوق البيع والشراء</div>
          }
        </div>
        <h1 className="text-3xl font-black mb-1" data-testid="text-add-listing-title">
          {selectedSlug ? (isService ? "أضف خدمتك" : "أضف إعلانك") : "أضف إعلانك أو خدمتك"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isService
            ? "سجّل خدمتك مجاناً ليجدك العملاء في منطقة وردان"
            : "أضف إعلانك مجاناً وتواصل مع المشترين مباشرة عبر واتساب"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Category Selection ───────────────────────────── */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <SectionHeader icon={<Tag className="h-4 w-4" />} title="اختر التصنيف" />
            <FormField control={form.control} name="categorySlug" render={({ field }) => (
              <FormItem>
                {catsLoading ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Marketplace */}
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5" /> بيع وشراء
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {marketplaceCats.map((cat) => (
                          <button key={cat.slug} type="button" onClick={() => field.onChange(cat.slug)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                              field.value === cat.slug
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border hover:border-primary/40 hover:bg-muted"
                            }`} data-testid={`button-cat-${cat.slug}`}>
                            <span className="text-xl">{CATEGORY_ICONS[cat.slug] ?? "📋"}</span>
                            <span className="text-center leading-tight">{cat.nameAr}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Services */}
                    <div>
                      <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5" /> خدمات
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {servicesCats.map((cat) => (
                          <button key={cat.slug} type="button" onClick={() => field.onChange(cat.slug)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                              field.value === cat.slug
                                ? "border-teal-600 bg-teal-50 text-teal-700"
                                : "border-border hover:border-teal-500/40 hover:bg-muted"
                            }`} data-testid={`button-cat-${cat.slug}`}>
                            <span className="text-xl">{CATEGORY_ICONS[cat.slug] ?? "🔧"}</span>
                            <span className="text-center leading-tight">{cat.nameAr}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <FormMessage className="mt-2" />
              </FormItem>
            )} />
          </div>

          {/* ── Listing Info ────────────────────────────────── */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <SectionHeader
              icon={isService ? <Wrench className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
              title={isService ? "معلومات الخدمة" : "معلومات الإعلان"}
              accent={isService}
            />
            <div className="space-y-5">

              <FormField control={form.control} name="titleAr" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    {isService ? "اسم الخدمة / النشاط *" : "عنوان الإعلان *"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={isService ? "مثال: كهربائي منازل — سريع وبأسعار مناسبة" : "مثال: شقة للإيجار في وردان"}
                      className="h-12 text-base"
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="descriptionAr" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    {isService ? "وصف الخدمة" : "وصف الإعلان"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={isService
                        ? "اكتب تفاصيل خدمتك، تخصصاتك، ومناطق العمل..."
                        : "اكتب تفاصيل الإعلان، الحالة، المميزات..."}
                      className="min-h-[100px] text-base resize-none"
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Price — marketplace only */}
              {!isService && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" /> السعر
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" placeholder="مثال: 50000" className="h-11" data-testid="input-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="priceUnit" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">العملة / الوحدة</FormLabel>
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-11" data-testid="select-price-unit"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRICE_UNIT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* Working hours — services only */}
              {isService && (
                <FormField control={form.control} name="workingHours" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-teal-600" /> ساعات العمل
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="مثال: السبت – الخميس، 8 ص – 8 م" className="h-11" data-testid="input-working-hours" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>
          </div>

          {/* ── Images ──────────────────────────────────────── */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <SectionHeader icon={<ImagePlus className="h-4 w-4" />} title="الصور" accent={isService} />
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-images"
              />
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {images.map((img, idx) => (
                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-border">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-1 right-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">رئيسية</span>
                      )}
                      {img.uploading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                          <span className="text-white text-xs">{img.phase === "compressing" ? "ضغط" : "رفع"} {img.percent ?? 0}%</span>
                        </div>
                      )}
                      {img.error && (
                        <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center">
                          <span className="text-white text-xs text-center px-1">{img.error}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute bottom-1 left-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-xs">إضافة</span>
                    </button>
                  )}
                </div>
              )}
              {images.length === 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 flex flex-col items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                  data-testid="button-upload-images"
                >
                  <ImagePlus className="h-10 w-10" />
                  <div className="text-center">
                    <p className="font-semibold">اضغط لإضافة صور</p>
                    <p className="text-xs mt-1">حتى {MAX_IMAGES} صور · JPG, PNG</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* ── Location ────────────────────────────────────── */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <SectionHeader icon={<MapPin className="h-4 w-4" />} title="الموقع" accent={isService} />
            <div className="space-y-4">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">المحافظة *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11" data-testid="select-city"><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-64">
                      {EGYPT_GOVERNORATES.map((gov) => <SelectItem key={gov} value={gov}>{gov}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">العنوان التفصيلي</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: وردان، مركز أبو النمرس، الجيزة" className="h-11" data-testid="input-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* ── Contact ─────────────────────────────────────── */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <SectionHeader icon={<Phone className="h-4 w-4" />} title="معلومات التواصل" accent={isService} />
            <div className="space-y-4">
              <FormField control={form.control} name="sellerName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {isService ? "اسم صاحب الخدمة / النشاط" : "اسم البائع"}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isService ? "اسمك أو اسم نشاطك التجاري" : "اسمك الكريم"} className="h-11" data-testid="input-seller-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> رقم الهاتف *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="01XXXXXXXXX" className="h-11" data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" /> رقم واتساب *
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="201XXXXXXXXX" className="h-11" data-testid="input-whatsapp" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          </div>

          {/* ── Disclaimer ──────────────────────────────────── */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <SectionHeader icon={<ShieldCheck className="h-4 w-4 text-amber-600" />} title="إقرار المسؤولية" />
            <FormField control={form.control} name="disclaimerAccepted" render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value === true}
                      onCheckedChange={(v) => field.onChange(v === true ? true : (false as unknown as true))}
                      className="mt-0.5 shrink-0"
                      data-testid="checkbox-disclaimer"
                    />
                  </FormControl>
                  <FormLabel className="font-normal text-sm leading-relaxed text-amber-900 cursor-pointer">
                    {DISCLAIMER_TEXT}
                  </FormLabel>
                </div>
                <FormMessage className="mt-2" />
              </FormItem>
            )} />
          </div>

          {/* ── Submit ──────────────────────────────────────── */}
          <div className="sticky bottom-4 flex gap-3">
            <Button
              type="submit"
              className={`flex-1 h-14 text-lg font-bold gap-2 shadow-lg ${accentClass}`}
              disabled={createListing.isPending || isUploading}
              data-testid="button-submit"
            >
              {createListing.isPending ? (
                <><Loader2 className="h-5 w-5 animate-spin" />جاري الإرسال...</>
              ) : isUploading ? (
                <><Loader2 className="h-5 w-5 animate-spin" />جاري رفع الصور...</>
              ) : (
                <><Plus className="h-5 w-5" />{isService ? "نشر الخدمة مجاناً" : "نشر الإعلان مجاناً"}</>
              )}
            </Button>
          </div>

        </form>
      </Form>

      {/* Bottom description */}
      <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1.5">
        <FileText className="h-3.5 w-3.5" />
        سيتم مراجعة إعلانك قبل النشر — عادةً في غضون ساعات قليلة
      </p>
    </div>
  );
}
