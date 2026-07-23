export type MoodType = 'positive' | 'heavy';

export interface MoodConfig {
  emoji: string;
  label: string;
  type: MoodType;
  color: string; // Tailwind class for background/border
  textColor: string;
  responseQuote: string;
}

export interface CheckInRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  moodEmoji: string;
  moodLabel: string;
  moodType: MoodType;
  reason: string;
  tags: string[];
  timestamp: number;
  shareTargets?: string[]; // 'teacher', 'socialworker', 'parent'
  voiceAudioUrl?: string; // Optional audio recording blob URL or base64 data URI
}

export interface PlantState {
  name: string;
  stage: 'seed' | 'sprout' | 'growing' | 'flowering' | 'blooming';
  progress: number; // 0 to 100
  wateredCount: number;
  height: number; // cm
  lastWatered: string | null; // YYYY-MM-DD
}

export interface QuoteCard {
  id: string;
  text: string;
  imageUrl?: string;
}

export type UnlockedCards = string[];
