import React from 'react';
import { X, Mail, MessageCircle, Instagram, MapPin } from 'lucide-react';
import homeHeaderLogo from '../assets/images/HOME HEADER LOGO.png';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-8 border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <img
              src={homeHeaderLogo}
              alt="Possensior Official Logo"
              className="h-30 w-auto object-contain select-none"
            />
          </div>
          <h2 className="text-xl font-extrabold text-[#1E2927]">Hubungi Kami</h2>
          <p className="text-xs text-slate-500 mt-1">
            Layanan pelanggan dan pertanyaan seputar pesanan atau kolaborasi.
          </p>
        </div>

        <div className="space-y-3 text-xs">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/possensior/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 hover:border-[#365E52] hover:bg-[#365E52]/5 transition-all text-slate-700 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
              <Instagram className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900 group-hover:text-[#365E52]">Instagram</div>
              <div className="text-slate-500 text-[11px]">@possensior (Direct Message)</div>
            </div>
          </a>

          {/* Mail */}
          <a
            href="mailto:possensiorclothing@gmail.com"
            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 hover:border-[#365E52] hover:bg-[#365E52]/5 transition-all text-slate-700 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#365E52] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900 group-hover:text-[#365E52]">Email Resmi</div>
              <div className="text-slate-500 text-[11px]">possensiorclothing@gmail.com</div>
            </div>
          </a>

          {/* WhatsApp / Customer Support */}
          <a
            href="https://wa.me/6285777240570?text=Halo%20Possensior%2C%20saya%20ingin%20bertanya%20seputar%20produk%20dan%20pesanan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 hover:border-[#365E52] hover:bg-[#365E52]/5 transition-all text-slate-700 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-green-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900 group-hover:text-[#365E52]">WhatsApp Customer Care</div>
              <div className="text-slate-500 text-[11px]">+62 857-7724-0570 (09.00 - 21.00 WIB)</div>
            </div>
          </a>

          {/* Address */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-700">
            <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900">Studio & Warehouse</div>
              <div className="text-slate-500 text-[11px]">Jakarta, Indonesia</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
