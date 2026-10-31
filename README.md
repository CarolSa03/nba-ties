# nba for bf

a small desktop app I made for my bf to find NBA games that were
tied after a quarter, at halftime or going into overtime

you pick a time range and, if you like, one or two teams. the app shows each
game's final score with the running score after every quarter and
overtime, and highlights the tied periods

## Features
- Time ranges: last 7 days, last 30 days, this season or custom dates
- Filter by one team, or two teams for head-to-head games
- Views for the full game, regulation only, halftime, Q1 and Q3
- Ties only switch and newest or oldest first sorting
- Light and dark theme
- Saved results, so repeat searches are instant :DDDD

## Setup
1. Get a free API key at balldontlie.io
2. `npm install`
3. `npm start`
4. Paste your key when the app asks for it

## Build the installer (Windows)
`npm run dist`, then find it in the `release` folder

buiilt with Electron, Vue 3 and Tailwind CSS