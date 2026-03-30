# ⚔️ Valhalla

**Valhalla** is an open-source, offline-first tournament manager built specifically for the [Brazilian Robotics Olympiad (OBR)](https://www.obr.org.br/). It runs entirely on a local network — no internet required.

---

## Features

- 🏆 **Multi-category ranking** — Rescue (Levels 1 & 2) and Artistic (Levels 1 & 2)
- 📊 **Configurable score columns** — Add, rename, reorder score columns per category
- 🧮 **Scoring formula engine** — Custom JavaScript formulas with tiebreaker support
- 🔐 **Offline authentication** — Role-based access (Admin / Referee / Public) with simple passwords
- 📡 **Real-time ranking** — Auto-refreshing public ranking page
- 🐳 **Docker-ready** — Start with a single command
- 📱 **Responsive** — Works on tablets and phones for referee scoring

---

## Tech Stack

| Layer        | Technology            |
|--------------|-----------------------|
| Framework    | Next.js 15 (App Router) |
| Language     | TypeScript (strict)   |
| API          | tRPC v11              |
| Database     | SQLite via Prisma     |
| Styling      | TailwindCSS v4        |
| UI           | shadcn/ui components  |
| Validation   | Zod                   |
| Session      | iron-session          |
| Container    | Docker + Docker Compose |

---

## Project Structure

```
src/
├── app/                       # Next.js App Router pages
│   ├── api/trpc/[trpc]/       # tRPC API endpoint
│   ├── login/                 # Login page
│   ├── dashboard/
│   │   ├── admin/             # Admin dashboard
│   │   └── referee/           # Referee scoring interface
│   └── ranking/               # Public ranking display
├── domain/                    # Pure domain types & interfaces
│   ├── entities/              # Entity types (Event, Team, Category, Score, User)
│   └── repositories/          # Repository interfaces
├── application/               # Business logic
│   └── services/              # Auth service, Scoring engine
├── infrastructure/            # External system integrations
│   ├── database/              # Prisma client singleton
│   ├── repositories/          # Prisma repository implementations
│   └── auth/                  # iron-session configuration
├── presentation/              # UI components
│   └── components/
│       ├── ui/                # shadcn/ui components
│       └── shared/            # TRPCProvider, layout wrappers
├── server/                    # tRPC server
│   ├── trpc/                  # tRPC init, context, router
│   └── routers/               # Feature routers (event, team, category, score, auth)
└── lib/                       # Shared utilities
    ├── utils.ts               # cn(), formatDate(), etc.
    ├── logger.ts              # Structured logger
    └── trpc/                  # tRPC client helpers
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/OtacilioN/Valhalla.git
cd Valhalla

# 2. Copy environment variables
cp .env.example .env
# Edit .env and set a strong SESSION_SECRET (min 32 chars)

# 3. Install dependencies
npm install

# 4. Set up the database
npm run prisma:migrate

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production with Docker

```bash
# 1. Copy and configure environment
cp .env.example .env
# Set SESSION_SECRET to a secure random string

# 2. Build and start
docker-compose up -d

# 3. Access at http://localhost:3000
```

The database is persisted in a Docker volume (`valhalla_data`).

---

## User Roles

| Role     | Access                                           |
|----------|--------------------------------------------------|
| `ADMIN`  | Full access: manage events, teams, categories    |
| `REFEREE`| Submit scores for teams in their assigned arena  |
| `PUBLIC` | View real-time rankings (no password required)   |

Authentication is **offline** — no email, no OAuth. The admin creates an event with two passwords (admin + referee). Users select their role and enter the corresponding password.

---

## Domain Overview

### Event

The central entity. Each event has:
- Name, description, location, start/end dates
- Admin & referee passwords
- Arenas, Categories, Referees

Only **one event can be active** at a time.

### Categories

Default categories created with each event:
- Rescue Level 1
- Rescue Level 2
- Artistic Level 1
- Artistic Level 2

Each category has:
- Configurable score columns
- A JavaScript scoring formula

### Score Column Presets

**Rescue:** Round 1 · Time 1 · Round 2 · Time 2 · Round 3 · Time 3

**Artistic:** Interview · Presentation 1 · Presentation 2 · Penalties

### Scoring Formulas

Formulas are stored as JavaScript IIFEs:

```javascript
// Rescue: sum of best 2 rounds, tiebreaker = time of counted rounds
(function(scores) {
  var rounds = [scores[0], scores[2], scores[4]];
  var times  = [scores[1], scores[3], scores[5]];
  // ... discard worst, sum rest
  return [total, tiebreakerTime];
})

// Artistic
(function(scores) {
  var max = scores[1] > scores[2] ? scores[1] : scores[2];
  var score = scores[0] + max;
  return [score, scores[1] + scores[2], scores[3] * -1];
})
```

---

## Environment Variables

| Variable              | Required | Description                          |
|-----------------------|----------|--------------------------------------|
| `SESSION_SECRET`      | ✅        | Secret for iron-session (≥32 chars) |
| `DATABASE_URL`        | ✅        | SQLite path (e.g. `file:./data/valhalla.db`) |
| `NEXT_PUBLIC_APP_URL` | ❌        | App URL for tRPC client (default: `http://localhost:3000`) |

---

## Database Migrations

```bash
# Create a new migration
npm run prisma:migrate

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database UI)
npm run prisma:studio
```

---

## Architecture Principles

- **Clean Architecture** layers: domain → application → infrastructure → presentation
- **tRPC** for end-to-end type safety
- **Server components** preferred; client components only when needed
- **Strict TypeScript** — no `any`
- **Feature-oriented** folder structure
- Prepared for **real-time features** (WebSockets) in a future iteration

---

## Contributing

Contributions are welcome! Please open an issue or PR.

---

## License

MIT © [Otacilio Maia](https://github.com/OtacilioN)
