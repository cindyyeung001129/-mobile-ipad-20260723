import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AnimatedPlant from './AnimatedPlant';
import { playClickSound, playSuccessChime, speakText } from '../utils/audio';
import { Sparkles, Volume2, Heart, ArrowRight, Droplets } from 'lucide-react';

interface HomeViewProps {
  onStartCheckIn: () => void;
  plantProgress: number;
  plantHeight: number;
  latestMoodLabel: string;
  wateredCount: number;
  lastWatered: string | null;
  onNavigateToGarden: () => void;
  onNavigateToExchange?: () => void;
  onWaterPlant?: () => boolean;
  isIpad?: boolean;
}

export default function HomeView({
  onStartCheckIn,
  plantProgress,
  plantHeight,
  latestMoodLabel,
  wateredCount,
  lastWatered,
  onNavigateToGarden,
  onNavigateToExchange,
  onWaterPlant,
  isIpad = false
}: HomeViewProps) {
  const [greeting, setGreeting] = useState('☀️ 早晨，今日慢慢開始');
  const [showWaterEffect, setShowWaterEffect] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [earnedWaterPoint, setEarnedWaterPoint] = useState(false);

  // Set the greeting based on the current local time dynamically!
  useEffect(() => {
    const updateGreeting = () => {
      const hours = new Date().getHours();
      if (hours >= 5 && hours < 12) {
        setGreeting('☀️ 早晨，今日慢慢開始');
      } else if (hours >= 12 && hours < 18) {
        setGreeting('🍵 午安，放慢腳步稍息一下');
      } else {
        setGreeting('🌙 晚安，今天你辛苦了，好好休息');
      }
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSpeakGreeting = () => {
    speakText(`${greeting}。請點擊「今日心情記錄」按鈕記錄你今天的心情。`);
  };

  const handleWater = () => {
    playSuccessChime();
    setShowWaterEffect(true);

    let isFirstTimeToday = false;
    if (onWaterPlant) {
      isFirstTimeToday = onWaterPlant();
    }
    setEarnedWaterPoint(isFirstTimeToday);
    setShowToast(true);

    setTimeout(() => {
      setShowWaterEffect(false);
    }, 2400);

    setTimeout(() => {
      setShowToast(false);
    }, 2200);
  };

  return (
    <div className={`flex-1 flex flex-col ${isIpad ? 'space-y-4 py-3 px-6 overflow-y-auto pb-6' : 'space-y-2 py-1 px-1 overflow-y-auto -mt-1 pb-4'}`}>
      {/* Card 1: Dynamic Greeting Card */}
      <div className={`bg-[#f9f7f2] rounded-2xl border-2 border-brand-sand/60 shadow-xs flex items-center justify-between shrink-0 ${isIpad ? 'px-6 py-3.5' : 'px-4 py-2'}`}>
        <h1 className={`${isIpad ? 'text-lg md:text-xl' : 'text-[14px] sm:text-[15px]'} font-black text-brand-moss font-sans tracking-tight`}>
          {greeting}
        </h1>
        <button
          onClick={handleSpeakGreeting}
          className="p-2 rounded-full hover:bg-brand-sand text-brand-moss transition active:scale-90"
          title="朗讀問候語"
          style={{ minHeight: isIpad ? '48px' : '40px', minWidth: isIpad ? '48px' : '40px' }}
        >
          <Volume2 className={isIpad ? 'w-6 h-6' : 'w-4.5 h-4.5'} />
        </button>
      </div>

      {isIpad ? (
        /* iPad 4:3 Side-By-Side Layout */
        <div className="grid grid-cols-2 gap-5 flex-1 items-stretch">
          {/* Left Column: Interactive Plant & Garden Entry Card */}
          <div className="bg-white px-5 py-4 rounded-2xl border-2 border-[#e6dfd3] shadow-xs flex flex-col items-center justify-between relative h-full">
            <div
              onClick={handleWater}
              className="cursor-pointer active:scale-95 transition-transform duration-200 w-full flex-1 flex flex-col items-center justify-center relative group"
              title="點擊給小綠澆水！"
            >
              {/* Gift exchange button top left */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playClickSound(580, 'sine');
                  if (onNavigateToExchange) {
                    onNavigateToExchange();
                  } else {
                    onNavigateToGarden();
                  }
                }}
                className="absolute top-2 left-2 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full text-xs font-black border border-amber-300 shadow-xs flex items-center gap-1.5 hover:bg-amber-100 transition active:scale-95 z-20 cursor-pointer"
                style={{ minHeight: '36px' }}
              >
                <span>🎁 換禮物</span>
              </button>

              {/* Watering hint badge top right */}
              <div className="absolute top-2 right-2 bg-sky-50 text-sky-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-sky-200 shadow-xs flex items-center gap-1.5 z-10">
                <Droplets className="w-4 h-4 text-sky-500 fill-sky-200 animate-bounce" />
                <span>點擊澆水</span>
              </div>

              <div className="transform scale-105 my-2">
                <AnimatedPlant
                  progress={plantProgress}
                  moodLabel={latestMoodLabel}
                  heightCm={plantHeight}
                  isWatering={showWaterEffect}
                />
              </div>

              <AnimatePresence>
                {showToast && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: -25 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute text-sky-500 z-30 pointer-events-none flex items-center gap-1.5 bg-sky-50/95 px-4 py-2 rounded-full border border-sky-200 shadow-md"
                  >
                    <Droplets className="w-4.5 h-4.5 fill-sky-400 text-sky-600 animate-pulse" />
                    <span className="text-xs font-black text-sky-800">
                      {earnedWaterPoint 
                        ? '💧 成功澆水 +1 積分！小綠好開心～' 
                        : '💧 成功澆水！小綠好開心～'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Garden Entry Button */}
            <div className="w-full flex justify-center pt-2 z-20">
              <button
                onClick={() => {
                  playClickSound(580, 'sine');
                  onNavigateToGarden();
                }}
                className="w-full py-3 bg-brand-sage/20 hover:bg-brand-sage/35 text-brand-moss rounded-full text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 border-2 border-brand-sage/40 active:scale-95 shadow-xs"
                style={{ minHeight: '44px' }}
              >
                <span>🌳 進入我的花園</span>
              </button>
            </div>
          </div>

          {/* Right Column: Action Buttons parallel to left card */}
          <div className="flex flex-col justify-between gap-5 h-full">
            {/* Action Card 1: Check-in */}
            <div className="bg-white p-6 rounded-2xl border-2 border-[#e6dfd3] shadow-xs flex-1 flex flex-col justify-center space-y-3">
              <span className="text-sm font-extrabold text-brand-moss/80 block">記錄今天的心情體驗</span>
              <motion.button
                onClick={() => {
                  playClickSound(660, 'sine');
                  onStartCheckIn();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full py-4 bg-[#8DBA88] hover:bg-[#8DBA88]/90 text-white rounded-full text-lg font-black shadow-md flex items-center justify-center transition-colors cursor-pointer border-0"
                style={{ minHeight: '52px' }}
              >
                <div className="absolute left-6 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-brand-ochre animate-pulse" />
                </div>
                <span className="tracking-wide">今日心情記錄</span>
              </motion.button>
            </div>

            {/* Action Card 2: Scan */}
            <div className="bg-white p-6 rounded-2xl border-2 border-[#e6dfd3] shadow-xs flex-1 flex flex-col justify-center space-y-3">
              <span className="text-sm font-extrabold text-brand-moss/80 block">解鎖溫馨語錄卡</span>
              <motion.button
                onClick={() => {
                  playClickSound(500, 'sine');
                  (window as any).startScanFlow && (window as any).startScanFlow();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full py-4 bg-[#D4B896] hover:bg-[#D4B896]/90 text-white rounded-full text-lg font-black shadow-md flex items-center justify-center transition-colors cursor-pointer border-0"
                style={{ minHeight: '52px' }}
              >
                <div className="absolute left-6 flex items-center justify-center">
                  <span className="text-xl">📷</span>
                </div>
                <span className="tracking-wide">掃描語錄卡</span>
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        /* Mobile Phone Layout (Unchanged) */
        <>
          {/* Card 2: Central Interactive Plant & Garden Entry Card */}
          <div className="bg-white px-3 py-3 rounded-2xl border-2 border-[#e6dfd3] shadow-sm flex flex-col items-center justify-between relative flex-1 min-h-[250px] -mt-0.5">
            
            {/* Interactive Plant Area (Click to water!) */}
            <div
              onClick={handleWater}
              className="cursor-pointer active:scale-95 transition-transform duration-200 w-full flex-1 flex flex-col items-center justify-center pt-1 pb-4 relative group"
              title="點擊給小綠澆水！"
            >
              {/* Gift exchange button top left of plant */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playClickSound(580, 'sine');
                  if (onNavigateToExchange) {
                    onNavigateToExchange();
                  } else {
                    onNavigateToGarden();
                  }
                }}
                className="absolute top-1 left-2 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full text-xs font-black border border-amber-300 shadow-xs flex items-center gap-1 hover:bg-amber-100 transition active:scale-95 z-20 cursor-pointer"
                style={{ minHeight: '32px' }}
                title="點擊進入換禮物處"
              >
                <span>🎁 換禮物</span>
              </button>

              {/* Watering hint badge top right of plant */}
              <div className="absolute top-1 right-2 bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full text-xs font-bold border border-sky-200 shadow-xs flex items-center gap-1 hover:bg-sky-100 transition active:scale-95 z-10">
                <Droplets className="w-3.5 h-3.5 text-sky-500 fill-sky-200 animate-bounce" />
                <span>點擊澆水</span>
              </div>

              <AnimatedPlant
                progress={plantProgress}
                moodLabel={latestMoodLabel}
                heightCm={plantHeight}
                isWatering={showWaterEffect}
              />

              {/* Floating water droplets toast animation */}
              <AnimatePresence>
                {showToast && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: -25 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute text-sky-500 z-30 pointer-events-none flex items-center gap-1 bg-sky-50/95 px-3.5 py-1.5 rounded-full border border-sky-200 shadow-md"
                  >
                    <Droplets className="w-4 h-4 fill-sky-400 text-sky-600 animate-pulse" />
                    <span className="text-xs font-black text-sky-800">
                      {earnedWaterPoint 
                        ? '💧 成功澆水 +1 積分！小綠好開心～' 
                        : '💧 成功澆水！小綠好開心～'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Centered & Elevated Garden Entry Button */}
            <div className="w-full flex justify-center pb-2 z-20">
              <button
                onClick={() => {
                  playClickSound(580, 'sine');
                  onNavigateToGarden();
                }}
                className="w-auto px-6 py-2.5 bg-brand-sage/20 hover:bg-brand-sage/35 text-brand-moss rounded-full text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 border-2 border-brand-sage/40 active:scale-95 shadow-xs"
                style={{ minHeight: '40px' }}
              >
                <span>🌳 進入我的花園</span>
              </button>
            </div>
          </div>

          {/* Action Cards Container */}
          <div className="flex flex-col gap-2 shrink-0 w-full">
            {/* Card 3: Prominent Emotion Check-In Action Card */}
            <div className="bg-white px-3 py-2.5 rounded-2xl border-2 border-[#e6dfd3] shadow-sm w-full">
              <motion.button
                onClick={() => {
                  playClickSound(660, 'sine');
                  onStartCheckIn();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full py-3 bg-[#8DBA88] hover:bg-[#8DBA88]/90 text-white rounded-[100px] text-[16px] font-black shadow-[0_4px_12px_rgba(141,186,136,0.35)] flex items-center justify-center transition-colors cursor-pointer border-0"
                style={{ minHeight: '48px' }}
              >
                <div className="absolute left-5 flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-brand-ochre animate-pulse" />
                </div>
                <span className="tracking-wide">今日心情記錄</span>
              </motion.button>
            </div>

            {/* Card 4: Scan Card */}
            <div className="bg-white px-3 py-2.5 rounded-2xl border-2 border-[#e6dfd3] shadow-sm w-full">
              <motion.button
                onClick={() => {
                  playClickSound(500, 'sine');
                  (window as any).startScanFlow && (window as any).startScanFlow();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full py-3 bg-[#D4B896] hover:bg-[#D4B896]/90 text-white rounded-[100px] text-[16px] font-black shadow-[0_4px_12px_rgba(212,184,150,0.35)] flex items-center justify-center transition-colors cursor-pointer border-0"
                style={{ minHeight: '48px' }}
              >
                <div className="absolute left-5 flex items-center justify-center">
                  <span className="text-lg">📷</span>
                </div>
                <span className="tracking-wide">掃描語錄卡</span>
              </motion.button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
