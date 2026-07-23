import React, { useState } from 'react';
import { ArrowLeft, Camera, Lock, CheckCircle2, X } from 'lucide-react';
import { playClickSound } from '../utils/audio';
import { ALL_CARDS } from '../cardsData';
import { QuoteCard } from '../types';

interface GalleryViewProps {
  unlockedCards: string[];
  onBack: () => void;
  onScan: () => void;
  isIpad?: boolean;
}

export default function GalleryView({ unlockedCards, onBack, onScan, isIpad = false }: GalleryViewProps) {
  const [selectedCard, setSelectedCard] = useState<QuoteCard | null>(null);

  const totalCards = ALL_CARDS.length;
  const unlockedCount = unlockedCards.length;
  const progressPercent = Math.round((unlockedCount / totalCards) * 100);

  return (
    <div className={`flex-1 flex flex-col space-y-4 ${isIpad ? 'py-3 px-4' : 'py-2 px-1'} overflow-y-auto -mt-1 pb-4 relative`}>
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <button
          onClick={() => {
            playClickSound(400, 'sine');
            onBack();
          }}
          className="p-2 -ml-2 rounded-full hover:bg-brand-sand text-gray-500 transition active:scale-95 flex items-center gap-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-bold">返回</span>
        </button>
        <h2 className={`${isIpad ? 'text-2xl' : 'text-xl'} font-black text-gray-800 font-sans tracking-tight`}>我的圖鑑</h2>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Scan Button */}
      <button
        onClick={() => {
          playClickSound(500, 'sine');
          onScan();
        }}
        className={`w-full ${isIpad ? 'py-4 text-base' : 'py-3 text-sm'} bg-white hover:bg-gray-50 border-2 border-brand-sand rounded-2xl flex items-center justify-center gap-2 text-brand-moss font-bold shadow-sm transition active:scale-95 cursor-pointer`}
      >
        <Camera className={isIpad ? 'w-6 h-6' : 'w-5 h-5'} />
        <span>點擊掃描語錄卡</span>
      </button>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border-2 border-brand-sand shadow-sm space-y-2">
        <div className="flex justify-between items-center text-sm font-bold text-gray-700">
          <span>收集進度</span>
          <span>{progressPercent}% ({unlockedCount}/{totalCards})</span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-sage transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grid of Cards */}
      <div className={isIpad ? "grid grid-cols-4 md:grid-cols-5 gap-4 pt-2" : "grid grid-cols-3 gap-3 pt-2"}>
        {ALL_CARDS.map(card => {
          const isUnlocked = unlockedCards.includes(card.id);
          
          return (
            <div
              key={card.id}
              onClick={() => {
                if (isUnlocked) {
                  playClickSound(500, 'sine');
                  setSelectedCard(card);
                }
              }}
              className={`relative aspect-[3/4] rounded-xl border-2 overflow-hidden flex flex-col transition-all ${
                isUnlocked 
                  ? 'border-brand-sage bg-white shadow-sm cursor-pointer hover:shadow-md hover:scale-105 active:scale-95' 
                  : 'border-gray-200 bg-gray-50 grayscale opacity-70 cursor-not-allowed'
              }`}
            >
              {isUnlocked ? (
                <>
                  <div className="absolute top-1.5 right-1.5 z-10 bg-white rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-brand-sage fill-brand-sage/20" />
                  </div>
                  <img
                    src={card.imageUrl}
                    alt={`Card ${card.id}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <span className="text-white text-xs font-bold drop-shadow-sm">#{card.id}</span>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <Lock className="w-6 h-6 text-gray-300" />
                  <span className="text-xs font-bold text-gray-400">#{card.id}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            playClickSound(400, 'sine');
            setSelectedCard(null);
          }}
        >
          <div 
            className="bg-white p-5 sm:p-6 rounded-3xl shadow-2xl border-2 border-brand-sand max-w-xs sm:max-w-sm w-full flex flex-col items-center gap-4 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex justify-between items-center border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-brand-sand px-2.5 py-1 rounded-lg text-brand-moss">
                  #{selectedCard.id}
                </span>
                <span className="text-xs font-bold text-gray-400">語錄圖鑑</span>
              </div>
              <button
                onClick={() => {
                  playClickSound(400, 'sine');
                  setSelectedCard(null);
                }}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                title="關閉"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Illustration */}
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-brand-sand/50 shadow-inner bg-gray-50">
              <img 
                src={selectedCard.imageUrl} 
                alt={`Quote ${selectedCard.id}`}
                className="w-full h-full object-cover" 
              />
            </div>

            {/* Quote Content */}
            <div className="text-center px-2 py-1 space-y-1">
              <p className="text-base sm:text-lg font-bold text-slate-700 leading-relaxed font-sans">
                「{selectedCard.text}」
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                playClickSound(400, 'sine');
                setSelectedCard(null);
              }}
              className="w-full py-3 bg-brand-sage hover:bg-brand-moss text-white font-bold rounded-2xl shadow-sm transition active:scale-95 text-sm sm:text-base cursor-pointer"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

