# Clicker Integration (Shared Economy)

This package contains corrected `main.js` and `game.js` wired to the shared economy layer at `../shared/economy.js`.

## What changed
- Removed direct Supabase client usage from both files.
- Connected gold operations to the shared economy API: `getGold`, `addGold`, `setGold`, `spendGold`, `refreshGold`.
- Replaced old `awardGold()` implementation with a wrapper that calls `addGold()` and refreshes UI.
- Replaced `getCurrentGold()` with `getGold()`.
- Added local UI helpers `displayCurrentGold()` and `showGoldReward()` in `main.js`.
- Stubbed `AchievementTracker` to avoid breaking existing references (logs initialization).
- Preserved console logs for debugging.

## Paths
- Place these files in: `www/lab/clicker/`
- Ensure `www/lab/shared/` contains: `economy.js`, `supaRaw.js`, `supabaseData.js`, `playersRepo.js`

## Notes
- No Supabase keys are required in these files anymore.
- All gold mutations flow through the central economy so other apps in the lab see consistent balances.
- If you had custom CSS for `.gold-reward`, it will still be used. Otherwise, consider styling it for better visuals.
