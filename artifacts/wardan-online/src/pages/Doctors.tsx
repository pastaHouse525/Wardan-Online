import { MessageCircle, MapPin, Stethoscope, DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useListAppointments } from "@workspace/api-client-react";
import { Link } from "wouter";

export default function Doctors() {
  const { data: doctors, isLoading } = useListAppointments();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-doctors-title">مواعيد طبية</h1>
        <p className="text-muted-foreground">تواصل مع الأطباء مباشرة عبر واتساب لحجز موعدك</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : doctors && doctors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => {
            const whatsappUrl = `https://wa.me/${doctor.whatsappNumber.replace(/\D/g, "")}`;
            return (
              <Card key={doctor.id} className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`card-doctor-${doctor.id}`}>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 flex items-center justify-center">
                  <div className="bg-primary/20 rounded-full p-4">
                    <Stethoscope className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-lg mb-1" data-testid={`text-doctor-name-${doctor.id}`}>{doctor.doctorNameAr}</h3>

                  {doctor.specialty && (
                    <Badge variant="secondary" className="mb-3">{doctor.specialty}</Badge>
                  )}

                  {doctor.clinicLocation && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{doctor.clinicLocation}</span>
                    </div>
                  )}

                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid={`button-doctor-whatsapp-${doctor.id}`}>
                    <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2">
                      <MessageCircle className="h-4 w-4" />
                      احجز موعدك عبر واتساب
                    </Button>
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Stethoscope className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-medium mb-2">لا توجد مواعيد طبية بعد</p>
          <p className="text-sm">سيتم إضافة أطباء قريباً</p>
        </div>
      )}
    </div>
  );
}
