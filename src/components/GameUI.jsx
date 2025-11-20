import React from 'react'
import { useGameStore } from '../store/gameStore'
import './GameUI.css'

function GameUI() {
  const { keysRemaining, chestsHit, gameStarted } = useGameStore()

  return (
    <div className="game-ui">
      <div className="hud-top">
        <div className="keys-display">
          <h3>Magic Keys</h3>
          <div className="keys-container">
            {[1, 2, 3].map((keyNum) => (
              <div
                key={keyNum}
                className={`key-icon ${keyNum > keysRemaining ? 'used' : 'active'}`}
              >
                🔑
              </div>
            ))}
          </div>
          <p className="keys-count">{keysRemaining} remaining</p>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="instructions-panel">
          {keysRemaining > 0 ? (
            <>
              <p className="instruction-text">
                👆 Drag and release to throw a key!
              </p>
              <p className="instruction-hint">
                Aim for the floating treasure chests
              </p>
            </>
          ) : (
            <p className="instruction-text">
              {chestsHit.length > 0 
                ? `🎉 You hit ${chestsHit.length} chest${chestsHit.length > 1 ? 's' : ''}!`
                : 'No more keys! Try again tomorrow.'}
            </p>
          )}
        </div>
      </div>

      {!gameStarted && (
        <div className="start-overlay">
          <h1>🎯 AR Treasure Hunt</h1>
          <p>Throw your magic keys to unlock rewards!</p>
          <button className="start-button" onClick={() => useGameStore.getState().startGame()}>
            Start Game
          </button>
        </div>
      )}
    </div>
  )
}

export default GameUI

