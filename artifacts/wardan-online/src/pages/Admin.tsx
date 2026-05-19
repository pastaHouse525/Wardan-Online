import { useState } from "react";
import {
  LayoutDashboard, List, CheckCircle, XCircle, Clock, Tag, Stethoscope,
  Trash2, Check, X, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useGetAdminStats, useAdminListListings, useApproveListing, useRejectListing, useDeleteListing,
  getAdminListListingsQueryKey, getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const categoryNames: Record<string, string> = {
  "real-estate": "عقارات",
  "livestock": "مواشي",
  "birds": "طيور",
  "vegetables": "خضروات",
  "clothes": "ملابس",
  "home-appliances": "أجهزة منزلية",
  "doctors": "مواعيد طبية",
};

export default function Admin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: listings, isLoading: listingsLoading } = useAdminListListings(
    {
      status: statusFilter === "all" ? undefined : statusFilter,
      category: categoryFilter === "all" ? undefined : categoryFilter,
    },
    { query: { queryKey: getAdminListListingsQueryKey({ status: statusFilter, category: categoryFilter }) } }
  );

  const approveMutation = useApproveListing();
  const rejectMutation = useRejectListing();
  const deleteMutation = useDeleteListing();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getAdminListListingsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "تمت الموافقة على الإعلان" }); },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "تم رفض الإعلان" }); },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "تم حذف الإعلان" }); },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const statCards = [
    { label: "إجمالي الإعلانات", value: stats?.totalListings, icon: <List className="h-5 w-5" />, color: "text-blue-600" },
    { label: "قيد المراجعة", value: stats?.pendingListings, icon: <Clock className="h-5 w-5" />, color: "text-yellow-600" },
    { label: "موافق عليها", value: stats?.approvedListings, icon: <CheckCircle className="h-5 w-5" />, color: "text-green-600" },
    { label: "مرفوضة", value: stats?.rejectedListings, icon: <XCircle className="h-5 w-5" />, color: "text-red-600" },
    { label: "التصنيفات", value: stats?.totalCategories, icon: <Tag className="h-5 w-5" />, color: "text-purple-600" },
    { label: "المواعيد الطبية", value: stats?.totalAppointments, icon: <Stethoscope className="h-5 w-5" />, color: "text-teal-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold" data-testid="text-admin-title">لوحة الإدارة</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : statCards.map((card) => (
            <Card key={card.label} data-testid={`card-stat-${card.label}`}>
              <CardContent className="p-4">
                <div className={`${card.color} mb-2`}>{card.icon}</div>
                <p className="text-2xl font-bold">{card.value ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Category Breakdown */}
      {stats?.listingsByCategory && stats.listingsByCategory.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>الإعلانات حسب التصنيف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.listingsByCategory.map((item) => (
                <div key={item.categorySlug} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-muted-foreground text-right">{item.categoryNameAr}</span>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min((item.count / (stats.totalListings || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-8 text-left">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44" data-testid="select-status-filter">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending">قيد المراجعة</SelectItem>
            <SelectItem value="approved">موافق عليها</SelectItem>
            <SelectItem value="rejected">مرفوضة</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44" data-testid="select-category-filter">
            <SelectValue placeholder="التصنيف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع التصنيفات</SelectItem>
            {Object.entries(categoryNames).map(([slug, name]) => (
              <SelectItem key={slug} value={slug}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة الإعلانات</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {listingsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}
            </div>
          ) : listings && listings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">البائع</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id} data-testid={`row-listing-${listing.id}`}>
                    <TableCell className="font-medium max-w-[200px]">
                      <span className="line-clamp-1">{listing.titleAr}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {categoryNames[listing.categorySlug] ?? listing.categorySlug}
                      </span>
                    </TableCell>
                    <TableCell>
                      {listing.status === "approved" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">موافق</Badge>}
                      {listing.status === "pending" && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">مراجعة</Badge>}
                      {listing.status === "rejected" && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">مرفوض</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {listing.sellerName ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {new Date(listing.createdAt).toLocaleDateString("ar-SA")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {listing.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(listing.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${listing.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {listing.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleReject(listing.id)}
                            disabled={rejectMutation.isPending}
                            data-testid={`button-reject-${listing.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(listing.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${listing.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <List className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد إعلانات بهذه الفلاتر</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
