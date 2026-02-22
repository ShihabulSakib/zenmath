import { useGameLogic } from './hooks/useGameLogic';
import ZenLayout from './components/ZenLayout';
import MainMenu from './components/MainMenu';
import GameSetup from './components/GameSetup';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';
import SettingsScreen from './components/SettingsScreen';
import SpecialMenu from './components/SpecialMenu';
// import { useFractionLogic } from './hooks/useFractionLogic'; // Remove import useFractionLogic

export default function App() {
  // const fractionLogic = useFractionLogic(); // Remove instantiation of useFractionLogic
  const game = useGameLogic(); // Pass it to useGameLogic

  return (
    <ZenLayout>
      {game.screen === 'menu' && (
        <MainMenu
          onSelect={game.selectMode}
          onSettings={game.goToSettings}
        />
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
          onDigitsChange={game.setDigits}
          onDifficultyChange={game.setDifficulty}
          onAllowRemainderChange={game.setAllowRemainder}
          onMixedOpsChange={game.setMixedOps}
          onAllowNegativeResultsChange={game.setAllowNegativeResults}
          onSquareRangeTypeChange={game.setSquareRangeType}
          onCustomSquareRangeChange={game.setCustomSquareRange}
          onFractionDenominatorRangeChange={game.setFractionDenominatorRange}
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
        />
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

      {game.screen === 'settings' && (
        <SettingsScreen
          settings={game.settings}
          onSave={game.updateSettings}
          onBack={game.goToMenu}
        />
      )}
    </ZenLayout>
  );
}
