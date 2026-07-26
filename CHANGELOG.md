# Changelog

## v1.1 - 2026-07-27

### Trust and history
- Real-time Firestore status distinguishes live, cached, offline, and failed states
- Editable visit history with backdated check-ins and safe deletion
- Amirul, Barbie, and Together profiles
- Transactional check-ins keep visit documents and shop totals consistent
- Shop archival preserves history; dropped shops can be restored

### Data management
- Seed rows are reconciled by normalized shop name on every release
- Seed preview shows missing, changed, and matching records before manual updates
- CSV imports are atomic and skip duplicate shop names
- Modern multi-tab Firestore persistence replaces the deprecated persistence API

### Planning
- Fallback KL coordinates no longer pretend to be the user's current location
- Adventure recommendations use a sensible distance ceiling
- Recommendation cards explain freshness, distance, and nearby crawl options

### Security
- Optional Google sign-in gate
- Allowlist-based Firestore rules and activation guide

## v1.01 - 2026-07-26

### New Features
- **Dark mode** with auto-detect system preference and manual toggle
- **About tab** with app info, version, and quick links
- **Geofencing auto-check-in** - prompts when within 100m of a known shop
- **Stats dashboard** - total shops, check-ins, dropped, fire ratings, avg visit gap, top shop
- **Share crawl route** - opens Google Maps directions for the crawl
- **Haptic feedback** - vibration on check-in, button taps, and mode switches

### Improvements
- **Bottom sheet UX** - native-feeling slide-up panels on mobile instead of modals
- **Skeleton loading states** instead of spinners for faster perceived load
- **Pull-to-refresh** on recommendations, wishlist, and shops lists
- **Bigger map pins** (10px, 4px border) with pulse animation on user location
- **Firebase offline persistence** via IndexedDB - works inside stores without signal
- **localStorage caching** - shops and BOLO items cached for instant load on revisit
- **PWA service worker** - stale-while-revalidate caching for offline support
- **High contrast dark mode** optimized for outdoor sunlight readability
- **Safe area insets** for notch/island devices
- **16px font inputs** to prevent iOS zoom on focus
- **Bottom navigation** with active state animations and 5-tab layout (added Stats)

### Technical
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 with `@custom-variant dark` for class-based dark mode
- Leaflet.js + OpenStreetMap with dark mode filter
- Firebase Firestore with IndexedDB persistence
- Updated manifest.json for better PWA support

---

## v1.00 - 2026-07-26

### Initial Release
- Map-based interface with Leaflet.js + OpenStreetMap
- Check-in workflow with vibe rating (Fire / Mid / Drop)
- Recommendation engine with Adventure and Lazy modes
- Thrift Crawl - nearby shop suggestions within 5km
- BOLO wishlist with check/uncheck and completion tracking
- CSV import from Google Maps exports
- Manual shop entry with GPS coordinates
- Shop list with search and status badges
- Mobile-first responsive design
- Firebase Firestore backend
- Vercel deployment ready
