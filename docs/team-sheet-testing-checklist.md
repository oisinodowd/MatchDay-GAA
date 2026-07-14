# Team Sheet Feature — Testing Checklist & Polish Documentation

## Overview
This document provides a comprehensive testing checklist for the Team Sheet Feature implementation in matchday-gaa. All 9 phases have been completed and the project builds successfully.

---

## Phase 1-3: Match Creation with Team Sheets

### ✅ Build Status
- [x] TypeScript compilation passes
- [x] Next.js production build succeeds
- [x] All routes generate correctly

### Manual Testing Checklist

#### New Match Page Flow
- [ ] **Navigate to `/matches/new`**
  - [ ] Page loads without errors
  - [ ] Two team input fields visible (Home Team, Away Team)
  - [ ] Sport selector shows GAA options
  
- [ ] **Create teams WITHOUT player sheets**
  - [ ] Create button is DISABLED until both teams have ≥15 players
  - [ ] "Add Players" prompt shown on each team card

- [ ] **Quick Add 21 Players**
  - [ ] Click "Quick Add 21" button
  - [ ] All 21 players appear with default positions:
    - Player 1: GK (number 1)
    - Players 2-8: DEF (numbers 2-8)
    - Players 9-12: MID (numbers 9-12)
    - Players 13-15: FWD (numbers 13-15)
    - Players 16-21: SUB (numbers 16-21)
  - [ ] First 15 marked as "Starter"
  - [ ] Last 6 marked as "Substitute"

- [ ] **Add Players Manually**
  - [ ] Click "Add Player" button
  - [ ] New player row appears with:
    - Name input field (defaults to "Player N")
    - Number input (auto-incremented)
    - Position selector chip
    - Photo upload placeholder
  - [ ] Position chips color-coded: GK=yellow, DEF=blue, MID=green, FWD=red, SUB=gray

- [ ] **Edit Player Details**
  - [ ] Change player name — updates immediately
  - [ ] Change jersey number — validates no duplicates
  - [ ] Change position — chip color updates
  - [ ] Remove player (trash icon) — row disappears with animation

- [ ] **Reorder Players**
  - [ ] Up/Down arrow buttons move players in list
  - [ ] First 15 stay grouped as "Starters"
  - [ ] Last 6 stay grouped as "Substitutes"

- [ ] **Upload Player Photo**
  - [ ] Click photo placeholder on any player
  - [ ] File picker opens (JPEG/PNG/WebP only)
  - [ ] Select image — preview shows immediately
  - [ ] Image compressed to base64 JPEG at 0.7 quality
  - [ ] Large images (>5MB) show error message

- [ ] **Validation Errors**
  - [ ] Try creating match with duplicate jersey numbers → Error shown
  - [ ] Try creating match with <15 players per team → Create button stays disabled
  - [ ] Try creating match without player names → Validation warning

- [ ] **Create Match**
  - [ ] Both teams have ≥15 players
  - [ ] Click "Create Match" button
  - [ ] Redirected to `/matches/active`
  - [ ] Match header shows both team names and scores (0-0)

---

## Phase 4: Player Selector Integration

### Scoring Panel (`ScoringPanel.tsx`)
- [ ] Navigate to active match page
- [ ] Open scoring dropdown for a team
- [ ] Player selector shows REAL player names and numbers from team sheet
- [ ] Selecting a player and scoring updates their individual stats
- [ ] Goals increment player's `goals` count
- [ ] Points increment player's `points` count
- [ ] Two-point shots add 2 to player's points

### Card Panel (`CardPanel.tsx`)
- [ ] Open card selector for a team
- [ ] Player dropdown shows real roster
- [ ] Recording yellow card increments player's `yellowCards`
- [ ] Recording black/red card updates respective counts
- [ ] Cards appear in red on player rows

### Substitution Panel (`SubstitutionPanel.tsx`)
- [ ] Open substitution panel
- [ ] "Player Out" dropdown shows starters + active substitutes
- [ ] "Player On" dropdown shows available bench players
- [ ] Selecting outgoing player marks them as `isSubstituted=true`
- [ ] Selecting incoming player updates their `isStarter=true`
- [ ] New players not on roster can be added manually

### Restart Panel (`RestartPanel.tsx`)
- [ ] Open restart panel
- [ ] Player selector shows real team roster
- [ ] Recording kick-out/45m/65m/free kicks logs event with player name

---

## Phase 5: Players Page Enhancement

### Navigation & Layout
- [ ] Navigate to `/matches/active/players`
- [ ] Page title "Players & Squad" displays correctly
- [ ] Back button returns to active match page

### Search Functionality
- [ ] Type player name in search box — filters results
- [ ] Type jersey number — filters matching players
- [ ] Type position (e.g., "DEF") — filters by position
- [ ] Clearing search shows all players again

### Filter Controls
- [ ] **Team filter:**
  - [ ] "All Teams" shows both home and away players
  - [ ] Select home team — only home players shown
  - [ ] Select away team — only away players shown
  
- [ ] **Role filter:**
  - [ ] "All Players" shows starters + substitutes
  - [ ] "Starters Only" filters to first 15 per team
  - [ ] "Substitutes Only" filters to bench players

### Player Rows Display
- [ ] Each row shows:
  - [ ] Photo thumbnail (or jersey number placeholder)
  - [ ] Jersey number in monospace font
  - [ ] Player name (truncated if too long)
  - [ ] Position badge with color coding
  - [ ] Starter/Substitute status label
  
