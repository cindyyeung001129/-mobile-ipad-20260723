import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SOS_EXERCISES } from '../moodsData';
import { playClickSound, startCalmingDrone, stopCalmingDrone, speakText, stopSpeaking } from '../utils/audio';
import { ShieldAlert, Wind, Eye, Music, Volume2, VolumeX, HelpCircle, Sparkles, CheckCircle2, RefreshCw, Play, Square } from 'lucide-react';

const HAVEN_PASSAGES = [
  {
    title: "課後放鬆",
    guide: "想像你完成了一天的學習，正坐在最舒服的小椅子上。試著把肩膀放鬆下來，喝一口溫暖的水，深深地吐出一口氣。現在不需要擔心任何作業或考試，這是專屬於你的放鬆時間。",
    quote: "「你今天已經非常努力了！不論做得怎麼樣，都給自己一個大大的讚。」"
  },
  {
    title: "溫暖小抱枕",
    guide: "想像你抱著一個又軟又暖的大抱枕，或是你最喜歡的毛絨玩偶。你可以把頭輕輕靠在上面，聽聽自己平穩的呼吸聲。軟綿綿的抱枕正溫柔地支撐著你，讓你感到無比安心。",
    quote: "「有各種情緒都是很正常的。累了就抱抱自己，休息一下再出發。」"
  },
  {
    title: "看窗外綠樹",
    guide: "想像你正靜靜地看著窗外的大樹，綠色的樹葉在微風中輕輕搖擺，小鳥在樹枝上跳躍。深深吸一口氣，感覺自己就像小樹一樣，在溫暖的陽光下安靜、有力量地成長。",
    quote: "「就像樹木慢慢長大一樣，給自己一點時間，你可以照著自己的節奏進步。」"
  },
  {
    title: "安心小房間",
    guide: "想像你正待在一個最舒服、最安全的房間裡。裡面放著你喜歡的書本和玩具，燈光柔和又溫暖。這裡非常安靜，你可以隨心所欲地休息，感覺身體完全放鬆下來。",
    quote: "「遇到困難時沒關係，你可以隨時回到這個安靜的地方，讓心平靜下來。」"
  },
  {
    title: "喝口溫暖的水",
    guide: "想像你雙手握著一杯溫暖的水，慢慢喝下一口。感覺溫熱的水流進肚子裡，把全身的緊張和不開心都慢慢帶走。你可以再做一次深呼吸，感受身體變得很放鬆、很舒服。",
    quote: "「照顧好自己的身體和心情，就是每天最重要、最棒的一件事。」"
  },
  {
    title: "快樂隨意畫",
    guide: "想像你拿著彩色的畫筆，在白紙上隨意畫出喜歡的圖案與漂亮的顏色。不需要在乎畫得好不好看，只要享受畫畫時這種自由又快樂的感覺，把所有心情都畫出來。",
    quote: "「每個人都是獨一無二的，做最真實、最可愛的你自己就非常好。」"
  }
];

interface FirstAidViewProps {
  onGoToHome?: () => void;
  onAwardFirstAidPoint?: () => boolean;
  isIpad?: boolean;
}

