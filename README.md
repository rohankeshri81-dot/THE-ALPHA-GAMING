# THE ALPHA CLUBHOUSE - Full-Stack Hub
======================================

An ultra-modern, high-performance Clubhouse Management System designed specifically for active fitness enthusiasts, dedicated readers, professional gamers, and community managers.

This project is a fully-engineered full-stack TypeScript application featuring a modular **React (Vite) + Tailwind CSS v4** frontend coupled with a robust **Node.js/Express** backend proxying **Supabase PostgreSQL** and **Razorpay** real-time payment settlement logs.

---

## 🚀 Key Functional Modules & Features

### 1. Unified Clubhouse Access
- **The Alpha Gym**: Direct registration slot trackers with slot density matrices and live enrollment states.
- **The Alpha Library**: Active seat allocation visualizer, multi-hour bookings, list selectors, and live study slot updates.
- **The Alpha Gaming & Cafe Arena**: Interactive seat selection matrix, console plan configurations, real-time seat lock state, cafe menu order calculator, tournament registry, and active community highlights.

### 2. Premium User Dashboard
- Real-time membership tracking (Gym pass, Library pass, Gaming pass status).
- Active receipts repository with printable PDF invoice generation via `jspdf`.
- Live slot bookings & payment status updates.

### 3. Comprehensive Developer & Admin Console
- **Analytics & Key Performance Indicators**: Live revenue counters, active athletes, reader logs, tournament registry count, filtered dynamically by calendar date range.
- **Custom Date Filters**: Filter all system metrics, user lists, booking databases, and matching results by custom date ranges or quick presets (Today, This Week, This Month).
- **Universal Multi-Layer Search**: Real-time cross-joining search of local in-memory DB and cloud Supabase tables with live filters.
- **Verified Transaction Audit**: Instant validation of Razorpay IDs, transaction approval or rejection, and automated receipt syncing.
- **Destructive Records Manager**: Admins can safely and permanently delete custom bookings, parent member accounts, or billing receipts with dual-mode protection and instant layout state cleanups.
- **Interactive SQL Workstation**: Execute live SQL statements on the connected PostgreSQL cluster securely, complete with schema visualizers and connection test benches.

---

## 🛠️ Technical Architecture

### Tech Stack
- **Frontend**: React 19 (Functional Hooks), Vite, TypeScript, Framer Motion (via `motion/react`), Tailwind CSS v4, Lucide React Icons.
- **Backend & Middleware**: Node.js, Express, tsx (dev loader), esbuild (production bundling).
- **Persistence**: Hybrid Storage System (Local JSON State redundancy matching live Supabase PostgreSQL tables).
- **Payment Verification Logs**: Razorpay SDK helper classes.

---

## ⚡ Direct Local Setup Instruction

### Prerequisites
- Install **Node.js** (v18 or higher recommended)
- Install **npm** or preferred package manager

### 1. Installation
Extract the zip package and run inside the root directory:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (using `.env.example` as a template):
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_service_key_here
```

### 3. Launch Development Server
```bash
npm run dev
```
The application will boot instantly and be accessible at: `http://localhost:3000`

### 4. Build for Production Server
To build the client bundle and compile the TypeScript Express server into a highly optimized, single-bundle CommonJS server file (`dist/server.cjs`):
```bash
npm run build
npm start
```

---

## 💾 Database Schema Setup (PostgreSQL / Supabase)

To link your own Supabase project, execute these raw SQL tables inside your Supabase project's SQL Editor:

```sql
-- 1. Create Bookings Table
CREATE TABLE IF NOT EXISTS public.alpha_bookings (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT,
    mobile_number TEXT,
    category TEXT NOT NULL,
    plan_name TEXT,
    payment_status TEXT NOT NULL,
    payment_method TEXT,
    total_amount NUMERIC NOT NULL,
    utr_number TEXT,
    razorpay_payment_id TEXT,
    receipt_number TEXT,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Payment Receipts Table
CREATE TABLE IF NOT EXISTS public.payment_receipts (
    id TEXT PRIMARY KEY,
    receipt_number TEXT NOT NULL,
    mobile_number TEXT,
    service_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    utr_reference TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Admin Users Table
CREATE TABLE IF NOT EXISTS public.alpha_admins (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enable Custom RAW SQL Execution Function for Admin Panel SQL Workstation (Optional)
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE 'SELECT json_agg(t) FROM (' || query || ') t' INTO result;
    RETURN COALESCE(result, '[]'::json);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;
```

---

## 🎨 Professional Layout Architecture & Design Standards
This application implements an elegant dark-theme design characterized by:
- **Consistent Visual Space**: Standardized `12` column layouts, padded containers (`p-6` to `p-12`), and flexible bento grids with interactive hover micro-animations.
- **Elite Typography**: Inter and Space Grotesk typeface pairs with JetBrains Mono accents.
- **Safety**: Safe error state boundaries and transactional fallbacks.