- [ ] Stats columns display:
  - [ ] Goals (G) — green text, only shown if >0
  - [ ] Points (P) — blue text, only shown if >0
  - [ ] Cards (C) — red text, only shown if >0

### Unassigned Scores Warning
- [ ] If scores exist without player assignment:
  - [ ] Orange warning box appears at top
  - [ ] Shows count of unassigned scores
  - [ ] Lists first 5 unassigned events
  - [ ] "Assign Player" button next to each (placeholder for future)

### Top Scorers Section
- [ ] Bottom card shows "Player Stats Summary"
- [ ] Top 5 scorers listed with:
  - [ ] Rank number (#1, #2, etc.)
  - [ ] Team badge (home/away color)
  - [ ] Player name
  - [ ] Goals and points breakdown
  - [ ] Total score (goals×3 + points)

---

## Phase 6: Team Sheets Tab on Active Match

### Tab Navigation
- [ ] Navigate to `/matches/active`
- [ ] Two tabs visible: "Scoring" and "Team Sheets"
- [ ] Default tab is "Scoring"
- [ ] Clicking "Team Sheets" switches view

### Team Sheet View (`TeamSheetView.tsx`)
- [ ] Both home and away team sheets displayed
- [ ] Each sheet shows formation grid layout
- [ ] Player badges display:
  - [ ] Photo (if uploaded) or jersey number
  - [ ] Name below badge
  - [ ] Position label on badge
  
- [ ] Clicking player badge expands row to show:
  - [ ] Full stats line (G-P-C)
  - [ ] Starter/Substitute status

---

## Phase 8: Edge Case Handling & Data Integrity

### Backward Compatibility
- [ ] Open app with OLD persisted match (no players array)
- [ ] Match automatically migrates — generates default 21 players
- [ ] Existing events still reference valid player indices
- [ ] No errors in console during migration

### Player Validation
- [ ] Create player with empty name → Defaults to "Player N"
- [ ] Create player with negative number → Corrected to positive
- [ ] Create player with duplicate number → Validation error shown
- [ ] Corrupted base64 photo URL → Discarded, shows placeholder

### Store Action Safety
- [ ] Score event with invalid playerIndex → Team score updates, no crash
- [ ] Card event with out-of-bounds index → Warning logged to console
- [ ] Substitution with invalid outgoing index → No state change, warning logged
- [ ] Undo last event reverses both team AND player stats correctly

### Storage Management
- [ ] App warns in console when localStorage >80% full
- [ ] Failed writes don't crash the app (graceful error handling)
- [ ] Corrupted storage data doesn't prevent app from loading

---

## Phase 9: Visual Polish & UX

### Accessibility Mode Testing
- [ ] **Rain Mode:**
  - [ ] Higher contrast colors applied
  - [ ] Larger text sizes
  - [ ] Card backgrounds darker
  
- [ ] **Large Text Mode:**
  - [ ] All text scales up appropriately
  - [ ] Layout doesn't break with larger fonts

### Responsive Design
- [ ] Test on mobile (320px width)
  - [ ] Team sheets stack vertically
  - [ ] Player rows wrap correctly
  - [ ] Buttons remain tappable
  
- [ ] Test on tablet (768px width)
  - [ ] Layout adapts gracefully
  - [ ] Tabs don't overflow

### Animations & Transitions
- [ ] Adding player has smooth fade-in animation
- [ ] Removing player slides out smoothly
- [ ] Photo upload shows loading spinner during compression
- [ ] Save confirmation banner fades in/out after 3 seconds

### Empty States
- [ ] No players on team → Shows "Add at least 15 players" illustration
- [ ] Search returns no results → Shows "No players match your filters" message
- [ ] No active match → Redirects to create new match with clear CTA

---

## Known Limitations & Future Enhancements

### Current Limitations
1. **Photo storage** — Base64 images stored in localStorage, limited by 5MB quota
2. **Drag-and-drop reordering** — Not yet implemented (arrow buttons only)
3. **Player assignment for unassigned scores** — Button exists but not functional
4. **Team sheet export** — No PDF/image export functionality yet

### Recommended Future Work
1. Implement IndexedDB for larger photo storage
2. Add drag-and-drop reordering with visual feedback
3. Build modal to assign players to unassigned score events
4. Add team sheet export as PDF or image
5. Support custom roster sizes (youth matches, etc.)
6. Add player injury tracking and recovery timeline

---

## Quick Smoke Test (5 minutes)

For a rapid verification that everything works:

1. **Create Match** (2 min)
   - Go to `/matches/new`
   - Enter "Home Team" and "Away Team"
   - Click "Quick Add 21" on both teams
   - Upload one photo for any player
   - Click "Create Match"

2. **Score Events** (1 min)
   - On active match page, score a goal for home team (assign to Player 10)
   - Score a point for away team (assign to Player 5)
   - Record a yellow card for home team Player 3

3. **View Players Page** (1 min)
   - Navigate to `/matches/active/players`
   - Search for "Player 10" — should be filtered
   - Check top scorers section shows correct rankings

4. **Check Team Sheets Tab** (1 min)
   - Go back to active match page
   - Switch to "Team Sheets" tab
   - Verify both teams display with photos and stats

---

## Build Verification Commands

```bash
# Full production build
npm run build

# Type checking only
npx tsc --noEmit

# Linting
npm run lint

# Development server for manual testing
npm run dev
```

---

*Last updated: 2026-07-12*
*All 9 phases complete — Build status: ✅ PASSING*
