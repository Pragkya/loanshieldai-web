# LoanShield AI — Beginner Setup Guide

You don't need to know React to run this. Follow the steps in order. Each step tells you exactly what to click or type.

> **Terminal** = the black window where you type commands. In VS Code, open it with **View → Terminal**.
> Type each command exactly, then press **Enter**.

---

## Step 1 — Install two free tools (one time only)

1. **Node.js** → https://nodejs.org → download the **LTS** version → install with all default options.
2. **VS Code** (code editor) → https://code.visualstudio.com → install.

Check Node is installed: open a terminal and type

```
node -v
```

You should see something like `v22.x.x`. Any version 18 or above is fine.

---

## Step 2 — Open the project

1. Unzip `loanshield-ai.zip` somewhere easy, e.g. `Documents/loanshield-ai`.
2. Open VS Code → **File → Open Folder** → choose the `loanshield-ai` folder.
3. Open the terminal: **View → Terminal**.

---

## Step 3 — Download the libraries

In the terminal, type:

```
npm install
```

Wait 1–2 minutes. A new folder called `node_modules` will appear. That is normal — never edit it.

---

## Step 4 — Create your Firebase project (sign-in + database + AI)

Firebase gives you Google sign-in and a database for profiles/history — free to start. The AI comes from Groq (Step 4e).

### 4a. Create the project
1. Go to https://console.firebase.google.com and sign in with your Google account.
2. Click **Create a project** → name it `loanshield-ai` → Continue → (Google Analytics: you can turn it off) → **Create project**.

### 4b. Register the website and copy the keys
1. On the project home page, click the **`</>` (Web)** icon.
2. App nickname: `loanshield-web` → **Register app**.
3. You will see a code block with `firebaseConfig = { apiKey: "...", ... }`. Keep this page open.
4. In VS Code, find the file **`.env.example`**. Right-click → **Copy**, then **Paste** in the same folder. Rename the copy to exactly **`.env`**.
5. Fill `.env` using the values from the Firebase page, without quotes:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=loanshield-ai-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=loanshield-ai-xxxx
VITE_FIREBASE_STORAGE_BUCKET=loanshield-ai-xxxx.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
```

6. Save the file (**Ctrl + S**).

### 4c. Turn on Google sign-in
1. Left menu → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → **Google** → switch **Enable** on → choose your support email → **Save**.

### 4d. Create the database
1. Left menu → **Build → Firestore Database** → **Create database**.
2. Location: pick **asia-south1 (Mumbai)** → Next → **Start in production mode** → **Create**.
3. Open the **Rules** tab. Delete everything there and paste the contents of the `firestore.rules` file from this project. Click **Publish**.
   (These rules mean each person can only see their own data.)

### 4e. Get your Groq AI key
1. Go to https://console.groq.com and sign in.
2. Left menu → **API Keys** → **Create API Key** → copy it.
3. Paste it in `.env`: `VITE_GROQ_API_KEY=gsk_...` → save.

The AI model used is `openai/gpt-oss-120b` (set in `src/utils/ai.js`).

> ⚠️ A `VITE_` key is visible to anyone who opens your website's code. This is fine for testing and demos. Before real users use the site, move the Groq call to a small server (for example a Firebase Cloud Function) so the key stays secret.

---

## Step 5 — Run the website on your computer

In the VS Code terminal:

```
npm run dev
```

You will see `Local: http://localhost:5173/`. Hold **Ctrl** and click the link (or type it in Chrome).

🎉 You should see the LoanShield login page. Sign in with Google, choose your language, and fill your money picture.

To stop the website: click the terminal and press **Ctrl + C**.

**Check the phone layout on your computer:** in Chrome press **F12** → click the 📱 phone icon at the top-left of the panel → pick a phone like "iPhone 12".

---

## Step 6 — Put it online (so it opens on any phone)

Do this once:

```
npm install -g firebase-tools
firebase login
firebase use --add
```

(For `firebase use --add`, select your project with the arrow keys, press Enter, and type `default` as the alias.)

Every time you want to publish your latest changes:

```
npm run build
firebase deploy
```

