# 🛠 Local Development Guide

This guide walks you through setting up the BrewMate AI development environment from scratch.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install Flutter](#2-install-flutter)
3. [Install Node.js](#3-install-nodejs)
4. [Install PostgreSQL](#4-install-postgresql)
5. [Setup Backend](#5-setup-backend)
6. [Setup Mobile App](#6-setup-mobile-app)
7. [Running the Full Stack](#7-running-the-full-stack)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

Ensure the following tools are installed on your machine:

| Tool       | Minimum Version | Download                                      |
| ---------- | --------------- | --------------------------------------------- |
| Flutter    | 3.22+           | https://docs.flutter.dev/get-started/install   |
| Dart       | 3.5+            | Bundled with Flutter                           |
| Node.js    | 20 LTS          | https://nodejs.org/                            |
| npm        | 10+             | Bundled with Node.js                           |
| PostgreSQL | 15+             | https://www.postgresql.org/download/           |
| Git        | 2.40+           | https://git-scm.com/downloads                 |

Optional but recommended:
- **Android Studio** — for Android emulator and SDK management
- **Xcode** (macOS only) — for iOS simulator and builds
- **VS Code** — with Flutter, Dart, and Prisma extensions
- **Postman / Insomnia** — for API testing
- **pgAdmin / DBeaver** — for database management

---

## 2. Install Flutter

### macOS / Linux

```bash
# Download Flutter SDK (or use your package manager)
git clone https://github.com/flutter/flutter.git -b stable ~/flutter
export PATH="$HOME/flutter/bin:$PATH"

# Verify installation
flutter doctor
```

### Windows

1. Download the Flutter SDK from [flutter.dev](https://docs.flutter.dev/get-started/install/windows).
2. Extract to a folder (e.g., `C:\flutter`).
3. Add `C:\flutter\bin` to your system `PATH`.
4. Open a new terminal and run:

```powershell
flutter doctor
```

### Post-Install

```bash
# Accept Android licenses
flutter doctor --android-licenses

# Verify everything is green
flutter doctor -v
```

> [!TIP]
> Resolve any issues flagged by `flutter doctor` before proceeding. Common fixes include installing Android SDK command-line tools or accepting licenses.

---

## 3. Install Node.js

We recommend using a version manager for Node.js:

### Using nvm (macOS / Linux)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### Using nvm-windows (Windows)

1. Download from [nvm-windows releases](https://github.com/coreybutler/nvm-windows/releases).
2. Install and restart your terminal.

```powershell
nvm install 20
nvm use 20
```

### Verify

```bash
node --version   # Should be v20.x.x
npm --version    # Should be v10.x.x
```

---

## 4. Install PostgreSQL

You have three options for your PostgreSQL database:

### Option A: Local Installation

1. Download from [postgresql.org](https://www.postgresql.org/download/).
2. During setup, note the port (default: `5432`) and the password for the `postgres` user.
3. Create the development database:

```bash
psql -U postgres
CREATE DATABASE brewmate_dev;
\q
```

### Option B: Supabase (Cloud)

1. Create a free project at [supabase.com](https://supabase.com/).
2. Go to **Settings → Database** and copy the connection string.
3. Use the connection string as your `DATABASE_URL`.

### Option C: Neon (Cloud)

1. Create a free project at [neon.tech](https://neon.tech/).
2. Copy the connection string from the dashboard.
3. Use the connection string as your `DATABASE_URL`.

### Option D: Docker

```bash
docker run --name brewmate-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=brewmate_dev \
  -p 5432:5432 \
  -d postgres:15-alpine
```

---

## 5. Setup Backend

### 5.1 Install Dependencies

```bash
cd backend
npm install
```

### 5.2 Configure Environment Variables

```bash
cp .env.example .env
```

Edit `backend/.env` with your actual values:

```dotenv
# ── Database ──────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/brewmate_dev?schema=public"

# ── JWT ───────────────────────────────────────────────────
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRATION="7d"

# ── Firebase Admin SDK ────────────────────────────────────
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"

# ── xAI Grok API (AI Recommendations) ────────────────────
XAI_GROK_API_KEY="xai-xxxxxxxxxxxxxxxxxxxxxxxx"
XAI_GROK_BASE_URL="https://api.x.ai/v1"

# ── Xendit Payment Gateway ───────────────────────────────
XENDIT_SECRET_KEY="xnd_development_xxxxxxxxxxxx"
XENDIT_WEBHOOK_TOKEN="your-xendit-webhook-verification-token"

# ── Server ────────────────────────────────────────────────
PORT=3000
```

> [!CAUTION]
> **Never commit `.env` files.** The `.gitignore` is configured to exclude them. Always use `.env.example` as a reference template with placeholder values.

### 5.3 Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed sample data (products, categories, etc.)
npx prisma db seed
```

### 5.4 Verify Backend

```bash
# Start in development mode (with hot reload)
npm run start:dev

# Backend should be running at http://localhost:3000
# Health check: GET http://localhost:3000/api/v1/health
```

---

## 6. Setup Mobile App

### 6.1 Install Dependencies

```bash
cd mobile
flutter pub get
```

### 6.2 Configure API Base URL

```bash
cp .env.example .env
```

Edit `mobile/.env`:

```dotenv
# For Android Emulator (10.0.2.2 maps to host localhost)
API_BASE_URL=http://10.0.2.2:3000/api/v1

# For iOS Simulator (localhost works directly)
# API_BASE_URL=http://localhost:3000/api/v1

# For Physical Device (use your machine's local IP)
# API_BASE_URL=http://192.168.x.x:3000/api/v1
```

> [!NOTE]
> **Android Emulator** uses `10.0.2.2` to reach the host machine's `localhost`. **iOS Simulator** can use `localhost` directly. For **physical devices**, use your computer's local network IP address.

### 6.3 Verify Mobile App

```bash
# Check for connected devices
flutter devices

# Run on a connected device or emulator
flutter run
```

---

## 7. Running the Full Stack

Open **two terminal windows** side by side:

### Terminal 1 — Backend

```bash
cd brewmate-ai/backend
npm run start:dev
```

### Terminal 2 — Mobile

```bash
cd brewmate-ai/mobile
flutter run
```

### Development Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                     Development Flow                        │
│                                                             │
│  Flutter App ──── HTTP/REST ────▶ NestJS API               │
│  (mobile/)                        (backend/)                │
│       │                               │                     │
│       │                               ▼                     │
│       │                          PostgreSQL                  │
│       │                               │                     │
│       │                          Prisma ORM                  │
│       │                               │                     │
│       ▼                               ▼                     │
│  Device / Emulator              localhost:3000               │
└─────────────────────────────────────────────────────────────┘
```

### Useful Commands

| Command                          | Description                        |
| -------------------------------- | ---------------------------------- |
| `npm run start:dev`              | Start backend with hot reload      |
| `npm run start:debug`            | Start backend with debugger        |
| `npm run test`                   | Run backend unit tests             |
| `npm run test:e2e`               | Run backend E2E tests              |
| `npx prisma studio`             | Open Prisma visual database editor |
| `npx prisma migrate dev`        | Create & apply new migration       |
| `flutter run`                    | Run mobile app                     |
| `flutter test`                   | Run mobile unit & widget tests     |
| `flutter build apk`             | Build Android APK                  |
| `flutter build ios`             | Build iOS (macOS only)             |

---

## 8. Troubleshooting

### Backend won't start

- Ensure PostgreSQL is running and accessible.
- Verify `DATABASE_URL` in `.env` is correct.
- Run `npx prisma migrate dev` to ensure migrations are applied.
- Check that port `3000` is not in use: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows).

### Flutter app can't connect to backend

- Ensure the backend is running on `http://localhost:3000`.
- For Android emulator, use `http://10.0.2.2:3000/api/v1` as the base URL.
- For iOS simulator, use `http://localhost:3000/api/v1`.
- For physical devices, use your machine's local IP and ensure both devices are on the same network.
- On Android, ensure `android:usesCleartextTraffic="true"` is set in `AndroidManifest.xml` for HTTP (non-HTTPS) connections during development.

### Prisma issues

- Run `npx prisma generate` after any schema changes.
- Run `npx prisma migrate reset` to reset the database (⚠️ destroys all data).
- Use `npx prisma studio` to visually inspect your database.

### Flutter build errors

- Run `flutter clean && flutter pub get` to reset build cache.
- Ensure Dart/Flutter SDK versions meet the minimum requirements.
- Run `flutter doctor -v` to diagnose environment issues.

---

> [!IMPORTANT]
> If you encounter issues not covered here, check the project's issue tracker or reach out to the team. Always include your OS, tool versions, and the full error message when reporting issues.
