import React from 'react';
import greenLogo from '../assets/images/GREEN LOGO.png';

interface LandingViewProps {
  onEnterStore: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onEnterStore }) => {
  return (
    <div
      onClick={onEnterStore}
      className="relative min-h-screen bg-[#F8FAF9] text-[#1E2927] flex flex-col items-center justify-center p-6 cursor-pointer select-none overflow-hidden selection:bg-transparent"
      title="Klik di mana saja untuk lanjut"
    >
      {/* Subtle Background Architectural Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#365E52 1px, transparent 1px), linear-gradient(to right, #365E52 1px, transparent 1px), linear-gradient(to bottom, #365E52 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Subtle Ambient Radial Glow */}
      <div className="absolute w-80 h-80 rounded-full bg-[#365E52]/10 blur-3xl -z-10 pointer-events-none" />

      {/* Main Center Container */}
      <div className="flex flex-col items-center justify-center text-center">
        {/* Continuous Smooth Rotating Logo (Constant Speed) */}
        <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center drop-shadow-[0_20px_25px_rgba(54,94,82,0.15)] animate-spin-3d">
          <img
            src={greenLogo}
            alt="Possensior Emblem"
            className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none"
          />
        </div>

        {/* Soft ground shadow */}
        <div className="w-36 h-4 mx-auto mt-2 bg-[#365E52]/15 rounded-full blur-md" />

        {/* Blinking Callout below logo */}
        <div className="mt-8">
          <p className="text-xs sm:text-sm font-bold tracking-widest text-[#365E52] uppercase animate-pulse select-none">
            KLIK DIMANA SAJA UNTUK LANJUT
          </p>
        </div>
      </div>
    </div>
  );
};
