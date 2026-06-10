# ☕ BrewMate AI

> **Speed for those who know, discovery for those who explore.**

BrewMate AI is a mobile coffee ordering app for iOS and Android, built with Flutter. It offers two primary user paths:

- **Quick Order** — Fast browse, add to cart, and checkout for customers who already know what they want.
- **Coffee Match** — An optional AI-powered recommendation flow that suggests drinks and snacks tailored to the user's taste preferences.

---

## 🛠 Tech Stack

| Layer          | Technology                                      |
| -------------- | ------------------------------------------------ |
| Mobile         | Flutter, Dart, Riverpod, GoRouter, Dio, Material 3 |
| Backend API    | NestJS, TypeScript, Prisma ORM                   |
| Database       | PostgreSQL (UUID primary keys, relational schema) |
| Authentication | Email/password + JWT, Firebase Google Sign-In    |
| AI Engine      | xAI Grok API (backend-only integration)          |
| Payments       | Xendit Payment Gateway (backend-only integration)|
| API Style      | REST JSON API under `/api/v1`                    |

---

## 📁 Folder Structure

```
brewmate-ai/
├── mobile/                  # Flutter mobile application
│   ├── lib/
│   │   ├── core/            # Theme, constants, utils, network client
│   │   ├── features/        # Feature modules (auth, menu, cart, order, coffee_match)
│   │   ├── models/          # Shared data models / DTOs
│   │   ├── providers/       # Riverpod providers
│   │   ├── routing/         # GoRouter configuration
│   │   └── widgets/         # Reusable UI components
│   ├── assets/              # Images, fonts, icons
│   ├── test/                # Unit & widget tests
│   ├── pubspec.yaml
│   └── .env.example
│
├── backend/                 # NestJS backend API
│   ├── src/
│   │   ├── modules/         # Feature modules (auth, users, products, orders, ai, payment)
│   │   ├── common/          # Guards, interceptors, filters, decorators
│   │   ├── prisma/          # Prisma service & module
│   │   └── config/          # Environment & app configuration
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Auto-generated migrations
│   │   └── seed.ts          # Database seed script
│   ├── test/                # E2E & unit tests
│   ├── .env.example
│   └── package.json
│
├── docs/                    # Project documentation
│   ├── prd/                 # Product Requirements Document
│   ├── erd/                 # Entity Relationship Diagrams
│   ├── api-contract/        # REST API contract & endpoint docs
│   └── setup/               # Local development & deployment guides
│
├── README.md                # ← You are here
└── .gitignore
```

---

## 🚀 Local Development Flow

### Prerequisites

| Tool       | Version   | Purpose                |
| ---------- | --------- | ---------------------- |
| Flutter    | ≥ 3.22    | Mobile app development |
| Dart       | ≥ 3.5     | Included with Flutter  |
| Node.js    | ≥ 20 LTS  | Backend runtime        |
| npm        | ≥ 10      | Package management     |
| PostgreSQL | ≥ 15      | Database               |

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/brewmate-ai.git
cd brewmate-ai

# 2. Start the backend
cd backend
cp .env.example .env          # Fill in your environment variables
npm install
npx prisma migrate dev        # Apply database migrations
npx prisma db seed             # Seed sample data
npm run start:dev              # Starts on http://localhost:3000

# 3. Start the mobile app (in a new terminal)
cd mobile
cp .env.example .env          # Set API_BASE_URL
flutter pub get
flutter run                    # Launch on emulator or device
```

> 📖 For detailed setup instructions, see [`docs/setup/local-development.md`](docs/setup/local-development.md).

---

## 🔐 Environment Variables Overview

### Backend (`backend/.env`)

| Variable                | Description                          | Required |
| ----------------------- | ------------------------------------ | -------- |
| `DATABASE_URL`          | PostgreSQL connection string         | ✅       |
| `JWT_SECRET`            | Secret key for JWT token signing     | ✅       |
| `JWT_EXPIRATION`        | Token expiration (e.g., `7d`)        | ✅       |
| `FIREBASE_PROJECT_ID`   | Firebase project identifier          | ✅       |
| `FIREBASE_PRIVATE_KEY`  | Firebase Admin SDK private key       | ✅       |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK client email      | ✅       |
| `XAI_GROK_API_KEY`     | xAI Grok API key for recommendations | ✅       |
| `XAI_GROK_BASE_URL`    | xAI Grok API base URL               | ✅       |
| `XENDIT_SECRET_KEY`     | Xendit payment gateway secret key    | ✅       |
| `XENDIT_WEBHOOK_TOKEN`  | Xendit webhook verification token    | ✅       |
| `PORT`                  | Server port (default: `3000`)        | ❌       |

### Mobile (`mobile/.env`)

| Variable        | Description                            | Required |
| --------------- | -------------------------------------- | -------- |
| `API_BASE_URL`  | Backend API URL (e.g., `http://10.0.2.2:3000/api/v1`) | ✅ |

---

## ⚠️ Security Warning

> [!CAUTION]
> **Never commit `.env` files, API keys, or secrets to version control.**

This project enforces the following security rules:

- 🔒 **Xendit secret key** — backend only. Never expose in Flutter.
- 🔒 **xAI/Grok API key** — backend only. Never expose in Flutter.
- 🔒 **Firebase Admin credentials** — backend only. Never expose in Flutter.
- 🔒 **JWT secret** — backend only. Never expose in Flutter.
- 💰 **Product pricing** — always calculated on the backend. Never trust client-side prices.
- 📦 **Order snapshots** — order items use immutable snapshots to preserve historical accuracy.
- 🤖 **AI recommendations** — only recommend real products from the database. AI must never invent product names, prices, ingredients, discounts, or availability.

The `.gitignore` is configured to exclude all environment files. Always use `.env.example` as a template.

---

## 📄 License

This project is proprietary. All rights reserved.
