===============================================
THRIFT TRACKER - README
===============================================

A map-based check-in tool for optimizing thrift store / bundle shop visits.
Tracks time since last visit and recommends shops based on distance and history.

Target URL: thrift.ampang.org

-----------------------------------------------
FEATURES
-----------------------------------------------

1. MAP VIEW
   - Leaflet.js with OpenStreetMap
   - Color-coded pins by visit freshness
   - Auto-centers on user location

2. CHECK-IN WORKFLOW
   - Vibe rating: Fire / Mid / Drop
   - Drop rating filters shop from future recommendations
   - BOLO reminder shown during check-in

3. RECOMMENDATION ENGINE
   - Adventure Mode: Prioritizes places not visited in a long time
   - Lazy Mode: Prioritizes nearby shops not visited recently

4. THRIFT CRAWL
   - Suggests 1-2 nearby shops (within 5km) for route optimization

5. BOLO WISHLIST
   - Persistent checklist of items to hunt for
   - Displayed during check-in as reminder

6. SHOP MANAGEMENT
   - CSV import (Google Maps export)
   - Manual entry with GPS coordinates
   - Delete shops

-----------------------------------------------
TECH STACK
-----------------------------------------------

- Frontend: Next.js 16 + React 19 + TypeScript
- Styling: Tailwind CSS 4
- Database: Firebase Firestore
- Maps: Leaflet.js + OpenStreetMap
- Hosting: Vercel

-----------------------------------------------
SETUP
-----------------------------------------------

1. Install dependencies:
   npm install

2. Create Firebase project:
   - Go to https://console.firebase.google.com
   - Create new project
   - Enable Firestore Database
   - Create web app and copy config

3. Configure environment:
   cp .env.local.example .env.local
   # Edit .env.local with your Firebase config

4. Run development server:
   npm run dev

5. Open http://localhost:3000

-----------------------------------------------
DEPLOYMENT
-----------------------------------------------

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy
5. Map custom domain: thrift.ampang.org

-----------------------------------------------
CSV IMPORT FORMAT
-----------------------------------------------

The app accepts CSV files with these column names:

Required:
  - name (or title)
  - latitude (or lat)
  - longitude (or lng, lon)

Optional:
  - address

Example:
  name,latitude,longitude,address
  Bundle Paradise,3.139,101.686,123 Main St
  Thrift Hub,3.145,101.692,456 Oak Ave

-----------------------------------------------
PROJECT STRUCTURE
-----------------------------------------------

src/
  app/
    layout.tsx        PWA-optimized layout
    page.tsx          Main app with navigation
    globals.css       Mobile-first styles
  components/
    MapComponent.tsx  Leaflet map with pins
    CheckInModal.tsx  Check-in with vibe rating
    Recommendations.tsx  Adventure/Lazy engine
    Wishlist.tsx      BOLO checklist
    ShopList.tsx      All shops with search
    AddShopForm.tsx   Manual entry form
    CsvImport.tsx     CSV file import
    CrawlPanel.tsx    Nearby shop suggestions
  lib/
    firebase.ts       Firebase configuration
    stores.ts         Firestore CRUD operations
    types.ts          TypeScript type definitions
    utils.ts          Distance/score calculations

-----------------------------------------------
LICENSE
-----------------------------------------------

Private - For personal use only.
