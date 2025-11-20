// Reward pool with probabilities
export const REWARD_POOL = [
  {
    id: 'jackpot-cold-brew',
    name: 'Free Cold Brew',
    description: 'Enjoy a refreshing cold brew on us!',
    value: 'FREE',
    probability: 0.05, // 5%
    rarity: 'legendary',
    color: '#FFD700'
  },
  {
    id: 'waffle-20-off',
    name: '₹20 off on any Waffle',
    description: 'Get ₹20 discount on your favorite waffle!',
    value: '₹20',
    probability: 0.15, // 15%
    rarity: 'epic',
    color: '#9B59B6'
  },
  {
    id: 'sandwich-combo',
    name: 'Buy 1 Sandwich, Get 1 Coffee 50% off',
    description: 'Perfect combo deal for you!',
    value: '50% OFF',
    probability: 0.10, // 10%
    rarity: 'epic',
    color: '#9B59B6'
  },
  {
    id: 'free-topping',
    name: 'Free Dessert Topping',
    description: 'Add a delicious topping to your dessert!',
    value: 'FREE',
    probability: 0.20, // 20%
    rarity: 'rare',
    color: '#3498DB'
  },
  {
    id: 'chocolate-shot',
    name: 'Free Chocolate Shot',
    description: 'A sweet chocolate shot to brighten your day!',
    value: 'FREE',
    probability: 0.20, // 20%
    rarity: 'rare',
    color: '#3498DB'
  },
  {
    id: 'small-discount',
    name: '₹10 off today',
    description: 'A small discount to make your day better!',
    value: '₹10',
    probability: 0.30, // 30%
    rarity: 'common',
    color: '#95A5A6'
  }
]

// Generate a random reward based on probabilities
export function getRandomReward() {
  const random = Math.random()
  let cumulative = 0
  
  for (const reward of REWARD_POOL) {
    cumulative += reward.probability
    if (random <= cumulative) {
      return { ...reward, redemptionCode: generateRedemptionCode() }
    }
  }
  
  // Fallback to last reward
  const lastReward = REWARD_POOL[REWARD_POOL.length - 1]
  return { ...lastReward, redemptionCode: generateRedemptionCode() }
}

// Generate a unique redemption code
function generateRedemptionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

