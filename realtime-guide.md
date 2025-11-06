You are my senior Next.js and Firebase engineer. 
I already have an existing Next.js (App Router) project with Cloud Firestore as my database. 
I want to integrate realtime data updates (without page refresh) using Firestore's onSnapshot method.

Please do the following:

1. **Add Firebase Setup**
   - Create or update `lib/firebase.ts` to initialize Firebase only once using `getApps().length ? getApp() : initializeApp(config)`.
   - Export both `app` and `db` using `getFirestore(app)`.

2. **Create Realtime Hook**
   - Add a new file `hooks/use-firestore.ts`.
   - Implement a reusable hook `useFirestoreQuery<T>(path: string, options?: { where?, orderBy?, limit? })` that:
     - Uses `onSnapshot()` internally.
     - Automatically unsubscribes on component unmount.
     - Returns `{ data, loading, error }`.
   - Optionally, include `useFirestoreDoc(path: string)` for listening to a single document.

3. **Integrate into Existing Component**
   - Convert the component that displays Firestore data into a Client Component (`"use client";`).
   - Replace any `getDocs()` or `fetch()` with the `useFirestoreQuery()` hook.
   - Example:
     ```tsx
     const { data, loading } = useFirestoreQuery("collectionName", { orderBy: [{ field: "createdAt", dir: "desc" }] });
     ```
   - Ensure that any new writes (`addDoc`, `updateDoc`, `deleteDoc`) automatically trigger UI updates via Firestore’s realtime stream.

4. **Preserve SSR**
   - Keep server-side fetching for the initial page load if needed, 
     but use a client-side component to maintain realtime sync after hydration.

5. **Security & Performance**
   - Include sample Firestore Security Rules that allow read/write only to authenticated users.
   - Add cleanup for `unsubscribe()` in all `useEffect()` hooks.

6. **Output Files**
   - `lib/firebase.ts` (singleton setup)
   - `hooks/use-firestore.ts` (realtime hook)
   - Example integration in an existing component (e.g. `app/items/page.tsx`)
   - Firestore security rules snippet

Make sure the code is fully TypeScript-compatible, works with Next.js 15+ App Router, and uses only client-side subscriptions for realtime updates.
