import { MoodConfig } from './types';

export const MOODS_CONFIG: Record<string, MoodConfig> = {
  '開心': {
    emoji: '😊',
    label: '開心',
    type: 'positive',
    color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/50 text-emerald-800',
    textColor: 'text-emerald-700',
    responseQuote: '「你注意這份喜悅，感覺已經很棒了。讓這份溫暖的能量成為你今天前行的動力。✨」'
  },
  '焦慮': {
    emoji: '😰',
    label: '焦慮',
    type: 'heavy',
    color: 'bg-amber-50 border-amber-200 hover:bg-amber-100/50 text-amber-800',
    textColor: 'text-amber-700',
    responseQuote: '「你已經試過撐過一些困難的時候，這次也可以先慢慢呼吸。我們在這裡陪著你。🌱」'
  },
  '憤怒': {
    emoji: '😠',
    label: '憤怒',
    type: 'heavy',
    color: 'bg-rose-50 border-rose-200 hover:bg-rose-100/50 text-rose-800',
    textColor: 'text-rose-700',
    responseQuote: '「生氣是身體在保護你的信號。試著給自己一點點空間，這不是你的錯，慢慢深呼吸。🧡」'
  },
  '睏': {
    emoji: '😢', // requested emoji for sleepy / tired
    label: '睏',
    type: 'heavy', // treat tired/heavy gently
    color: 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-800',
    textColor: 'text-slate-700',
    responseQuote: '「身體和心靈都在溫柔地提醒你需要好好休息了。辛苦了，今天就早點休息吧。🌙」'
  },
  '平靜': {
    emoji: '😌',
    label: '平靜',
    type: 'positive',
    color: 'bg-teal-50 border-teal-200 hover:bg-teal-100/50 text-teal-800',
    textColor: 'text-teal-700',
    responseQuote: '「享受當下的這份安寧與和諧。在平靜中，心靈就像一潭清澈的湖水。🍀」'
  },
  '害怕': {
    emoji: '😨',
    label: '害怕',
    type: 'heavy',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100/50 text-purple-800',
    textColor: 'text-purple-700',
    responseQuote: '「感到害怕時，請抱抱小小的自己。你在安全的地方，吸氣、吐氣，你做得很棒。🛡️」'
  },
  '討厭': {
    emoji: '😣',
    label: '討厭',
    type: 'heavy',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100/50 text-orange-800',
    textColor: 'text-orange-700',
    responseQuote: '「討厭的感覺是真實且被允許的。給自己設立一個舒適的邊界，遠離讓你煩惱的事物。🚪」'
  },
  '驚訝': {
    emoji: '😲',
    label: '驚訝',
    type: 'positive',
    color: 'bg-sky-50 border-sky-200 hover:bg-sky-100/50 text-sky-800',
    textColor: 'text-sky-700',
    responseQuote: '「突如其來的波瀾會刺激我們的心跳。讓我們一起停頓三秒，慢慢沉澱這份意外之喜。🌟」'
  }
};

export const PRESET_TAGS = ['學校', '家庭', '朋友', '功課', '身體', '宅在家', '好天氣', '美食', '運動', '遊戲'];

export const SOS_EXERCISES = [
  {
    title: '🌬️ 4-7-8 呼吸放鬆法',
    description: '一個簡單的呼吸練習，能迅速降低焦慮，平復急躁情緒，非常適合在緊張時進行。',
    steps: [
      { text: '吸氣 4 秒：用鼻子慢慢吸氣，感受肚子微微隆起...', duration: 4, action: 'inhale' },
      { text: '屏住呼吸 7 秒：保持安靜，放鬆肩膀，停留在這份寧靜...', duration: 7, action: 'hold' },
      { text: '呼氣 8 秒：用嘴巴發出微微的「呼」聲，吐出所有壓力...', duration: 8, action: 'exhale' }
    ]
  },
  {
    title: '🧘‍♂️ 5-4-3-2-1 感官著陸法',
    description: '當你覺得思緒混亂、不知道自己在做什麼時，藉由周圍事物，把心帶回當下。',
    items: [
      { count: 5, type: '👀 視覺', text: '尋找 5 件目光所及的事物（💡 觀看身處空間內的事物即可，例如：窗外的樹、桌上的筆、牆上的時鐘）' },
      { count: 4, type: '🖐️ 觸覺', text: '尋找 4 件可以觸摸的物件（💡 用手觸摸屬於自己的物品即可，例如：你的衣服、文具、手錶）' },
      { count: 3, type: '👂 聽覺', text: '尋找 3 種可以聽見的聲音（💡 靜心聆聽即可）' },
      { count: 2, type: '👃 嗅覺', text: '尋找 2 種可以聞到的氣味（💡 輕輕留意身邊的氣味，例如：清新的空氣、書本的氣味）' },
      { count: 1, type: '👄 味覺', text: '尋找 1 種味道（💡 可飲用自帶清水，或回想喜歡的味道）' }
    ]
  },
  {
    title: '🏡 安心小基地想像',
    description: '在腦海中勾勒一個完全屬於你、安全且溫暖的地方，讓疲憊的心靈休息。',
    quotes: [
      '想像自己正坐在最舒服的小椅子上，喝一口溫暖的水...',
      '身邊有最喜歡的玩偶或熟悉的書本，非常安靜舒服。',
      '在這裡，沒有任何壓力，你是百分之百安全的。',
      '只要好好放鬆，給自己一個溫暖的擁抱。'
    ]
  }
];

export const PLANT_STAGES = {
  seed: { label: '種子階段', minProgress: 0, maxProgress: 20, desc: '一顆小小的種子，正在泥土裡安穩地睡覺。' },
  sprout: { label: '幼苗階段', minProgress: 21, maxProgress: 40, desc: '哇！探出了嫩綠色的小芽，對世界充滿好奇。' },
  growing: { label: '成長中', minProgress: 41, maxProgress: 60, desc: '葉子漸漸繁茂，枝幹也變得結實了起來。' },
  flowering: { label: '開花中', minProgress: 61, maxProgress: 85, desc: '含苞待放！粉色與白色的花蕾正在悄悄舒展。' },
  blooming: { label: '盛開綻放', minProgress: 86, maxProgress: 100, desc: '太美了！花朵完全盛開，盆栽散發著幸福的光芒！' }
};

export function getPlantStage(progress: number): 'seed' | 'sprout' | 'growing' | 'flowering' | 'blooming' {
  if (progress <= 20) return 'seed';
  if (progress <= 40) return 'sprout';
  if (progress <= 70) return 'growing';
  if (progress <= 85) return 'flowering';
  return 'blooming';
}
