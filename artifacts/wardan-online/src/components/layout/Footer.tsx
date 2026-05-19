import { Link } from "wouter";
import { ShoppingBag, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold text-xl mb-4">
              <ShoppingBag className="h-7 w-7" />
              <span>وردان أونلاين</span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              سوقك الإلكتروني الشامل للعقارات والمواشي والطيور والخضروات والملابس والأجهزة المنزلية والمواعيد الطبية.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link href="/" className="hover:text-primary-foreground transition-colors">الرئيسية</Link></li>
              <li><Link href="/category/real-estate" className="hover:text-primary-foreground transition-colors">عقارات</Link></li>
              <li><Link href="/category/livestock" className="hover:text-primary-foreground transition-colors">مواشي</Link></li>
              <li><Link href="/category/birds" className="hover:text-primary-foreground transition-colors">طيور</Link></li>
              <li><Link href="/doctors" className="hover:text-primary-foreground transition-colors">مواعيد طبية</Link></li>
              <li><Link href="/add-listing" className="hover:text-primary-foreground transition-colors">أضف إعلان</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-lg mb-4">التصنيفات</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link href="/category/vegetables" className="hover:text-primary-foreground transition-colors">خضروات</Link></li>
              <li><Link href="/category/clothes" className="hover:text-primary-foreground transition-colors">ملابس</Link></li>
              <li><Link href="/category/home-appliances" className="hover:text-primary-foreground transition-colors">أجهزة منزلية</Link></li>
              <li><Link href="/admin" className="hover:text-primary-foreground transition-colors">لوحة الإدارة</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-6 text-center text-sm text-primary-foreground/60">
          <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} وردان أونلاين</p>
        </div>
      </div>
    </footer>
  );
}
