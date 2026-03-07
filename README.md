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

## Documentation

| Document | Description |
|----------|-------------|
| [Design System](docs/DESIGN_SYSTEM.md) | Brand tokens, color system, typography, components |
| [Journal](docs/JOURNAL.md) | Narrative of the build process |

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
