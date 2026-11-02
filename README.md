# Sovastro – Mood & Healing Tracker (React + Express)
Simple, clean version.

## Run
    npm install
    npm run dev        # open http://localhost:5173
    # production: npm run build && npm run server   -> http://localhost:3000

## Flow
1. Login (name + email) -> left menu: Today, Weekly, Monthly, Tasks, Guides.
2. Today: "How are you feeling today?" with 8 moods (Happy, Good, Okay, Confused, Not very good, Low, Anxious, Stressed).
   Submit is compulsory: other tabs stay locked until today's mood is submitted. Then you land on Weekly.
3. Weekly: one simple line graph (missing days = gap), average, good/tough days, trend.
4. Monthly: line graph + month summary (how your days felt, best/lowest day, days not logged).
5. Tasks: astrologer assigns e.g. "Om Namah Shivay x5 / 20s" -> user popup -> OK -> 20s timer + tap counter -> Done.
   Not finished = stays Pending and is reminded again (REMIND_MS in server/server.js).
6. Guides: 3 recommended astrologers/healers (optional, not a replacement for medical care).
"Add sample data" on Weekly/Monthly fills demo moods. Data: server/data.json (demo). Use a DB + FCM/APNs push in production.
