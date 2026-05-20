import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[#1D2B50] text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.jpeg"
                alt="Wardan"
                className="h-10 w-10 rounded-xl object-cover"
              />
              <div className="leading-tight">
                <p className="font-black text-lg tracking-wide">WARDAN</p>
                <p className="text-xs text-white/60">وردان أونلاين</p>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              سوقك الإلكتروني الشامل للعقارات والمواشي والطيور والخضروات والملابس والأجهزة المنزلية والمواعيد الطبية.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-[#3DAA82]">روابط سريعة</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/" className="hover:text-white transition-colors">الرئيسية</Link></li>
              <li><Link href="/category/real-estate" className="hover:text-white transition-colors">عقارات</Link></li>
              <li><Link href="/category/livestock" className="hover:text-white transition-colors">مواشي</Link></li>
              <li><Link href="/category/birds" className="hover:text-white transition-colors">طيور</Link></li>
              <li><Link href="/doctors" className="hover:text-white transition-colors">مواعيد طبية</Link></li>
              <li><Link href="/add-listing" className="hover:text-white transition-colors">أضف إعلان</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-[#F5A020]">التصنيفات</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/category/vegetables" className="hover:text-white transition-colors">خضروات</Link></li>
              <li><Link href="/category/clothes" className="hover:text-white transition-colors">ملابس</Link></li>
              <li><Link href="/category/home-appliances" className="hover:text-white transition-colors">أجهزة منزلية</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/40">
          <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} وردان أونلاين</p>
        </div>
      </div>
    </footer>
  );
}
