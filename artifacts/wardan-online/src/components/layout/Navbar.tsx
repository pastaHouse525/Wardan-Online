import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "wouter";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `${import.meta.env.BASE_URL}search?q=${encodeURIComponent(searchQuery.trim())}`.replace(/\/\//g, "/");
    }
  };

  const navLinks = [
    { href: "/", label: "الرئيسية" },
    { href: "/category/real-estate", label: "عقارات" },
    { href: "/category/livestock", label: "مواشي" },
    { href: "/category/birds", label: "طيور" },
    { href: "/doctors", label: "مواعيد طبية" },
    { href: "/admin", label: "الإدارة" },
  ];

  return (
    <nav className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-90 transition-opacity" data-testid="link-logo">
            <ShoppingBag className="h-7 w-7" />
            <span>وردان أونلاين</span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="flex w-full gap-2">
              <Input
                type="search"
                placeholder="ابحث عن إعلانك..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                data-testid="input-search"
              />
              <Button type="submit" variant="secondary" size="icon" data-testid="button-search-submit">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/add-listing">
              <Button variant="secondary" className="gap-2" data-testid="button-add-listing">
                <Plus className="h-4 w-4" />
                أضف إعلان
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            data-testid="button-mobile-menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex gap-1 pb-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location === link.href
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              }`}
              data-testid={`link-nav-${link.label}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <Input
                type="search"
                placeholder="ابحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
                data-testid="input-mobile-search"
              />
              <Button type="submit" variant="secondary" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors"
                onClick={() => setMenuOpen(false)}
                data-testid={`link-mobile-${link.label}`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/add-listing" onClick={() => setMenuOpen(false)}>
              <Button variant="secondary" className="w-full gap-2 mt-2" data-testid="button-mobile-add">
                <Plus className="h-4 w-4" />
                أضف إعلان
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
