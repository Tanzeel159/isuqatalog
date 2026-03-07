# ISU Qatalog

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

**ISU Qatalog** is a comprehensive academic co-pilot for Iowa State University students that transforms complex course planning into a streamlined, personalised journey.

## What It Does

- **Personalised Course Timelines** — Build and manage semester schedules across Fall, Spring, and Summer, tailored to your workload preferences.
- **Extensive Course Catalogue** — Browse courses across majors and departments aligned with Human-Computer Interaction (HCI), with details on learning outcomes, availability, professor listings, ratings, and student discussion threads.
- **Peer Connection** — View previous course takers and chat directly with them to get authentic perspectives before enrolling.
- **AI-Powered Recommendations** — Describe your area of interest and let the AI narrow selections, proactively sorting courses to eliminate timeline clashes and build optimised schedules.
- **Admin Panel** — Academic advisors get a secure interface to manage and update course details and syllabi.
- **Shareable Plans** — Interactive, shareable academic plans to keep students aligned with advisors and professors.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, React Router, Tailwind CSS, Motion |
| Backend | Express, TypeScript, tsx |
| Database | SQLite (better-sqlite3) |
| AI | OpenAI API, Pinecone (vector search) |
| Build | Vite |

## Getting Started

**Prerequisites:** Node.js (v18+)

1. **Clone the repo**
   ```bash
   git clone https://github.com/<your-username>/isuqatalog.git
   cd isuqatalog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example file and fill in your keys:
   ```bash
   cp .env.example .env
   ```

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `OPENAI_API_KEY` | Yes | OpenAI API key for AI features |
   | `PINECONE_API_KEY` | No | Pinecone API key for vector search (falls back to local TF-IDF) |
   | `PINECONE_INDEX` | No | Pinecone index name (default: `hci-index`) |
   | `OPENAI_EMBEDDING_MODEL` | No | Embedding model (default: `text-embedding-3-small`) |
   | `APP_URL` | No | Frontend URL (default: `http://localhost:3000`) |
   | `API_PORT` | No | API server port (default: `3001`) |

4. **Run the app**
   ```bash
   npm run dev
   ```
   The frontend runs on `http://localhost:3000` and the API on port `3001`.

## Project Structure

```
isuqatalog/
├── src/              # React frontend
├── server/           # Express API + AI logic
├── hci_data/         # Static HCI course & program data (JSON)
├── data/             # Runtime SQLite database (gitignored)
├── .env.example      # Environment variable template
└── vite.config.ts    # Vite configuration
```

## License

This project is part of academic coursework at Iowa State University.
