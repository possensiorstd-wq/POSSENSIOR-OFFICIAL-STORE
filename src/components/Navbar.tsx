import React, { useState } from 'react';
import homeHeaderLogo from '../assets/images/HOME HEADER LOGO.png';
import { ShoppingBag, Search, Menu, X, ArrowLeft, Info, PhoneCall, Image as ImageIcon } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onNavigateTracking: () => void;
  onNavigateLookbook: () => void;
  onOpenContact: () => void;
  onOpenAbout: () => void;
  onBackToLanding: () => void;
  onGoHome: () => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onNavigateTracking,
  onNavigateLookbook,
  onOpenContact,
  onOpenAbout,
  onBackToLanding,
  onGoHome,
  currentView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Logo (HOME HEADER LOGO.png) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#365E52] rounded-md p-1"
            title="Possensior Official Store"
          >
            <img
              src={homeHeaderLogo}
              alt="Possensior Official Store"
              className="h-50 sm:h-51 w-auto max-h-90 object-contain select-none"
            />
          </button>
        </div>

        {/* Zone 2: Navigation Links: Kontak, About Us, Lookbook, Cek Resi */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button
            onClick={onOpenContact}
            className="whitespace-nowrap shrink-0 hover:text-[#365E52] transition-colors cursor-pointer py-1"
          >
            Kontak
          </button>

          <button
            onClick={onOpenAbout}
            className="whitespace-nowrap shrink-0 hover:text-[#365E52] transition-colors cursor-pointer py-1"
          >
            About Us
          </button>

          <button
            onClick={onNavigateLookbook}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentView === 'lookbook'
                ? 'text-[#365E52] font-bold border-b-2 border-[#365E52]'
                : 'hover:text-[#365E52]'
            }`}
          >
            Lookbook
          </button>

          <button
            onClick={() => onNavigateTracking()}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
              currentView === 'tracking'
                ? 'text-[#365E52] font-bold border-b-2 border-[#365E52]'
                : 'hover:text-[#365E52]'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-[#365E52]" />
            <span>Cek Resi</span>
          </button>
        </nav>

        {/* Zone 3: Shopping Cart Button - Icon Only with Badge Counter */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCart}
            className="relative p-2.5 bg-[#365E52] hover:bg-[#2A4B41] text-white rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#365E52]"
            aria-label={`Keranjang belanja dengan ${cartCount} barang`}
            title="Keranjang Belanja"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-[#365E52] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-3 shadow-lg animate-in slide-in-from-top-2">
          <button
            onClick={() => {
              onOpenContact();
              setMobileMenuOpen(false);
            }}
            className="text-left py-2 text-sm font-semibold text-slate-800 hover:text-[#365E52] flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-[#365E52]" />
            <span>Kontak</span>
          </button>

          <button
            onClick={() => {
              onOpenAbout();
              setMobileMenuOpen(false);
            }}
            className="text-left py-2 text-sm font-semibold text-slate-800 hover:text-[#365E52] flex items-center gap-2"
          >
            <Info className="w-4 h-4 text-[#365E52]" />
            <span>About Us</span>
          </button>

          <button
            onClick={() => {
              onNavigateLookbook();
              setMobileMenuOpen(false);
            }}
            className={`text-left py-2 text-sm font-semibold flex items-center gap-2 ${
              currentView === 'lookbook' ? 'text-[#365E52]' : 'text-slate-800 hover:text-[#365E52]'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#365E52]" />
            <span>Lookbook</span>
          </button>

          <button
            onClick={() => {
              onNavigateTracking();
              setMobileMenuOpen(false);
            }}
            className="text-left py-2 text-sm font-semibold text-[#365E52] flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Cek Resi</span>
          </button>


          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                onBackToLanding();
                setMobileMenuOpen(false);
              }}
              className="text-xs text-slate-500 hover:text-[#365E52] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Landing Page</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
