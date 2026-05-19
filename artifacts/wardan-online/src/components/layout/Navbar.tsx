import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <nav className="bg-[#1D2B50] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity" data-testid="link-logo">
            <img
              src="/logo.jpeg"
              alt="Wardan"
              className="h-9 w-9 rounded-xl object-cover"
            />
            <div className="leading-tight">
              <span className="font-black text-lg tracking-wide">WARDAN</span>
              <span className="block text-xs text-white/60 font-medium -mt-0.5">وردان أونلاين</span>
            </div>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="flex w-full gap-2">
              <Input
                type="search"
                placeholder="ابحث عن إعلانك..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus-visible:ring-[#3DAA82]"
                data-testid="input-search"
              />
              <Button
                type="submit"
                className="bg-[#3DAA82] hover:bg-[#35967A] text-white border-0"
                size="icon"
                data-testid="button-search-submit"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/add-listing">
              <Button
                className="gap-2 bg-[#F5A020] hover:bg-[#E09010] text-white border-0"
                data-testid="button-add-listing"
              >
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
                  ? "bg-[#3DAA82] text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
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
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                data-testid="input-mobile-search"
              />
              <Button type="submit" className="bg-[#3DAA82] hover:bg-[#35967A] text-white border-0" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                onClick={() => setMenuOpen(false)}
                data-testid={`link-mobile-${link.label}`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/add-listing" onClick={() => setMenuOpen(false)}>
              <Button className="w-full gap-2 mt-2 bg-[#F5A020] hover:bg-[#E09010] text-white border-0" data-testid="button-mobile-add">
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
