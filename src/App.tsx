import { useGameLogic, type QuestionResult } from './hooks/useGameLogic';
import { useStats } from './hooks/useStats';
import { evaluateAndSend, startNotificationScheduler, stopNotificationScheduler, setFeedbackCallback } from './services/notifications';
import { ToastProvider, useToast } from './hooks/useToast';
import ErrorBoundary from './components/ErrorBoundary';
import ZenLayout from './components/ZenLayout';
import MainMenu from './components/MainMenu';
import GameSetup from './components/GameSetup';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';
import SettingsScreen from './components/SettingsScreen';
import SpecialMenu from './components/SpecialMenu';
import RevisionScreen from './components/RevisionScreen';
import StatsScreen from './components/StatsScreen';
import HistoryScreen from './components/HistoryScreen';
import ToastContainer from './components/Toast';
import { useEffect } from 'react';

// Reset menu scroll position on hard reload/app launch.
// This runs once when the module is loaded, before any components mount.
if (typeof sessionStorage !== 'undefined') {
  sessionStorage.removeItem('zenmath-menu-scroll-position');
}

function AppInner() {
  const stats = useStats();
  const { showToast } = useToast();

  useEffect(() => {
    setFeedbackCallback(showToast);
    evaluateAndSend();
    startNotificationScheduler();
    return () => {
      setFeedbackCallback(null);
      stopNotificationScheduler();
    };
  }, [showToast]);

  const handleSessionComplete = (
    mode: string,
    totalQuestions: number,
    correct: number,
    avgTimeMs: number,
    difficulty: string,
    results: QuestionResult[]
  ) => {
    const questions = results.map(r => ({
      num1: typeof r.num1 === 'number' ? r.num1 : 0,
      num2: typeof r.num2 === 'number' ? r.num2 : 0,
      operation: r.operation,
      correctAnswer: r.correctAnswer,
      userAnswer: r.userAnswer,
      timeMs: r.timeTaken * 1000,
      isCorrect: r.isCorrect,
      mode,
      difficulty,
    }));

    stats.saveSession(mode, totalQuestions, correct, avgTimeMs, difficulty, questions);
  };

  const game = useGameLogic(handleSessionComplete);

  return (
    <ErrorBoundary>
      <ZenLayout>
        {game.screen === 'menu' && (
          <ErrorBoundary>
            <MainMenu
              onSelect={game.selectMode}
              onSettings={game.goToSettings}
              onRevision={game.goToRevision}
              onStats={game.goToStats}
              onHistory={game.goToHistory}
              game={game}
            />
          </ErrorBoundary>
        )}

        {game.screen === 'setup' && (
          <GameSetup
            mode={game.mode}
            digits={game.digits}
            difficulty={game.difficulty}
            allowRemainder={game.allowRemainder}
            allowNegativeResults={game.allowNegativeResults}
            mixedOps={game.mixedOps}
            squareRangeType={game.squareRangeType}
            customSquareRange={game.customSquareRange}
            fractionDenominatorRange={game.fractionDenominatorRange}
            fractionNumeratorRange={game.fractionNumeratorRange}
            onDigitsChange={game.setDigits}
            onDifficultyChange={game.setDifficulty}
            onAllowRemainderChange={game.setAllowRemainder}
            onMixedOpsChange={game.setMixedOps}
            onAllowNegativeResultsChange={game.setAllowNegativeResults}
            onSquareRangeTypeChange={game.setSquareRangeType}
            onCustomSquareRangeChange={game.setCustomSquareRange}
            onFractionDenominatorRangeChange={game.setFractionDenominatorRange}
            onFractionNumeratorRangeChange={game.setFractionNumeratorRange}
            onStart={game.startGame}
            onBack={game.goToMenu}
          />
        )}

        {game.screen === 'special-menu' && (
          <SpecialMenu
            mode={game.mode}
            onSelect={game.selectTableRange}
            onBack={game.goToMenu}
          />
        )}

        {game.screen === 'playing' && (
          <ErrorBoundary>
            <GameScreen
              num1={game.num1}
              num2={game.num2}
              operation={game.currentOperation}
              userInput={game.userInput}
              timeRemaining={game.timeRemaining}
              currentQuestion={game.currentQuestion}
              totalQuestions={game.totalQuestions}
              feedback={game.feedback}
              correctAnswer={game.correctAnswer}
              onKey={game.handleKeyPress}
              onQuit={game.goToMenu}
              mode={game.mode}
              fractionQuestionDisplay={game.fractionQuestionDisplay}
              fractionCorrectAnswer={game.fractionCorrectAnswer}
              ttsEnabled={game.settings.ttsEnabled}
              listenOnlyMode={game.settings.ttsEnabled && game.settings.listenOnlyMode}
              onSpeak={game.speakCurrentQuestion}
              streak={game.streak}
              showStreak={game.settings.showStreak}
              currentQuestionTimeElapsed={game.currentQuestionTimeElapsed}
              tableRange={game.tableRange}
              allowNegativeResults={game.allowNegativeResults}
            />
          </ErrorBoundary>
        )}

        {game.screen === 'result' && (
          <ResultsScreen
            score={game.score}
            totalQuestions={game.totalQuestions}
            percentage={game.percentage}
            avgTime={game.avgTime}
            results={game.results}
            onPlayAgain={game.startGame}
            onMenu={game.goToMenu}
          />
        )}

        {game.screen === 'stats' && (
          <StatsScreen
            onBack={game.goToMenu}
            stats={stats}
            dailyGoal={game.settings.dailyGoal}
          />
        )}

        {game.screen === 'history' && (
          <HistoryScreen onBack={game.goToMenu} />
        )}

        {game.screen === 'revision' && (
          <RevisionScreen onBack={game.goToMenu} />
        )}

        {game.screen === 'settings' && (
          <SettingsScreen
            settings={game.settings}
            onSave={game.updateSettings}
            onBack={game.goToMenu}
            audioSpriteLoaded={game.audioSpriteLoaded}
            onLoadAudioSprites={game.loadAudioSprites}
          />
        )}
      </ZenLayout>
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