Firebase prints a **Hosting URL** like `https://loanshield-ai-xxxx.web.app`. Open it on any phone or computer. Google sign-in works there automatically.

---

## What each file does

```
loanshield-ai/
├── index.html              ← page shell, fonts
├── .env                    ← YOUR Firebase keys (never share or upload)
├── firestore.rules         ← database security
├── public/shield.svg       ← logo
└── src/
    ├── main.jsx            ← starting point
    ├── App.jsx             ← chooses: login → setup → app pages
    ├── firebase.js         ← connects to Firebase
    ├── i18n.js             ← all screen text in 5 languages
    ├── styles.css          ← all colours and design
    ├── context/AppContext.jsx  ← signed-in user, profile, language, senior mode
    ├── utils/
    │   ├── finance.js      ← EMI maths and Safe / Caution / Unsafe rules
    │   ├── ai.js           ← sends questions to Groq with the money picture
    │   ├── pdf.js          ← reads PDF text + finds hidden-charge clauses
    │   └── history.js      ← saves past checks
    ├── components/
    │   ├── Layout.jsx      ← menu (bottom bar on phone, side bar on desktop)
    │   ├── FinanceModal.jsx← the "money picture" pop-up
    │   ├── ChatBox.jsx     ← chat used by Copilot + document chat
    │   ├── VoiceButton.jsx ← mic input + read-aloud
    │   ├── Verdict.jsx     ← Safe / Caution / Unsafe badge
    │   └── Markdown.jsx    ← formats AI answers
    └── pages/
        ├── Login.jsx, Setup.jsx, Home.jsx, Profile.jsx
        ├── EmiChecker.jsx  ← loan / EMI checker
        ├── Copilot.jsx     ← AI chat
        ├── Documents.jsx   ← PDF analyser + chat
        ├── Invest.jsx      ← investment guide
        └── StressTest.jsx  ← income-drop test (open /stress-test)
```

### How the safety verdict is decided (`src/utils/finance.js`)
- **Left over** = income − Survival Floor − all EMIs (old + new) − credit-card & informal payments
- **Safety buffer** = 10% of income, +3% per dependant (max 5), +5% if income is irregular (business, daily wage, gig, farming), capped at 30%
- **Safe** → left over ≥ buffer **and** total EMIs ≤ 40% of income
- **Caution** → left over ≥ 0 **and** total EMIs ≤ 55% of income
- **Unsafe** → anything else

Change these numbers in `assessLoan()` if your team wants different rules.

---

## Easy changes you can try

| I want to… | Open this file | Change |
|---|---|---|
| Change colours | `src/styles.css` | the 4 lines at the top (`--mint`, `--teal`, `--cream`, `--orange`) |
| Change a word on screen | `src/i18n.js` | find the English word, edit it (and the 4 other languages) |
| Add Stress Test to the menu | `src/components/Layout.jsx` | add `["/stress-test", "stressTitle", I.invest],` to the `links` list |
| Change quick questions in Copilot | `src/i18n.js` | `q1` to `q4` |
| Use a different AI model | `src/utils/ai.js` | `GROQ_MODEL = "openai/gpt-oss-120b"` |

Save the file — the browser updates by itself while `npm run dev` is running.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| `npm` is not recognised | Node.js isn't installed, or restart VS Code after installing it. |
| Login page says "Firebase keys missing" | The file must be named exactly `.env` (not `.env.txt`). Stop with Ctrl+C and run `npm run dev` again after editing it. |
| Google pop-up closes with `auth/unauthorized-domain` | Firebase → Authentication → Settings → **Authorized domains** → add the domain you're using. |
| "AI is not reachable right now" | Check `VITE_GROQ_API_KEY` in `.env`, then restart `npm run dev`. Press F12 → Console to see the exact Groq error. |
| `Missing or insufficient permissions` | Paste `firestore.rules` into the Rules tab and Publish (Step 4d). |
| PDF says it is a scanned image | The PDF is a photo. Text-based PDFs (downloaded from the bank) work best. |
| Mic button not visible | Voice input works in Chrome / Edge / Android Chrome, not Firefox or iPhone Safari. |

---

ⓘ LoanShield AI gives general education, not licensed financial advice.
