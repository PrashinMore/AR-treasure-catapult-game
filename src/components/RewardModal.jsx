import React, { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { motion, AnimatePresence } from 'framer-motion'
import { saveRewardRedemption, getDeviceId } from '../services/supabase'
import './RewardModal.css'

function RewardModal() {
  const { currentReward, setReward, resetGame } = useGameStore()
  const [isClosing, setIsClosing] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Auto-save reward when modal opens
    if (currentReward && !saved) {
      const deviceId = getDeviceId()
      saveRewardRedemption(currentReward, deviceId)
        .then(() => {
          setSaved(true)
          console.log('Reward saved to database')
        })
        .catch((error) => {
          console.error('Failed to save reward:', error)
          // Continue anyway - reward code is still valid
          setSaved(true)
        })
    }
  }, [currentReward, saved])

  if (!currentReward) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setReward(null)
      setIsClosing(false)
      setSaved(false)
    }, 300)
  }

  const handleRedeem = () => {
    // Reward is already saved, just close
    handleClose()
  }

  const getRarityGradient = (rarity) => {
    switch (rarity) {
      case 'legendary':
        return 'linear-gradient(135deg, #FFD700, #FFA500)'
      case 'epic':
        return 'linear-gradient(135deg, #9B59B6, #8E44AD)'
      case 'rare':
        return 'linear-gradient(135deg, #3498DB, #2980B9)'
      default:
        return 'linear-gradient(135deg, #95A5A6, #7F8C8D)'
    }
  }

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          className="reward-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="reward-modal"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reward-header">
              <motion.div
                className="reward-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                🎁
              </motion.div>
              <h2>Reward Unlocked!</h2>
            </div>

            <div
              className="reward-card"
              style={{ background: getRarityGradient(currentReward.rarity) }}
            >
              <div className="reward-content">
                <h3 className="reward-name">{currentReward.name}</h3>
                <p className="reward-description">{currentReward.description}</p>
                <div className="reward-value">
                  <span>{currentReward.value}</span>
                </div>
              </div>

              <div className="redemption-code">
                <p className="code-label">Redemption Code</p>
                <div className="code-display">
                  {currentReward.redemptionCode}
                </div>
                <p className="code-hint">Show this code to the cashier</p>
              </div>
            </div>

            <div className="reward-actions">
              <button className="redeem-button" onClick={handleRedeem}>
                Got it! 🎉
              </button>
              <button className="close-button" onClick={handleClose}>
                Close
              </button>
            </div>

            <div className="sparkles">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="sparkle"
                  initial={{
                    x: '50%',
                    y: '50%',
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{
                    x: `${50 + (Math.random() - 0.5) * 100}%`,
                    y: `${50 + (Math.random() - 0.5) * 100}%`,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default RewardModal

