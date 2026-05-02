# 🍽️ TableTalk AI — Your Restaurant's AI Waiter

> **AI-powered ordering for restaurants — via voice, phone call, or WhatsApp. Zero wait time. Zero missed orders.**

🔗 **Live Demo:** [tabletalk-ai-d9dv.vercel.app](https://tabletalk-ai-d9dv.vercel.app)

---

## ✨ What is TableTalk AI?

TableTalk AI is a full-stack, AI-powered restaurant ordering system that lets customers place orders in multiple ways — via in-app voice, a **phone call**, or **WhatsApp**. A customer simply speaks or messages their order (e.g., *"One butter chicken and naan"*), and the AI waiter instantly confirms and saves it — no human waiter needed.

The app is built with a **Next.js** frontend and a **FastAPI** backend, powered by **Groq** for fast AI inference and **Sarvam AI** for voice/speech capabilities.

---

## 🚀 Features

- 🎙️ **In-App Voice Ordering** — Customers tap the mic and speak their order directly in the browser
- 📞 **Phone Call Ordering** — Customers can call in and place their order with the AI over a regular phone call
- 💬 **WhatsApp Ordering** — Customers can send their order via WhatsApp and get instant AI confirmation
- ⚡ **Instant AI Confirmation** — The AI processes and confirms orders in real time across all channels
- 📊 **Live Admin Dashboard** — Real-time order tracking for restaurant staff
- 🗂️ **Menu Page** — Browse available items before or during ordering
- 📦 **Order Tracking** — Customers can track the status of their order
- 🌐 **Deployed on Vercel** — Fast, globally available frontend

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| shadcn/ui + Radix UI | Component library |
| Framer Motion | Animations |
| Recharts | Admin dashboard charts |
| Vercel Analytics | Usage analytics |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | Python web framework |
| Uvicorn | ASGI server |
| Groq | LLM inference (fast AI responses) |
| Sarvam AI | Voice/speech processing |
| Supabase | Database & real-time backend |
| Pydantic | Data validation |

---

## 📁 Project Structure

```
tabletalk-ai/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Home / landing page
│   ├── menu/             # Menu browsing page
│   ├── track/            # Order tracking page
│   └── admin/            # Admin dashboard
├── backend/              # FastAPI backend
│   └── app.py            # Main FastAPI application
├── components/           # Reusable React components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── styles/               # Global CSS
├── public/               # Static assets
├── main.py               # Backend entry point (Uvicorn)
├── requirements.txt      # Python dependencies
├── package.json          # Node.js dependencies
└── next.config.mjs       # Next.js configuration
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A [Groq](https://console.groq.com/) API key
- A [Supabase](https://supabase.com/) project
- A [Sarvam AI](https://www.sarvam.ai/) API key

### 1. Clone the repository

```bash
git clone https://github.com/vikshittindwani/tabletalk-ai.git
cd tabletalk-ai
```

### 2. Set up environment variables

Create a `.env` file in the root directory:

```env
# Backend
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SARVAM_API_KEY=your_sarvam_api_key

# Optional (backend server config)
HOST=127.0.0.1
PORT=8000
UVICORN_RELOAD=true
```

### 3. Install and run the Frontend

```bash
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 4. Install and run the Backend

```bash
pip install -r requirements.txt
python main.py
```

The backend API will be available at `http://localhost:8000`.

---

## 📜 Available Scripts

### Frontend (npm)

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

### Backend (Python)

| Command | Description |
|---|---|
| `python main.py` | Start FastAPI server via Uvicorn |

---

## 🌍 Deployment

The frontend is deployed on **Vercel**. To deploy your own instance:

1. Push the repo to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Add all required environment variables in the Vercel dashboard
4. Deploy — Vercel handles the rest

For the backend, deploy to any platform that supports Python/FastAPI (Railway, Render, Fly.io, etc.).

---
<img width="1920" height="1080" alt="Screenshot (300)" src="https://github.com/user-attachments/assets/de6a2449-3af9-4b8b-9690-a618306e3148" />
<img width="1920" height="1080" alt="Screenshot (301)" src="https://github.com/user-attachments/assets/4e5af146-1839-4a96-b95b-1c61985a66dd" />

<img width="1920" height="1080" alt="Screenshot (302)" src="https://github.com/user-attachments/assets/bdc14f5e-019b-4780-92b7-44c5faaf7942" />

<img width="1920" height="1080" alt="Screenshot (303)" src="https://github.com/user-attachments/assets/051c1859-d571-47e7-ba25-8e626e5584a2" />


## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 👤 Author

**Vikshit Tindwani**

Built with ❤️ using Groq + Sarvam AI

---

## 📄 License

This project is open source. See the repository for details.
