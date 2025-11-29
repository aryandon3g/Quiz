
import React from 'react';


export type Language = 'en' | 'hi';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type AppScreen = 'home' | 'generating' | 'quiz' | 'summary' | 'review' | 'modeSelection' | 'progress' | 'achievements';
export type GamificationTitle = 'Novice' | 'Explorer' | 'Virtuoso' | 'Master';
export type QuizMode = 'practice' | 'attempt';
export type SidebarView = 'main' | 'subjects' | 'topics' | 'mixedQuizConfig' | 'topicQuizConfig';

export interface QuizQuestion {
  question_en: string;
  question_hi: string;
  options_en: string[];
  options_hi: string[];
  correct_option_index: number;
  explanation_en: string;
  explanation_hi: string;
  imageUrl?: string; // New: Optional image URL for figure-based questions
}

export interface QuizSettings {
  topic: string;
  difficulty: Difficulty;
  numQuestions: number;
}

export interface UserAnswer {
  questionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeTaken: number;
  isBookmarked?: boolean;
}

export interface SummaryData {
  id: string;
  timestamp: number;
  score: number;
  totalQuestions: number;
  accuracy: number;
  totalTime: number;
  avgTimePerQuestion: number;
  topic?: string;
  answers: UserAnswer[];
  questions: QuizQuestion[];
  mode: QuizMode;
  netScore?: number;
  skipped?: number;
  xpEarned?: number;
}

export interface QuizTopic {
  name_en: string;
  name_hi: string;
  questionsLoader: () => Promise<QuizQuestion[]>; // Now loads asynchronously
}

export interface QuizSubject {
  name_en: string;
  name_hi: string;
  topics: QuizTopic[];
  isCustom?: boolean;
  iconEmoji?: string; // New: Optional emoji for aesthetic icons
}

// New types for Gamification and Progress Tracking
export interface ProgressDataPoint {
  quizId: string;
  timestamp: number;
  topic: string;
  accuracy: number;
  avgTimePerQuestion: number;
  xpEarned: number;
}

export interface Achievement {
  id: string;
  name_en: string;
  name_hi: string;
  description_en: string;
  description_hi: string;
  icon: string; // Changed from React.FC<any> to string
  criteria: string; // Text description of criteria
  unlocked: boolean;
  unlockedAt?: number; // Timestamp of unlock
  currentProgress?: number; // For progress tracking on achievements
  targetValue?: number; // For achievements with numerical targets
}

export interface XpData {
  totalXp: number;
  level: number;
}


// New type for Daily Streak
export interface StreakData {
  currentStreak: number;
  lastQuizDate: string; // Stored as 'YYYY-MM-DD'
}