# 🚀 Quick Start Guide

Get your AR Treasure Hunt game running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create AR Marker (Optional for Testing)

The app works in **fallback mode** without a marker, but for full AR experience:

1. Go to https://hiukim.github.io/mind-ar-js-doc/tools/compile/
2. Upload a simple image (your logo or a pattern)
3. Download the `.mind` file
4. Save it as `public/markers/cafe-marker.mind`

## Step 3: Run the App

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

**Note:** For mobile testing, you'll need HTTPS. Use:
- `ngrok http 3000` (recommended)
- Or deploy to Vercel/Netlify

## Step 4: Test the Game

1. The app will start in marker detection mode
2. After 2 seconds (or when marker is detected), chests appear
3. Drag down on screen to throw keys
4. Hit chests to unlock rewards!

## Optional: Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Run `database-setup.sql` in the SQL editor
3. Copy your project URL and anon key
4. Create `.env` file:
   ```
   VITE_SUPABASE_URL=your-url
   VITE_SUPABASE_ANON_KEY=your-key
   ```

## Troubleshooting

**Camera not working?**
- Use HTTPS (required for camera)
- Check browser permissions
- Try Chrome or Firefox

**Marker not detecting?**
- App works in fallback mode without marker
- For real AR, ensure marker file exists in `public/markers/`

**Build errors?**
- Make sure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again

## Next Steps

- Customize rewards in `src/utils/rewards.js`
- Adjust game settings in `src/store/gameStore.js`
- Style the UI in component CSS files
- Deploy to Vercel/Netlify for production

Happy treasure hunting! 🎯✨

