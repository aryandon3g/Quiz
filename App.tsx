
import React, { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { Sidebar } from './components/Sidebar';
import { ConfirmModal } from './components/ConfirmModal';
import { getHistory, saveToHistory, clearHistory, getCustomQuizzes, saveCustomQuizzes, getXpData, saveXpData, getAchievements, saveAchievements, getProgressData, saveProgressData, clearProgressData, getStreakData, saveStreakData } from './services/storageService';
import type { Language, AppScreen, QuizQuestion, Difficulty, UserAnswer, SummaryData, QuizMode, SidebarView, XpData, Achievement, ProgressDataPoint, StreakData } from './types';
import { QuizSubject } from './types';
import { commonLabels, achievementLabels, homeScreenLabels, sidebarLabels, quizCardLabels, modeSelectionLabels, summaryScreenLabels } from './services/labels';
import { clearQuestionCache } from './services/quizDataService';
import { AchievementUnlockedNotification } from './components/AchievementUnlockedNotification';
import { LevelUpAnimation } from './components/LevelUpAnimation';

// Lazy load main screens for faster initial load
const LazyHomeScreen = lazy(() => import('./components/HomeScreen').then(module => ({ default: module.HomeScreen })));
const LazyQuizScreen = lazy(() => import('./components/QuizScreen').then(module => ({ default: module.QuizScreen })));
const LazySummaryScreen = lazy(() => import('./components/SummaryScreen').then(module => ({ default: module.SummaryScreen })));
const LazyModeSelectionScreen = lazy(() => import('./components/ModeSelectionScreen').then(module => ({ default: module.ModeSelectionScreen })));
const LazyProgressVisualization = lazy(() => import('./components/ProgressVisualization').then(module => ({ default: module.ProgressVisualization })));
const LazyAchievementsScreen = lazy(() => import('./components/AchievementsScreen').then(module => ({ default: module.AchievementsScreen })));


const XP_PER_LEVEL = 100;
const calculateLevelInfo = (totalXp: number) => {
    const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
    return { level };
};

const getDefaultAchievements = (language: Language): Achievement[] => [
    { id: 'firstStep', name_en: achievementLabels.en.firstStep.name, name_hi: achievementLabels.hi.firstStep.name, description_en: achievementLabels.en.firstStep.description, description_hi: achievementLabels.hi.firstStep.description, icon: 'BadgeIcon', criteria: 'quiz_completed_count >= 1', unlocked: false, currentProgress: 0, targetValue: 1 },
    { id: 'knowledgeable', name_en: achievementLabels.en.knowledgeable.name, name_hi: achievementLabels.hi.knowledgeable.name, description_en: achievementLabels.en.knowledgeable.description, description_hi: achievementLabels.hi.knowledgeable.description, icon: 'BadgeIcon', criteria: 'quiz_completed_count >= 50', unlocked: false, currentProgress: 0, targetValue: 50 },
    { id: 'sharpWitted', name_en: achievementLabels.en.sharpWitted.name, name_hi: achievementLabels.hi.sharpWitted.name, description_en: achievementLabels.en.sharpWitted.description, description_hi: achievementLabels.hi.sharpWitted.description, icon: 'BadgeIcon', criteria: 'total_fast_correct_answers >= 250', unlocked: false, currentProgress: 0, targetValue: 250 },
    { id: 'champion', name_en: achievementLabels.en.champion.name, name_hi: achievementLabels.hi.champion.name, description_en: achievementLabels.en.champion.description, description_hi: achievementLabels.hi.champion.description, icon: 'BadgeIcon', criteria: 'total_correct_answers >= 1000', unlocked: false, currentProgress: 0, targetValue: 1000 },
    { id: 'mastermind', name_en: achievementLabels.en.mastermind.name, name_hi: achievementLabels.hi.mastermind.name, description_en: achievementLabels.en.mastermind.description, description_hi: achievementLabels.hi.mastermind.description, icon: 'BadgeIcon', criteria: 'total_xp >= 2000', unlocked: false, currentProgress: 0, targetValue: 2000 },
    { id: 'guru', name_en: achievementLabels.en.guru.name, name_hi: achievementLabels.hi.guru.name, description_en: achievementLabels.en.guru.description, description_hi: achievementLabels.hi.guru.description, icon: 'TrophyIcon', criteria: 'total_xp >= 5000', unlocked: false, currentProgress: 0, targetValue: 5000 },
    { id: 'precise', name_en: achievementLabels.en.precise.name, name_hi: achievementLabels.hi.precise.name, description_en: achievementLabels.en.precise.description, description_hi: achievementLabels.hi.precise.description, icon: 'BadgeIcon', criteria: 'single_quiz_accuracy >= 95 && single_quiz_questions >= 20', unlocked: false },
    { id: 'fearless', name_en: achievementLabels.en.fearless.name, name_hi: achievementLabels.hi.fearless.name, description_en: achievementLabels.en.fearless.description, description_hi: achievementLabels.hi.fearless.description, icon: 'TrophyIcon', criteria: 'longest_quiz_questions >= 100', unlocked: false, currentProgress: 0, targetValue: 100 },
    { id: 'victorious', name_en: achievementLabels.en.victorious.name, name_hi: achievementLabels.hi.victorious.name, description_en: achievementLabels.en.victorious.description, description_hi: achievementLabels.hi.victorious.description, icon: 'TrophyIcon', criteria: 'perfect_quizzes_count >= 10', unlocked: false, currentProgress: 0, targetValue: 10 },
    { id: 'rocketSpeed', name_en: achievementLabels.en.rocketSpeed.name, name_hi: achievementLabels.hi.rocketSpeed.name, description_en: achievementLabels.en.rocketSpeed.description, description_hi: achievementLabels.hi.rocketSpeed.description, icon: 'BadgeIcon', criteria: 'total_fast_correct_answers >= 100', unlocked: false, currentProgress: 0, targetValue: 100 },
    { id: 'oceanOfKnowledge', name_en: achievementLabels.en.oceanOfKnowledge.name, name_hi: achievementLabels.hi.oceanOfKnowledge.name, description_en: achievementLabels.en.oceanOfKnowledge.description, description_hi: achievementLabels.hi.oceanOfKnowledge.description, icon: 'BadgeIcon', criteria: 'unique_topics_completed >= 10', unlocked: false, currentProgress: 0, targetValue: 10 },
    { id: 'theAce', name_en: achievementLabels.en.theAce.name, name_hi: achievementLabels.hi.theAce.name, description_en: achievementLabels.en.theAce.description, description_hi: achievementLabels.hi.theAce.description, icon: 'TrophyIcon', criteria: 'total_xp >= 1500 && overall_accuracy >= 85', unlocked: false, currentProgress: 0, targetValue: 85 },
    { id: 'theGambler', name_en: achievementLabels.en.theGambler.name, name_hi: achievementLabels.hi.theGambler.name, description_en: achievementLabels.en.theGambler.description, description_hi: achievementLabels.hi.theGambler.description, icon: 'BadgeIcon', criteria: 'attempt_mode_correct_answers >= 200', unlocked: false, currentProgress: 0, targetValue: 200 },
    { id: 'worldConqueror', name_en: achievementLabels.en.worldConqueror.name, name_hi: achievementLabels.hi.worldConqueror.name, description_en: achievementLabels.en.worldConqueror.description, description_hi: achievementLabels.hi.worldConqueror.description, icon: 'TrophyIcon', criteria: 'total_quizzes_completed >= 200', unlocked: false, currentProgress: 0, targetValue: 200 },
    { id: 'theEmperor', name_en: achievementLabels.en.theEmperor.name, name_hi: achievementLabels.hi.theEmperor.name, description_en: achievementLabels.hi.theEmperor.description, description_hi: achievementLabels.hi.theEmperor.description, icon: 'TrophyIcon', criteria: 'total_xp >= 10000', unlocked: false, currentProgress: 0, targetValue: 10000 },
];


const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [language, setLanguage] = useState<Language>('en');
    const [screen, setScreen] = useState<AppScreen>('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [difficulty] = useState<Difficulty>('Medium');
    const [numQuestions] = useState(10); 

    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    
    const [history, setHistory] = useState<SummaryData[]>([]);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    const [quizMode, setQuizMode] = useState<QuizMode | null>(null);
    const [customQuizzes, setCustomQuizzes] = useState<QuizSubject[]>([]
    );
    const [sidebarStartView, setSidebarStartView] = useState<SidebarView>('main');

    const [xpData, setXpData] = useState<XpData>({ totalXp: 0, level: 1 });
    const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, lastQuizDate: '' });
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [progressHistory, setProgressHistory] = useState<ProgressDataPoint[]>([]);
    const [quizLanguageSwitches, setQuizLanguageSwitches] = useState(0);

    const [showAchievementNotification, setShowAchievementNotification] = useState(false);
    const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newLevelForAnimation, setNewLevelForAnimation] = useState(0);


    const l = commonLabels[language];

    const defaultAchievementsMemo = useMemo(() => getDefaultAchievements(language), [language]);

    useEffect(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }

        const loadInitialData = async () => {
            setHistory(await getHistory());
            setCustomQuizzes(await getCustomQuizzes());
            setXpData(await getXpData());
            setAchievements(await getAchievements(defaultAchievementsMemo));
            setProgressHistory(await getProgressData());
            setStreakData(await getStreakData());
        };

        loadInitialData();
    }, [defaultAchievementsMemo]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const handleThemeChange = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);

    const handleOpenSettings = useCallback(() => {
        setSidebarStartView('main');
        setIsSidebarOpen(true);
    }, []);

    const handleTakeQuizClick = useCallback(() => {
        setSidebarStartView('subjects');
        setIsSidebarOpen(true);
    }, []);
    
    const updateXp = useCallback(async (xpGained: number) => {
        const currentXpData = await getXpData();
        const oldLevel = calculateLevelInfo(currentXpData.totalXp).level;

        const newTotalXp = currentXpData.totalXp + xpGained;
        const { level: newLevel } = calculateLevelInfo(newTotalXp);

        if (newLevel > oldLevel) {
            setNewLevelForAnimation(newLevel);
            setShowLevelUp(true);
        }
        
        const updatedXpData = { totalXp: newTotalXp, level: newLevel };
        await saveXpData(updatedXpData);
        setXpData(updatedXpData);

        return updatedXpData;
    }, []);

    const checkAchievements = useCallback(async (quizSummary: SummaryData | null, currentXpData: XpData, currentCustomQuizzes: QuizSubject[], currentLanguageSwitches: number) => {
        const allHistoryData = await getHistory();

        const updatedAchievements = defaultAchievementsMemo.map(ach => {
            let isUnlocked = ach.unlocked;
            let currentProgress = ach.currentProgress || 0;

            if (isUnlocked) return ach; // Already unlocked, no need to re-check

            const totalQuizzesCompleted = allHistoryData.length;
            const totalCorrectAnswers = allHistoryData.reduce((sum, s) => sum + s.score, 0);
            const overallAccuracy = totalQuizzesCompleted > 0 ? allHistoryData.reduce((sum, s) => sum + s.accuracy, 0) / totalQuizzesCompleted : 0;
            const uniqueTopicsCompleted = new Set(allHistoryData.map(s => s.topic)).size;
            const perfectQuizzesCount = allHistoryData.filter(s => s.accuracy === 100 && s.totalQuestions >= 10).length;
            const longestQuizQuestions = allHistoryData.reduce((max, s) => Math.max(max, s.totalQuestions), 0);
            const attemptModeCorrectAnswers = allHistoryData.filter(s => s.mode === 'attempt').reduce((sum, s) => sum + s.score, 0);
            let totalFastCorrectAnswers = 0;
            allHistoryData.forEach(historyItem => {
                historyItem.answers.forEach(answer => {
                    if (answer.isCorrect && answer.timeTaken <= 5) {
                        totalFastCorrectAnswers++;
                    }
                });
            });

            switch (ach.id) {
                case 'firstStep':
                    currentProgress = totalQuizzesCompleted;
                    isUnlocked = totalQuizzesCompleted >= (ach.targetValue || 1);
                    break;
                case 'knowledgeable':
                    currentProgress = totalQuizzesCompleted;
                    isUnlocked = totalQuizzesCompleted >= (ach.targetValue || 50);
                    break;
                case 'sharpWitted':
                    currentProgress = totalFastCorrectAnswers;
                    isUnlocked = totalFastCorrectAnswers >= (ach.targetValue || 250);
                    break;
                case 'champion':
                    currentProgress = totalCorrectAnswers;
                    isUnlocked = totalCorrectAnswers >= (ach.targetValue || 1000);
                    break;
                case 'mastermind':
                    currentProgress = currentXpData.totalXp;
                    isUnlocked = currentXpData.totalXp >= (ach.targetValue || 2000);
                    break;
                case 'guru':
                    currentProgress = currentXpData.totalXp;
                    isUnlocked = currentXpData.totalXp >= (ach.targetValue || 5000);
                    break;
                case 'precise':
                    if (quizSummary && (quizSummary.accuracy || 0) >= 95 && quizSummary.totalQuestions >= 20) {
                        isUnlocked = true;
                    } else {
                        const pastAch = allHistoryData.find(s => (s.accuracy || 0) >= 95 && s.totalQuestions >= 20);
                        isUnlocked = !!pastAch;
                    }
                    currentProgress = isUnlocked ? (ach.targetValue || 1) : 0;
                    break;
                case 'fearless':
                    currentProgress = longestQuizQuestions;
                    isUnlocked = longestQuizQuestions >= (ach.targetValue || 100);
                    break;
                case 'victorious':
                    currentProgress = perfectQuizzesCount;
                    isUnlocked = perfectQuizzesCount >= (ach.targetValue || 10);
                    break;
                case 'rocketSpeed':
                    currentProgress = totalFastCorrectAnswers;
                    isUnlocked = totalFastCorrectAnswers >= (ach.targetValue || 100);
                    break;
                case 'oceanOfKnowledge':
                    currentProgress = uniqueTopicsCompleted;
                    isUnlocked = uniqueTopicsCompleted >= (ach.targetValue || 10);
                    break;
                case 'theAce':
                    currentProgress = overallAccuracy;
                    isUnlocked = currentXpData.totalXp >= 1500 && overallAccuracy >= 85;
                    break;
                case 'theGambler':
                    currentProgress = attemptModeCorrectAnswers;
                    isUnlocked = attemptModeCorrectAnswers >= (ach.targetValue || 200);
                    break;
                case 'worldConqueror':
                    currentProgress = totalQuizzesCompleted;
                    isUnlocked = totalQuizzesCompleted >= (ach.targetValue || 200);
                    break;
                case 'theEmperor':
                    currentProgress = currentXpData.totalXp;
                    isUnlocked = currentXpData.totalXp >= (ach.targetValue || 10000);
                    break;
                default:
                    break;
            }
            if (isUnlocked && !ach.unlocked) {
                setUnlockedAchievement({ ...ach, unlocked: true, unlockedAt: Date.now() });
                setShowAchievementNotification(true);
                return { ...ach, unlocked: true, unlockedAt: Date.now(), currentProgress: ach.targetValue || currentProgress };
            }
            return { ...ach, currentProgress: currentProgress };
        });

        setAchievements(updatedAchievements);
        await saveAchievements(updatedAchievements);
    }, [defaultAchievementsMemo]);

    const handleStartSubjectQuiz = useCallback(async (questionsLoader: () => Promise<QuizQuestion[]>, topic: string) => {
        setScreen('generating');
        setApiError(null);
        try {
            const quizQuestions = await questionsLoader();
            setQuestions(quizQuestions);
            setSummaryData({ topic, questions: quizQuestions } as SummaryData);
            setScreen('modeSelection');
            setIsSidebarOpen(false);
            setQuizLanguageSwitches(0);
        } catch (error) {
            console.error("Failed to load subject quiz questions:", error);
            setApiError(error instanceof Error ? error.message : "Failed to load quiz questions.");
            setScreen('home');
        }
    }, []);

    const handleModeSelection = useCallback((mode: QuizMode) => {
        setQuizMode(mode);
        setScreen('quiz');
    }, []);
    
    const restartApp = useCallback(async () => {
        setScreen('home');
        setQuestions([]);
        setSummaryData(null);
        setApiError(null);
        setQuizMode(null);
        setQuizLanguageSwitches(0);
        setHistory(await getHistory());
        setXpData(await getXpData());
        setAchievements(await getAchievements(defaultAchievementsMemo));
        setProgressHistory(await getProgressData());
        setStreakData(await getStreakData());
    }, [defaultAchievementsMemo]);

    const handleQuizFinish = useCallback(async (answers: UserAnswer[], streak: number) => {
      const correctAnswers = answers.filter(a => a.isCorrect).length;
      const skippedAnswers = answers.filter(a => a.selectedOptionIndex === -1).length;
      const incorrectAnswers = answers.filter(a => a.selectedOptionIndex !== -1 && !a.isCorrect).length;
      
      const answered = answers.filter(a => a.selectedOptionIndex !== -1);
      const totalTime = answered.reduce((sum, a) => sum + a.timeTaken, 0);
      
      const netScore = quizMode === 'attempt' 
          ? (correctAnswers * 1) - (incorrectAnswers * 0.25) 
          : correctAnswers;

      let streakBonus = 0;
      if (streak >= 10) {
        streakBonus = 10;
      } else if (streak >= 5) {
        streakBonus = 5;
      } else if (streak >= 3) {
        streakBonus = 2;
      }
      
      const accuracyBonus = Math.round(questions.length > 0 ? (correctAnswers / questions.length) * 10 : 0);
      const xpEarned = (correctAnswers * 10) + streakBonus + accuracyBonus;
      
      // --- Streak Logic ---
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      let newStreak = streakData.currentStreak;
      
      if (streakData.lastQuizDate === yesterdayStr) {
          newStreak++;
      } else if (streakData.lastQuizDate !== todayStr) {
          newStreak = 1;
      }

      const newStreakData: StreakData = {
          currentStreak: newStreak,
          lastQuizDate: todayStr,
      };
      await saveStreakData(newStreakData);
      setStreakData(newStreakData);
      
      const updatedXpData = await updateXp(xpEarned);
      // End Streak Logic

      const newSummaryData: SummaryData = {
          id: `${Date.now()}-${summaryData?.topic || 'quiz'}`,
          timestamp: Date.now(),
          score: correctAnswers,
          totalQuestions: questions.length,
          accuracy: questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0,
          totalTime: totalTime,
          avgTimePerQuestion: answered.length > 0 ? totalTime / answered.length : 0,
          answers: answers,
          questions: questions,
          mode: quizMode!,
          netScore: netScore,
          topic: summaryData?.topic,
          skipped: skippedAnswers,
          xpEarned: xpEarned,
      };
      setSummaryData(newSummaryData);
      await saveToHistory(newSummaryData);
      setHistory(await getHistory());
      
      const newProgressDataPoint: ProgressDataPoint = {
        quizId: newSummaryData.id,
        timestamp: newSummaryData.timestamp,
        topic: newSummaryData.topic || 'Untitled',
        accuracy: newSummaryData.accuracy,
        avgTimePerQuestion: newSummaryData.avgTimePerQuestion,
        xpEarned: xpEarned,
      };
      await saveProgressData(newProgressDataPoint);
      setProgressHistory(await getProgressData());

      const updatedCustomQuizzes = await getCustomQuizzes();
      await checkAchievements(newSummaryData, updatedXpData, updatedCustomQuizzes, quizLanguageSwitches);
      setScreen('summary');

    }, [questions, summaryData, quizMode, updateXp, quizLanguageSwitches, checkAchievements, getCustomQuizzes, streakData]);

    const handleReattempt = useCallback(() => {
        setScreen('quiz');
    }, []);

    const handleReattemptIncorrect = useCallback(async () => {
        if (!summaryData) return;
        const incorrectAnswers = summaryData.answers.filter(a => !a.isCorrect && a.selectedOptionIndex !== -1);
        const incorrectQuestionIndices = new Set(incorrectAnswers.map(a => a.questionIndex));
        const incorrectQuestions = summaryData.questions.filter((_, index) => incorrectQuestionIndices.has(index));

        if (incorrectQuestions.length > 0) {
            setQuestions(incorrectQuestions);
            setSummaryData({ 
                ...summaryData,
                topic: `${summaryData.topic} (${commonLabels['en'].incorrectOnly})`,
                questions: incorrectQuestions 
            });
            setQuizMode('practice');
            setScreen('quiz');
        }
    }, [summaryData]);

    const handleViewHistoryItem = useCallback(async (id: string) => {
        const historyData = await getHistory();
        const item = historyData.find(h => h.id === id);
        if (item) {
            setSummaryData(item);
            setQuestions(item.questions);
            setQuizMode(item.mode);
            setScreen('summary');
            setIsSidebarOpen(false);
        }
    }, []);
    
    const handleClearHistory = useCallback(async () => {
        await clearHistory();
        setHistory([]);
        await clearProgressData();
        setProgressHistory([]);
    }, []);

    const handleSaveCustomQuiz = useCallback(async (quiz: QuizSubject) => {
        const newQuizzes = [...customQuizzes, quiz];
        setCustomQuizzes(newQuizzes);
        await saveCustomQuizzes(newQuizzes);
        clearQuestionCache();
        
        const updatedXpData = await getXpData();
        const updatedCustomQuizzes = await getCustomQuizzes();
        await checkAchievements(null, updatedXpData, updatedCustomQuizzes, quizLanguageSwitches);

        setScreen('home');
        setIsSidebarOpen(false);
    }, [customQuizzes, checkAchievements, quizLanguageSwitches]);

    const handleDeleteCustomQuiz = useCallback(async (quizName: string) => {
        if(window.confirm(language === 'en' ? `Are you sure you want to delete the quiz "${quizName}"?` : `क्या आप वाकई "${quizName}" प्रश्नोत्तरी को हटाना चाहते हैं?`)) {
            const newQuizzes = customQuizzes.filter(q => q.name_en !== quizName);
            setCustomQuizzes(newQuizzes);
            await saveCustomQuizzes(newQuizzes);
            clearQuestionCache();
        }
    }, [customQuizzes, language]);

    const handleBackClick = useCallback(() => {
        if (screen === 'quiz' || screen === 'modeSelection') {
            setIsConfirmModalOpen(true);
        } else if (screen === 'summary' || screen === 'progress' || screen === 'achievements') {
            restartApp();
        } else if (screen === 'review') {
            setScreen('summary');
        }
    }, [screen, restartApp]);

    const handleConfirmQuit = useCallback(async () => {
        setIsConfirmModalOpen(false);
        if (screen === 'quiz') {
            setScreen('modeSelection');
            setQuizMode(null);
        } else if (screen === 'modeSelection') {
            setScreen('home');
            setSidebarStartView('subjects');
            setIsSidebarOpen(true);

            setQuestions([]);
            setSummaryData(null);
            setApiError(null);
            setQuizMode(null);
            setQuizLanguageSwitches(0);
        }
    }, [screen]);

    const handleCancelQuit = useCallback(() => {
        setIsConfirmModalOpen(false);
    }, []);

    const handleLanguageChangeInQuiz = useCallback(() => {
        setLanguage(lang => lang === 'en' ? 'hi' : 'en');
        setQuizLanguageSwitches(prev => prev + 1);
    }, []);

    const renderScreen = () => {
        switch (screen) {
            case 'home':
                return <LazyHomeScreen 
                    language={language} 
                    history={history}
                    onViewHistoryItem={handleViewHistoryItem}
                    onTakeQuizClick={handleTakeQuizClick}
                    xpData={xpData}
                    onViewProgress={() => setScreen('progress')}
                    onViewAchievements={() => setScreen('achievements')}
                    streakData={streakData}
                />;
            case 'generating':
                return <Loader language={language} />;
            case 'modeSelection':
                return <LazyModeSelectionScreen language={language} onSelectMode={handleModeSelection} />;
            case 'quiz':
                return <LazyQuizScreen 
                    initialQuestions={questions}
                    language={language}
                    onLanguageChange={handleLanguageChangeInQuiz}
                    onFinish={handleQuizFinish}
                    mode={quizMode!}
                    reviewData={null}
                />;
            case 'review':
                return summaryData && <LazyQuizScreen
                    initialQuestions={summaryData!.questions}
                    language={language}
                    onLanguageChange={handleLanguageChangeInQuiz}
                    onFinish={() => {}}
                    mode={summaryData!.mode}
                    isReviewMode={true}
                    reviewData={summaryData}
                    onBackToSummary={() => setScreen('summary')}
                />;
            case 'summary':
                return summaryData && <LazySummaryScreen 
                    summary={summaryData} 
                    language={language} 
                    onRestart={restartApp}
                    onReview={() => setScreen('review')}
                    onReattemptIncorrect={handleReattemptIncorrect}
                />;
            case 'progress':
                return <LazyProgressVisualization language={language} progressData={progressHistory} />;
            case 'achievements':
                return <LazyAchievementsScreen language={language} achievements={achievements} />;
            default:
                return <LazyHomeScreen 
                    language={language} 
                    history={history}
                    onViewHistoryItem={handleViewHistoryItem}
                    onTakeQuizClick={handleTakeQuizClick}
                    xpData={xpData}
                    onViewProgress={() => setScreen('progress')}
                    onViewAchievements={() => setScreen('achievements')}
                    streakData={streakData}
                />;
        }
    };

    return (
        <main className="h-screen w-screen bg-gray-100 dark:bg-primary-950 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
             <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-primary-950">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
                <div className="absolute inset-0 z-0 mix-blend-soft-light dark:mix-blend-color-dodge opacity-70">
                    <div className="absolute top-1/2 left-1/2 w-[50vw] h-[50vh] bg-primary-500 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[150px] animate-mesh-gradient"></div>
                    <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vh] bg-primary-300 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[150px] animate-mesh-gradient" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vh] bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-[150px] animate-mesh-gradient" style={{ animationDelay: '4s' }}></div>
                </div>
            </div>

            <div className="relative mx-auto h-full w-full max-w-md bg-white/50 dark:bg-primary-900/50 backdrop-blur-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-black/20 rounded-2xl
                before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-primary-400/30 before:via-transparent before:to-primary-200/30 before:animate-button-glow before:blur-xl">
                
                <div className="print:hidden">
                    <Header 
                        onSettingsClick={handleOpenSettings}
                        showBackButton={screen !== 'home' && screen !== 'generating'}
                        onBackClick={handleBackClick}
                    />
                    <Sidebar
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        language={language}
                        onLanguageChange={setLanguage}
                        theme={theme}
                        onThemeChange={handleThemeChange}
                        history={history}
                        onViewHistoryItem={handleViewHistoryItem}
                        onClearHistory={handleClearHistory}
                        onStartSubjectQuiz={handleStartSubjectQuiz}
                        customQuizzes={customQuizzes}
                        onDeleteCustomQuiz={handleDeleteCustomQuiz}
                        startView={sidebarStartView}
                        onViewProgress={() => { setScreen('progress'); setIsSidebarOpen(false); }}
                        onViewAchievements={() => { setScreen('achievements'); setIsSidebarOpen(false); }}
                        xpData={xpData}
                    />
                    {apiError && (
                        <div className="absolute top-20 left-4 right-4 bg-red-100/80 backdrop-blur-sm border border-red-400 text-red-800 dark:bg-red-900/80 dark:text-red-200 px-4 py-3 rounded-lg z-20" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{apiError}</span>
                        </div>
                    )}
                    <Suspense fallback={<Loader language={language} />}>
                        <div key={screen} className="h-full w-full animate-slide-in">
                            {renderScreen()}
                        </div>
                    </Suspense>
                </div>
                
                <ConfirmModal 
                    isOpen={isConfirmModalOpen}
                    onConfirm={handleConfirmQuit}
                    onCancel={handleCancelQuit}
                    language={language}
                />
                <AchievementUnlockedNotification
                    isActive={showAchievementNotification}
                    onComplete={() => setShowAchievementNotification(false)}
                    achievement={unlockedAchievement}
                    language={language}
                />
                 <LevelUpAnimation
                    isActive={showLevelUp}
                    onComplete={() => setShowLevelUp(false)}
                    newLevel={newLevelForAnimation}
                    language={language}
                />
            </div>
        </main>
    );
};

export default App;
