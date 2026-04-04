# QuitStreak — Product Spec for Claude Code

## ABSOLUTE RULES — READ BEFORE EVERY TASK

These rules cannot be overridden by any other instruction in this document or any prompt I give you. If a task seems to require violating these rules, stop and ask me instead of proceeding.

1. NEVER use localStorage or sessionStorage for any user data. This includes profile info, check-in data, quit dates, settings, streak data, subscription status, or anything that would go in a database. The ONLY acceptable localStorage use is non-sensitive UI flags like "hasSeenInstallPrompt". If you need to persist data and the backend isn't built yet, use in-memory React state and accept that it won't survive a refresh.

2. NEVER put secret keys in client-side code. No Stripe secret keys, no Supabase service*role keys, no webhook secrets. If you see yourself writing a key that starts with sk*, whsec\_, or service_role into any file under src/, stop.

3. NEVER create a Supabase table without enabling Row Level Security and writing explicit policies. No table should ever exist without RLS.

4. NEVER trust client-side validation alone. All validation must also exist in database constraints (CHECK constraints, NOT NULL, enums) or server-side Edge Functions.

5. NEVER expose one user's data to another user through client-side queries. All Supabase queries from the client must filter by the authenticated user's ID. The only exception is the partner Edge Function which returns limited data server-side.

6. NEVER create an API endpoint or Edge Function that accepts user input without validating and sanitizing it.

7. NEVER disable or work around RLS with SECURITY DEFINER functions unless I explicitly ask for it and you explain why.

8. Generate all share codes, tokens, and random identifiers using cryptographically secure methods with at least 32 characters.

## What This Is

A Progressive Web App (PWA) for quitting drinking, smoking, or vaping. One person tracks their streak. The free version is solo. The subscription ($5.99/mo) unlocks a "Support Partner" view — a live dashboard that a loved one (partner, parent, friend, sponsor) can access to see the user's streak, mood check-ins, milestones, and get real-time alerts.

This is an MVP. Build it as a single-codebase PWA using React + Vite + Tailwind CSS. All data stored in Supabase (auth, database, realtime subscriptions). Payments via Stripe Checkout (redirect flow, not embedded).

---

SECURITY RULES — APPLY TO ALL PHASES
These rules override everything else. Every phase must follow them.

SUPABASE ROW LEVEL SECURITY: Every table MUST have RLS enabled. Every table MUST have explicit policies. Never use SECURITY DEFINER functions as a workaround for missing policies. Policies must enforce:

Users can only SELECT, INSERT, UPDATE, DELETE their own rows (matched by auth.uid() = user_id)
The partner data endpoint is the ONLY exception — it reads limited data filtered by share_code, via a Supabase Edge Function that runs server-side, never via client-side queries

