import React, { useState } from 'react';
import { ArrowLeft, Camera, Sparkles, CheckCircle, Search, ArrowRight } from 'lucide-react';
import { playClickSound, playSuccessChime } from '../utils/audio';
import { ALL_CARDS } from '../cardsData';
import { QuoteCard } from '../types';

interface ScannerViewProps {
  unlockedCards: string[];
  onUnlock: (cardId: string) => void;
  onClose: () => void;
  onGoToGallery: () => void;
}

export default function ScannerView({ unlockedCards, onUnlock, onClose, onGoToGallery }: ScannerViewProps) {
  const [scanState, setScanState] = useState<'scanning' | 'success'>('scanning');
  const [unlockedCard, setUnlockedCard] = useState<QuoteCard | null>(null);
  const [manualCode, setManualCode] = useState('');

  const totalCards = ALL_CARDS.length;
  const unlockedCount = unlockedCards.length;

  const handleScanSuccess = () => {
    // Find a random locked card, or just unlock #003 for demo
    const lockedCards = ALL_CARDS.filter(c => !unlockedCards.includes(c.id));
    
    let cardToUnlock: QuoteCard;
    if (lockedCards.length > 0) {
      // Pick random locked
      cardToUnlock = lockedCards[Math.floor(Math.random() * lockedCards.length)];
    } else {
      // Already unlocked all, pick a random one anyway
      cardToUnlock = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
    }

    setUnlockedCard(cardToUnlock);
    onUnlock(cardToUnlock.id);
    playSuccessChime();
    setScanState('success');
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleScanSuccess();
  };

  if (scanState === 'success' && unlockedCard) {
    return (
      <div className="h-full w-full flex flex-col bg-[#fdfaf6] p-4 absolute inset-0 z-50">
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center pt-8">
          <button
            onClick={() => {
              playClickSound(400, 'sine');
              onClose();
            }}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 text-gray-700 transition active:scale-95 flex items-center gap-1"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold">返回</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-black text-gray-800">解鎖成功！</h2>
          </div>

          {/* Bookmarl Style Card */}
          <div className="bg-white p-4 rounded-2xl shadow-xl border-2 border-brand-sand w-[220px] aspect-[1/2] flex flex-col transform transition-all hover:scale-105">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-400">語錄圖鑑</span>
              <span className="text-xs font-black bg-brand-sand px-2 py-1 rounded-md text-brand-moss">#{unlockedCard.id}</span>
            </div>
            
            <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 border border-gray-100">
              <img src={unlockedCard.imageUrl} alt="Quote" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 flex items-center justify-center text-center">
              <p className="text-sm font-bold text-gray-700 leading-relaxed">
                「{unlockedCard.text}」
              </p>
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-brand-sage font-bold flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> 已加入你的語錄圖鑑
            </p>
            <p className="text-xs text-gray-500 font-bold">
              已收集：{unlockedCards.includes(unlockedCard.id) ? unlockedCount : unlockedCount + 1} / {totalCards} 張
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3 pb-6 shrink-0">
          <button
            onClick={() => {
              playClickSound(500, 'sine');
              onGoToGallery();
            }}
            className="flex-1 py-3.5 bg-white border-2 border-brand-sand text-gray-700 font-bold rounded-2xl active:scale-95 transition"
          >
            前往我的圖鑑
          </button>
          <button
            onClick={() => {
              playClickSound(600, 'sine');
              setScanState('scanning');
              setManualCode('');
            }}
            className="flex-1 py-3.5 bg-brand-sage text-white font-bold rounded-2xl shadow-sm active:scale-95 transition"
          >
            繼續掃
          </button>
        </div>
      </div>
    );
  }

  // SCANNING STATE
  return (
    <div className="h-full w-full flex flex-col bg-gray-900 absolute inset-0 z-50">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pt-8 pb-10">
        <button
          onClick={() => {
            playClickSound(400, 'sine');
            onClose();
          }}
          className="p-2 -ml-2 rounded-full hover:bg-white/20 text-white transition active:scale-95 flex items-center gap-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-bold">返回</span>
        </button>
        <h2 className="text-lg font-black text-white tracking-tight">掃描語錄卡</h2>
        <div className="w-16" />
      </div>

      {/* Mock Camera Area */}
      <div 
        onClick={() => {
          playClickSound(700, 'sine');
          handleScanSuccess();
        }}
        className="flex-1 relative flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 transition"
      >
        {/* Mock camera blurred background */}
        <div className="absolute inset-0 bg-gray-800 opacity-50 blur-sm"></div>
        
        {/* Scanner frame */}
        <div className="relative w-64 h-64 border-2 border-white/40 rounded-3xl flex flex-col items-center justify-center z-10 bg-black/20 backdrop-blur-sm shadow-2xl">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-sage rounded-tl-3xl -mt-1 -ml-1"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-sage rounded-tr-3xl -mt-1 -mr-1"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-sage rounded-bl-3xl -mb-1 -ml-1"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-sage rounded-br-3xl -mb-1 -mr-1"></div>
          
          <Camera className="w-10 h-10 text-white/80 mb-3" />
          <span className="text-white font-bold text-sm">點擊模擬掃描語錄卡</span>
        </div>
      </div>

      {/* Instructions & Manual Input Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-20 space-y-4 pb-8">
        <div className="flex items-center justify-center gap-2 text-brand-moss font-bold text-sm mb-4">
          <Sparkles className="w-4 h-4 text-brand-ochre" />
          <span>或者手動輸入完整語錄卡牌文字</span>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-gray-50 border-2 border-brand-sand rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-sage transition"
            />
            <button
              onClick={handleManualSubmit}
              className="px-4 bg-brand-sage hover:bg-brand-moss text-white rounded-xl font-bold transition active:scale-95 flex items-center justify-center"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-brand-sand text-center">
          <p className="text-xs font-bold text-gray-400">
            已收集：<span className="text-brand-moss">{unlockedCount} / {totalCards}</span> 張
          </p>
        </div>
      </div>
    </div>
  );
}
