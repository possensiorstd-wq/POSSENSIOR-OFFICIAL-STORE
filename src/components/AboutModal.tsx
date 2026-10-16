import React from 'react';
import { X, Check } from 'lucide-react';
import { PossensiorWordmark, PossensiorIcon } from './Logos';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 sm:p-8 border border-slate-200 animate-in zoom-in-95 duration-200 text-[#1E2927]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="flex justify-center mb-2">
            <PossensiorIcon className="w-12 h-12 text-[#365E52]" color="#365E52" />
          </div>
          <PossensiorWordmark className="h-6 w-auto mx-auto text-[#365E52]" color="#365E52" />
        </div>

        {/* Exact Brand Ethos from Image 2 */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-5">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal text-justify">
            POSSENSIOR is an independent Indonesian streetwear brand focused on precision in silhouette, considered construction, and a distinct design language. Built around modern proportions and a commitment to detail, each piece reflects a balance of character, quality, and everyday wearability.
          </p>
        </div>

        {/* Signature Pillars */}
        <div className="space-y-2.5 text-xs text-slate-600 mb-6">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#365E52]/10 text-[#365E52] flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3" />
            </div>
            <div>
              <span className="font-bold text-slate-900">Heavyweight Combed Fabric:</span> Menggunakan katun combed berbobot 220–380 GSM dengan ketahanan struktur tinggi.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#365E52]/10 text-[#365E52] flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3" />
            </div>
            <div>
              <span className="font-bold text-slate-900">Tailored Boxy Silhouette:</span> Potongan drop shoulder yang lebar dan seimbang, tidak mudah melar.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#365E52]/10 text-[#365E52] flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3" />
            </div>
            <div>
              <span className="font-bold text-slate-900">Curated Streetwear Graphics:</span> Desain tipografi minimalis dengan makna mendalam di setiap seri.
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#365E52] hover:bg-[#2A4B41] text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
