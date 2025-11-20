import React, { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { checkDailyPlayLimit, recordPlay, getDeviceId } from '../services/supabase'
import ARScene from './ARScene'
import GameUI from './GameUI'
import MarkerDetectionScreen from './MarkerDetectionScreen'
import RewardModal from './RewardModal'
import './ARGame.css'

function ARGame() {
  const { markerDetected, arReady, arError, currentReward, startGame, setMarkerDetected, gameStarted } = useGameStore()
  const [isLoading, setIsLoading] = useState(true)
  const [playLimitReached, setPlayLimitReached] = useState(false)

  // Set marker as detected immediately to skip marker detection screen
  useEffect(() => {
    if (!markerDetected) {
      setMarkerDetected(true)
    }
    if (!gameStarted) {
      startGame()
    }
  }, [markerDetected, gameStarted, setMarkerDetected, startGame])

  useEffect(() => {
    // Check daily play limit (silently fail if Supabase is not configured)
    const checkLimit = async () => {
      try {
        const deviceId = getDeviceId()
        const hasPlayedToday = await checkDailyPlayLimit(deviceId)
        
        if (hasPlayedToday) {
          setPlayLimitReached(true)
        } else {
          // Record this play (silently fail if Supabase is not configured)
          await recordPlay(deviceId).catch(() => {
            // Supabase not configured, continue anyway
          })
        }
      } catch (error) {
        // Silently continue - Supabase might not be configured
        // This is fine for local development
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

