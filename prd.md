# Product Requirements Document (PRD): Thrift Tracker

## 1. Product Overview
**Name:** Thrift Tracker (Working Title)
**Target URL:** `thrift.ampang.org`
**Purpose:** A localized, map-based check-in tool designed specifically for optimizing thrift store / bundle shop visits. It tracks the time elapsed since the last visit to prevent frequenting the same locations too soon, and intelligently recommends shops based on distance and historical visit data.
**Target Audience:** The core user and their partner (Barbie).

## 2. Core Features (Phase 1)

### 2.1 Map-Based Interface & Geolocation
*   **Default View:** A clean, utilitarian map centered on the user's current location, displaying nearby bundle shops as pins.
*   **Pin Status:** Pins should visually indicate "freshness" (e.g., color-coded or opacity-based: vibrant for places not visited in a long time, faded for places visited recently).

### 2.2 The "Check-In" Workflow
*   **Auto-Detection:** Upon opening the app near a known location, a prompt appears: *"Are you at [Shop Name]?"*
*   **Manual Override:** A search/list button allows the user to manually select a shop to check into if geolocation fails or they are retroactively logging a visit.
*   **The Vibe Check:** During check-in, the user must rate the shop's current quality:
    *   🔥 **Fire:** Great selection.
    *   😐 **Mid:** Okay, but nothing special.
    *   🗑️ **Drop:** Terrible, closed down, or no longer worth visiting. A "Drop" rating filters the shop out of future automated recommendations.

### 2.3 The Recommendation Engine ("Where to go?")
When the user wants to find a place to visit, they are presented with a sorted list of recommended shops based on two selectable modes:
*   **🧭 Adventure Mode:** Heavily weights the *time since the last visit*. Prioritizes places the users haven't been to in months (or ever), even if it requires a longer drive.
*   **🛋️ Lazy Mode:** Heavily weights *distance from current location*. Prioritizes nearby shops, so long as they haven't been visited in the very recent past (e.g., within the last 7-14 days).

### 2.4 Thrift Crawl (Nearby Combos)
*   When a user selects a shop from the Recommendation Engine, the app will display a "Make it a Crawl" section.
*   This suggests 1-2 additional shops within a tight radius (e.g., 3-5 km) of the primary destination that also meet the criteria (haven't been visited recently), enabling route optimization.

### 2.5 BOLO (Be On the Look Out) Wishlist
*   A persistent, easily accessible global checklist within the app interface.
*   Allows users to add specific items they are hunting for (e.g., "Oversized Denim", "Y2K shades").
*   This list is briefly displayed/highlighted upon a successful check-in as a reminder of what to look for inside the store.

### 2.6 Database Management (Initial & Ongoing)
*   **Initial Seed:** The app will support a one-time import script for a Google Maps list export (CSV format) containing the initial database of bundle shops.
*   **Manual Entry:** A "Drop Pin / Add Shop" feature allowing users to manually input new discoveries (Name, location) directly into the app without needing to update the CSV.

## 3. User Interface & Design Guidelines
*   **Aesthetic:** Utilitarian, clean, and fast.
*   **Focus:** Minimal taps to achieve core actions (Check-in, Find a place). No unnecessary animations or heavy UI clutter. High contrast for outdoor visibility (daylight readability).
*   **Mobile-First:** The web app must be heavily optimized for mobile browsers (Safari/Chrome on iOS/Android), behaving as much like a native app as possible.

## 4. Technical Architecture
*   **Frontend:** Next.js (React) for a fast, responsive UI.
*   **Styling:** Vanilla CSS or Tailwind CSS configured for a strict, utilitarian design system.
*   **Backend / Database:** Firebase (Firestore).
    *   *Why:* Provides a generous free tier that will easily cover this usage, handles real-time syncing seamlessly (if Barbie checks in, the user's phone updates instantly), and requires minimal maintenance.
*   **Map Provider:** Leaflet.js with OpenStreetMap (100% free and fits the clean/utilitarian vibe) or Google Maps JS API (has a generous free tier).
*   **Hosting:** Vercel (seamless deployment for Next.js, easy custom domain mapping to `thrift.ampang.org`).

## 5. Future Considerations (Post-Phase 1)
*   Thrift Haul logging (photos/notes).
*   Opening hours integration.
*   Gamification (stats, visit heatmaps).
