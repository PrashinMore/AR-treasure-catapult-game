import React, { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { checkDailyPlayLimit, recordPlay, getDeviceId } from '../services/supabase'
import ARScene from './ARScene'
import GameUI from './GameUI'
import MarkerDetectionScreen from './MarkerDetectionScreen'
import RewardModal from './RewardModal'
import './ARGame.css'

function ARGame() {
  const { markerDetected, arReady, arError, currentReward, startGame } = useGameStore()
  const [isLoading, setIsLoading] = useState(true)
  const [playLimitReached, setPlayLimitReached] = useState(false)

  useEffect(() => {
    // Check daily play limit
    const checkLimit = async () => {
      try {
        const deviceId = getDeviceId()
        const hasPlayedToday = await checkDailyPlayLimit(deviceId)
        
        if (hasPlayedToday) {
          setPlayLimitReached(true)
        } else {
          // Record this play
          await recordPlay(deviceId)
        }
      } catch (error) {
        console.error('Error checking play limit:', error)
        // Continue anyway - allow play in case of error
      } finally {
        setIsLoading(false)
      }
    }

    checkLimit()
  }, [])

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading AR Treasure Hunt...</p>
      </div>
    )
  }

  if (arError) {
    return (
      <div className="error-screen">
        <h2>⚠️ AR Error</h2>
        <p>{arError}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    )
  }

  if (playLimitReached) {
    return (
      <div className="error-screen">
        <h2>🎯 Daily Limit Reached</h2>
        <p>You've already played today! Come back tomorrow for more treasure hunting.</p>
        <button onClick={() => window.location.reload()}>OK</button>
      </div>
    )
  }

  return (
    <div className="ar-game">
      {!markerDetected ? (
        <MarkerDetectionScreen />
      ) : (
        <>
          <ARScene />
          <GameUI />
        </>
      )}
      {currentReward && <RewardModal />}
    </div>
  )
}

export default ARGame