NEVER put secrets in client code. The Supabase anon key is fine (it's designed to be public). The Stripe secret key, webhook secret, and any server-side keys go ONLY in Supabase Edge Function environment variables. If I see a key starting with sk* or whsec* anywhere in the src/ folder, that is a critical bug.
INPUT VALIDATION: All user inputs must be validated before database insertion. Check-in mood and craving values must be integers 1-5 — enforce this in the database with CHECK constraints AND in the application code. Notes must be trimmed and limited to 280 characters. Quit type must be one of the three enum values. Never trust client-side validation alone.
AUTH: Use Supabase auth exclusively. Never roll custom auth. Never store session tokens manually. Never put auth tokens in URLs (except the magic link Supabase generates). The partner share_code in the URL is NOT an auth token — it grants read-only access to limited data only.
PARTNER SHARE CODES: Generate share codes server-side using crypto-strength randomness (minimum 32 characters, alphanumeric). Never use sequential IDs, UUIDs alone, or short codes. The share code is the only thing protecting someone's sobriety data from public access — treat it like a password.
STRIPE WEBHOOKS: Always verify the webhook signature using the webhook secret. Never trust webhook data without signature verification. Never process payments client-side.
RATE LIMITING: The encouragement message endpoint (partner sending messages to user) must be rate limited — maximum 10 messages per hour per share_code. Implement this in the Edge Function, not client-side.
NO LOCALSTORAGE FOR SENSITIVE DATA: Never store profile data, auth tokens, check-in history, or subscription status in localStorage or sessionStorage. Supabase handles session persistence through its own secure mechanism. The only thing acceptable in localStorage is non-sensitive UI preferences like "has seen install prompt."

## Tech Stack

- **Frontend:** React 18+ with Vite, Tailwind CSS, deployed as PWA (service worker, manifest.json, installable)
- **Backend/DB:** Supabase (auth, Postgres, Row Level Security, Realtime subscriptions)
- **Payments:** Stripe Checkout (server-side via Supabase Edge Functions)
- **Hosting:** Designed to deploy on Vercel or Netlify (static build + edge functions)
- **No native apps.** PWA only. Must work on mobile Safari and Chrome. Must prompt "Add to Home Screen."

---

## Design Direction

**Tone:** Warm, calm, grounded. NOT clinical or sterile. NOT gamified/childish. Think: a quiet room with good lighting. The feeling of a deep breath. Someone who believes in you.

**Color palette:**

- Background: warm off-white (#FAF8F5) or very soft warm gray
- Primary accent: a deep, earthy teal (#2D6A6A) — represents growth, calm
- Secondary accent: warm amber/gold (#D4A053) — represents milestones, warmth
- Text: near-black (#1A1A1A) with warm gray (#6B6B6B) for secondary
- Danger/reset: muted rust (#C0564B), never bright red

**Typography:** Use a distinctive serif for headings (e.g., "Playfair Display" or "Lora") paired with a clean sans-serif for body (e.g., "DM Sans" or "Plus Jakarta Sans"). The serif gives it emotional weight. The sans keeps it readable. Import from Google Fonts.

**Visual feel:**

- Generous whitespace, large touch targets
- Soft rounded corners (12-16px)
- Subtle shadows, no hard borders
- The streak counter should feel monumental — large, centered, the hero of every screen
- Milestone badges should feel earned, not cheap — think embossed coins, not cartoon stars
- Animations: subtle fade-ins, smooth number transitions on the counter. Nothing bouncy or playful. Calm confidence.

**Key design rule:** Every screen should make the user feel proud of themselves. Not anxious, not guilted, not overwhelmed. Proud.

---

## Information Architecture

### Routes

```
/                    → Landing page (unauthenticated)
/app                 → Main dashboard (authenticated, the tracker)
/app/check-in        → Daily mood/craving check-in flow
/app/milestones      → Milestone history and upcoming
/app/settings        → Account, subscription, partner link management
/app/partner-setup   → Generate/manage the partner share link
/partner/:shareCode  → Partner dashboard (separate view, no auth required OR optional auth)
```

---

## Core Features — Free Tier

### 1. Onboarding (first launch only)

Screen 1: "What are you quitting?"

- Three large tappable cards: Drinking / Smoking / Vaping
- User picks one (can be changed later in settings)
- Store as `quit_type` enum

Screen 2: "When did you quit?" (or "When are you quitting?")

- Date picker, defaults to today
- Allow past dates (someone might be 14 days in already)
- Store as `quit_date` timestamp

Screen 3: "You're on your way."

- Show their current streak (even if it's Day 0)
- Big, warm, immediate reinforcement
- CTA: "Start tracking" → goes to /app

Auth happens here — use Supabase magic link (email) or Google OAuth. Keep it minimal. One tap/click to sign up. No passwords.

### 2. Main Dashboard (/app)

This is the most important screen. The user will open this every single day. It must be beautiful, motivating, and fast.

**Hero: The Streak Counter**

- Center of the screen, dominant
- Shows: "[X] days [Y] hours [Z] minutes" — live ticking
- The number should be LARGE (48px+ on mobile for the day count)
- Below the counter: "smoke-free" / "alcohol-free" / "vape-free" depending on quit_type
- The counter background/treatment should subtly evolve as the streak grows:
  - Days 0-7: a seedling/sprout metaphor (subtle, not literal — use color shifts, a thin progress ring)
  - Days 8-30: growing, ring fills, colors deepen slightly
  - Days 31-90: warm gold accents start appearing
  - Days 91+: full "mature" state, the most satisfying visual

**Below the counter:**

- **"How are you feeling?" button** → navigates to /app/check-in
  - Prominent but not pushy. This is how we get daily engagement.
- **Next milestone card**
  - Shows the next upcoming milestone with a progress bar
  - E.g., "3 days away from 2 Weeks 🪙" with a progress bar at 78%
- **Stats row** (compact, horizontal scroll or 2x2 grid):

  - Money saved (user inputs their daily spend during onboarding or settings; calculate: days × daily_spend)
  - Cigarettes not smoked / drinks not had (days × daily_amount, set in settings)
  - Health stat (a single rotating health fact, e.g., "Your blood pressure has started to normalize" — these are time-based and well-documented for smoking/drinking/vaping)

- **"Share with someone who cares" CTA** (subscription upsell — MORE ON THIS BELOW)
  - This is the primary subscription conversion surface
  - Shows on free tier as a warm, non-aggressive card at the bottom of the dashboard
  - Something like: "Someone in your life wants to see you win. Let them follow your journey."
  - Tapping it goes to the subscription flow

### 3. Daily Check-in (/app/check-in)

Quick, 3-step flow (should take <30 seconds):

Step 1: "How's your mood?"

- 5 emoji-style options in a row: 😤 😟 😐 🙂 😊
- But don't use literal emojis — design custom simple face icons or use abstract representations (colored circles with expressions) that match the app's design language
- Single tap to select

Step 2: "Any cravings today?"

- Scale: None / Mild / Moderate / Strong / Overwhelming
- 5 tappable pills in a row

Step 3: "Anything on your mind?" (optional)

- Small text area, max 280 chars
- Placeholder: "This is just for you." (unless partner is connected, then: "Your partner can see this too.")
- Skip button visible

**After submission:**

- Warm confirmation: "Logged. You're doing great." (or contextual — "Day 14. Two weeks. That's real.")
- Navigate back to dashboard
- Store: { mood: 1-5, craving: 1-5, note: string, timestamp }

**Notification prompt:** After first check-in, ask if they want daily reminders. Set a default reminder for 9am local time. Use the web Push Notification API.

### 4. Milestones (/app/milestones)

**Milestone definitions (hardcoded):**

For ALL quit types:

- 24 hours
- 3 days
- 1 week
- 2 weeks
- 1 month
- 2 months
- 3 months (90 days)
- 6 months
- 1 year
- 18 months
- 2 years
- 5 years

**Display:**

- Vertical timeline, scrollable
- Past milestones: shown as "earned" with a filled badge, the date achieved, and a health benefit fact
- Next milestone: highlighted, with countdown
- Future milestones: shown as locked/dimmed outlines

**Health benefit facts per milestone (smoking example):**

- 24h: "Your heart rate and blood pressure have started dropping."
- 3d: "Nicotine is leaving your body. The worst cravings are peaking — you're in the hardest part."
- 1w: "Your lungs are beginning to clear. You might cough more — that's healing."
- 2w: "Circulation is improving. Walking feels a little easier."
- 1mo: "Lung function is increasing. Coughing and shortness of breath are decreasing."
- 3mo: "Your circulation has significantly improved. Your lung function has increased up to 30%."
- 6mo: "Your risk of coronary heart disease has dropped to half."
- 1y: "Your added risk of coronary heart disease is half that of a smoker's."
- 2y: "Your risk of stroke has reduced to that of a non-smoker."
- 5y: "Your risk of cancers of the mouth, throat, and esophagus has halved."

Create equivalent fact sets for drinking and vaping. Research these carefully — they should be medically accurate and encouraging, not scary.

**When a milestone is reached:**

- Push notification (if enabled): "🏆 You just hit [milestone]. [health fact]."
- On next app open: a modal celebration screen — the milestone badge, the fact, and a "Share" button
- The share button generates a shareable image (canvas-rendered card with streak count and milestone) + native share sheet (Web Share API)

### 5. Settings (/app/settings)

- Change quit type
- Change quit date (with confirmation — "This will reset your streak display")
- Edit daily spend amount (for money-saved calc)
- Edit daily consumption amount (cigarettes/drinks/vape sessions per day before quitting)
- Notification preferences (daily check-in reminder time, milestone alerts)
- Manage subscription (link to Stripe Customer Portal)
- Manage partner link (see /app/partner-setup)
- Sign out
- Delete account (with confirmation)

---

## Subscription Feature — Partner Support View

This is the paid feature. This is what makes the app special and shareable. Build the free tier to make people WANT this.

### Subscription Flow

**Price:** $5.99/month or $39.99/year (show both, default to annual with "Save 44%" badge)

**Trigger points (places the user sees the upsell):**

1. The persistent card at the bottom of the main dashboard
2. When a milestone is reached: "Share this moment with someone who matters. They can follow your whole journey."
3. In settings, under "Partner Support"
4. On the partner-setup page

**Upsell copy (vary across touchpoints, keep it emotional, never pushy):**

- "Recovery is easier when someone's in your corner."
- "Let someone you trust follow along. They'll see your streaks, your milestones, and know when you need support."
- "The best gift you can give someone who worries about you: proof that you're doing it."

**Checkout:** Tapping "Subscribe" opens Stripe Checkout (redirect). After success, redirect back to /app/partner-setup. Supabase Edge Function handles the Stripe webhook to flag the user's `subscription_status` as active.

### Partner Setup (/app/partner-setup)

Only accessible to subscribed users.

**Flow:**

1. User taps "Invite your support partner"
2. System generates a unique share code / URL: `https://quitstreak.app/partner/abc123def`
3. User sends this link to their person (via text, email, WhatsApp — use Web Share API, or show a copyable link)
4. The link is single-use per partner. One partner slot for the base subscription. (Future: allow multiple partners for higher tier)

**Partner can optionally create an account** (to get push notifications for milestones) or just bookmark the link.

**Management:**

- User can see who has accessed their partner link
- User can revoke the link (generates a new one, old one stops working)
- User can pause sharing (temporarily hides data without revoking)

### Partner Dashboard (/partner/:shareCode)

This is what the partner sees. It must be beautiful, emotionally resonant, and make the partner feel CONNECTED.

**No auth required to view** (the share code is the access token). Optional account creation for push notifications.

**What the partner sees:**

1. **The streak counter** — same live-ticking display as the main dashboard

   - Header: "[Name]'s Journey" (user sets their display name)
   - Sub: "has been [smoke-free/alcohol-free/vape-free] for..."
   - The big counter

2. **Recent mood check-ins** — last 7 days shown as a row of mood indicators (the face icons) with dates

   - If the user wrote a note, it's shown (the user knows this — they were told during check-in)
   - Craving level shown as a subtle color intensity on each day's indicator

3. **Milestone feed** — which milestones have been hit, with dates

   - Next upcoming milestone with countdown

4. **"Send encouragement" button**

   - Partner can send a short message (280 chars max)
   - Delivered as a push notification + visible on the user's dashboard as a small card: "💬 [Partner name] says: [message]"
   - This is critical for engagement and emotional stickiness

5. **Stats** — money saved, consumption avoided (same as main dashboard)

**What the partner does NOT see:**

- The user's email or account details
- Ability to edit anything
- Historical check-in notes older than 7 days (respect privacy, keep it current)

**Design:**

- The partner dashboard should feel like looking through a window into someone's progress
- Warm, read-only, supportive
- Include a small fixed footer: "Powered by QuitStreak — Start your own journey" (acquisition funnel for the partner themselves)

---

## Landing Page (/)

For unauthenticated visitors. Must convert to signups.

**Structure:**

1. **Hero section**

   - Headline: "Quit drinking. Quit smoking. Quit vaping. And prove it to someone who cares."
   - Subhead: "Track your streak, log your journey, and share a live dashboard with the person rooting for you hardest."
   - CTA button: "Start free — no credit card" → goes to onboarding/auth
   - Below CTA: "Used by X people to quit for good" (show a real count from the DB, or omit until you have numbers)

2. **How it works** — 3 steps, illustrated with app screenshots or simple illustrations

   - "1. Set your quit date" — brief description
   - "2. Track daily" — brief description
   - "3. Share with someone who cares" — brief description with "(subscription)" tag

3. **The partner view preview**

   - A mockup/screenshot of the partner dashboard
   - Copy: "Your mom. Your partner. Your best friend. Your sponsor. Give them peace of mind."
   - This section sells the subscription before they even sign up

4. **Social proof section** — Leave placeholder slots for testimonials. For launch, use 2-3 that you write yourself based on realistic scenarios:

   - "My wife can see my streak. That's more accountability than any app ever gave me."
   - "I bought this for my brother. He's 47 days in. I check every morning."
   - "The daily check-in takes 10 seconds but it's the thing that keeps me honest."

5. **Pricing section**

   - Free: Streak tracking, daily check-ins, milestones, stats, push notifications
   - QuitStreak+ ($5.99/mo or $39.99/yr): Everything free + Partner Support Dashboard, partner milestone alerts, encouragement messages, priority support
   - CTA: "Start free" for both (upsell happens in-app)

6. **Footer**
   - Links: Privacy Policy, Terms, Contact
   - "If you're struggling with addiction, please reach out to SAMHSA's helpline: 1-800-662-4357"

---

## Database Schema (Supabase / Postgres)

```sql
-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) primary key,
  display_name text not null default 'Someone brave',
  quit_type text not null check (quit_type in ('drinking', 'smoking', 'vaping')),
  quit_date timestamptz not null default now(),
  daily_spend decimal(10,2) default 0,
  daily_amount integer default 0, -- cigarettes/drinks/vape sessions per day before quitting
  subscription_status text not null default 'free' check (subscription_status in ('free', 'active', 'canceled', 'past_due')),
  stripe_customer_id text,
  share_code text unique, -- generated when partner feature is activated
  share_active boolean default true, -- user can pause sharing
  reminder_time time default '09:00',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Check-ins
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  mood integer not null check (mood between 1 and 5),
  craving integer not null check (craving between 1 and 5),
  note text,
  created_at timestamptz default now()
);

-- Milestones (earned)
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  milestone_key text not null, -- e.g., '24h', '3d', '1w', '2w', '1m', etc.
  achieved_at timestamptz default now(),
  unique(user_id, milestone_key)
);

-- Encouragement messages (from partner to user)
create table public.encouragements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  partner_name text default 'Your supporter',
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security policies
-- profiles: users can read/update their own row. Partner view can read limited fields via share_code (use a Supabase function).
-- checkins: users can CRUD their own. Partner can read last 7 days via share_code function.
-- milestones: users can read their own. Partner can read via share_code function.
-- encouragements: users can read their own. Anyone with the share_code can insert (rate-limited).
```

**Supabase Edge Function for partner access:**
Create a function `get_partner_data(share_code)` that returns: profile (display_name, quit_type, quit_date, share_active), last 7 checkins, all milestones, and stats. This avoids giving the partner direct DB access.

---

## PWA Configuration

**manifest.json:**

```json
{
  "name": "QuitStreak",
  "short_name": "QuitStreak",
  "description": "Track your sobriety. Share it with someone who cares.",
  "start_url": "/app",
  "display": "standalone",
  "background_color": "#FAF8F5",
  "theme_color": "#2D6A6A",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Service worker:** Cache the app shell and static assets for offline access. The streak counter should work offline (it's just math from quit_date). Check-ins queue offline and sync when connection returns.

**Install prompt:** Show a custom "Add to Home Screen" banner after the user's second visit or first check-in. Don't use the browser's default prompt — build a custom UI bar at the bottom that explains the benefit: "Install QuitStreak for daily reminders and instant access."

---

## Engagement & Conversion Mechanics

These are subtle but critical. They're the difference between a dead app and one that retains and converts.

### Free tier engagement:

1. **Daily check-in streak** — separate from the quit streak, this tracks consecutive days of check-ins. Show a small "🔥 5-day check-in streak" indicator. This creates a second habit loop.
2. **Morning notification** — "Day [X]. You're still going. Quick check-in?" Deep-links to /app/check-in.
3. **Milestone notifications** — celebrate even small ones. Day 1, Day 3, Day 7 feel HUGE to someone quitting.
4. **The counter never stops** — even if you don't open the app for a week, your streak keeps counting. When you come back, it's satisfying to see "14 days" instead of "you missed 6 days."

### Conversion hooks (free → paid):

1. **After every milestone celebration modal**, show: "Someone is rooting for you. Let them see this too." with a secondary CTA to learn about partner view. Not a hard gate — just a warm suggestion.
2. **After 7 days**, show a one-time card on the dashboard: "You've been at this for a week. That's worth sharing." Links to partner feature explainer.
3. **After any check-in where craving = 4 or 5** (strong/overwhelming), show: "Tough day. Having someone in your corner helps. [Learn about Partner Support]"
4. **On the share image generated for milestones**, include a small watermark: "Tracked with QuitStreak — quitstreak.app" — organic acquisition from social shares.
5. **The partner dashboard footer** always shows: "Start your own journey — quitstreak.app" — the partner becomes a potential user.

### Retention:

1. If a user hasn't opened the app in 3+ days, send a push: "Still going strong? Day [X] and counting."
2. If a user resets their streak (relapse), handle it with ZERO judgment: "Starting over takes courage. Every Day 1 is a choice to try again." Give them a "Reset quit date" flow, not a punishing screen.

---

## Relapse / Reset Handling

This is emotionally critical. Get it right.

- In settings, user can tap "I need to reset my streak"
- Confirmation screen: "That's okay. Slipping doesn't erase what you've done. [X] days of progress is still [X] days your body healed. Ready to start again?"
- Two options: "Reset to today" / "Actually, I'm still going" (in case they tapped by accident)
- Previous streak is stored in the DB (don't delete old milestones — archive them with a `streak_number` field)
- After reset, the very first screen shows: "Day 0. Let's go again." No shame. No stats about "you lost X days." Just forward.
- If partner is connected, the partner sees: "[Name] started a new chapter. Send them encouragement." — and the "send encouragement" button is highlighted.

---

## Files & Folder Structure

```
/
├── public/
│   ├── manifest.json
│   ├── sw.js (service worker)
│   ├── icon-192.png
│   ├── icon-512.png
│   └── favicon.ico
├── src/
│   ├── main.jsx
│   ├── App.jsx (router setup)
│   ├── index.css (tailwind + custom)
│   ├── lib/
│   │   ├── supabase.js (client init)
│   │   ├── stripe.js (checkout redirect helper)
│   │   ├── milestones.js (milestone definitions, health facts)
│   │   ├── stats.js (money saved, health benefits calculations)
│   │   └── time.js (streak calculation utilities)
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProfile.js
│   │   ├── useCheckins.js
│   │   ├── useStreak.js (live counter)
│   │   └── usePartnerData.js
│   ├── components/
│   │   ├── StreakCounter.jsx (the big live-ticking counter)
│   │   ├── MoodSelector.jsx
│   │   ├── CravingScale.jsx
│   │   ├── MilestoneCard.jsx
│   │   ├── MilestoneBadge.jsx
│   │   ├── StatsRow.jsx
│   │   ├── UpsellCard.jsx
│   │   ├── EncouragementCard.jsx
│   │   ├── InstallPrompt.jsx
│   │   └── Layout.jsx (shared shell with nav)
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Dashboard.jsx
│   │   ├── CheckIn.jsx
│   │   ├── Milestones.jsx
│   │   ├── Settings.jsx
│   │   ├── PartnerSetup.jsx
│   │   └── PartnerDashboard.jsx
│   └── assets/
│       └── (milestone badge SVGs, etc.)
├── supabase/
│   ├── migrations/ (SQL schema)
│   └── functions/
│       ├── create-checkout/index.ts
│       ├── stripe-webhook/index.ts
│       └── get-partner-data/index.ts
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env.example
```

---

## Environment Variables (.env.example)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx (edge functions only, not exposed to client)
STRIPE_WEBHOOK_SECRET=whsec_xxx (edge functions only)
VITE_APP_URL=https://quitstreak.app
```

---

## What NOT to Build (MVP scope control)

- No social feed or community features
- No therapist/coach integration
- No AI chatbot
- No wearable integration
- No multi-addiction tracking (one quit type per account for now)
- No admin dashboard
- No A/B testing framework
- No analytics beyond basic Supabase usage (add Plausible or PostHog later)
- No multiple partner slots (one partner for now)
- No in-app chat between user and partner (just the encouragement one-way message and check-in visibility)

---

## Launch Checklist (for after the build)

1. Deploy to Vercel/Netlify
2. Set up Supabase project, run migrations
3. Configure Stripe products ($5.99/mo and $39.99/yr)
4. Set up Stripe webhook endpoint
5. Buy domain: quitstreak.app (or similar)
6. Test full flow: signup → onboarding → dashboard → check-in → milestone → subscribe → partner setup → partner view → encouragement → relapse reset
7. Test PWA install on iOS Safari and Android Chrome
8. Test push notifications on both platforms
9. Write privacy policy (critical for health data)
10. Submit to Product Hunt, r/stopdrinking, r/stopsmoking, r/QuitVaping
