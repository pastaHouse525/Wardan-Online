import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateListing, useListCategories, getListFeaturedListingsQueryKey, getListListingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const schema = z.object({
  titleAr: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
  categorySlug: z.string().min(1, "اختر التصنيف"),
  price: z.string().optional(),
  priceUnit: z.string().optional(),
  descriptionAr: z.string().optional(),
  location: z.string().optional(),
  sellerName: z.string().optional(),
  whatsappNumber: z.string().min(7, "رقم واتساب غير صحيح"),
  imageUrl: z.string().url("رابط الصورة غير صحيح").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

const categories = [
  { slug: "real-estate", nameAr: "عقارات" },
  { slug: "livestock", nameAr: "مواشي" },
  { slug: "birds", nameAr: "طيور" },
  { slug: "vegetables", nameAr: "خضروات" },
  { slug: "clothes", nameAr: "ملابس" },
  { slug: "home-appliances", nameAr: "أجهزة منزلية" },
  { slug: "doctors", nameAr: "مواعيد طبية" },
];

export default function AddListing() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titleAr: "",
      categorySlug: "",
      price: "",
      priceUnit: "ريال",
      descriptionAr: "",
      location: "",
      sellerName: "",
      whatsappNumber: "",
      imageUrl: "",
    },
  });

  const createListing = useCreateListing();

  const onSubmit = (data: FormData) => {
    createListing.mutate(
      {
        data: {
          titleAr: data.titleAr,
          categorySlug: data.categorySlug,
          whatsappNumber: data.whatsappNumber,
          descriptionAr: data.descriptionAr || undefined,
          price: data.price ? Number(data.price) : undefined,
          priceUnit: data.priceUnit || undefined,
          location: data.location || undefined,
          sellerName: data.sellerName || undefined,
          imageUrl: data.imageUrl || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFeaturedListingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() });
          setSubmitted(true);
        },
        onError: () => {
          toast({
            title: "حدث خطأ",
            description: "تعذر إرسال الإعلان. حاول مرة أخرى.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle className="h-20 w-20 mx-auto mb-6 text-primary" />
        <h2 className="text-2xl font-bold mb-3">تم إرسال إعلانك بنجاح!</h2>
        <p className="text-muted-foreground mb-8">
          إعلانك قيد المراجعة وسيظهر بعد الموافقة عليه
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setSubmitted(false); form.reset(); }} variant="outline" data-testid="button-add-another">
            أضف إعلاناً آخر
          </Button>
          <Button onClick={() => setLocation("/")} data-testid="button-go-home">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2" data-testid="text-add-listing-title">أضف إعلانك</h1>
      <p className="text-muted-foreground mb-8">أضف إعلانك مجاناً وتواصل مع المشترين عبر واتساب</p>

      <div className="bg-card rounded-2xl border p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="titleAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان الإعلان *</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: شقة للبيع في الرياض 3 غرف" {...field} data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categorySlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التصنيف *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.slug} value={cat.slug}>{cat.nameAr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} data-testid="input-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وحدة السعر</FormLabel>
                    <FormControl>
                      <Input placeholder="ريال" {...field} data-testid="input-price-unit" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الموقع</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: الرياض - حي النزهة" {...field} data-testid="input-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descriptionAr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="اكتب وصفاً تفصيلياً للإعلان..."
                      className="min-h-[100px]"
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sellerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم البائع</FormLabel>
                  <FormControl>
                    <Input placeholder="اسمك الكريم" {...field} data-testid="input-seller-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsappNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم واتساب *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="966501234567"
                      dir="ltr"
                      {...field}
                      data-testid="input-whatsapp"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رابط الصورة</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      dir="ltr"
                      {...field}
                      data-testid="input-image-url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full gap-2 h-12 text-base"
              disabled={createListing.isPending}
              data-testid="button-submit-listing"
            >
              {createListing.isPending ? (
                "جاري الإرسال..."
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  إضافة الإعلان
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
