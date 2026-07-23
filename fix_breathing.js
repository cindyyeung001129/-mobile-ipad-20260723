import fs from 'fs';
let code = fs.readFileSync('src/components/FirstAidView.tsx', 'utf8');

// State
code = code.replace(
  `useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');`,
  `useState<'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2'>('idle');`
);

// Phrases
code = code.replace(
  `🌬️ 3-2-4 呼吸平復法`,
  `🌬️ 4-4-4-4 方形呼吸法`
);
code = code.replace(
  `吸氣 3 秒 · 憋氣 2 秒 · 呼氣 4 秒`,
  `吸氣 4 秒 · 閉氣 4 秒 · 呼氣 4 秒 · 閉氣 4 秒`
);
code = code.replace(
  `跟著圈圈，慢慢呼吸：`,
  `跟著方形，慢慢呼吸：`
);
code = code.replace(
  `深呼吸練習。吸氣三秒，憋氣兩秒，呼氣四秒。跟著圓圈的縮放，讓我們一起放鬆。`,
  `深呼吸練習。吸氣四秒，閉氣四秒，呼氣四秒，閉氣四秒。跟著方形的縮放，讓我們一起放鬆。`
);

// Phases logic
code = code.replace(
  /const runInhalePhase = \(\) => \{[\s\S]*?runInhalePhase\(\);\s*\}\s*\}, 1000\);\s*\};/m,
  `const runInhalePhase = () => {
    setBreathingPhase('inhale');
    setBreathingTimer(4);
    speakText('慢慢吸氣，感受身體放鬆。');
    
    let counter = 4;
    breathingIntervalRef.current = setInterval(() => {
      counter--;
      setBreathingTimer(counter);
      if (counter <= 0) {
        clearInterval(breathingIntervalRef.current!);
        runHold1Phase();
      }
    }, 1000);
  };

  const runHold1Phase = () => {
    setBreathingPhase('hold1');
    setBreathingTimer(4);
    speakText('閉住呼吸，安頓心靈。');

    let counter = 4;
    breathingIntervalRef.current = setInterval(() => {
      counter--;
      setBreathingTimer(counter);
      if (counter <= 0) {
        clearInterval(breathingIntervalRef.current!);
        runExhalePhase();
      }
    }, 1000);
  };

  const runExhalePhase = () => {
    setBreathingPhase('exhale');
    setBreathingTimer(4);
    speakText('慢慢呼氣，吐出所有壓力和煩惱。');

    let counter = 4;
    breathingIntervalRef.current = setInterval(() => {
      counter--;
      setBreathingTimer(counter);
      if (counter <= 0) {
        clearInterval(breathingIntervalRef.current!);
        runHold2Phase();
      }
    }, 1000);
  };

  const runHold2Phase = () => {
    setBreathingPhase('hold2');
    setBreathingTimer(4);
    speakText('閉住呼吸，保持平靜。');

    let counter = 4;
    breathingIntervalRef.current = setInterval(() => {
      counter--;
      setBreathingTimer(counter);
      if (counter <= 0) {
        clearInterval(breathingIntervalRef.current!);
        setBreathingCycleCount((prev) => prev + 1);
        // Repeat the loop automatically
        runInhalePhase();
      }
    }, 1000);
  };`
);

// Update visualizer (Outer ring)
code = code.replace(
  /className="absolute rounded-full border border-brand-sage\/40"[\s\S]*?style={{ width: '100%', height: '100%' }}/m,
  `className="absolute rounded-2xl border border-brand-sage/40"
                      animate={{
                        scale:
                          breathingPhase === 'inhale' ? [1, 1.45] :
                          breathingPhase === 'hold1' ? 1.45 :
                          breathingPhase === 'exhale' ? [1.45, 1] : 1,
                        opacity: breathingPhase === 'idle' ? 0.2 : [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 4,
                        ease: 'easeInOut',
                        repeat: breathingPhase === 'idle' ? Infinity : 0
                      }}
                      style={{ width: '100%', height: '100%' }}`
);

// Update visualizer (Main ball)
code = code.replace(
  /className="w-20 h-20 rounded-full flex flex-col items-center justify-center text-center shadow-md border-2"[\s\S]*?ease: 'linear',\s*\}\}/m,
  `className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-center shadow-md border-2"
                      style={{
                        backgroundColor:
                          breathingPhase === 'inhale' ? '#e2ece3' :
                          breathingPhase === 'hold1' ? '#fbf4e8' :
                          breathingPhase === 'exhale' ? '#fbeee9' : '#f5f1e9',
                        borderColor:
                          breathingPhase === 'inhale' ? '#8ca48e' :
                          breathingPhase === 'hold1' ? '#f2cc8f' :
                          breathingPhase === 'exhale' ? '#df7a5e' : '#a8bfa9',
                      }}
                      animate={{
                        scale:
                          breathingPhase === 'inhale' ? [1, 1.45] :
                          breathingPhase === 'hold1' ? 1.45 :
                          breathingPhase === 'exhale' ? [1.45, 1] : 1,
                      }}
                      transition={{
                        duration: 4,
                        ease: 'linear',
                      }}`
);

// Inner text & prompts
code = code.replace(
  /\{breathingPhase === 'hold' && '憋氣'\}/g,
  `{breathingPhase === 'hold1' && '閉氣'}
                          {breathingPhase === 'hold2' && '閉氣'}`
);

code = code.replace(
  /\{breathingPhase === 'hold' && '⏹️ 憋住呼吸\.\.\.平靜感覺'\}/g,
  `{breathingPhase === 'hold1' && '⏹️ 閉住呼吸...平靜感覺'}
                    {breathingPhase === 'hold2' && '⏹️ 閉住呼吸...保持平靜'}`
);

fs.writeFileSync('src/components/FirstAidView.tsx', code);
