# Firestore access setup

The app includes an optional Google sign-in gate and allowlist-based Firestore
rules. They are intentionally not activated automatically because enabling the
rules before adding the two member accounts would lock everyone out.

1. Enable Google as a sign-in provider in Firebase Authentication.
2. Sign in once with each approved Google account and copy its Firebase Auth
   UID from the Firebase console.
3. In Firestore, create `members/{uid}` documents for Amirul and Barbie. The
   document body can contain a friendly `name`; membership is determined by the
   document ID.
4. Set `NEXT_PUBLIC_FIREBASE_AUTH_REQUIRED=true` locally and in Vercel, then
   redeploy the app.
5. Deploy the included rules with `firebase deploy --only firestore:rules`.
6. Confirm both approved accounts work and a third account is denied.

Until steps 1–5 are complete, leave the flag set to `false` and do not deploy
the restrictive rules.
