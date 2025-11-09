## ToyotaTinder
**AI-ranked Toyota matchmaker with swipeable discovery, built for Hackathon 2025.**

ToyotaTinder blends a curated Toyota inventory dataset, Google’s Gemini 2.5 Flash model, and a tactile swipe deck so shoppers can dial in budget + lifestyle signals and surface their best-fit Toyotas in seconds.

---

### ✨ Key Features
- **Preference intake** – guided form at `/find` captures budget, fuel type, mileage targets, usage, and notes.
- **Gemini-powered ranking** – `/api/analyze` streams CSV inventory into Gemini 2.5 Flash and receives strict JSON IDs plus reasoning; falls back to a heuristic scorer if no API key or the request fails.
- **Swipe deck** – `/swipe` renders a stacked, draggable deck (Framer Motion) that mimics Tinder interactions with skip/like CTA buttons for keyboardless use.
- **Persistent likes & results** – matches, AI reasoning, and favorites are cached in `localStorage` so refreshing or browsing between pages preserves progress.
- **Lightweight auth** – `/signup` + `/login` seed credentials in `localStorage` and `AuthGate` guards liked/swipe routes; perfect for hackathon demos without wiring a backend.
- **Liked garage** – `/liked` lists saved cars with clear CTA to restart matching or clear the board.

---

### 🏗️ Architecture Snapshot
| Layer | Details |
| --- | --- |
| UI | Next.js App Router (React 19) + Tailwind CSS 4 utility classes defined in `src/app/globals.css`, Framer Motion for hero + deck animation, custom PageTransition for subtle route delays. |
| Data | `src/data/CarData.csv` ingested via `csvCars.server.ts`, normalized into typed `Car` objects. |
| AI | `@google/genai` client calls Gemini 2.5 Flash with a CSV prompt capped at 75 rows; expects `{"ids":[],"descriptions":{},"reasoning":""}`. Absent keys trigger `pickTopN` scoring or randomized fallback with warnings surfaced in UI. |
| State | Client-side `likes.ts` wraps `localStorage` for likes, results, and meta warnings; `AuthGate` enforces login before swiping or viewing liked cars. |

---

### 🔐 Authentication Model
- Accounts are JSON blobs stored under `tt-accounts`; passwords are not hashed (hackathon scope).
- Successful login writes `tt-auth` so `NavBar` + `AuthGate` know the session is active.
- Sign out simply clears the token; there is no backend session—do not use in production without replacing with a real auth provider.

---

### ⚙️ Getting Started
Prerequisites: Node.js 20+, npm 10+, and a Gemini API key.

```bash
# install dependencies
npm install

# run dev server on http://localhost:3000
npm run dev
```

Set environment variables in `.env.local`:

```bash
GEMINI_API_KEY=your-google-genai-key
```

Without a key the app still works, but analyze results will include a warning and use heuristic/randomized matches.

Useful scripts:
- `npm run dev` – local development with hot reload.
- `npm run build` – production build.
- `npm run start` – serve the built app.
- `npm run lint` – Next.js + ESLint 9.

---

### 🧠 How Matching Works
1. **Collect preferences** – `/find` POSTs `Preferences` to `/api/analyze`.
2. **Filter + format** – server filters the CSV dataset (budget cushion, fuel, mileage cap, location substring) and constructs a 75-row CSV prompt.
3. **Gemini inference** – `GoogleGenAI` client requests `gemini-2.5-flash` using `responseMimeType: application/json` to keep parsing strict.
4. **Reasoned output** – API returns selected car IDs + reasoning text; IDs map back to `Car` objects before saving to the client.
5. **Swipe experience** – `/swipe` loads cached results, animates cards, and records likes. Each right swipe adds the car to saved likes for `/liked`.

If Gemini fails or returns malformed JSON, the app logs the issue, scores vehicles locally (`scoreCar`), and continues—ideal for demos without worrying about rate limits.

---

### 🗂️ Project Structure
```
src/
  app/
    find/            # preference intake + loading narrative
    swipe/           # draggable deck + CTA controls
    liked/           # saved cars (auth-gated)
    login/, signup/  # localStorage auth flows
    api/analyze/     # Gemini orchestration + fallbacks
    globals.css      # Tailwind layer + design tokens
  components/        # NavBar, CTA hero, cards, auth gate, etc.
  data/              # CarData.csv + ingester
  lib/               # types, likes store, scoring helpers
```

---

### 🚧 Known Limitations & Next Steps
1. Replace localStorage auth with a secure provider (Clerk/Auth.js) and hashed credentials.
2. Persist likes + results server-side for multi-device sync.
3. Stream live inventory via dealership APIs instead of static CSV.
4. Add automated tests around `/api/analyze` permutations and swipe interactions.
5. Expand dataset enrichment (images, trim-level specs) for richer card visuals.

---

### 🙌 Contributing
Open a PR with a concise description and screenshots/video of UI changes. Run `npm run lint` before submitting. For significant features (new AI prompt logic, dataset updates), add context in the PR body about expected UX impact.
