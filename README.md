# Campus Lost & Found

A minimal, clean, single-file Lost & Found web application built for **schools and colleges**.

Just open `index.html` in your browser — no server, no install, no setup needed.

## Features

- **Report lost or found items** with detailed campus location (building, floor, area, room number)
- **Browse and search** items by category, area type, or keywords
- **Automatic matching** — compares descriptions, categories, colours, and campus locations
- **Confirm or reject** matches
- **Fully offline** — runs in the browser, data stored in localStorage
- **Responsive** — works on desktop, tablet, and mobile

## Campus Location System

When reporting an item, you specify:
- **Building / Block** (Main Building, Block A–E, Science Block, IT Block, Library, Hostel, etc.)
- **Floor** (Basement → 5th Floor, Terrace, Outdoor)
- **Area Type** (Classroom, Lab, Library, Canteen, Corridor, Washroom, Parking, etc.)
- **Room / Lab Number** (e.g., Room 301, Lab C2)
- **Extra Notes** (e.g., "near the back bench", "beside the window")

## How to Use

1. Double-click `index.html` (or open it in any browser)
2. Click **Report Lost** or **Report Found**
3. Fill in the details with campus location
4. If a matching item exists, it will show up on the **Matches** page

## Tech

- Single HTML file with embedded CSS & JavaScript
- No frameworks, no dependencies, no build step
- Data persists in browser localStorage
