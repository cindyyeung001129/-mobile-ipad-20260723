import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MOODS_CONFIG, PRESET_TAGS } from '../moodsData';
import { playClickSound, playSuccessChime, speakText } from '../utils/audio';
import { ArrowLeft, Volume2, Sparkles, Plus, Check } from 'lucide-react';

interface CheckInWizardProps {
  onClose: () => void;
  onComplete: (
    moodEmoji: string,
    moodLabel: string,
    moodType: 'positive' | 'heavy',
    reason: string,
    tags: string[],
    voiceAudioUrl?: string
  ) => void;
  onClaimQuote?: () => void;
  onGoToFirstAid?: () => void;
}

const CATEGORY_TAGS: Record<string, string[]> = {
  '心情想法': ['疲憊', '發吽哣', '胡思亂想', '元氣爆發'],
  '生活學習': ['沉迷學習', '勁忙', '請勿打擾'],
  '活動': ['旅行中', '運動', '飲奶茶', '食飯'],
  '休息': ['自拍', '宅', '瞓覺', '打機', '聽歌']
};

export default function CheckInWizard({ onClose, onComplete, onClaimQuote, onGoToFirstAid }: CheckInWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedMoodKey, setSelectedMoodKey] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('心情想法');

  // Voice Recording and Speech-to-Text States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recognition, setRecognition] = useState<any>(null);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(false);
  const [playbackWaveHeights, setPlaybackWaveHeights] = useState<number[]>([12, 6, 18, 10, 22, 14, 8, 20, 16, 10, 14, 6]);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const recordingStartTimeRef = useRef<number | null>(null);
  const isFallbackRef = useRef<boolean>(false);

  useEffect(() => {
    let interval: any;
    if (isPlaybackPlaying) {
      interval = setInterval(() => {
        setPlaybackWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 20) + 6));
      }, 120);
    } else {
      setPlaybackWaveHeights([12, 6, 18, 10, 22, 14, 8, 20, 16, 10, 14, 6]);
    }
    return () => clearInterval(interval);
  }, [isPlaybackPlaying]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'zh-HK'; // Cantonese
        
        rec.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setReason(prev => (prev + ' ' + finalTranscript).trim());
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
        };

        setRecognition(rec);
      } catch (err) {
        console.warn("Speech recognition init failed:", err);
      }
    }
  }, []);

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const startRecording = async () => {
    if (isRecording) return;
    playClickSound(650, 'sine');
    setIsRecording(true);
    setRecordingTime(0);
    setVoiceAudioUrl(null);
    setRecordingError(null);
    recordingStartTimeRef.current = Date.now();
    isFallbackRef.current = false;

    // 1. Start Speech recognition
    try {
      if (recognition) {
        recognition.start();
      }
    } catch (e) {
      console.warn("Speech recognition start failed:", e);
    }

    // 2. Start MediaRecorder
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const duration = recordingStartTimeRef.current ? (Date.now() - recordingStartTimeRef.current) / 1000 : 0;
        if (duration <= 1.0) {
          console.warn("Recording was too short:", duration);
          setRecordingError("⚠️ 錄音時間太短（需大於 1 秒），請重新錄音喔！");
          setVoiceAudioUrl(null);
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        
        // Convert to data URI / base64 so it can be saved in localStorage securely
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setVoiceAudioUrl(base64Audio);
          setRecordingError(null);
        };
      };

      mediaRecorder.start();
    } catch (e) {
      console.warn("MediaRecorder start failed (expected under iframe sandbox):", e);
      isFallbackRef.current = true;
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    playClickSound(450, 'sine');
    setIsRecording(false);
    
    // Stop recognition
    try {
      if (recognition) {
        recognition.stop();
      }
    } catch (e) {
      console.warn(e);
    }

    const duration = recordingStartTimeRef.current ? (Date.now() - recordingStartTimeRef.current) / 1000 : 0;

    // Stop MediaRecorder
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    } catch (e) {
      console.warn("Stopping media recorder failed:", e);
    }

    if (duration <= 1.0) {
      setRecordingError("⚠️ 錄音時間太短（需大於 1 秒），請重新錄音喔！");
      setVoiceAudioUrl(null);
    } else {
      setRecordingError(null);
      if (isFallbackRef.current) {
        // Fallback: indicate we can use Text-To-Speech read back
        setVoiceAudioUrl('tts-fallback');
      }
    }
  };

  // Speech support: speak text when step changes or when volume icon is clicked
  const handleSpeak = (text: string) => {
    speakText(text);
  };

  const currentMoodInfo = selectedMoodKey ? MOODS_CONFIG[selectedMoodKey] : null;

  // Sound feedback on choosing mood
  const handleSelectMood = (key: string) => {
    playClickSound(520, 'sine');
    setSelectedMoodKey(key);
  };

  const handleNextStep = () => {
    playClickSound(600, 'sine');
    if (step === 1 && selectedMoodKey) {
      setStep(2);
      const textToSpeak = `${currentMoodInfo?.emoji}你選擇咗「${currentMoodInfo?.label}」。${currentMoodInfo?.responseQuote}`;
      setTimeout(() => handleSpeak(textToSpeak), 200);
    } else if (step === 2) {
      setStep(3);
      setTimeout(() => handleSpeak('可以寫低發生咩事，或者直接完成記錄。'), 200);
    } else if (step === 3) {
      // Trigger complete
      playSuccessChime();
      setStep(4);
      setTimeout(() => handleSpeak('記錄完成！今日你注意自己，這已經是一個照顧。'), 200);
    }
  };

  const handleSkipOrCompleteStep3 = (isSkip: boolean) => {
    const finalReason = isSkip ? '' : reason;
    const finalTags = isSkip ? [] : selectedTags;
    
    // Call the parent state modification
    if (currentMoodInfo) {
      onComplete(
        currentMoodInfo.emoji,
        currentMoodInfo.label,
        currentMoodInfo.type,
        finalReason,
        finalTags,
        voiceAudioUrl || undefined
      );
    }
    
    playSuccessChime();
    setStep(4);
  };

  const handlePrevStep = () => {
    playClickSound(400, 'sine');
    if (step === 1) {
      onClose(); // Exit directly back to the previous screen (Home screen)
    } else if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const toggleTag = (tag: string) => {
    playClickSound(480, 'sine');
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="absolute inset-0 bg-brand-beige z-50 flex flex-col justify-between p-5 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-brand-sand pb-3 shrink-0">
        <div className="flex items-center justify-between">
          {step < 4 ? (
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-1 text-brand-moss hover:text-black font-black text-[15px] transition cursor-pointer"
              style={{ minHeight: '40px' }}
            >
              <ArrowLeft className="w-4.5 h-4.5 stroke-[3]" />
              <span>返回</span>
            </button>
          ) : (
            <div className="w-12 h-10" />
          )}

          <div className="w-12 h-10" />

          {/* TTS support icon */}
          <button
            onClick={() => {
              if (step === 1) handleSpeak("今日心情係點樣？請選擇你現在的情緒。");
              if (step === 2 && currentMoodInfo) handleSpeak(`${currentMoodInfo.emoji}你選擇咗「${currentMoodInfo.label}」。${currentMoodInfo.responseQuote}`);
              if (step === 3) handleSpeak("可以寫低發生咩事，用簡單嘅文字記錄今日觸動你嘅瞬間。");
              if (step === 4) handleSpeak("記錄完成！你的每一次記錄，都是灌溉心靈綠洲的水分。");
            }}
            className="p-2 rounded-full bg-brand-sand hover:bg-brand-sage/20 text-brand-moss transition active:scale-90 cursor-pointer"
            title="語音導讀"
            style={{ minHeight: '40px', minWidth: '40px' }}
          >
            <Volume2 className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Step dots with custom styling below the title row */}
        {step < 4 ? (
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex gap-1 items-center">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'bg-brand-sage w-4.5'
                      : 'bg-brand-sand/80 w-1.5'
                  }`}
                />
              ))}
            </div>
            <span className="text-[12.5px] font-black text-brand-moss font-mono tracking-wider">
              步驟 {step}/3
            </span>
          </div>
        ) : null}
      </div>

      {/* Main Body */}
      <div className="flex-1 py-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 flex flex-col h-full justify-between"
            >
              <div className="space-y-0.5">
                <h2 className="text-[23px] font-black text-gray-800 text-center font-sans tracking-tight leading-none">
                  今日感覺心情係點樣？
                </h2>
                <p className="text-center text-sm font-extrabold text-brand-moss font-sans">
                  點選最貼近你當下感受的表情 🪴
                </p>
              </div>

              {/* 2 x 4 Grid for Mood selection */}
              <div className="grid grid-cols-4 gap-2 my-1">
                {Object.entries(MOODS_CONFIG).map(([key, config]) => {
                  const isSelected = selectedMoodKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectMood(key)}
                      className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-brand-sage bg-brand-sage/10 scale-102 shadow-md focus-ring'
                          : 'border-brand-sand bg-white hover:border-brand-sage/50 shadow-sm'
                      }`}
                      style={{ minHeight: '72px' }}
                    >
                      <span className="text-3xl mb-0.5 filter drop-shadow-sm transition-transform duration-200 active:scale-125">
                        {config.emoji}
                      </span>
                      <span className="text-[14px] font-black text-gray-700">
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ─── 揀個狀態（可選） ─── */}
              <div className="space-y-2 mt-1">
                <div className="text-center font-extrabold text-gray-500 text-[13.5px] sm:text-[14px] tracking-wider flex items-center justify-center gap-2">
                  <div className="h-[1px] bg-brand-sand/60 flex-1"></div>
                  <span>─── 揀個狀態（可選） ───</span>
                  <div className="h-[1px] bg-brand-sand/60 flex-1"></div>
                </div>

                {/* Category selectors (fine print / small text) */}
                <div className="flex justify-between gap-1 bg-brand-sand/15 p-1 rounded-xl border border-brand-sand/35">
                  {Object.keys(CATEGORY_TAGS).map((cat) => {
                    const isCatActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          playClickSound(480, 'sine');
                          setActiveCategory(cat);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[13px] sm:text-sm font-black transition-all cursor-pointer ${
                          isCatActive
                            ? 'bg-brand-sage text-white shadow-xs'
                            : 'text-brand-moss/80 hover:bg-brand-sand/30 hover:text-gray-800'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-tags corresponding to the active category */}
                <div className="flex flex-wrap gap-2 justify-center py-1.5 bg-white/50 rounded-xl p-1.5 min-h-[42px]">
                  {CATEGORY_TAGS[activeCategory].map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-[13px] sm:text-sm px-3.5 py-1.5 rounded-full border transition-all cursor-pointer font-black ${
                          isSelected
                            ? 'bg-brand-sage text-white border-brand-sage shadow-xs'
                            : 'bg-white border-brand-sand/70 text-gray-600 hover:bg-brand-sand/30'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled={!selectedMoodKey}
                  onClick={handleNextStep}
                  className={`w-full py-3.5 rounded-[100px] text-base font-black transition shadow-[0_4px_12px_rgba(109,160,111,0.2)] flex items-center justify-center gap-2 cursor-pointer ${
                    selectedMoodKey
                      ? 'bg-brand-sage hover:bg-brand-moss text-white active:scale-98'
                      : 'bg-brand-sand text-gray-400 cursor-not-allowed'
                  }`}
                  style={{ minHeight: '48px' }}
                >
                  <span>繼續</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && currentMoodInfo && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex flex-col h-full justify-between"
            >
              <div className="space-y-4 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-sand/50 text-6xl mb-2 filter drop-shadow-sm">
                  {currentMoodInfo.emoji}
                </div>
                <h3 className="text-[24px] font-black text-gray-800">
                  {currentMoodInfo.emoji}你選擇咗「{currentMoodInfo.label}」
                </h3>
              </div>

              {/* Response Quote Card */}
              <div className="bg-white border-2 border-brand-sand rounded-3xl p-6 shadow-sm space-y-4 max-w-md mx-auto w-full">
                {currentMoodInfo.type === 'heavy' && (
                  <div className="flex items-center gap-2 text-brand-terracotta font-extrabold text-base bg-brand-terracotta/10 px-4 py-1.5 rounded-full w-max mx-auto mb-2">
                    <span>🧰 心靈休息站支援</span>
                  </div>
                )}
                
                <p className="text-[20px] text-gray-700 text-center font-sans leading-relaxed italic px-2 font-black">
                  {currentMoodInfo.responseQuote}
                </p>

                {currentMoodInfo.type === 'heavy' && (
                  <p className="text-base font-bold text-brand-moss text-center border-t border-brand-sand pt-3">
                    溫馨提醒：記錄完成後，可前往「休息站」體驗深呼吸練習與感官放鬆。
                  </p>
                )}
              </div>

              <div className="pt-4">
                <button
                  onClick={handleNextStep}
                  className="w-full py-4 rounded-[100px] text-base font-black bg-brand-sage hover:bg-brand-moss text-white transition shadow-[0_4px_12px_rgba(109,160,111,0.2)] active:scale-98 cursor-pointer"
                  style={{ minHeight: '52px' }}
                >
                  繼續
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && currentMoodInfo && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3.5 flex flex-col h-full justify-between"
            >
              <div className="space-y-1">
                <h2 className="text-[20px] sm:text-[22px] font-black text-gray-800 text-center font-sans tracking-tight leading-tight">
                  可以寫低發生咩事 🌱
                </h2>
                <p className="text-center text-xs sm:text-sm font-extrabold text-brand-moss leading-tight">
                  用簡單嘅文字，記錄今日觸動你嘅瞬間
                </p>
              </div>

              {/* Text Input area */}
              <div className="bg-white rounded-2xl border-2 border-brand-sand p-3 shadow-inner relative flex flex-col gap-1.5">
                <textarea
                  value={reason}
                  onChange={(e) => {
                    if (e.target.value.length <= 600) {
                      setReason(e.target.value);
                    }
                  }}
                  placeholder="例如：今日睇咗一部好有趣嘅電影！"
                  className="w-full h-22 outline-none resize-none text-gray-700 text-sm sm:text-base font-semibold leading-normal font-sans"
                  maxLength={600}
                />
                <div className="text-right text-[11px] font-black text-brand-moss font-mono">
                  已寫 {reason.length} 個字 / 最多 600 字
                </div>
              </div>

              {/* Speech-to-Text / Voice section */}
              <div className="space-y-1.5 px-1">
                <p className="text-center text-xs sm:text-[13px] font-bold text-gray-500 leading-normal">
                  今日唔想打字？可以㩒住錄音，
                  <br />
                  慢慢講出嚟都得 🌸
                </p>

                {/* Simulated/Real Recording Capsule */}
                <div 
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                  onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                  onClick={() => {
                    // Safe tap-to-toggle fallback
                    if (isRecording) {
                      stopRecording();
                    } else {
                      startRecording();
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 px-4 rounded-2xl border-2 transition duration-200 cursor-pointer select-none active:scale-98 ${
                    isRecording 
                      ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                      : 'bg-white border-brand-sand hover:bg-brand-sand/20 text-brand-moss'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{isRecording ? '🛑' : '🎙️'}</span>
                    <span className="text-xs sm:text-sm font-extrabold whitespace-nowrap">
                      {isRecording ? '正在錄音 (放開或再點擊結束)...' : '長按錄音'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Recording pulse dots */}
                    <div className="flex gap-0.5 items-center mr-1">
                      {[1, 2, 3, 4, 5].map((b) => (
                        <div
                          key={b}
                          className={`w-[2px] rounded-full transition-all duration-150 ${
                            isRecording ? 'bg-rose-500' : 'bg-brand-sand'
                          }`}
                          style={{
                            height: isRecording 
                              ? `${Math.max(4, Math.sin(recordingTime * 2 + b) * 12 + 8)}px` 
                              : '4px'
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-black font-mono">
                      {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Error warning message */}
                {recordingError && (
                  <div className="p-2.5 px-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl animate-fadeIn text-center mt-1.5">
                    {recordingError}
                  </div>
                )}

                {/* On-the-spot Recording Result Playback */}
                {voiceAudioUrl && (
                  <div className="flex flex-col gap-2 p-3 bg-brand-sand/35 border-2 border-brand-sand rounded-2xl text-[11px] font-extrabold text-brand-moss animate-fadeIn mt-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">✨</span>
                        <span className="text-xs font-black">錄音已生成！</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Delete & re-record button (錄音刪除重新來的) */}
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound(300, 'sine');
                            setIsPlaybackPlaying(false);
                            if ('speechSynthesis' in window) {
                              window.speechSynthesis.cancel();
                            }
                            setVoiceAudioUrl(null);
                            setRecordingError(null);
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-black text-[11px] border border-rose-200 transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
                          style={{ minHeight: '30px' }}
                        >
                          <span>🗑️ 刪除重新來</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playClickSound(500, 'sine');
                            if (isPlaybackPlaying) {
                              setIsPlaybackPlaying(false);
                              if ('speechSynthesis' in window) {
                                window.speechSynthesis.cancel();
                              }
                              return;
                            }
                            
                            setIsPlaybackPlaying(true);
                            
                            if (voiceAudioUrl !== 'tts-fallback') {
                              const audio = new Audio(voiceAudioUrl);
                              audio.play().then(() => {
                                audio.onended = () => {
                                  setIsPlaybackPlaying(false);
                                };
                              }).catch(err => {
                                console.warn("Audio playback blocked, using TTS fallback:", err);
                                speakText(reason || '今日過得好充實！');
                                setTimeout(() => {
                                  setIsPlaybackPlaying(false);
                                }, 3500);
                              });
                            } else {
                              speakText(reason || '今日過得好充實！');
                              setTimeout(() => {
                                setIsPlaybackPlaying(false);
                              }, 3500);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl font-black cursor-pointer transition active:scale-95 flex items-center gap-1 shadow-sm ${
                            isPlaybackPlaying 
                              ? 'bg-rose-500 text-white hover:bg-rose-600' 
                              : 'bg-brand-sage text-white hover:bg-brand-moss'
                          }`}
                          style={{ minHeight: '30px' }}
                        >
                          <span>{isPlaybackPlaying ? '⏹ 停止' : '▶ 試聽錄音'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Animated Waveform Visualizer (聲音波紋條條) */}
                    <div className="flex items-center justify-center gap-1 bg-white/70 py-2.5 rounded-xl border border-brand-sand/40 mt-1">
                      <div className="flex items-end gap-0.5 h-7">
                        {playbackWaveHeights.map((h, idx) => (
                          <div
                            key={idx}
                            className={`w-[3px] rounded-full transition-all duration-100 ${
                              isPlaybackPlaying ? 'bg-brand-sage animate-pulse' : 'bg-brand-sand'
                            }`}
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono ml-2">
                        {isPlaybackPlaying ? 'PLAYING' : 'READY'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick tags side-by-side */}
              <div className="space-y-1.5">
                <span className="text-xs sm:text-sm font-black text-brand-moss block text-center">
                  點擊可加入生活範疇：
                </span>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {['學校', '家庭', '朋友'].map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-xs sm:text-[13px] px-3.5 py-1.5 rounded-xl border-2 transition duration-150 flex items-center gap-1 cursor-pointer font-extrabold ${
                          isSelected
                            ? 'bg-brand-sage border-brand-sage text-white shadow-xs'
                            : 'bg-white border-brand-sand hover:bg-brand-sand/50 text-gray-700'
                        }`}
                        style={{ minHeight: '32px' }}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1 shrink-0">
                <button
                  onClick={() => handleSkipOrCompleteStep3(false)}
                  className="w-full py-3 rounded-[100px] text-sm sm:text-base font-black bg-brand-sage hover:bg-brand-moss text-white transition shadow-[0_4px_12px_rgba(109,160,111,0.2)] active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  style={{ minHeight: '44px' }}
                >
                  完成記錄
                </button>
                <button
                  onClick={() => handleSkipOrCompleteStep3(true)}
                  className="w-full py-1.5 rounded-[100px] text-brand-moss hover:text-black hover:bg-brand-sand/30 text-xs sm:text-sm font-black transition cursor-pointer text-center"
                  style={{ minHeight: '32px' }}
                >
                  跳過寫日誌
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 flex flex-col items-center text-center justify-between h-full"
            >
              <div className="space-y-3 my-auto w-full">
                {/* Sparkles celebration visual */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="mx-auto w-16 h-16 rounded-full bg-brand-ochre/20 flex items-center justify-center text-brand-terracotta text-3xl"
                >
                  ✨
                </motion.div>

                <h2 className="text-[32px] font-black text-brand-moss font-sans tracking-tight">
                  ♥ 記錄完成 ♥
                </h2>

                <div className="max-w-xs mx-auto space-y-3">
                  <p className="text-base font-extrabold text-brand-moss">
                    你的每一次記錄，都是灌溉心靈綠洲的水分。
                  </p>
                </div>

                

                {/* Claim Quote Card Box */}
                {onClaimQuote && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 bg-brand-ochre/10 border-2 border-brand-ochre/30 rounded-2xl p-4 w-full max-w-sm mx-auto flex flex-col items-center gap-3 shadow-xs"
                  >
                    <span className="text-brand-ochre text-[14px] font-black tracking-wide">可以領取一張語錄卡！</span>
                    <button
                      onClick={() => {
                        playClickSound(480, 'sine');
                        onClaimQuote();
                      }}
                      className="py-2.5 px-6 bg-brand-ochre hover:bg-amber-600 text-white rounded-xl text-[14px] font-black transition active:scale-95 cursor-pointer shadow-sm w-full"
                    >
                      立即領取
                    </button>
                  </motion.div>
                )}

                {/* Logged Content Summary Card */}
                <div className="bg-white border-2 border-brand-sand rounded-3xl p-4 text-left shadow-sm space-y-3 max-w-sm mx-auto w-full mt-3">
                  <h4 className="text-[11px] font-extrabold text-gray-400 tracking-wider text-center border-b border-brand-sand/60 pb-2 uppercase font-sans">
                    📋 今日心情記錄
                  </h4>
                  
                  {/* Mood Info row */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400 w-12 shrink-0">當下心情:</span>
                    <div className="flex items-center gap-1.5 bg-brand-sand/30 px-3 py-1 rounded-full border border-brand-sand">
                      <span className="text-lg leading-none">{currentMoodInfo?.emoji}</span>
                      <span className="text-xs font-black text-gray-800">{currentMoodInfo?.label}</span>
                    </div>
                  </div>

                  {/* Status/Category tags row */}
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-black text-gray-400 w-12 shrink-0 mt-1">選填狀態:</span>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {selectedTags.length > 0 ? (
                        selectedTags.map((tag) => (
                          <span key={tag} className="text-[11px] bg-brand-sage/15 text-brand-moss px-2.5 py-0.5 rounded-full border border-brand-sage/20 font-black">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">無</span>
                      )}
                    </div>
                  </div>

                  {/* Reason text block */}
                  <div className="flex flex-col gap-1.5 border-t border-brand-sand/40 pt-2.5">
                    <span className="text-xs font-black text-gray-400">心情感受 / 發生什麼事:</span>
                    <p className="text-xs font-semibold text-gray-700 bg-[#FAF6F0] p-3 rounded-2xl border border-brand-sand/35 leading-relaxed italic font-sans max-h-[80px] overflow-y-auto">
                      {reason.trim() ? reason : '僅進行心情與狀態記錄，未寫下日記文字。'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full pt-4 space-y-3">
                {currentMoodInfo?.type === 'heavy' && onGoToFirstAid && (
                  <button
                    onClick={() => {
                      playClickSound(500, 'sine');
                      onGoToFirstAid();
                    }}
                    className="w-full py-4 rounded-[100px] text-base font-black bg-brand-terracotta hover:bg-brand-terracotta/90 text-white transition shadow-[0_4px_12px_rgba(223,122,94,0.2)] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    style={{ minHeight: '52px' }}
                  >
                    <span>🧰</span> 前往休息站放鬆
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-[100px] text-base font-black bg-brand-moss hover:bg-black text-white transition shadow-[0_4px_12px_rgba(90,90,64,0.2)] active:scale-98 cursor-pointer"
                  style={{ minHeight: '52px' }}
                >
                  返回首頁
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
