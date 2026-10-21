import React from 'react';
import { PossensiorWordmark } from './Logos';
import { Instagram, Mail, Lock, ArrowUpRight } from 'lucide-react';
import { ProductCategory } from '../types/store';

interface FooterProps {
  onSelectCategory?: (cat: ProductCategory) => void;
  onNavigateTracking: () => void;
  onOpenOwnerControl: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onNavigateTracking,
  onOpenOwnerControl,
}) => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 text-[#1E2927]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-100">
          {/* Brand info (7 cols) - Updated with exact text from image 2 */}
          <div className="md:col-span-7 space-y-4">
            <PossensiorWordmark className="h-7 w-auto text-[#365E52]" color="#365E52" />
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed font-normal">
              POSSENSIOR is an independent Indonesian streetwear brand focused on precision in silhouette, considered construction, and a distinct design language. Built around modern proportions and a commitment to detail, each piece reflects a balance of character, quality, and everyday wearability.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#365E52] font-semibold">
              <span>Jakarta, Indonesia</span>
              <span>·</span>
              <span>Official Web Store</span>
            </div>
          </div>

          {/* Quick links: Koleksi (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Koleksi</h4>
            <ul className="space-y-2 text-xs text-slate-500 font-medium">
              <li>
                <button
                  onClick={() => onSelectCategory && onSelectCategory('all')}
                  className="hover:text-[#365E52] transition-colors cursor-pointer"
                >
                  Semua Produk
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory && onSelectCategory('tees')}
                  className="hover:text-[#365E52] transition-colors cursor-pointer"
                >
                  Tees
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory && onSelectCategory('pants')}
                  className="hover:text-[#365E52] transition-colors cursor-pointer"
                >
                  Pants
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory && onSelectCategory('outerwear')}
                  className="hover:text-[#365E52] transition-colors cursor-pointer"
                >
                  Outerwear
                </button>
              </li>
            </ul>
          </div>

          {/* Social Media (3 cols) - Exactly requested: Instagram and Mail */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Social Media</h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
              <li>
                <a
                  href="https://www.instagram.com/possensior/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-slate-600 hover:text-[#365E52] transition-colors group"
                >
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <span>Instagram</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:possensiorclothing@gmail.com"
                  className="inline-flex items-center gap-2 text-slate-600 hover:text-[#365E52] transition-colors group"
                >
                  <Mail className="w-4 h-4 text-[#365E52]" />
                  <span>Mail</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li className="pt-2">
                <button
                  onClick={onNavigateTracking}
                  className="text-xs text-slate-500 hover:text-[#365E52] transition-colors cursor-pointer"
                >
                  Cek Resi & Pengiriman
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright on left, Owner Only on far right */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 Possensior Apparel Ltd. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <span className="text-slate-400">Unchangeable Reality Series</span>
            <span>·</span>
            <button
              onClick={onOpenOwnerControl}
              className="text-slate-400 hover:text-[#365E52] transition-colors flex items-center gap-1 cursor-pointer font-medium"
              title="Khusus Pengelola Toko"
            >
              <Lock className="w-3 h-3" />
              <span>Owner Only</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
