<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Thrift Tracker

A map-based check-in tool for thrift store visits. Single-user app (you + partner).

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Firebase Firestore (client-side only, no API routes)
- Leaflet.js + OpenStreetMap
- PWA for mobile

## Key Conventions

- All data fetching is client-side via Firebase SDK (no server components for data)
- Use `dynamic(() => import(...), { ssr: false })` for Leaflet components
- Mobile-first: 16px font inputs, high contrast, minimal taps
- Default location: Kuala Lumpur (3.139, 101.686)

## File Locations

- Firebase config: `src/lib/firebase.ts`
- Firestore operations: `src/lib/stores.ts`
- Types: `src/lib/types.ts`
- Utils (distance, scoring): `src/lib/utils.ts`
- Components: `src/components/`
- Main page: `src/app/page.tsx`

## Commands

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run start` - Start production server

## Firebase Structure

```
shops/
  {id}: { name, lat, lng, address, createdAt, lastVisit, visitCount, dropped }

checkins/
  {id}: { shopId, userId, timestamp, vibe, notes }

bolo/
  {id}: { text, createdAt, checked }
```

## Vibe Ratings

- fire: Great selection (keeps shop in recommendations)
- mid: Okay, nothing special (keeps shop in recommendations)
- drop: Terrible/closed (filters shop from future recommendations)

## Notes

- No authentication - single user app
- Firebase handles real-time sync if needed later
- BOLO wishlist shown during check-in as reminder
- Crawl feature suggests shops within 5km radius
