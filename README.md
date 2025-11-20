# 🎯 AR Treasure Hunt - Catapult Game

An amazing, high-engagement AR treasure hunt game for cafés! Customers scan a marker, throw magic keys at floating treasure chests, and unlock real café rewards.

## ✨ Features

- **AR Marker Tracking** - Uses MindAR for stable marker-based AR
- **3D Treasure Chests** - Animated floating chests with magical effects
- **Pokémon Go-style Throwing** - Drag and release to throw keys with physics
- **Reward System** - Random rewards with probability-based distribution
- **Beautiful UI** - Modern, polished interface with animations
- **Supabase Integration** - Backend for reward tracking and redemption

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account (optional, for production)
- A MindAR marker file (see [Marker Setup](#marker-setup))

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Supabase credentials (optional)
```

### Development

```bash
npm run dev
```

Open `http://localhost:3000` in your browser (HTTPS required for camera access on mobile).

### Building for Production

```bash
npm run build
npm run preview
```

## 📱 Marker Setup

### Creating a MindAR Marker

1. **Generate a marker image:**
   - Use the [MindAR Marker Generator](https://hiukim.github.io/mind-ar-js-doc/tools/compile/)
   - Upload your café logo or a custom design
   - Download the generated `.mind` file

2. **Place the marker file:**
   ```
   public/
     markers/
       cafe-marker.mind
   ```

3. **Print the marker:**
   - Print the marker image on a table tent, poster, or menu
   - Ensure good lighting and contrast
   - Recommended size: 8x8 inches minimum

### Alternative: Using ArUco Markers

If you prefer ArUco markers, you can modify the code to use `@ar-js/three` instead of MindAR.

## 🎮 How to Play

1. **Scan the Marker** - Point your camera at the café marker
2. **Get 3 Keys** - You start with 3 magic keys
3. **Throw Keys** - Drag down and release to throw a key at a chest
4. **Hit Chests** - If a key hits a chest, it opens and reveals a reward
5. **Redeem** - Show the redemption code to the cashier

## 🎁 Reward System

The game includes a probability-based reward system:

- **5%** - Free Cold Brew (Legendary)
- **15%** - ₹20 off on any Waffle (Epic)
- **10%** - Buy 1 Sandwich, Get 1 Coffee 50% off (Epic)
- **20%** - Free Dessert Topping (Rare)
- **20%** - Free Chocolate Shot (Rare)
- **30%** - ₹10 off today (Common)

You can customize rewards in `src/utils/rewards.js`.

## 🗄️ Database Setup (Supabase)

### Create Tables

Run these SQL commands in your Supabase SQL editor:

```sql
-- Plays table (track daily plays per device)
CREATE TABLE plays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Redemptions table (track reward redemptions)
CREATE TABLE redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  reward_value TEXT NOT NULL,
  redemption_code TEXT UNIQUE NOT NULL,
  device_id TEXT NOT NULL,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_plays_device_date ON plays(device_id, created_at);
CREATE INDEX idx_redemptions_code ON redemptions(redemption_code);
CREATE INDEX idx_redemptions_device ON redemptions(device_id);
```

### Environment Variables

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🏗️ Project Structure

```
AR-Treasure/
├── public/
│   └── markers/          # AR marker files
├── src/
│   ├── components/
│   │   ├── 3D/           # 3D models (TreasureChest, KeyProjectile)
│   │   ├── ARGame.jsx    # Main game component
│   │   ├── ARScene.jsx   # AR scene with MindAR integration
│   │   ├── GameUI.jsx    # HUD and UI elements
│   │   ├── MarkerDetectionScreen.jsx
│   │   └── RewardModal.jsx
│   ├── services/
│   │   └── supabase.js   # Supabase client and functions
│   ├── store/
│   │   └── gameStore.js  # Zustand state management
│   └── utils/
│       ├── physics.js    # Projectile physics
│       └── rewards.js    # Reward generation logic
└── package.json
```

## 🎨 Customization

### Changing Rewards

Edit `src/utils/rewards.js` to modify:
- Reward names and descriptions
- Probabilities
- Rarity tiers

### Adjusting Gameplay

- **Number of keys:** `src/store/gameStore.js` - `keysRemaining: 3`
- **Number of chests:** `src/components/ARScene.jsx` - `chestCount = 5`
- **Chest positions:** `src/components/ARScene.jsx` - `createTreasureChests()`
- **Physics:** `src/utils/physics.js` - gravity, speed, etc.

### Styling

All CSS files are in `src/components/` with matching `.css` files. Use CSS variables for easy theming.

## 🔧 Troubleshooting

### Camera Not Working

- Ensure you're using HTTPS (required for camera access)
- Check browser permissions for camera access
- Try a different browser (Chrome/Firefox recommended)

### Marker Not Detecting

- Ensure good lighting
- Keep marker flat and in view
- Check marker file is in `public/markers/`
- Try printing a larger marker

### AR Not Loading

- Check browser console for errors
- Ensure MindAR marker file exists
- Try fallback mode (works without marker)

## 📱 Mobile Testing

1. **Local Network:**
   ```bash
   npm run dev -- --host
   ```
   Access via `http://your-ip:3000`

2. **HTTPS Required:**
   - Use a service like ngrok: `ngrok http 3000`
   - Or deploy to Vercel/Netlify for testing

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Deploy dist/ folder
```

### Environment Variables

Don't forget to set environment variables in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📄 License

MIT License - feel free to use this for your café!

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add new reward types
- Improve physics/animations
- Add new AR features
- Enhance UI/UX

## 🎯 Future Enhancements

- [ ] Daily streak bonuses
- [ ] Social sharing for extra keys
- [ ] Leaderboard
- [ ] Multiple marker support
- [ ] Sound effects
- [ ] Haptic feedback
- [ ] Analytics dashboard

---

**Made with ❤️ for cafés everywhere!**