export default function FirstAidView({ onGoToHome, onAwardFirstAidPoint, isIpad = false }: FirstAidViewProps) {
  const [activeTool, setActiveTool] = useState<'breathing' | 'grounding' | 'haven'>('breathing');
  const [isDroneActive, setIsDroneActive] = useState(false);
  const [pointEarnedNotice, setPointEarnedNotice] = useState(false);

  // Safe Haven States
  const [isGuiding, setIsGuiding] = useState(false);
  const [currentPassageIdx, setCurrentPassageIdx] = useState<number>(0);

  // Breathing States
  const [breathingPhase, setBreathingPhase] = useState<'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'completed'>('idle');
  const [breathingTimer, setBreathingTimer] = useState(0);
  const [breathingCycleCount, setBreathingCycleCount] = useState(0);
  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Grounding states
  const [groundingStep, setGroundingStep] = useState(1);
  const [groundingChecked, setGroundingChecked] = useState<Record<number, boolean>>({});
  const [isGroundingStarted, setIsGroundingStarted] = useState(false);
  const [isGroundingFinished, setIsGroundingFinished] = useState(false);

  // Voice Enable States (Muted by default)
  const [isVoiceEnabled, setIsVoiceEnabledState] = useState(false);
  const isVoiceEnabledRef = useRef(false);

  const toggleVoice = (currentTextIfEnabled?: string) => {
    const nextVal = !isVoiceEnabled;
    setIsVoiceEnabledState(nextVal);
    isVoiceEnabledRef.current = nextVal;
    
    if (nextVal) {
      playClickSound(560, 'sine');
      if (currentTextIfEnabled) {
        speakText(currentTextIfEnabled);
      }
    } else {
      playClickSound(400, 'sine');
      stopSpeaking();
    }
  };

  const safeSpeak = (text: string) => {
    if (isVoiceEnabledRef.current) {
      speakText(text);
    }
  };

  const clearBreathingTimer = () => {
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
      clearTimeout(breathingIntervalRef.current as any);
      breathingIntervalRef.current = null;
    }
  };

  // Clean up timers & audio drones on unmount
  useEffect(() => {
    return () => {
      clearBreathingTimer();
      stopCalmingDrone();
    };
  }, []);

  // Breathing loop controller
  const startBreathingLoop = () => {
    playClickSound(520, 'sine');
    setBreathingCycleCount(0);
    clearBreathingTimer();
    
    // Cycle starts with Inhale (4 seconds)
    runInhalePhase();
  };

  const stopBreathingLoop = () => {
    playClickSound(300, 'sine');
    clearBreathingTimer();
    setBreathingPhase('idle');
    setBreathingTimer(0);
  };

  const runInhalePhase = () => {
    clearBreathingTimer();
    setBreathingPhase('inhale');
    setBreathingTimer(4);
    safeSpeak('慢慢吸氣，感受身體放鬆。');
    
    let counter = 4;
    breathingIntervalRef.current = setInterval(() => {
      counter--;
      setBreathingTimer(counter);
      if (counter <= 0) {
        clearBreathingTimer();
        runHold1Phase();
      }
    }, 1000);
  };

  const runHold1Phase = () => {
    clearBreathingTimer();
    setBreathingPhase('hold1');
    setBreathingTimer(4);
    safeSpeak('閉住呼吸，安頓心靈。');

    let counter = 4;
    breathingIntervalRef.current = setInterval(() => {
      counter--;
      setBreathingTimer(counter);
      if (counter <= 0) {
        clearBreathingTimer();
        runExhalePhase();
      }
    }, 1000);
  };

  const runExhalePhase = () => {
    clearBreathingTimer();
    setBreathingPhase('exhale');
    setBreathingTimer(4);
    safeSpeak('慢慢呼氣，吐出所有壓力和煩惱。');

    let counter = 4;
    breathingIntervalRef.current = setInterval(() => {
      counter--;
      setBreathingTimer(counter);
      if (counter <= 0) {
        clearBreathingTimer();
        runHold2Phase();
      }
    }, 1000);
  };

  const runHold2Phase = () => {
    clearBreathingTimer();
    setBreathingPhase('hold2');
    setBreathingTimer(4);
    safeSpeak('閉住呼吸，保持平靜。');

    let counter = 4;
    breathingIntervalRef.current = setInterval(() => {
      counter--;
      setBreathingTimer(counter);
      if (counter <= 0) {
        clearBreathingTimer();
        
        setBreathingCycleCount((prev) => {
          const newCount = prev + 1;
          
          if (onAwardFirstAidPoint) {
            const awarded = onAwardFirstAidPoint();
            if (awarded) setPointEarnedNotice(true);
          }

          setBreathingPhase('completed');
          setBreathingTimer(0);

          if (newCount < 3) {
            safeSpeak(`第 ${newCount} 輪完成。稍作休息，準備下一輪。`);
            breathingIntervalRef.current = setTimeout(() => {
              runInhalePhase();
            }, 2500) as unknown as NodeJS.Timeout;
          } else {
            safeSpeak('恭喜你完成了三輪呼吸練習，做得太棒了！');
            breathingIntervalRef.current = setTimeout(() => {
              setBreathingPhase('idle');
              setBreathingTimer(0);
            }, 3000) as unknown as NodeJS.Timeout;
          }

          return newCount;
        });
      }
    }, 1000);
  };

  // Toggle synthesized low-frequency calming drone
  const handleToggleDrone = () => {
    const nextState = !isDroneActive;
    setIsDroneActive(nextState);
    playClickSound(nextState ? 600 : 300, 'sine');
    if (nextState) {
      startCalmingDrone();
    } else {
      stopCalmingDrone();
    }
  };

  const toggleGroundingCheck = (stepNum: number) => {
    playClickSound(480, 'sine');
    setGroundingChecked((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  return (
    <div className="flex-1 flex flex-col p-1 space-y-2.5 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-5 h-5 text-brand-terracotta" />
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 font-sans tracking-tight">心靈休息站</h2>
        </div>
      </div>

      {/* Segmented control for tools */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-brand-sand rounded-2xl border-2 border-brand-sand shrink-0">
        {[
          { id: 'breathing', label: '呼吸練習', icon: <Wind className="w-4 h-4" /> },
          { id: 'grounding', label: '五感著陸', icon: <Eye className="w-4 h-4" /> },
          { id: 'haven', label: '安心小基地', icon: <HelpCircle className="w-4 h-4" /> }
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              playClickSound(500, 'sine');
              setActiveTool(tool.id as any);
              setIsVoiceEnabledState(false);
              isVoiceEnabledRef.current = false;
              stopSpeaking();
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition duration-150 cursor-pointer ${
              activeTool === tool.id
                ? 'bg-white text-brand-moss font-black shadow-xs'
                : 'text-gray-600 hover:bg-white/40 font-bold'
            }`}
            style={{ minHeight: '40px' }}
          >
            {tool.icon}
            <span className="text-xs sm:text-sm font-sans font-bold tracking-tight mt-0.5">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Sound drone generator control */}
      <div className="bg-[#fcfbf9] px-3 py-2 rounded-xl border-2 border-brand-sand/60 shadow-xs flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg transition ${isDroneActive ? 'bg-brand-sage/20 text-brand-moss animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-brand-moss">療癒共鳴音</h4>
            <p className="text-xs font-bold text-gray-500 leading-tight">幫助腦波平靜 (Web Audio 合鳴)</p>
          </div>
        </div>
        <button
          onClick={handleToggleDrone}
          className={`text-xs px-3 py-1.5 rounded-full font-black border transition duration-200 cursor-pointer ${
            isDroneActive
              ? 'bg-brand-sage border-brand-sage text-white shadow-xs'
              : 'bg-white border-brand-sand/80 text-brand-moss hover:bg-brand-sand/30'
          }`}
          style={{ minHeight: '32px' }}
        >
          {isDroneActive ? '⏹ 關閉' : '▶ 播放'}
        </button>
      </div>

      {/* Main Container Area */}
      <div className="flex-1 bg-white rounded-2xl border-2 border-brand-sand p-3 sm:p-4 shadow-sm flex flex-col justify-center items-center overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          {activeTool === 'breathing' && (
            <motion.div
              key="breathing"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 flex flex-col items-center justify-center space-y-3.5 my-auto w-full max-w-sm"
            >
              <div className="text-center space-y-1">
                <h3 className="text-base sm:text-lg font-black text-gray-800">🌬️ 4-4-4-4 方形呼吸法</h3>
                <p className="text-xs sm:text-sm font-bold text-brand-moss">吸氣 4 秒 · 閉氣 4 秒 · 呼氣 4 秒 · 閉氣 4 秒</p>
              </div>

              {/* Dynamic step visual card */}
              <div className="bg-gradient-to-br from-brand-sand/15 via-white to-brand-sage/10 rounded-2xl p-3 sm:p-4 border-2 border-brand-sand/80 shadow-xs space-y-3 w-full flex flex-col items-center justify-center">
                <p className="text-xs sm:text-sm font-black text-gray-700 text-center select-none">跟著方形慢慢呼吸，幫助身體放鬆：</p>
                
                {/* Breathing Circle Visualizer in the center */}
                <div className="flex justify-center my-1">
                  <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
                    {/* Outer pulsing ring */}
                    <motion.div
                      className="absolute rounded-2xl border-2 border-brand-sage/40"
                      animate={{
                        scale:
                          breathingPhase === 'inhale' ? [1, 1.35] :
                          breathingPhase === 'hold1' ? 1.35 :
                          breathingPhase === 'hold2' ? 1 :
                          breathingPhase === 'completed' ? 1.1 :
                          breathingPhase === 'exhale' ? [1.35, 1] : 1,
                        opacity: breathingPhase === 'idle' ? 0.3 : [0.5, 0.9, 0.5]
                      }}
                      transition={{
                        duration: breathingPhase === 'completed' ? 0.5 : 4,
                        ease: 'easeInOut',
                        repeat: breathingPhase === 'idle' ? Infinity : 0
                      }}
                      style={{ width: '100%', height: '100%' }}
                    />

                    {/* Main animated ball */}
                    <motion.div
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm border-2"
                      style={{
                        backgroundColor:
                          breathingPhase === 'inhale' ? '#e2ece3' :
                          breathingPhase === 'hold1' ? '#fbf4e8' :
                          breathingPhase === 'exhale' ? '#fbeee9' :
                          breathingPhase === 'hold2' ? '#eef2f5' :
                          breathingPhase === 'completed' ? '#d1fae5' : '#f5f1e9',
                        borderColor:
                          breathingPhase === 'inhale' ? '#8ca48e' :
                          breathingPhase === 'hold1' ? '#f2cc8f' :
                          breathingPhase === 'exhale' ? '#df7a5e' :
                          breathingPhase === 'hold2' ? '#a5b4c4' :
                          breathingPhase === 'completed' ? '#34d399' : '#a8bfa9',
                      }}
                      animate={{
                        scale:
                          breathingPhase === 'inhale' ? [1, 1.35] :
                          breathingPhase === 'hold1' ? 1.35 :
                          breathingPhase === 'hold2' ? 1 :
                          breathingPhase === 'completed' ? 1.1 :
                          breathingPhase === 'exhale' ? [1.35, 1] : 1,
                      }}
                      transition={{
                        duration: breathingPhase === 'completed' ? 0.5 : 4,
                        ease: 'linear',
                      }}
                    >
                      <div className="flex flex-col items-center justify-center rounded-full origin-center">
                        <span className="text-xs sm:text-sm font-black text-gray-800 tracking-wider">
                          {breathingPhase === 'idle' && '已準備'}
                          {breathingPhase === 'inhale' && '吸氣'}
                          {breathingPhase === 'hold1' && '閉氣'}
                          {breathingPhase === 'hold2' && '閉氣'}
                          {breathingPhase === 'exhale' && '呼氣'}
                          {breathingPhase === 'completed' && '完成'}
                        </span>
                        {breathingPhase !== 'idle' && breathingPhase !== 'completed' && (
                          <span className="text-lg sm:text-xl font-black text-brand-moss font-mono mt-0.5">
                            {breathingTimer}
                          </span>
                        )}
                        {breathingPhase === 'completed' && (
                          <span className="text-[10px] sm:text-xs font-black text-emerald-700 mt-0.5">
                            {breathingCycleCount}/3 輪
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Center status prompt */}
                <div className="text-center bg-brand-sand/20 rounded-xl px-3 py-1.5 w-full border border-brand-sand/40">
                  <p className="text-xs sm:text-sm font-black text-emerald-800 tracking-tight">
                    {breathingPhase === 'idle' && '準備好後按下方開始'}
                    {breathingPhase === 'inhale' && '🌟 吸氣...肚子慢慢鼓起來'}
                    {breathingPhase === 'hold1' && '⏹️ 閉住呼吸...平靜感覺'}
                    {breathingPhase === 'hold2' && '⏹️ 閉住呼吸...保持平靜'}
                    {breathingPhase === 'exhale' && '🍃 慢慢呼氣...釋放所有緊繃'}
                    {breathingPhase === 'completed' && (
                      breathingCycleCount < 3 
                        ? `🎉 完成第 ${breathingCycleCount} 輪！2 秒後自動開始下一輪...` 
                        : '🎉 三輪練習已完成！給自己一個掌聲！'
                    )}
                  </p>
                </div>
              </div>

              {/* Breathing Tool Action Bar */}
              <div className="flex gap-2.5 w-full max-w-[270px] sm:max-w-[360px] mx-auto items-center justify-center">
                {breathingPhase === 'idle' ? (
                  <button
                    onClick={startBreathingLoop}
                    className="flex-1 py-3 bg-brand-sage hover:bg-brand-moss text-white rounded-full text-xs sm:text-sm font-black tracking-wider transition shadow-sm active:scale-95 cursor-pointer border-0 flex items-center justify-center gap-2"
                    style={{ minHeight: '44px' }}
                  >
                    <Play className="w-4 h-4 fill-white shrink-0" />
                    <span>開始呼吸練習</span>
                  </button>
                ) : (
                  <button
                    onClick={stopBreathingLoop}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs sm:text-sm font-black tracking-wider transition shadow-sm active:scale-95 cursor-pointer border-0 flex items-center justify-center gap-2"
                    style={{ minHeight: '44px' }}
                  >
                    <Square className="w-4 h-4 fill-white shrink-0" />
                    <span>停止練習</span>
                  </button>
                )}

                {/* Voice Toggle Button */}
                <button
                  onClick={() => toggleVoice("呼吸練習。吸氣四秒，閉氣四秒，呼氣四秒，閉氣四秒。跟著方形的縮放，讓我們一起放鬆。")}
                  className={`p-2.5 border rounded-xl cursor-pointer active:scale-95 transition flex items-center justify-center shrink-0 ${
                    isVoiceEnabled 
                      ? 'bg-brand-sage text-white border-brand-sage hover:bg-brand-moss' 
                      : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                  }`}
                  style={{ minHeight: '44px', minWidth: '44px' }}
                  title="語音引導開關"
                >
                  {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              <div className="text-center select-none">
                <p className="text-xs font-medium text-slate-400">建議在家長或教師陪同下進行</p>
              </div>
            </motion.div>
          )}

          {activeTool === 'grounding' && (
            <motion.div
              key="grounding"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 flex flex-col items-center justify-center space-y-3.5 my-auto w-full max-w-sm"
            >
              {!isGroundingStarted ? (
                /* Entrance Landing Page */
                <div className="w-full flex flex-col items-center justify-center space-y-3.5">
                  <div className="text-center space-y-1">
                    <div className="w-14 h-14 bg-brand-sage/10 text-brand-sage rounded-full flex items-center justify-center mx-auto shadow-inner border border-brand-sage/20">
                      <Eye className="w-7 h-7" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-gray-800">5-4-3-2-1 五感著陸</h3>
                    <p className="text-xs sm:text-sm font-bold text-gray-600 leading-relaxed max-w-xs mx-auto">
                      一個協助你回到當下的練習 🌸
                    </p>
                  </div>


                  <div className="space-y-2 w-full text-center">
                    <div className="flex gap-2.5 w-full max-w-[270px] sm:max-w-[360px] mx-auto items-center justify-center">
                      <button
                        onClick={() => {
                          playClickSound(580, 'sine');
                          setIsGroundingStarted(true);
                          setIsGroundingFinished(false);
                          setGroundingStep(1);
                          setGroundingChecked({});
                          safeSpeak("開始五感著陸練習。第一步，視覺：尋找 5 件目光所及的事物。觀看身處空間內的事物即可，例如窗外的樹、桌上的筆、牆上的時鐘。");
                        }}
                        className="flex-1 py-3 bg-brand-sage hover:bg-brand-moss text-white rounded-full text-xs sm:text-sm font-black tracking-wider transition shadow-sm active:scale-95 cursor-pointer border-0 flex items-center justify-center gap-2"
                        style={{ minHeight: '44px' }}
                      >
                        <Play className="w-4 h-4 fill-white shrink-0" />
                        <span>開始五感著陸</span>
                      </button>

                      {/* Voice Toggle Button */}
                      <button
                        onClick={() => toggleVoice("五感著陸練習。透過觀察身邊的視覺、觸覺、聽覺、嗅覺與味覺，幫助你回歸當下與平靜。")}
                        className={`p-2.5 border rounded-xl cursor-pointer active:scale-95 transition flex items-center justify-center shrink-0 ${
                          isVoiceEnabled 
                            ? 'bg-brand-sage text-white border-brand-sage hover:bg-brand-moss' 
                            : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                        }`}
                        style={{ minHeight: '44px', minWidth: '44px' }}
                        title="語音引導開關"
                      >
                        {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs font-medium text-center text-slate-400">
                      建議在家長或教師陪同下進行
                    </p>
                  </div>
                </div>
              ) : isGroundingFinished ? (
                /* Finished Success Page */
                <div className="w-full flex flex-col items-center justify-center space-y-3.5">
                  <div className="text-center space-y-1">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-gray-800">🎉 著陸完成！🎉</h3>
                  </div>

                  <div className="bg-brand-sand/30 p-4 rounded-xl border border-brand-sand text-center space-y-2 w-full">
                    <span className="text-xs font-black text-brand-moss bg-brand-sand/60 px-2.5 py-0.5 rounded-full inline-block">
                      5-4-3-2-1 五感著陸
                    </span>
                    <p className="text-xs sm:text-sm font-black text-gray-700 leading-relaxed">
                      「 你做到了！<br />
                      你好棒！<br />
                      下次再來練習喔！」
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 w-full">
                    <button
                      onClick={() => {
                        playClickSound(580, 'sine');
                        setIsGroundingStarted(true);
                        setIsGroundingFinished(false);
                        setGroundingStep(1);
                        setGroundingChecked({});
                        safeSpeak("重新開始著陸練習。第一步，視覺：尋找 5 件目光所及的事物。觀看身處空間內的事物即可，例如窗外的樹、桌上的筆、牆上的時鐘。");
                      }}
                      className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-xs border-0"
                      style={{ minHeight: '42px' }}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>再試一次</span>
                    </button>

                    <button
                      onClick={() => {
                        playClickSound(400, 'sine');
                        if (onGoToHome) {
                          onGoToHome();
                        } else {
                          setIsGroundingStarted(false);
                          setIsGroundingFinished(false);
                          setGroundingStep(1);
                        }
                      }}
                      className="py-2.5 bg-brand-sage hover:bg-brand-moss text-white rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-xs border-0"
                      style={{ minHeight: '42px' }}
                    >
                      <span>回到首頁</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Step by Step Flow */
                <div className="w-full flex flex-col items-center justify-center space-y-3">
                  {/* Header */}
                  <div className="text-center">
                    <span className="inline-block text-xs font-black text-brand-moss bg-brand-sage/10 px-3 py-1 rounded-full border border-brand-sage/20">
                      五感著陸 - 步驟 {groundingStep} / 5
                    </span>
                  </div>

                  {/* Dynamic step visual card */}
                  <div className="bg-gradient-to-br from-brand-sand/15 via-white to-brand-sage/10 rounded-xl p-3.5 sm:p-4 border-2 border-brand-sand/80 shadow-xs space-y-3 w-full">
                    <AnimatePresence mode="wait">
                      {groundingStep === 1 && (
                        <motion.div
                          key="g1"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-2 text-center sm:text-left"
                        >
                          <h4 className="text-sm sm:text-base font-black text-slate-800 leading-snug">
                            👀 第一步：視覺
                          </h4>
                          <p className="text-xs sm:text-sm font-black text-emerald-800">
                            尋找 5 件目光所及的事物
                          </p>
                          <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/80 text-left space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-amber-900">
                              💡 觀看身處空間內的事物即可
                            </p>
                            <p className="text-xs font-medium text-amber-800">
                              （例如：窗外的樹、桌上的筆、牆上的時鐘）
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {groundingStep === 2 && (
                        <motion.div
                          key="g2"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-2 text-center sm:text-left"
                        >
                          <h4 className="text-sm sm:text-base font-black text-slate-800 leading-snug">
                            🖐️ 第二步：觸覺
                          </h4>
                          <p className="text-xs sm:text-sm font-black text-emerald-800">
                            尋找 4 件可以觸摸的物件
                          </p>
                          <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/80 text-left space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-amber-900">
                              💡 用手觸摸屬於自己的物品即可
                            </p>
                            <p className="text-xs font-medium text-amber-800">
                              （例如：你的衣服、文具、手錶）
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {groundingStep === 3 && (
                        <motion.div
                          key="g3"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-2 text-center sm:text-left"
                        >
                          <h4 className="text-sm sm:text-base font-black text-slate-800 leading-snug">
                            👂 第三步：聽覺
                          </h4>
                          <p className="text-xs sm:text-sm font-black text-emerald-800">
                            尋找 3 種可以聽見的聲音
                          </p>
                          <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/80 text-left space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-amber-900">
                              💡 靜心聆聽即可
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {groundingStep === 4 && (
                        <motion.div
                          key="g4"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-2 text-center sm:text-left"
                        >
                          <h4 className="text-sm sm:text-base font-black text-slate-800 leading-snug">
                            👃 第四步：嗅覺
                          </h4>
                          <p className="text-xs sm:text-sm font-black text-emerald-800">
                            尋找 2 種可以聞到的氣味
                          </p>
                          <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/80 text-left space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-amber-900">
                              💡 輕輕留意身邊的氣味
                            </p>
                            <p className="text-xs font-medium text-amber-800">
                              （例如：清新的空氣、書本的氣味）
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {groundingStep === 5 && (
                        <motion.div
                          key="g5"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-2 text-center sm:text-left"
                        >
                          <h4 className="text-sm sm:text-base font-black text-slate-800 leading-snug">
                            👄 第五步：味覺
                          </h4>
                          <p className="text-xs sm:text-sm font-black text-emerald-800">
                            尋找 1 種味道
                          </p>
                          <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/80 text-left space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-amber-900">
                              💡 可飲用自帶清水，或回想喜歡的味道
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Primary Action and TTS */}
                  <div className="flex gap-2.5 w-full items-center justify-between">
                    <button
                      onClick={() => {
                        playClickSound(520, 'sine');
                        if (groundingStep < 5) {
                          const nextStep = groundingStep + 1;
                          setGroundingStep(nextStep);
                          if (nextStep === 2) safeSpeak("第二步，觸覺：尋找 4 件可以觸摸的物件。用手觸摸屬於自己的物品即可，例如你的衣服、文具、手錶。");
                          if (nextStep === 3) safeSpeak("第三步，聽覺：尋找 3 種可以聽見的聲音。靜心聆聽即可。");
                          if (nextStep === 4) safeSpeak("第四步，嗅覺：尋找 2 種可以聞到的氣味。輕輕留意身邊的氣味，例如清新的空氣、書本的氣味。");
                          if (nextStep === 5) safeSpeak("第五步，味覺：尋找 1 種味道。可飲用自帶清水，或回想喜歡的味道。");
                        } else {
                          setIsGroundingFinished(true);
                          if (onAwardFirstAidPoint) {
                            const awarded = onAwardFirstAidPoint();
                            if (awarded) setPointEarnedNotice(true);
                          }
                          safeSpeak("太棒了！你完成了五感著陸練習！你做得真棒！");
                        }
                      }}
                      className="flex-1 py-3 bg-brand-sage hover:bg-brand-moss text-white rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-xs border-0"
                      style={{ minHeight: '42px' }}
                    >
                      {groundingStep === 1 && <span>✅ 我已找到 5 件</span>}
                      {groundingStep === 2 && <span>✅ 我已找到 4 件</span>}
                      {groundingStep === 3 && <span>✅ 我已找到 3 種</span>}
                      {groundingStep === 4 && <span>✅ 我已找到 2 種</span>}
                      {groundingStep === 5 && <span>✅ 我已找到 1 種</span>}
                    </button>

                    <button
                      onClick={() => {
                        let text = "";
                        if (groundingStep === 1) text = "👀 第一步，視覺：尋找 5 件目光所及的事物。觀看身處空間內的事物即可，例如窗外的樹、桌上的筆、牆上的時鐘。";
                        if (groundingStep === 2) text = "🖐️ 第二步，觸覺：尋找 4 件可以觸摸的物件。用手觸摸屬於自己的物品即可，例如你的衣服、文具、手錶。";
                        if (groundingStep === 3) text = "👂 第三步，聽覺：尋找 3 種可以聽見的聲音。靜心聆聽即可。";
                        if (groundingStep === 4) text = "👃 第四步，嗅覺：尋找 2 種可以聞到的氣味。輕輕留意身邊的氣味，例如清新的空氣、書本的氣味。";
                        if (groundingStep === 5) text = "👄 第五步，味覺：尋找 1 種味道。可飲用自帶清水，或回想喜歡的味道。";
                        toggleVoice(text);
                      }}
                      className={`p-2.5 border rounded-xl cursor-pointer active:scale-95 transition flex items-center justify-center ${
                        isVoiceEnabled 
                          ? 'bg-brand-sage text-white border-brand-sage hover:bg-brand-moss' 
                          : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                      }`}
                      style={{ minHeight: '42px', minWidth: '42px' }}
                      title="語音引導開關"
                    >
                      {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-black text-brand-moss select-none animate-pulse">
                      💡 完成本步驟後，點擊按鈕進入下一步！
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTool === 'haven' && (
            <motion.div
              key="haven"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 flex flex-col items-center justify-center space-y-3.5 my-auto w-full max-w-sm"
            >
              {!isGuiding ? (
                /* Landing Entrance Screen */
                <div className="w-full flex flex-col items-center justify-center space-y-3.5">
                  <div className="text-center space-y-1">
                    <div className="w-14 h-14 bg-brand-sage/10 text-brand-sage rounded-full flex items-center justify-center mx-auto shadow-inner border border-brand-sage/20">
                      <HelpCircle className="w-7 h-7" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-800">🏡 安心小基地</h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-relaxed">
                      陪伴你放鬆心情、加油打氣的溫暖空間。
                    </p>
                  </div>

                  <div className="w-full space-y-2 text-center">
                    <div className="flex gap-2.5 w-full max-w-[270px] sm:max-w-[360px] mx-auto items-center justify-center">
                      <button
                        onClick={() => {
                          playClickSound(580, 'sine');
                          const randIdx = Math.floor(Math.random() * HAVEN_PASSAGES.length);
                          setCurrentPassageIdx(randIdx);
                          setIsGuiding(true);
                          const p = HAVEN_PASSAGES[randIdx];
                          safeSpeak(p.guide + " " + p.quote);
                        }}
                        className="flex-1 py-3 bg-brand-sage hover:bg-brand-moss text-white rounded-full text-xs sm:text-sm font-black tracking-wider transition shadow-sm active:scale-95 cursor-pointer border-0 flex items-center justify-center gap-2"
                        style={{ minHeight: '44px' }}
                      >
                        <Play className="w-4 h-4 fill-white shrink-0" />
                        <span>開始安心引導</span>
                      </button>

                      {/* Voice Toggle Button */}
                      <button
                        onClick={() => toggleVoice("安心小基地。陪伴你放鬆心情、加油打氣的溫暖空間。")}
                        className={`p-2.5 border rounded-xl cursor-pointer active:scale-95 transition flex items-center justify-center shrink-0 ${
                          isVoiceEnabled 
                            ? 'bg-brand-sage text-white border-brand-sage hover:bg-brand-moss' 
                            : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                        }`}
                        style={{ minHeight: '44px', minWidth: '44px' }}
                        title="語音引導開關"
                      >
                        {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    <p className="text-xs font-medium text-slate-400">建議在家長或教師陪同下進行</p>
                  </div>
                </div>
              ) : (
                /* Interactive Guidance Screen */
                <div className="flex-1 flex flex-col justify-between space-y-3 py-1">
                  {/* Header Indicator */}
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-black text-emerald-800 tracking-tight">
                      🏡 【 {HAVEN_PASSAGES[currentPassageIdx].title} 】
                    </h3>
                  </div>

                  {/* Healing Page Box */}
                  <div className="bg-gradient-to-br from-brand-sand/15 via-white to-brand-sage/10 rounded-2xl p-3 sm:p-4 border-2 border-brand-sand/80 shadow-xs text-center space-y-3.5 max-w-sm mx-auto w-full">
                    {/* Text Guide */}
                    <div className="space-y-1 text-left">
                      <span className="text-xs uppercase font-black tracking-wider text-brand-sage block select-none">
                        🧭 呼吸與想像導引
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed font-sans">
                        {HAVEN_PASSAGES[currentPassageIdx].guide}
                      </p>
                    </div>

                    {/* Divider Line */}
                    <div className="border-t border-dashed border-brand-sand my-0.5" />

                    {/* Warm Quote */}
                    <div className="space-y-1 text-left bg-white/70 p-2.5 rounded-xl border border-brand-sand/40">
                      <span className="text-xs uppercase font-black tracking-wider text-amber-700 block select-none">
                        💖 安心加油小語
                      </span>
                      <p className="text-xs sm:text-sm font-black text-emerald-800 leading-relaxed italic font-sans">
                        {HAVEN_PASSAGES[currentPassageIdx].quote}
                      </p>
                    </div>
                  </div>

                  {/* Sub-Actions Bar (換一段、語音、結束) */}
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto w-full">
                    {/* 1. 換一段 (Next Segment) */}
                    <button
                      onClick={() => {
                        playClickSound(520, 'sine');
                        let nextIdx = currentPassageIdx;
                        if (HAVEN_PASSAGES.length > 1) {
                          while (nextIdx === currentPassageIdx) {
                            nextIdx = Math.floor(Math.random() * HAVEN_PASSAGES.length);
                          }
                        }
                        setCurrentPassageIdx(nextIdx);
                        const p = HAVEN_PASSAGES[nextIdx];
                        safeSpeak(p.guide + " " + p.quote);
                      }}
                      className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-[13px] font-black transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-xs border-0"
                      style={{ minHeight: '40px' }}
                      title="隨記切換下一篇溫暖引導"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>換一段</span>
                    </button>

                    {/* 2. 語音 (TTS Play) */}
                    <button
                      onClick={() => {
                        const p = HAVEN_PASSAGES[currentPassageIdx];
                        toggleVoice(p.guide + " " + p.quote);
                      }}
                      className={`py-2.5 rounded-xl text-xs sm:text-[13px] font-black transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-xs border ${
                        isVoiceEnabled
                          ? 'bg-brand-sage text-white border-brand-sage hover:bg-brand-moss'
                          : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                      }`}
                      style={{ minHeight: '40px' }}
                      title="語音引導開關"
                    >
                      {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span>語音</span>
                    </button>

                    {/* 3. 結束 (Exit / Back to start) */}
                    <button
                      onClick={() => {
                        playClickSound(400, 'sine');
                        if ('speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                        }
                        setIsGuiding(false);
                      }}
                      className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-[13px] font-black transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-2xs border border-gray-200"
                      style={{ minHeight: '40px' }}
                    >
                      <span>結束</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
