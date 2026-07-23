import { motion } from 'motion/react';
import { getPlantStage } from '../moodsData';

interface AnimatedPlantProps {
  progress: number; // 0 to 100
  moodLabel?: string; // Optional: change visual based on mood
  isWatering?: boolean; // Hydration animation trigger
  heightCm?: number;
  isStatic?: boolean;
}

export default function AnimatedPlant({
  progress,
  moodLabel = '平靜',
  isWatering = false,
  heightCm = 10,
  isStatic = false
}: AnimatedPlantProps) {
  const stage = getPlantStage(progress);

  // Set colors or mood-specific atmosphere
  let glowColor = 'rgba(109, 160, 111, 0.3)'; // Sage #6da06f
  let leavesColor = '#6da06f'; // Warm organic green
  let bloomColor = '#df7a5e'; // Terracotta/coral
  let swaySpeed = 4; // seconds for full sway cycle

  if (moodLabel === '開心') {
    glowColor = 'rgba(255, 179, 71, 0.5)'; // Warm gold yellow
    leavesColor = '#7cb37d'; // Bright happy green
    bloomColor = '#ff6b81'; // Rosy pink
    swaySpeed = 3; // Happier, more active sway
  } else if (moodLabel === '焦慮') {
    glowColor = 'rgba(255, 179, 71, 0.3)';
    leavesColor = '#8ba38d'; // Muted grayish green
    swaySpeed = 6; // slow, cautious sway
  } else if (moodLabel === '憤怒') {
    glowColor = 'rgba(223, 122, 94, 0.4)'; // Terracotta
    leavesColor = '#5e7d5f'; // Dark fiery green
    bloomColor = '#ff4757'; // Hot red/orange
    swaySpeed = 2; // Fast, passionate sway
  } else if (moodLabel === '睏') {
    glowColor = 'rgba(100, 116, 139, 0.25)'; // Sleepy slate
    leavesColor = '#7fa081';
    swaySpeed = 8; // Deep, slow, sleepy breathing sway
  } else if (moodLabel === '平靜') {
    glowColor = 'rgba(109, 160, 111, 0.3)'; // Soft warm sage
    leavesColor = '#6da06f';
    bloomColor = '#f3a683';
    swaySpeed = 5; // Standard peaceful sway
  }

  // Floating particles depending on mood
  const particles = Array.from({ length: 6 });

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-64 select-none">
      {/* Background Glow Halo */}
      <motion.div
        className="absolute rounded-full filter blur-xl"
        style={{
          width: '180px',
          height: '180px',
          backgroundColor: glowColor,
          zIndex: 0,
        }}
        animate={isStatic ? undefined : {
          scale: [1, 1.12, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={isStatic ? undefined : {
          duration: swaySpeed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Falling/watering droplets animation */}
      {isWatering && !isStatic && (
        <div className="absolute top-0 left-0 right-0 bottom-16 pointer-events-none flex justify-center z-20">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-4 bg-sky-300 rounded-full mx-2 opacity-0"
              initial={{ y: -20, opacity: 0, scaleY: 1 }}
              animate={{
                y: [0, 140],
                opacity: [0, 1, 1, 0],
                scaleY: [1, 1.5, 0.8],
              }}
              transition={{
                duration: 1.2,
                delay: i * 0.15,
                repeat: 2,
                ease: 'easeIn',
              }}
            />
          ))}
        </div>
      )}

      {/* Floating particles */}
      {!isStatic && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {particles.map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${4 + (i % 3) * 3}px`,
                height: `${4 + (i % 3) * 3}px`,
                backgroundColor: moodLabel === '開心' ? '#f2cc8f' : moodLabel === '憤怒' ? '#df7a5e' : '#8ca48e',
                bottom: '48px',
                left: `${35 + i * 10 + Math.random() * 5}%`,
                opacity: 0.7,
              }}
              animate={{
                y: [0, -100 - (i * 12)],
                x: [0, Math.sin(i) * 15, Math.cos(i) * -15],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Central SVG Plant rendering */}
      <svg
        className="w-48 h-56 relative z-10 filter drop-shadow-md"
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ground Soil (in the pot) */}
        <ellipse cx="100" cy="180" rx="35" ry="8" fill="#5c443c" />

        {/* PLANT STAGE RENDERING */}
        {stage === 'seed' && (
          <motion.g
            animate={isStatic ? undefined : { scale: [1, 1.05, 1], y: [0, 1, 0] }}
            transition={isStatic ? undefined : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Tiny brown seed in soil */}
            <path
              d="M100,165 C92,165 92,178 100,178 C108,178 108,165 100,165 Z"
              fill="#8d6e63"
            />
            {/* Tiny green life spark indicator */}
            <path
              d="M100,165 Q102,158 105,155 Q101,158 100,165"
              fill="#a7f3d0"
            />
            {/* Soil mound */}
            <path d="M80,180 Q100,172 120,180 Z" fill="#4e342e" />
          </motion.g>
        )}

        {stage === 'sprout' && (
          <motion.g
            animate={isStatic ? undefined : { rotate: [-2, 2, -2] }}
            transition={isStatic ? undefined : { duration: swaySpeed, repeat: Infinity, ease: 'easeInOut' }}
            className="origin-bottom"
            style={{ transformOrigin: '100px 180px' }}
          >
            {/* Small stem */}
            <path
              d="M100,180 Q98,160 102,145"
              stroke={leavesColor}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Left Leaf */}
            <motion.path
              d="M100,155 Q85,150 88,140 Q98,145 100,155 Z"
              fill={leavesColor}
              initial={isStatic ? undefined : { scale: 0 }}
              animate={isStatic ? undefined : { scale: 1 }}
              transition={isStatic ? undefined : { delay: 0.2 }}
            />
            {/* Right Leaf */}
            <motion.path
              d="M101,150 Q116,144 112,135 Q104,142 101,150 Z"
              fill={leavesColor}
              initial={isStatic ? undefined : { scale: 0 }}
              animate={isStatic ? undefined : { scale: 1 }}
              transition={isStatic ? undefined : { delay: 0.4 }}
            />
          </motion.g>
        )}

        {stage === 'growing' && (
          <motion.g
            animate={isStatic ? undefined : { rotate: [-3, 3, -3] }}
            transition={isStatic ? undefined : { duration: swaySpeed, repeat: Infinity, ease: 'easeInOut' }}
            className="origin-bottom"
            style={{ transformOrigin: '100px 180px' }}
          >
            {/* Main trunk */}
            <path
              d="M100,180 Q97,145 101,115"
              stroke="#6d8c70"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Lower Left Branch */}
            <path
              d="M99,150 Q85,142 75,145"
              stroke="#6d8c70"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Lower Right Branch */}
            <path
              d="M100,140 Q115,132 125,138"
              stroke="#6d8c70"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Leaves */}
            <path d="M75,145 Q63,142 66,134 Q74,138 75,145 Z" fill={leavesColor} />
            <path d="M125,138 Q137,135 134,127 Q126,131 125,138 Z" fill={leavesColor} />
            <path d="M101,115 Q88,105 92,97 Q100,105 101,115 Z" fill={leavesColor} />
            <path d="M101,115 Q114,105 110,97 Q102,105 101,115 Z" fill={leavesColor} />
            <path d="M98,130 Q84,120 90,114 Q96,122 98,130 Z" fill={leavesColor} stroke="#fff" strokeWidth="0.5" />
          </motion.g>
        )}

        {stage === 'flowering' && (
          <motion.g
            animate={isStatic ? undefined : { rotate: [-4, 4, -4] }}
            transition={isStatic ? undefined : { duration: swaySpeed, repeat: Infinity, ease: 'easeInOut' }}
            className="origin-bottom"
            style={{ transformOrigin: '100px 180px' }}
          >
            {/* Main stem */}
            <path
              d="M100,180 Q96,140 102,100"
              stroke="#5d755e"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Branches */}
            <path d="M98,145 Q80,135 68,142" stroke="#5d755e" strokeWidth="4" strokeLinecap="round" />
            <path d="M100,130 Q120,120 132,128" stroke="#5d755e" strokeWidth="4" strokeLinecap="round" />
            <path d="M101,110 Q85,100 80,85" stroke="#5d755e" strokeWidth="3" strokeLinecap="round" />

            {/* Leaves */}
            <path d="M68,142 Q55,135 58,125 Q68,130 68,142 Z" fill={leavesColor} />
            <path d="M132,128 Q145,122 141,112 Q131,118 132,128 Z" fill={leavesColor} />
            <path d="M80,85 Q68,80 72,70 Q80,75 80,85 Z" fill={leavesColor} />
            <path d="M102,100 Q90,90 94,80 Q101,88 102,100 Z" fill={leavesColor} />
            <path d="M102,100 Q115,90 110,80 Q103,88 102,100 Z" fill={leavesColor} />

            {/* Closed Flower Buds */}
            <motion.circle
              cx="65"
              cy="125"
              r="6"
              fill={bloomColor}
              animate={isStatic ? undefined : { scale: [1, 1.15, 1] }}
              transition={isStatic ? undefined : { duration: 2, repeat: Infinity }}
            />
            <motion.circle
              cx="135"
              cy="112"
              r="6"
              fill={bloomColor}
              animate={isStatic ? undefined : { scale: [1.1, 0.9, 1.1] }}
              transition={isStatic ? undefined : { duration: 2.2, repeat: Infinity }}
            />
            <motion.circle
              cx="102"
              cy="78"
              r="5"
              fill="#e9c46a"
              animate={isStatic ? undefined : { scale: [0.9, 1.1, 0.9] }}
              transition={isStatic ? undefined : { duration: 1.8, repeat: Infinity }}
            />
          </motion.g>
        )}

        {stage === 'blooming' && (
          <motion.g
            animate={isStatic ? undefined : { rotate: [-4, 4, -4] }}
            transition={isStatic ? undefined : { duration: swaySpeed, repeat: Infinity, ease: 'easeInOut' }}
            className="origin-bottom"
            style={{ transformOrigin: '100px 180px' }}
          >
            {/* Fully Rich Bushy Plant */}
            <path
              d="M100,180 L102,85"
              stroke="#5d755e"
              strokeWidth="7"
              strokeLinecap="round"
              className="origin-bottom"
            />
            <path d="M98,145 Q75,132 55,140" stroke="#5d755e" strokeWidth="5" strokeLinecap="round" />
            <path d="M100,125 Q125,110 145,122" stroke="#5d755e" strokeWidth="5" strokeLinecap="round" />
            <path d="M101,105 Q80,85 70,65" stroke="#5d755e" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M102,95 Q125,80 130,60" stroke="#5d755e" strokeWidth="4.5" strokeLinecap="round" />

            {/* Rich Foliage Leaves */}
            <path d="M55,140 Q38,135 42,122 Q53,128 55,140 Z" fill={leavesColor} />
            <path d="M145,122 Q162,115 157,102 Q147,108 145,122 Z" fill={leavesColor} />
            <path d="M70,65 Q52,60 58,45 Q68,52 70,65 Z" fill={leavesColor} />
            <path d="M130,60 Q148,55 142,40 Q132,48 130,60 Z" fill={leavesColor} />
            
            {/* Main top crown leaves */}
            <path d="M102,85 Q85,75 90,60 Q100,70 102,85 Z" fill="#719474" />
            <path d="M102,85 Q119,75 114,60 Q104,70 102,85 Z" fill="#719474" />

            {/* Extra leaves to fill out bush */}
            <circle cx="85" cy="120" r="14" fill={leavesColor} opacity="0.85" />
            <circle cx="115" cy="110" r="14" fill={leavesColor} opacity="0.85" />
            <circle cx="100" cy="100" r="12" fill={leavesColor} opacity="0.9" />

            {/* BLOOMED FLOWERS */}
            {/* Left Flower */}
            <motion.g
              className="origin-center"
              style={{ transformOrigin: '55px 140px' }}
              animate={isStatic ? undefined : { scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
              transition={isStatic ? undefined : { duration: 4, repeat: Infinity }}
            >
              <circle cx="55" cy="140" r="11" fill={bloomColor} />
              <circle cx="48" cy="140" r="8" fill="#f4a261" opacity="0.9" />
              <circle cx="62" cy="140" r="8" fill="#f4a261" opacity="0.9" />
              <circle cx="55" cy="133" r="8" fill="#f4a261" opacity="0.9" />
              <circle cx="55" cy="147" r="8" fill="#f4a261" opacity="0.9" />
              <circle cx="55" cy="140" r="5" fill="#e9c46a" /> {/* core */}
            </motion.g>

            {/* Right Flower */}
            <motion.g
              className="origin-center"
              style={{ transformOrigin: '145px 122px' }}
              animate={isStatic ? undefined : { scale: [1, 1.05, 1], rotate: [0, -4, 4, 0] }}
              transition={isStatic ? undefined : { duration: 3.5, repeat: Infinity, delay: 0.5 }}
            >
              <circle cx="145" cy="122" r="11" fill={bloomColor} />
              <circle cx="138" cy="122" r="8" fill="#ffb4a2" opacity="0.95" />
              <circle cx="152" cy="122" r="8" fill="#ffb4a2" opacity="0.95" />
              <circle cx="145" cy="115" r="8" fill="#ffb4a2" opacity="0.95" />
              <circle cx="145" cy="129" r="8" fill="#ffb4a2" opacity="0.95" />
              <circle cx="145" cy="122" r="5" fill="#ffd166" />
            </motion.g>

            {/* Top Crown Flower */}
            <motion.g
              className="origin-center"
              style={{ transformOrigin: '102px 70px' }}
              animate={isStatic ? undefined : { scale: [1.05, 0.95, 1.05] }}
              transition={isStatic ? undefined : { duration: 3, repeat: Infinity, delay: 1.0 }}
            >
              <circle cx="102" cy="70" r="12" fill="#e9c46a" />
              <circle cx="95" cy="70" r="8" fill="#fff" opacity="0.9" />
              <circle cx="109" cy="70" r="8" fill="#fff" opacity="0.9" />
              <circle cx="102" cy="63" r="8" fill="#fff" opacity="0.9" />
              <circle cx="102" cy="77" r="8" fill="#fff" opacity="0.9" />
              <circle cx="102" cy="70" r="5" fill="#e76f51" />
            </motion.g>
          </motion.g>
        )}

        {/* The Flower Pot (──────── 花盆 ────────) */}
        {/* Beautiful terracotta pot */}
        <path
          d="M60,180 L140,180 L130,225 L70,225 Z"
          fill="#df7a5e"
          stroke="#b85a3f"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Rim of the pot */}
        <rect
          x="54"
          y="172"
          width="92"
          height="10"
          rx="3"
          fill="#e78b72"
          stroke="#b85a3f"
          strokeWidth="3.5"
        />
        {/* Highlight details for premium shine */}
        <line x1="62" y1="186" x2="68" y2="218" stroke="#f0a390" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="100" cy="177" rx="42" ry="3" fill="#8d5b4c" opacity="0.4" />
      </svg>

      {/* Decorative ASCII Potted Plant overlay (as a stylized aesthetic element beneath the beautiful SVG) */}
      <div className="absolute bottom-1 font-mono text-[9px] text-brand-moss/45 text-center leading-none pointer-events-none select-none h-4">
        🌱 盆栽 ({stage === 'seed' ? '種子' : stage === 'sprout' ? '幼苗' : stage === 'growing' ? '成長中' : stage === 'flowering' ? '開花中' : '盛開'}) 🌿
      </div>
    </div>
  );
}
