import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LookbookItem } from '../types/store';
import { fetchLookbookItems } from '../lib/supabase';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface LookbookViewProps {
  onBackToStore: () => void;
}

export const LookbookView: React.FC<LookbookViewProps> = ({ onBackToStore }) => {
  const [items, setItems] = useState<LookbookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'database' | 'storage' | 'empty'>('empty');
  
  // Lightbox Modal State
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLookbookItems();
      if (res.error && res.items.length === 0) {
        setError(res.error);
      } else {
        setItems(res.items);
        setSourceType(res.source);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat galeri Lookbook.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (activeItemIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveItemIndex(null);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItemIndex, items.length]);

  const handleNext = () => {
    if (activeItemIndex === null || items.length === 0) return;
    setActiveItemIndex((prev) => (prev! + 1) % items.length);
  };

  const handlePrev = () => {
    if (activeItemIndex === null || items.length === 0) return;
    setActiveItemIndex((prev) => (prev! - 1 + items.length) % items.length);
  };

  const handleImageError = (id: string) => {
    setFailedImageIds((prev) => new Set(prev).add(id));
  };

  const activeItem = activeItemIndex !== null ? items[activeItemIndex] : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#365E52]/10 text-[#365E52]">
              <Sparkles className="w-3 h-3" />
              Editorial Series
            </span>
            <span className="text-xs text-slate-400 font-medium tracking-widest uppercase">
              POSSENSIOR
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase">
            Lookbook
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl font-normal leading-relaxed">
            Eksplorasi visual dan narasi estetika streetwear POSSENSIOR. Setiap potongan siluet dirancang dengan proporsi presisi dan karakter autentik.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:text-[#365E52] transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Katalog Produk</span>
          </button>
          
          <button
            onClick={loadData}
            title="Muat ulang lookbook"
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-[#365E52] transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#365E52]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden animate-pulse flex flex-col"
            >
              <div className="w-full bg-slate-200 aspect-[3/4]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded-md w-2/3" />
                <div className="h-3 bg-slate-200 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && items.length === 0 && (
        <div className="text-center py-16 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-300 max-w-lg mx-auto">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Gagal Memuat Lookbook</h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {error}
          </p>
          <button
            onClick={loadData}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#365E52] hover:bg-[#2A4B41] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-20 px-6 bg-slate-50/70 rounded-3xl border border-slate-200 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#365E52]/10 text-[#365E52] flex items-center justify-center">
            <ImageIcon className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#365E52] block mb-1">
            POSSENSIOR EDITORIAL
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Koleksi Lookbook Segera Hadir
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Foto editorial dan visual kampanye terbaru sedang dipersiapkan. Semua foto lookbook terhubung langsung dari Supabase Storage.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onBackToStore}
              className="px-5 py-2.5 bg-[#365E52] hover:bg-[#2A4B41] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Jelajahi Produk
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Periksa Pembaruan
            </button>
          </div>
        </div>
      )}

      {/* Lookbook Editorial Grid */}
      {!loading && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {items.map((item, index) => {
              const isFailed = failedImageIds.has(item.id);
              if (isFailed) return null;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  onClick={() => setActiveItemIndex(index)}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  {/* Image Container with aspect ratio preservation */}
                  <div className="relative w-full aspect-[3/4] bg-slate-900 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title || `Lookbook POSSENSIOR ${index + 1}`}
                      onError={() => handleImageError(item.id)}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                      <div className="text-white flex items-center justify-between w-full">
                        <span className="text-xs font-semibold tracking-wider uppercase">
                          Lihat Detail
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Number Badge */}
                    <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-white/90">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Editorial Caption */}
                  {(item.title || item.description || item.season) && (
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white">
                      <div>
                        {item.season && (
                          <span className="text-[10px] font-bold tracking-widest text-[#365E52] uppercase block mb-1">
                            {item.season}
                          </span>
                        )}
                        {item.title && (
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide group-hover:text-[#365E52] transition-colors">
                            {item.title}
                          </h3>
                        )}
                        {item.description && (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Footer note acknowledging Supabase source */}
          <div className="mt-12 text-center text-xs text-slate-400">
            Total {items.length} potret editorial · Dikurasi oleh POSSENSIOR
          </div>
        </>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeItemIndex !== null && activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6"
            onClick={() => setActiveItemIndex(null)}
          >
            {/* Top Toolbar */}
            <div
              className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-white/80 text-xs font-mono">
                <span className="bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                  {activeItemIndex + 1} / {items.length}
                </span>
                {activeItem.season && (
                  <span className="hidden sm:inline-block bg-[#365E52]/60 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white">
                    {activeItem.season}
                  </span>
                )}
              </div>

              <button
                onClick={() => setActiveItemIndex(null)}
                className="p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer backdrop-blur-md"
                aria-label="Tutup Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Previous Button */}
            {items.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer backdrop-blur-md z-20"
                aria-label="Foto Sebelumnya"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Navigation Next Button */}
            {items.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer backdrop-blur-md z-20"
                aria-label="Foto Berikutnya"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Main Lightbox Content Area */}
            <div
              className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center justify-center p-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={activeItem.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                src={activeItem.image_url}
                alt={activeItem.title || 'Lookbook Full'}
                className="max-h-[72vh] sm:max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
              />

              {/* Caption Bar under image */}
              {(activeItem.title || activeItem.description) && (
                <div className="mt-4 text-center max-w-xl px-4 py-2 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 text-white">
                  {activeItem.title && (
                    <h4 className="text-sm font-bold uppercase tracking-wider">
                      {activeItem.title}
                    </h4>
                  )}
                  {activeItem.description && (
                    <p className="mt-1 text-xs text-white/70 font-normal leading-relaxed">
                      {activeItem.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
