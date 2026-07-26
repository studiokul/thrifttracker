# Thrift Tracker

A map-based check-in tool designed to optimize thrift store and bundle shop visits. It tracks the time elapsed since your last visit to prevent frequenting the same locations too soon, and intelligently recommends shops based on distance and historical visit data.

## Features

- **Map-Based Interface**: View nearby bundle shops as pins on an interactive map.
- **The "Check-In" Workflow**: Auto-detects nearby shops or allows manual selection to log your visit. Includes a "Vibe Check" rating (🔥, 😐, 🗑️) to filter out bad spots.
- **Recommendation Engine**: Choose between **Adventure Mode** (prioritizes places you haven't visited in a long time) and **Lazy Mode** (prioritizes nearby shops).
- **Thrift Crawl**: Suggests 1-2 additional nearby shops when you pick a primary destination.
- **BOLO (Be On the Look Out) Wishlist**: A global checklist that reminds you what you're hunting for when you check in.
- **CSV Import**: Import your initial list of shops from a Google Maps CSV export.
- **Visit History**: Review, edit, backdate, or undo check-ins.
- **Shared Profiles**: Attribute visits to Amirul, Barbie, or both.
- **Seed Reconciliation**: New repository seed rows are added without duplicating existing shops.
- **Honest Sync State**: See whether data is live, cached, offline, or failed.

## Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Map**: Leaflet.js with OpenStreetMap
- **Backend / Database**: Firebase Firestore (client-side data fetching for real-time sync)

## Getting Started Locally

### 1. Firebase Setup

This app requires a Firebase project for the database.
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Firestore Database** in test mode or configure proper security rules.
3. Register a Web App in your Firebase project to get your configuration keys.

### 2. Environment Variables

Copy the example environment file and populate it with your Firebase keys:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the values:
```
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### 3. Install and Run

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This app is optimized to be deployed on [Vercel](https://vercel.com). Simply push the repository to GitHub, import it into Vercel, and ensure you add the Firebase environment variables to your Vercel project settings.

For private access, follow `SECURITY.md` to enable Google sign-in and deploy the
included allowlist-based Firestore rules.
