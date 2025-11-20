import { create } from 'zustand'

export const useGameStore = create((set, get) => ({
  // Game state
  keysRemaining: 3,
  chestsHit: [],
  currentReward: null,
  gameStarted: false,
  markerDetected: false,
  
  // AR state
  arReady: false,
  arError: null,
  
  // Actions
  useKey: () => set((state) => ({ 
    keysRemaining: Math.max(0, state.keysRemaining - 1) 
  })),
  
  hitChest: (chestId) => set((state) => {
    if (state.chestsHit.includes(chestId)) return state
    return { 
      chestsHit: [...state.chestsHit, chestId]
      // Key is already deducted when thrown, not on hit
    }
  }),
  
  setReward: (reward) => set({ currentReward: reward }),
  
  startGame: () => set({ gameStarted: true, keysRemaining: 3, chestsHit: [] }),
  
  resetGame: () => set({ 
    keysRemaining: 3, 
    chestsHit: [], 
    currentReward: null,
    gameStarted: false 
  }),
  
  setMarkerDetected: (detected) => set({ markerDetected: detected }),
  
  setARReady: (ready) => set({ arReady: ready }),
  
  setARError: (error) => set({ arError: error })
}))

