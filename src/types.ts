/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  question: string;
  text: string;
  emoji: string;
  score: number; // 1-5
  ageRange?: string;
  country?: string;
  isCustomQuestion?: boolean;
}

export interface UserProfile {
  name: string;
  streak: number;
  maxStreak: number;
  lastDateAnswered: string | null; // YYYY-MM-DD
  ageRange: string;
  country: string;
  isPremium: boolean;
}

export interface GlobalFeedItem {
  id: string;
  questionText: string;
  text: string;
  emoji: string;
  score: number;
  ageRange: string;
  country: string;
  timestamp: string;
}

export interface AIAnalysisResult {
  feedback: string;
  sentimentTheme: string;
  quote: string;
  isSimulated?: boolean;
}
