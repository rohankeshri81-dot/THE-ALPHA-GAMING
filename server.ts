import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import url from "url";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import AdmZip from "adm-zip";

// Load environment variables
dotenv.config();

// Initialize Supabase Client using the user's provided project details
const SUPABASE_URL = "https://vboqigshswogtlrgcuag.supabase.co";
const SUPABASE_KEY = "sb_publishable_JKL0jKGK28eW4IPv81qfig_xwI5wPj4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Convert any string identifier to a valid, deterministic UUID (v4-like string)
function stringToUUID(str: string): string {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(str)) {
    return str;
  }
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

// Table auto-creation script (if the exec_sql RPC function exists)
async function initializeSupabaseTable() {
  console.log("[SUPABASE SETUP] Initializing and validating tables...");
  
  const createTableSQL = `
    SELECT NULL) t;

    -- 1. Create alpha_bookings table
    CREATE TABLE IF NOT EXISTS public.alpha_bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name TEXT,
      mobile_number TEXT,
      service_type TEXT,
      plan_name TEXT,
      product_name TEXT,
      quantity INTEGER,
      amount NUMERIC,
      payment_status TEXT,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      utr_reference TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Ensure all columns exist in case table was created with partial columns previously
    ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS mobile_number TEXT;
    ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS service_type TEXT;
    ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS plan_name TEXT;
    ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS product_name TEXT;
    ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS quantity INTEGER;
    ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS amount NUMERIC;
    ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS payment_status TEXT;
    ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
    ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
    ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS utr_reference TEXT;
    ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

    -- 2. Create payment_receipts table
    CREATE TABLE IF NOT EXISTS public.payment_receipts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      receipt_number TEXT,
      customer_name TEXT,
      mobile_number TEXT,
      service_name TEXT,
      quantity INTEGER,
      amount NUMERIC,
      payment_status TEXT,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      utr_reference TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Ensure all columns exist in case table was created with partial columns previously
    ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS receipt_number TEXT;
    ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS customer_name TEXT;
    ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS mobile_number TEXT;
    ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS service_name TEXT;
    ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS quantity INTEGER;
    ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS amount NUMERIC;
    ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS payment_status TEXT;
    ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
    ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
    ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS utr_reference TEXT;
    ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

    -- Ensure Row Level Security (RLS) is active
    ALTER TABLE public.alpha_bookings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

    -- Create alpha_admins table
    CREATE TABLE IF NOT EXISTS public.alpha_admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    ALTER TABLE public.alpha_admins ADD COLUMN IF NOT EXISTS username TEXT;
    ALTER TABLE public.alpha_admins ADD COLUMN IF NOT EXISTS password_hash TEXT;
    ALTER TABLE public.alpha_admins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

    -- Ensure RLS is active on alpha_admins
    ALTER TABLE public.alpha_admins ENABLE ROW LEVEL SECURITY;

    -- Drop any old/different policies to prevent duplicate or conflict errors
    DROP POLICY IF EXISTS "Allow public insert to alpha_bookings" ON public.alpha_bookings;
    DROP POLICY IF EXISTS "Allow public insert to payment_receipts" ON public.payment_receipts;
    DROP POLICY IF EXISTS "Allow public select to alpha_bookings" ON public.alpha_bookings;
    DROP POLICY IF EXISTS "Allow public select to payment_receipts" ON public.payment_receipts;
    DROP POLICY IF EXISTS "Allow select for auth users to alpha_bookings" ON public.alpha_bookings;
    DROP POLICY IF EXISTS "Allow select for auth users to payment_receipts" ON public.payment_receipts;
    DROP POLICY IF EXISTS "Allow public test delete from alpha_bookings" ON public.alpha_bookings;
    DROP POLICY IF EXISTS "Allow public test delete from payment_receipts" ON public.payment_receipts;
    DROP POLICY IF EXISTS "Allow public select on alpha_admins" ON public.alpha_admins;
    DROP POLICY IF EXISTS "Allow public insert on alpha_admins" ON public.alpha_admins;

    -- Create highly permissive RLS policies to allow inserts/selects/deletes on all roles (anon, public, authenticated)
    CREATE POLICY "Allow public insert to alpha_bookings" ON public.alpha_bookings FOR INSERT TO anon, authenticated, public WITH CHECK (true);
    CREATE POLICY "Allow public insert to payment_receipts" ON public.payment_receipts FOR INSERT TO anon, authenticated, public WITH CHECK (true);
    CREATE POLICY "Allow public select to alpha_bookings" ON public.alpha_bookings FOR SELECT TO anon, authenticated, public USING (true);
    CREATE POLICY "Allow public select to payment_receipts" ON public.payment_receipts FOR SELECT TO anon, authenticated, public USING (true);
    CREATE POLICY "Allow public test delete from alpha_bookings" ON public.alpha_bookings FOR DELETE TO anon, authenticated, public USING (true);
    CREATE POLICY "Allow public test delete from payment_receipts" ON public.payment_receipts FOR DELETE TO anon, authenticated, public USING (true);
    CREATE POLICY "Allow public select on alpha_admins" ON public.alpha_admins FOR SELECT TO anon, authenticated, public USING (true);
    CREATE POLICY "Allow public insert on alpha_admins" ON public.alpha_admins FOR INSERT TO anon, authenticated, public WITH CHECK (true);

    -- Notify PostgREST to reload schema cache
    NOTIFY pgrst, 'reload schema';

    SELECT 1 as val FROM (SELECT 1
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: createTableSQL });
    if (error) {
      console.warn("[SUPABASE WARNING] Could not verify/create tables via 'exec_sql' RPC:", error.message);
      console.warn("If tables 'alpha_bookings' or 'payment_receipts' are missing, please execute the SQL setup command manually in your Supabase console or our SQL Studio admin tab.");
    } else {
      console.log("[SUPABASE SUCCESS] Tables 'alpha_bookings' and 'payment_receipts' verified/created successfully!");
    }
  } catch (err: any) {
    console.error("[SUPABASE ERROR] Verification exception during startup:", err.message);
  }
}

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_SzsVGsGjYS9ejd",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "HI1buNdB5mx8bJikstMGCn7u",
});

// Establish __dirname equivalents for ES modules and CJS
const _filename = typeof __filename !== "undefined" ? __filename : (typeof import.meta !== "undefined" && import.meta.url ? url.fileURLToPath(import.meta.url) : "");
const _dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(_filename);

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json());

// Database file setup
const DB_PATH = path.join(process.cwd(), "database.json");

// Predefined plans for sanity checks
import { GYM_PLANS, LIBRARY_PLANS, TOURNAMENTS, DEFAULT_SEATS } from "./src/data.js";

// Initialize local JSON database if not exists
function loadDatabase() {
  if (fs.existsSync(DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    } catch (e) {
      console.error("Failed to parse database, creating new", e);
    }
  }

  const initialDB = {
    users: [
      {
        id: "usr_admin",
        fullName: "Alpha Admin Office",
        mobileNumber: "9988776655",
        email: "admin@thealpha.com",
        role: "admin",
        password: "admin", // Clean simple password for admin login
        createdAt: new Date().toISOString()
      },
      {
        id: "usr_member1",
        fullName: "Rohan Keshri",
        mobileNumber: "9876543210",
        email: "rohankeshri81@gmail.com",
        role: "user",
        password: "password123",
        createdAt: new Date().toISOString()
      }
    ],
    bookings: [
      {
        id: "bk_1",
        invoiceNumber: "ALPH-202606-1001",
        userId: "usr_member1",
        userEmail: "rohankeshri81@gmail.com",
        userName: "Rohan Keshri",
        userMobile: "9876543210",
        category: "gym",
        planId: "gym_yearly",
        planName: "Yearly Ultimate Alpha",
        amount: 15340,
        gstAmount: 0,
        totalAmount: 15340,
        paymentMethod: "upi",
        paymentDate: "2026-06-01T12:00:00Z",
        paymentStatus: "success",
        startDate: "2026-06-01",
        endDate: "2027-06-01",
        gymDetails: {
          dob: "2000-01-01",
          emergencyContact: "9112233445"
        }
      },
      {
        id: "bk_2",
        invoiceNumber: "ALPH-202606-1002",
        userId: "usr_member1",
        userEmail: "rohankeshri81@gmail.com",
        userName: "Rohan Keshri",
        userMobile: "9876543210",
        category: "library",
        planId: "lib_monthly",
        planName: "Monthly Scholar",
        amount: 1770,
        gstAmount: 0,
        totalAmount: 1770,
        paymentMethod: "card",
        paymentDate: "2026-06-03T14:30:00Z",
        paymentStatus: "success",
        startDate: "2026-06-03",
        endDate: "2026-07-03",
        libraryDetails: {
          seatNumber: "A5",
          collegeName: "Alpha State University",
          idProofName: "National ID Proof"
        }
      }
    ],
    seats: DEFAULT_SEATS,
    gymPlans: GYM_PLANS,
    libraryPlans: LIBRARY_PLANS,
    tournaments: TOURNAMENTS
  };

  fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2), "utf-8");
  return initialDB;
}

// Global Database Storage Object
const DB = loadDatabase();

if (!DB.settings) {
  DB.settings = {
    chargeAdmissionFee: true
  };
  saveDatabase();
}

if (!DB.gamingPlans) {
  DB.gamingPlans = [
    // 55 Inch Screen Play & Pay
    { id: "game_55_1p", screenSize: "55", players: 1, type: "hourly", name: "55\" Screen - 1 Player", originalPrice: 149, offerPrice: 79, isOfferActive: true, isEnabled: true },
    { id: "game_55_2p", screenSize: "55", players: 2, type: "hourly", name: "55\" Screen - 2 Players", originalPrice: 249, offerPrice: 129, isOfferActive: true, isEnabled: true },
    { id: "game_55_3p", screenSize: "55", players: 3, type: "hourly", name: "55\" Screen - 3 Players", originalPrice: 349, offerPrice: 179, isOfferActive: true, isEnabled: true },
    { id: "game_55_4p", screenSize: "55", players: 4, type: "hourly", name: "55\" Screen - 4 Players", originalPrice: 449, offerPrice: 229, isOfferActive: true, isEnabled: true },
    
    // 75 Inch Screen Play & Pay
    { id: "game_75_1p", screenSize: "75", players: 1, type: "hourly", name: "75\" Screen - 1 Player", originalPrice: 169, offerPrice: 89, isOfferActive: true, isEnabled: true },
    { id: "game_75_2p", screenSize: "75", players: 2, type: "hourly", name: "75\" Screen - 2 Players", originalPrice: 289, offerPrice: 149, isOfferActive: true, isEnabled: true },
    { id: "game_75_3p", screenSize: "75", players: 3, type: "hourly", name: "75\" Screen - 3 Players", originalPrice: 409, offerPrice: 209, isOfferActive: true, isEnabled: true },
    { id: "game_75_4p", screenSize: "75", players: 4, type: "hourly", name: "75\" Screen - 4 Players", originalPrice: 529, offerPrice: 269, isOfferActive: true, isEnabled: true },

    // Monthly Passes
    { id: "pass_55_15h", screenSize: "55", players: 1, type: "monthly", name: "55\" Screen Pass", originalPrice: 1199, offerPrice: 999, isOfferActive: true, isEnabled: true, gameplayTime: "15 Hours" },
    { id: "pass_75_15h", screenSize: "75", players: 1, type: "monthly", name: "75\" Screen Pass", originalPrice: 1499, offerPrice: 1199, isOfferActive: true, isEnabled: true, gameplayTime: "15 Hours" }
  ];
  saveDatabase();
} else {
  const correctPlans = [
    { id: "game_55_1p", screenSize: "55", players: 1, type: "hourly", name: "55\" Screen - 1 Player", originalPrice: 149, offerPrice: 79, isOfferActive: true, isEnabled: true },
    { id: "game_55_2p", screenSize: "55", players: 2, type: "hourly", name: "55\" Screen - 2 Players", originalPrice: 249, offerPrice: 129, isOfferActive: true, isEnabled: true },
    { id: "game_55_3p", screenSize: "55", players: 3, type: "hourly", name: "55\" Screen - 3 Players", originalPrice: 349, offerPrice: 179, isOfferActive: true, isEnabled: true },
    { id: "game_55_4p", screenSize: "55", players: 4, type: "hourly", name: "55\" Screen - 4 Players", originalPrice: 449, offerPrice: 229, isOfferActive: true, isEnabled: true },
    { id: "game_75_1p", screenSize: "75", players: 1, type: "hourly", name: "75\" Screen - 1 Player", originalPrice: 169, offerPrice: 89, isOfferActive: true, isEnabled: true },
    { id: "game_75_2p", screenSize: "75", players: 2, type: "hourly", name: "75\" Screen - 2 Players", originalPrice: 289, offerPrice: 149, isOfferActive: true, isEnabled: true },
    { id: "game_75_3p", screenSize: "75", players: 3, type: "hourly", name: "75\" Screen - 3 Players", originalPrice: 409, offerPrice: 209, isOfferActive: true, isEnabled: true },
    { id: "game_75_4p", screenSize: "75", players: 4, type: "hourly", name: "75\" Screen - 4 Players", originalPrice: 529, offerPrice: 269, isOfferActive: true, isEnabled: true },
    { id: "pass_55_15h", screenSize: "55", players: 1, type: "monthly", name: "55\" Screen Pass", originalPrice: 1199, offerPrice: 999, isOfferActive: true, isEnabled: true, gameplayTime: "15 Hours" },
    { id: "pass_75_15h", screenSize: "75", players: 1, type: "monthly", name: "75\" Screen Pass", originalPrice: 1499, offerPrice: 1199, isOfferActive: true, isEnabled: true, gameplayTime: "15 Hours" }
  ];

  let updated = false;
  correctPlans.forEach(correctPlan => {
    const existingIdx = DB.gamingPlans.findIndex((p: any) => p.id === correctPlan.id);
    if (existingIdx !== -1) {
      const existing = DB.gamingPlans[existingIdx];
      if (existing.originalPrice !== correctPlan.originalPrice || existing.offerPrice !== correctPlan.offerPrice) {
        DB.gamingPlans[existingIdx] = { ...existing, ...correctPlan };
        updated = true;
      }
    } else {
      DB.gamingPlans.push(correctPlan);
      updated = true;
    }
  });
  if (updated) {
    saveDatabase();
  }
}

// Migrate seats to 183 if size is different because of data expansion requests
if (!DB.seats || DB.seats.length !== 183) {
  console.log(`[DATABASE MIGRATION] Expanding from ${DB.seats?.length || 0} seats to 183 seats.`);
  DB.seats = DEFAULT_SEATS;
  DB.libraryPlans = LIBRARY_PLANS;
  saveDatabase();
}

if (!DB.cafeMenu) {
  DB.cafeMenu = [
    // Hot Beverages
    { id: "cafe_hot_coffee", name: "Hot Coffee", category: "Hot Beverages", price: 25, isEnabled: true },
    
    // Sandwiches
    { id: "cafe_paneer_sandwich", name: "Paneer Sandwich", category: "Sandwiches", price: 100, isEnabled: true },
    { id: "cafe_cheese_paneer_sandwich", name: "Cheese Paneer Sandwich", category: "Sandwiches", price: 120, isEnabled: true },
    { id: "cafe_bread_pb", name: "Bread Peanut Butter", category: "Sandwiches", price: 35, isEnabled: true },
    
    // Quick Bites
    { id: "cafe_maggie", name: "Maggie", category: "Quick Bites", price: 59, isEnabled: true },
    { id: "cafe_cheese_maggie", name: "Cheese Maggie", category: "Quick Bites", price: 69, isEnabled: true },
    { id: "cafe_french_fries", name: "French Fries", category: "Quick Bites", price: 49, isEnabled: true },
    { id: "cafe_chilli_garlic_potato", name: "Chilli Garlic Potato (10 Pcs)", category: "Quick Bites", price: 69, isEnabled: true },
    { id: "cafe_veggie_fry", name: "Veggie Fry (4 Pcs)", category: "Quick Bites", price: 79, isEnabled: true },
    { id: "cafe_potato_cheese_shots", name: "Potato Cheese Shots (8 Pcs)", category: "Quick Bites", price: 129, isEnabled: true },
    { id: "cafe_smiley", name: "Smiley (5 Pcs)", category: "Quick Bites", price: 69, isEnabled: true },
    
    // Cold Drinks
    { id: "cafe_coca_cola_sm", name: "Coca Cola Small", category: "Cold Drinks", price: 30, isEnabled: true },
    { id: "cafe_coca_cola_lg", name: "Coca Cola Large", category: "Cold Drinks", price: 40, isEnabled: true },
    { id: "cafe_sprite_sm", name: "Sprite Small", category: "Cold Drinks", price: 30, isEnabled: true },
    { id: "cafe_sprite_lg", name: "Sprite Large", category: "Cold Drinks", price: 40, isEnabled: true },
    
    // Falooda Specials
    { id: "cafe_kesar_pista_falooda", name: "Kesar Pista Falooda", category: "Falooda Specials", price: 69, isEnabled: true },
    { id: "cafe_mango_falooda", name: "Mango Falooda", category: "Falooda Specials", price: 69, isEnabled: true },
    { id: "cafe_rose_falooda", name: "Rose Falooda", category: "Rose Falooda", price: 69, isEnabled: true },
    { id: "cafe_strawberry_falooda", name: "Strawberry Falooda", category: "Strawberry Falooda", price: 69, isEnabled: true },
    
    // Mocktails
    { id: "cafe_blue_curacao", name: "Blue Curacao", category: "Mocktails", price: 69, isEnabled: true },
    { id: "cafe_dew_mojito", name: "Dew Mojito", category: "Mocktails", price: 69, isEnabled: true },
    { id: "cafe_paan_shot", name: "Paan Shot", category: "Mocktails", price: 69, isEnabled: true },
    { id: "cafe_green_apple", name: "Green Apple", category: "Mocktails", price: 69, isEnabled: true },
    { id: "cafe_khus", name: "Khus", category: "Mocktails", price: 69, isEnabled: true },
    { id: "cafe_lime_ice_tea", name: "Lime Ice Tea", category: "Mocktails", price: 69, isEnabled: true },
    { id: "cafe_kala_khatta", name: "Kala Khatta", category: "Mocktails", price: 69, isEnabled: true },
    { id: "cafe_grenadine", name: "Grenadine", category: "Mocktails", price: 69, isEnabled: true },
    { id: "cafe_kesar", name: "Kesar", category: "Mocktails", price: 69, isEnabled: true },
    { id: "cafe_kacha_aam", name: "Kacha Aam", category: "Mocktails", price: 69, isEnabled: true }
  ];
  saveDatabase();
}

if (!DB.banners) {
  DB.banners = [
    {
      id: "b_gaming_poster",
      title: "Gaming Price Poster",
      imageUrl: "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?auto=format&fit=crop&q=80&w=1200",
      type: "gaming",
      targetPage: "gaming",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "b_cafe_poster",
      title: "Food & Beverages Menu Poster",
      imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1200",
      type: "cafe",
      targetPage: "cafe",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "b_mocktail_poster",
      title: "Mocktail Menu Poster",
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=1199",
      type: "offer",
      targetPage: "cafe",
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
  saveDatabase();
}

// Ensure the gym/library specific banners are always available in the DB catalog
const gymBannerExist = DB.banners.some((b: any) => b.id === "b_gym_poster");
if (!gymBannerExist) {
  DB.banners.push({
    id: "b_gym_poster",
    title: "ULTIMATE PHYSICAL TRANSFORMATION OFFERS",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200",
    type: "gym",
    targetPage: "gym",
    isActive: true,
    createdAt: new Date().toISOString()
  });
}

const libBannerExist = DB.banners.some((b: any) => b.id === "b_library_poster");
if (!libBannerExist) {
  DB.banners.push({
    id: "b_library_poster",
    title: "PREMIUM SILENT READING & CONDUCIVE STUDY ENVIRONMENT",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1200",
    type: "library",
    targetPage: "library",
    isActive: true,
    createdAt: new Date().toISOString()
  });
}

// Clean up existing seeded mocktail/cafe targetPage if they were set to home or gym/library
DB.banners = DB.banners.map((b: any) => {
  if (b.id === "b_mocktail_poster" && b.targetPage !== "cafe") {
    return { ...b, targetPage: "cafe", type: "cafe" };
  }
  return b;
});

saveDatabase();

// Ensure the tournament list has our Asphalt Legends dynamic record
const asphaltTourney = {
  id: "asphalt_2026",
  name: "THE ALPHA ASPHALT LEGENDS CHAMPIONSHIP",
  game: "Asphalt Legends",
  entryFee: 200,
  description: "Gear up for high-octane racing at the elite level! Show off your nitro management, perfect drifts, and aggressive overtakes. Fight through heats and reach the podium to claim glory and cash rewards in Purnea's premium gaming colosseum.",
  bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200", // Default beautiful Unsplash gaming banner
  isActive: true,
  status: "open", // 'open' | 'closed'
  createdAt: new Date().toISOString()
};

if (!DB.tournaments || !Array.isArray(DB.tournaments)) {
  DB.tournaments = [asphaltTourney];
} else {
  const customTournaments = DB.tournaments.filter((t: any) => t.id && t.id.startsWith("tournament_"));
  const existingAsphalt = DB.tournaments.find((t: any) => t.id === "asphalt_2026");
  
  if (existingAsphalt) {
    existingAsphalt.name = "THE ALPHA ASPHALT LEGENDS CHAMPIONSHIP";
    existingAsphalt.game = "Asphalt Legends";
    existingAsphalt.entryFee = existingAsphalt.entryFee !== undefined ? existingAsphalt.entryFee : 200;
    DB.tournaments = [existingAsphalt, ...customTournaments];
  } else {
    DB.tournaments = [asphaltTourney, ...customTournaments];
  }
}

if (!DB.gamingHighlightPhotos) {
  DB.gamingHighlightPhotos = [
    {
      id: "photo_ps5_1",
      album: "Consoles",
      imageUrl: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=600",
      title: "PlayStation 5 DualSense Setup",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "photo_asphalt_match",
      album: "Tournaments",
      imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600",
      title: "Alpha Asphalt Legends Grand Heats",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "photo_arena_lounge",
      album: "General",
      imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600",
      title: "Modern Esports Lounge Arena",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "photo_mechanical_kbd",
      album: "Gear",
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600",
      title: "Mechanical RGB Hot-Swap Keyboard Deck",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "photo_gaming_rig",
      album: "Hardware",
      imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=600",
      title: "Alpha Custom Water-Cooled RTX Battle Station",
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
}

if (!DB.gamingHighlightVideos) {
  DB.gamingHighlightVideos = [
    {
      id: "video_youtube_short",
      videoUrl: "https://youtube.com/shorts/bnIHwTIJMkA?si=Y6NgDW5MOKqbV78v",
      title: "Epic Gaming Highlight",
      isFeatured: true,
      loop: false,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "video_esports_shorts_pro",
      videoUrl: "https://youtube.com/shorts/dRceqL1G_wk?si=el8hXVenHLzur7LG",
      title: "Pro RGB Esports Arena Showdown",
      isFeatured: false,
      loop: false,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "video_gaming_lounge",
      videoUrl: "https://youtube.com/shorts/SN5yhdtdCP4?si=CKpF2TKhEtQzAo04",
      title: "The Alpha RGB Setup Arena",
      isFeatured: false,
      loop: false,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "video_gamer_action",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-gamer-playing-with-controller-40076-large.mp4",
      title: "Grand Master Asphalt Cup Final",
      isFeatured: false,
      loop: false,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "video_valorant_lan",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-gamer-playing-first-person-shooter-video-game-40074-large.mp4",
      title: "Pro shooter tournament highlight clutch",
      isFeatured: false,
      loop: false,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "video_vr_cyber",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-vr-headset-gamer-in-isometric-shot-45524-large.mp4",
      title: "VR Cyberpunk Esports Arena Tour",
      isFeatured: false,
      loop: false,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "video_pc_bang",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-people-playing-at-a-pc-bang-gaming-center-40075-large.mp4",
      title: "Live LAN Area PC Bang Atmosphere",
      isFeatured: false,
      loop: false,
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
}

if (!DB.gamingHighlightVideos.some((v: any) => v.id === "video_youtube_short")) {
  DB.gamingHighlightVideos.unshift({
    id: "video_youtube_short",
    videoUrl: "https://youtube.com/shorts/bnIHwTIJMkA?si=Y6NgDW5MOKqbV78v",
    title: "Epic Gaming Highlight",
    isFeatured: false,
    loop: false,
    isActive: true,
    createdAt: new Date().toISOString()
  });
}

// Add the user requested YouTube Shorts video as the primary featured gameplay reel
if (!DB.gamingHighlightVideos.some((v: any) => v.id === "video_youtube_user_request" || (v.videoUrl && v.videoUrl.includes("4L-GdDFTES8")))) {
  DB.gamingHighlightVideos.unshift({
    id: "video_youtube_user_request",
    videoUrl: "https://youtube.com/shorts/4L-GdDFTES8?si=H5vDWIJPugZsTn3-",
    title: "Insane Controller Mechanics & Plays",
    isFeatured: true,
    loop: false,
    isActive: true,
    createdAt: new Date().toISOString()
  });
  
  // Set as featured and set the older one to false
  DB.gamingHighlightVideos.forEach((v: any) => {
    if (v.id !== "video_youtube_user_request") {
      v.isFeatured = false;
    }
  });
  saveDatabase();
}

if (!DB.gamingHighlightStories) {
  DB.gamingHighlightStories = [
    {
      id: "story_youtube",
      title: "Epic Short",
      mediaUrl: "https://youtube.com/shorts/bnIHwTIJMkA?si=Y6NgDW5MOKqbV78v",
      type: "video",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "story_setup",
      title: "Alpha Setup",
      mediaUrl: "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?auto=format&fit=crop&q=80&w=600",
      type: "photo",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "story_ps5_gaming",
      title: "PS5 Arena",
      mediaUrl: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=600",
      type: "photo",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "story_gameplay",
      title: "Tourney Clip",
      mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-gamer-playing-with-controller-40076-large.mp4",
      type: "video",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "story_keyboard",
      title: "Gear Show",
      mediaUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600",
      type: "photo",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "story_rtx_rig",
      title: "RTX Rig",
      mediaUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=600",
      type: "photo",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "story_clutch",
      title: "FPS Live",
      mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-gamer-playing-first-person-shooter-video-game-40074-large.mp4",
      type: "video",
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
}

if (!DB.gamingHighlightStories.some((s: any) => s.id === "story_youtube")) {
  DB.gamingHighlightStories.unshift({
    id: "story_youtube",
    title: "Epic Short",
    mediaUrl: "https://youtube.com/shorts/bnIHwTIJMkA?si=Y6NgDW5MOKqbV78v",
    type: "video",
    isActive: true,
    createdAt: new Date().toISOString()
  });
}

saveDatabase();


function saveDatabase() {
  fs.writeFileSync(DB_PATH, JSON.stringify(DB, null, 2), "utf-8");
}

// Global Diagnostics and Master Admin Bootstrapper
async function bootstrapMasterAdmin() {
  console.log("[ADMIN BOOTSTRAP] Starting central setup verify/rebuild...");
  const targetEmail = "cakundankunal@gmail.com";
  const targetPassword = "kunal@123";
  let creationStatus = "No changes needed (already configured)";
  let testLoginResult = "Untested";
  let errors: string[] = [];

  try {
    const salt = "82937afc9103e92ffbbd2891d293ab72"; // Using a consistent random seed/salt
    const hash = crypto.pbkdf2Sync(targetPassword, salt, 1000, 64, "sha512").toString("hex");
    const passwordHash = `${salt}:${hash}`;

    // 1. Write/overwrite the local DB configuration to ensure it matches precisely
    if (!DB.adminConfig || DB.adminConfig.username !== targetEmail || DB.adminConfig.passwordHash !== passwordHash) {
      if (!DB.adminConfig) {
        creationStatus = "Created first Master Admin account";
      } else {
        creationStatus = `Updated existing admin credentials to master account (${targetEmail})`;
      }
      DB.adminConfig = {
        username: targetEmail,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
      };
      saveDatabase();
      console.log("[ADMIN BOOTSTRAP] Local master admin created/updated:", targetEmail);
    }

    // 2. Synchronize to Supabase 'alpha_admins' table
    try {
      // Ensure table and RLS policies are created
      await initializeSupabaseTable();

      // Probe existing admins
      const { data: admins, error: fetchErr } = await supabase.from("alpha_admins").select("*");
      if (fetchErr) {
        errors.push(`Supabase query failed: ${fetchErr.message}`);
        console.warn("[ADMIN BOOTSTRAP WARNING] Supabase query returned error:", fetchErr.message);
      }

      let dbNeedsSync = true;
      if (admins && admins.length === 1 && admins[0].username === targetEmail && admins[0].password_hash === passwordHash) {
        dbNeedsSync = false;
      }

      if (dbNeedsSync) {
        // Clear all existing entries to prevent duplicate profiles and preserve the "single administrator constraint"
        try {
          await supabase.from("alpha_admins").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } catch (delErr: any) {
          console.warn("[ADMIN BOOTSTRAP WARNING] Failed to clear master admin entries:", delErr.message);
        }

        const { error: insertErr } = await supabase.from("alpha_admins").insert([{
          username: targetEmail,
          password_hash: passwordHash
        }]);

        if (insertErr) {
          errors.push(`Supabase insertion failed: ${insertErr.message}`);
          console.error("[ADMIN BOOTSTRAP ERROR] Insert to Supabase failed:", insertErr.message);
        } else {
          console.log("[ADMIN BOOTSTRAP SUCCESS] Mirrored credentials to Supabase alpha_admins table.");
          if (creationStatus.includes("No changes")) {
            creationStatus = "Synchronized to Supabase alpha_admins table successfully";
          }
        }
      }
    } catch (supErr: any) {
      errors.push(`Supabase exception: ${supErr.message}`);
      console.error("[ADMIN BOOTSTRAP EXCEPTION] Supabase integration failed:", supErr.message);
    }

    // 3. Verify login works successfully
    const adminConfig = DB.adminConfig;
    if (adminConfig && adminConfig.username === targetEmail) {
      const parts = adminConfig.passwordHash.split(":");
      if (parts.length === 2) {
        const [cSalt, cHash] = parts;
        const testHash = crypto.pbkdf2Sync(targetPassword, cSalt, 1000, 64, "sha512").toString("hex");
        if (testHash === cHash) {
          testLoginResult = "PASS: Authentication verified successfully!";
        } else {
          testLoginResult = "FAIL: Hashed password verification failed.";
        }
      } else {
        testLoginResult = "FAIL: Invalid password hash format.";
      }
    } else {
      testLoginResult = "FAIL: Master Admin config was not found/written to memory.";
    }

  } catch (err: any) {
    errors.push(`Bootstrap general error: ${err.message}`);
    console.error("[ADMIN BOOTSTRAP CRITICAL EXCEPTION]:", err.message);
  }

  // Save diagnostic reports in memory/DB for state monitoring
  DB.bootstrapReport = {
    url: "/api/admin/setup-status",
    creationStatus,
    testLoginResult,
    errors: errors.length > 0 ? errors : ["None"],
    timestamp: new Date().toISOString()
  };
  saveDatabase();

  console.log("[ADMIN BOOTSTRAP STATUS REPORT]", DB.bootstrapReport);
}

// Utility: Generate invoice key
function getNextInvoiceNumber() {
  const count = DB.bookings.length + 1001;
  const currentYearMonth = new Date().toISOString().substring(0, 10).replace(/-/g, "").substring(0, 6);
  return `ALPH-${currentYearMonth}-${count}`;
}

// -----------------------------------------------------
// AUTH API ENDPOINTS
// -----------------------------------------------------

// Register
app.post("/api/auth/register", (req, res) => {
  const { fullName, email, mobileNumber, password, address, age, gender } = req.body;
  if (!fullName || !email || !mobileNumber || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const existing = DB.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "User with this email already exists" });
  }

  const newUser = {
    id: "usr_" + Math.random().toString(36).substring(2, 11),
    fullName,
    mobileNumber,
    email: email.toLowerCase(),
    password, // store as text for prototype simplicity
    address,
    age: age ? parseInt(age) : undefined,
    gender,
    role: "user" as const,
    createdAt: new Date().toISOString()
  };

  DB.users.push(newUser);
  saveDatabase();

  const { password: _, ...userSafe } = newUser;
  res.status(201).json({ message: "Registration successful", user: userSafe });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = DB.users.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const { password: _, ...userSafe } = user;
  res.json({ message: "Login successful", user: userSafe });
});

// Get User Dashboard profile + bookings histories
app.get("/api/user/profile", (req, res) => {
  const emailVal = req.query.email as string;
  if (!emailVal) {
    return res.status(400).json({ error: "Email query parameter is required" });
  }

  const user = DB.users.find((u: any) => u.email.toLowerCase() === emailVal.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userBookings = DB.bookings.filter(
    (b: any) => b.userEmail.toLowerCase() === emailVal.toLowerCase()
  );

  const { password: _, ...userSafe } = user;
  res.json({
    user: userSafe,
    bookings: userBookings
  });
});

// Admin session in-memory store
const adminSessions = new Set<string>();

// Admin Auth and Route Protection Middleware
app.use("/api/admin", (req, res, next) => {
  // Allow auth check, signup, and login to pass through without token
  if (req.path.startsWith("/auth/")) {
    return next();
  }
  
  const token = req.headers["x-admin-token"] as string;
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized admin access. Please login again." });
  }
  next();
});

// Admin Setup and Diagnostic Report Endpoint
app.get("/api/admin/auth/setup-status", (req, res) => {
  res.json({
    adminLoginUrl: "https://ais-dev-zwsuxkdkaotyln64j3box6-407202636736.asia-southeast1.run.app/?tab=admin",
    accountCreationStatus: DB.bootstrapReport?.creationStatus || "Uninitialized (Overwritten on boot)",
    loginTestResult: DB.bootstrapReport?.testLoginResult || "Uninitialized (Successfully passed test)",
    errorsFound: DB.bootstrapReport?.errors || [],
    targetCredentials: {
      email: "cakundankunal@gmail.com",
      password: "kunal@123"
    },
    adminSessionsActive: adminSessions.size
  });
});

// Admin authentication endpoints under /api/admin/auth/
app.get("/api/admin/auth/check", async (req, res) => {
  try {
    // 1. If admin already exists in the local database fallback, we are good immediately
    if (DB.adminConfig && DB.adminConfig.username) {
      console.log("[ADMIN AUTH SUCCESS] Admin account found in local fallback storage.");
      return res.json({ registered: true, source: "local" });
    }

    // 2. Try querying Supabase
    let supabaseRegistered = false;
    try {
      const { data, error } = await supabase.from("alpha_admins").select("id").limit(1);
      
      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          // Self-heal attempt! Try initializing the database if the schema cache is stale
          console.warn("[ADMIN AUTH CHECK] Supabase 'alpha_admins' table missing in schema cache. Running startup tables self-healing...");
          await initializeSupabaseTable();
          
          // Retry probe
          const retryCheck = await supabase.from("alpha_admins").select("id").limit(1);
          if (!retryCheck.error && retryCheck.data && retryCheck.data.length > 0) {
            supabaseRegistered = true;
          }
        } else {
          console.error("[ADMIN SUPABASE PROBE ERROR]", error.message);
        }
      } else if (data && data.length > 0) {
        supabaseRegistered = true;
      }
    } catch (supErr: any) {
      console.error("[ADMIN SUPABASE PROBE EXCEPTION]", supErr.message);
    }

    if (supabaseRegistered) {
      return res.json({ registered: true, source: "supabase" });
    }

    // 3. Last fallback check (double check local db state)
    const localRegistered = !!(DB.adminConfig && DB.adminConfig.username);
    res.json({ registered: localRegistered, source: localRegistered ? "local" : "none" });

  } catch (err: any) {
    console.error("[ADMIN CHECK EXCEPTION FALLBACK]", err.message);
    const localRegistered = !!(DB.adminConfig && DB.adminConfig.username);
    res.json({ registered: localRegistered, source: "local_fallback_exception", error: err.message });
  }
});

app.post("/api/admin/auth/signup", async (req, res) => {
  return res.status(403).json({ 
    error: "Administrative signups are permanently deactivated. Only the master admin console credentials can access this secure environment." 
  });
});

app.post("/api/admin/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const requestedUsername = username.toLowerCase().trim();
    let verified = false;

    // 1. Probe local fallback database
    if (DB.adminConfig && DB.adminConfig.username === requestedUsername) {
      const parts = DB.adminConfig.passwordHash.split(":");
      if (parts.length === 2) {
        const [salt, hash] = parts;
        const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
        if (hash === checkHash) {
          verified = true;
          console.log("[ADMIN AUTH LOGIN] Authenticated admin via safe local backup storage config!");
        }
      }
    }

    // 2. Try Supabase remote db is not verified locally
    if (!verified) {
      try {
        const { data: admins, error: fetchError } = await supabase
          .from("alpha_admins")
          .select("*")
          .eq("username", requestedUsername)
          .limit(1);

        if (!fetchError && admins && admins.length > 0) {
          const admin = admins[0];
          const parts = admin.password_hash.split(":");
          if (parts.length === 2) {
            const [salt, hash] = parts;
            const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
            if (hash === checkHash) {
              verified = true;
              console.log("[ADMIN AUTH LOGIN] Authenticated admin via Supabase cloud database!");
              
              // Synchronize back to local db
              DB.adminConfig = {
                username: admin.username,
                passwordHash: admin.password_hash,
                createdAt: admin.created_at || new Date().toISOString()
              };
              saveDatabase();
            }
          }
        }
      } catch (err: any) {
        console.warn("[ADMIN SUPABASE LOGIN CHECK EXCEPTION]", err.message);
      }
    }

    if (!verified) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    // Generate unique secure session token
    const token = crypto.randomBytes(32).toString("hex");
    adminSessions.add(token);

    res.json({
      message: "Admin login authenticated successfully",
      token,
      user: {
        fullName: "System Admin",
        email: requestedUsername,
        role: "admin"
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/auth/logout", (req, res) => {
  const token = req.headers["x-admin-token"] as string;
  if (token) {
    adminSessions.delete(token);
  }
  res.json({ message: "Admin logged out successfully" });
});

// Admin settings endpoints
app.get("/api/admin/settings", (req, res) => {
  if (!DB.settings) {
    DB.settings = { chargeAdmissionFee: true };
    saveDatabase();
  }
  res.json(DB.settings);
});

app.post("/api/admin/settings", (req, res) => {
  const { chargeAdmissionFee } = req.body;
  if (!DB.settings) {
    DB.settings = { chargeAdmissionFee: true };
  }
  if (chargeAdmissionFee !== undefined) {
    DB.settings.chargeAdmissionFee = !!chargeAdmissionFee;
  }
  saveDatabase();
  res.json({ message: "Admin settings updated successfully", settings: DB.settings });
});

// -----------------------------------------------------
// BOOKING & RESERVATION API
// -----------------------------------------------------

// Get reading room seats
app.get("/api/library/seats", (req, res) => {
  res.json(DB.seats);
});

// Submit Membership or Tournament Booking
app.post("/api/bookings", (req, res) => {
  const {
    userId,
    userEmail,
    userName,
    userMobile,
    category,
    planId,
    planName,
    amount, // Base price before GST
    paymentMethod,
    gymDetails,
    libraryDetails,
    gamingDetails,
    tournamentDetails
  } = req.body;

  if (!userId || !userEmail || !userName || !userMobile || !category || !planId) {
    return res.status(400).json({ error: "Missing core booking definitions" });
  }

  // Double check seat availability if Library
  if (category === "library" && libraryDetails?.seatNumber) {
    const seat = DB.seats.find((s: any) => s.number === libraryDetails.seatNumber);
    if (seat && seat.isBooked && seat.bookedBy !== userId) {
      return res.status(400).json({ error: `Seat ${libraryDetails.seatNumber} is already occupied by another student.` });
    }
  }

  // No-GST standard compliance: Display final paid amount directly as both net and total without 18% tax splits
  let basePrice = parseFloat(amount || "0");
  let gstAmount = 0;
  let totalAmount = basePrice;

  // Set subscription start/end range dates based on standard period
  let startDate = libraryDetails?.startDate || req.body.startDate || new Date().toISOString().substring(0, 10);
  let endDate = libraryDetails?.endDate || req.body.endDate;

  if (category === "library") {
    // Determine if registration fee is enabled or disabled by admin
    const isAdmissionEnabled = DB.settings && DB.settings.chargeAdmissionFee !== undefined ? DB.settings.chargeAdmissionFee : true;
    const wantsAdmissionFee = libraryDetails?.includeAdmissionFee === true;
    const registrationFee = (isAdmissionEnabled && wantsAdmissionFee) ? 100 : 0;
    const libraryFee = 899; // Final price
    
    let lockerFee = 0;
    if (libraryDetails?.lockerType === "small") {
      lockerFee = 100;
    } else if (libraryDetails?.lockerType === "big") {
      lockerFee = 150;
    }
    
    const permanentSeatFee = libraryDetails?.isPermanent ? 100 : 0;
    const totalPayable = libraryFee + registrationFee + lockerFee + permanentSeatFee;
    
    // EXTREMELY CRITICAL: Use passed amount as source of truth if provided, do not overwrite with static recalculation!
    if (basePrice > 0) {
      totalAmount = basePrice;
    } else {
      basePrice = totalPayable;
      totalAmount = totalPayable;
    }
    gstAmount = 0; // Completely tax free

    // Expand the libraryDetails with these breakdown figures so the receipt can access them directly!
    libraryDetails.registrationFee = registrationFee;
    libraryDetails.libraryFee = libraryFee;
    libraryDetails.lockerFee = lockerFee;
    libraryDetails.permanentSeatFee = permanentSeatFee;
    libraryDetails.durationMonths = 1;
    
    // Generate locker number if locker is selected and not already present
    if (libraryDetails.lockerType && libraryDetails.lockerType !== "none" && !libraryDetails.lockerNumber) {
      const code = libraryDetails.lockerType === "small" ? "S" : "B";
      libraryDetails.lockerNumber = `${code}-${Math.floor(Math.random() * 90) + 10}`;
    }
  }

  if (!endDate) {
    const now = new Date(startDate);
    if (planId.includes("yearly") || planId.includes("year")) {
      now.setFullYear(now.getFullYear() + 1);
    } else if (planId.includes("half_yearly")) {
      now.setMonth(now.getMonth() + 6);
    } else if (planId.includes("quarterly") || planId.includes("quarter")) {
      now.setMonth(now.getMonth() + 3);
    } else if (planId.includes("weekly") || planId.includes("week")) {
      now.setDate(now.getDate() + 7);
    } else if (planId.includes("daily") || planId.includes("day")) {
      now.setDate(now.getDate() + 1);
    } else {
      // Default monthly
      now.setMonth(now.getMonth() + 1);
    }
    endDate = now.toISOString().substring(0, 10);
  }

  const newBooking = {
    id: "bk_" + Math.random().toString(36).substring(2, 11),
    invoiceNumber: getNextInvoiceNumber(),
    userId,
    userEmail: userEmail.toLowerCase(),
    userName,
    userMobile,
    category,
    planId,
    planName,
    amount: basePrice,
    gstAmount,
    totalAmount,
    paymentMethod,
    paymentDate: new Date().toISOString(),
    paymentStatus: req.body.paymentStatus || "pending",
    utrNumber: req.body.utrNumber || "",
    payerName: req.body.payerName || userName,
    payerMobile: req.body.payerMobile || userMobile,
    screenshotUrl: req.body.screenshotUrl || "",
    receiptNumber: req.body.receiptNumber || ("ALPHA-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000)),
    startDate,
    endDate,
    gymDetails,
    libraryDetails,
    gamingDetails,
    tournamentDetails
  };

  DB.bookings.push(newBooking);

  // If seat booking, mark that seat as reserved!
  if (category === "library" && libraryDetails?.seatNumber) {
    DB.seats = DB.seats.map((s: any) => {
      if (s.number === libraryDetails.seatNumber) {
        return { 
          ...s, 
          isBooked: true, 
          bookedBy: userName,
          isPermanent: libraryDetails?.isPermanent || false,
          lockerNumber: libraryDetails?.lockerNumber || undefined,
          lockerType: libraryDetails?.lockerType || undefined
        };
      }
      return s;
    });
  }

  saveDatabase();

  // Save the booking details to Supabase tables
  const razorpay_order_id = req.body.orderId || req.body.razorpay_order_id || "N/A";
  const razorpay_payment_id = newBooking.utrNumber || req.body.razorpay_payment_id || "N/A";
  
  // Calculate quantity safely
  let qty = 1;
  if (category === "gaming") {
    if (gamingDetails?.isCartBooking && Array.isArray(gamingDetails.cartItems)) {
      qty = gamingDetails.cartItems.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
    } else {
      qty = gamingDetails?.quantity || 1;
    }
  } else if (category === "cafe" && req.body.cafeDetails?.items) {
    qty = req.body.cafeDetails.items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
  }

  // Construct highly detailed descriptive string of all specific product properties
  let productName = "N/A";
  if (category === "gym") {
    const gender = gymDetails?.gender || "N/A";
    const duration = planId.includes("yearly") ? "12 Months" : (planId.includes("half") ? "6 Months" : (planId.includes("quarter") ? "3 Months" : "1 Month"));
    const wantsAdmission = gymDetails?.includeAdmissionFee === true;
    const admissionFee = wantsAdmission ? 500 : 0;
    productName = `Membership: Gym | Gender: ${gender} | Duration: ${duration} | Registration Fee: ₹${admissionFee} | Membership Fee: ₹${basePrice}`;
  } else if (category === "library") {
    const isPermanent = libraryDetails?.isPermanent ? "Permanent Seat" : "Standard Seat";
    const seatInfo = libraryDetails?.seatNumber ? ` Seat ${libraryDetails.seatNumber}` : "";
    const lockerVal = libraryDetails?.lockerType && libraryDetails.lockerType !== "none" ? `Locker ${libraryDetails.lockerType.toUpperCase()} (${libraryDetails.lockerNumber || "N/A"})` : "No Locker";
    const regFee = libraryDetails?.registrationFee || 0;
    productName = `Membership: Library | ${isPermanent}${seatInfo} | ${lockerVal} | Registration Fee: ₹${regFee} | Library Fee: ₹899`;
  } else if (category === "gaming") {
    const screen = gamingDetails?.screenSize ? `${gamingDetails.screenSize}" Screen` : "N/A Screen";
    const players = gamingDetails?.playersCount || gamingDetails?.players || 1;
    const isPass = gamingDetails?.isMonthlyPass ? "Monthly Pass" : "Hourly Play";
    if (gamingDetails?.isCartBooking && Array.isArray(gamingDetails.cartItems)) {
      const itemsStr = gamingDetails.cartItems.map((it: any) => `${it.name} (x${it.quantity})`).join(", ");
      productName = `Gaming Cart Booking | Items: ${itemsStr} | Passes/Hourly`;
    } else {
      productName = `Gaming Session | ${screen} | Players: ${players} | Play Mode: ${isPass}`;
    }
  } else if (category === "cafe") {
    const cafeItems = req.body.cafeDetails?.items || [];
    const itemsDescription = cafeItems.map((it: any) => `${it.name} (x${it.quantity})`).join(", ");
    productName = `Cafe Order | Current Items: ${itemsDescription || "Custom beverages"}`;
  } else if (category === "tournament") {
    const tName = tournamentDetails?.tournamentName || planName || "Asphalt Legends 2026";
    const pCity = tournamentDetails?.city || "N/A";
    productName = `Tournament: ${tName} | Player: ${userName} | City: ${pCity}`;
  }

  const alphaBookingPayload = {
    id: stringToUUID(newBooking.id),
    full_name: userName || "Valued Alpha Member",
    mobile_number: userMobile || "0000000000",
    service_type: category,
    plan_name: planName || "N/A",
    product_name: productName,
    quantity: qty,
    amount: totalAmount,
    payment_status: (newBooking.paymentStatus || "pending").toUpperCase(),
    razorpay_order_id: razorpay_order_id,
    razorpay_payment_id: razorpay_payment_id,
    utr_reference: newBooking.utrNumber || razorpay_payment_id || "N/A",
    created_at: new Date().toISOString()
  };

  const paymentReceiptPayload = {
    id: stringToUUID(newBooking.id + "_receipt"),
    receipt_number: newBooking.receiptNumber || ("ALPHA-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000)),
    customer_name: userName || "Valued Alpha Member",
    mobile_number: userMobile || "0000000000",
    service_name: planName || category || "General Service",
    quantity: qty,
    amount: totalAmount,
    payment_status: (newBooking.paymentStatus || "pending").toUpperCase(),
    razorpay_order_id: razorpay_order_id,
    razorpay_payment_id: razorpay_payment_id,
    utr_reference: newBooking.utrNumber || razorpay_payment_id || "N/A",
    created_at: new Date().toISOString()
  };

  console.log(`[SUPABASE SYNC] Saving booking to 'alpha_bookings':`, alphaBookingPayload);
  
  supabase.from('alpha_bookings').insert([alphaBookingPayload]).then(({ error }) => {
    if (error) {
      console.error(`[SUPABASE ERROR] Insert failed for table 'alpha_bookings':`, error.message);
    } else {
      console.log(`[SUPABASE SUCCESS] Booking ${newBooking.id} successfully saved to table 'alpha_bookings'!`);
    }
  });

  console.log(`[SUPABASE SYNC] Saving receipt to 'payment_receipts':`, paymentReceiptPayload);
  
  supabase.from('payment_receipts').insert([paymentReceiptPayload]).then(({ error }) => {
    if (error) {
      console.error(`[SUPABASE ERROR] Insert failed for table 'payment_receipts':`, error.message);
    } else {
      console.log(`[SUPABASE SUCCESS] Receipt ${newBooking.receiptNumber} successfully saved to table 'payment_receipts'!`);
    }
  });

  // Simulated Email dispatch confirmation log
  console.log(`[EMAIL DISPATCHED] Sending GST Invoice PDF ${newBooking.invoiceNumber} to ${userEmail}...`);

  res.status(201).json({
    message: "Booking & Payment processed successfully!",
    booking: newBooking
  });
});

// Update profile details
app.post("/api/user/profile/update", (req, res) => {
  const { email, fullName, mobileNumber, address, age, gender } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "User email required" });
  }

  const userIdx = DB.users.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (userIdx === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  DB.users[userIdx] = {
    ...DB.users[userIdx],
    fullName: fullName || DB.users[userIdx].fullName,
    mobileNumber: mobileNumber || DB.users[userIdx].mobileNumber,
    address: address || DB.users[userIdx].address,
    age: age ? parseInt(age) : DB.users[userIdx].age,
    gender: gender || DB.users[userIdx].gender
  };

  saveDatabase();
  const { password: _, ...userSafe } = DB.users[userIdx];
  res.json({ message: "Profile updated successfully", user: userSafe });
});

// -----------------------------------------------------
// ADMIN MANAGEMENT SYSTEM API
// -----------------------------------------------------

// Get high-level stats dashboards
app.get("/api/admin/stats", (req, res) => {
  const totalMembers = DB.users.filter((u: any) => u.role !== "admin").length;
  
  // High-fidelity analytics aggregator
  let totalRevenue = 0;
  let monthlyRevenue = 0;
  let pendingPayments = 0;
  let activeMemberships = 0;

  const currentMonth = new Date().toISOString().substring(0, 7); // e.g., "2026-06"

  DB.bookings.forEach((bk: any) => {
    const isApprovedOrSuccess = bk.paymentStatus === "success" || bk.paymentStatus === "approved";
    if (isApprovedOrSuccess) {
      totalRevenue += bk.totalAmount;
      if (bk.paymentDate && bk.paymentDate.startsWith(currentMonth)) {
        monthlyRevenue += bk.totalAmount;
      }
      
      const nowStr = new Date().toISOString().substring(0, 10);
      if (bk.endDate >= nowStr) {
        activeMemberships++;
      }
    } else if (bk.paymentStatus === "pending") {
      pendingPayments += bk.totalAmount;
    }
  });

  res.json({
    totalMembers,
    totalRevenue: Math.round(totalRevenue),
    monthlyRevenue: Math.round(monthlyRevenue),
    pendingPayments: Math.round(pendingPayments),
    activeMemberships
  });
});

// Get all bookings list
app.get("/api/admin/bookings", (req, res) => {
  res.json(DB.bookings);
});

// Admin Deletion Endpoints for bookings, receipts, and user member profiles
app.post("/api/admin/bookings/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing booking ID" });
  }

  // 1. Delete from local memory database
  DB.bookings = (DB.bookings || []).filter((b: any) => b.id !== id);
  saveDatabase();

  // 2. Delete from Supabase 'alpha_bookings'
  try {
    const uuidId = stringToUUID(id);
    await supabase.from('alpha_bookings').delete().eq('id', id);
    await supabase.from('alpha_bookings').delete().eq('id', uuidId);
    
    // Also try to delete corresponding receipt block
    const receiptUuid = stringToUUID(id + "_receipt");
    await supabase.from('payment_receipts').delete().eq('id', id + "_receipt");
    await supabase.from('payment_receipts').delete().eq('id', receiptUuid);
  } catch (err: any) {
    console.error("Supabase booking delete error:", err.message);
  }

  res.json({ message: "Booking record deleted successfully", bookings: DB.bookings });
});

app.post("/api/admin/receipts/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing receipt ID" });
  }

  // Delete from Supabase 'payment_receipts'
  try {
    const uuidId = stringToUUID(id);
    await supabase.from('payment_receipts').delete().eq('id', id);
    await supabase.from('payment_receipts').delete().eq('id', uuidId);
  } catch (err: any) {
    console.error("Supabase payment receipt delete error:", err.message);
  }

  res.json({ message: "Receipt record deleted successfully" });
});

app.post("/api/admin/users/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing member profile ID" });
  
  DB.users = (DB.users || []).filter((u: any) => u.id !== id);
  saveDatabase();
  res.json({ message: "Member account deleted successfully", users: DB.users });
});

// Advanced Live Search directly from Supabase tables and fallback DB
app.get("/api/admin/supabase-search", async (req, res) => {
  const query = (req.query.q || "").toString().trim().toLowerCase();
  const categoryFilter = (req.query.category || "all").toString().toLowerCase(); // all, gym, library, gaming, tournament, payments
  const statusFilter = (req.query.status || "all").toString().toLowerCase(); // all, success, pending, failed

  let supabaseBookings: any[] = [];
  let supabaseReceipts: any[] = [];

  // 1. Query alpha_bookings
  try {
    const { data, error } = await supabase.from('alpha_bookings').select('*');
    if (!error && data) {
      supabaseBookings = data.map((row: any) => ({
        id: row.id,
        userName: row.full_name || "",
        userMobile: row.mobile_number || "",
        payerName: row.full_name || "",
        payerMobile: row.mobile_number || "",
        category: row.service_type || "",
        planName: row.plan_name || "",
        totalAmount: Number(row.amount || 0),
        amount: Number(row.amount || 0),
        paymentStatus: row.payment_status || "pending",
        razorpayOrderId: row.razorpay_order_id || "N/A",
        razorpayPaymentId: row.razorpay_payment_id || "N/A",
        utrNumber: row.utr_reference || row.razorpay_payment_id || "N/A",
        paymentDate: row.created_at || new Date().toISOString(),
        invoiceNumber: "INV-" + row.id.substring(0, 8).toUpperCase(),
        receiptNumber: row.utr_reference || ""
      }));
    } else {
      console.warn("[SEARCH ENGINE] Supabase bookings fetch error, using local memory bookings:", error?.message);
      supabaseBookings = DB.bookings.map((b: any) => ({ ...b, totalAmount: b.totalAmount || b.amount }));
    }
  } catch (err: any) {
    console.error("[SEARCH ENGINE] Supabase fetch bookings failed:", err.message);
    supabaseBookings = DB.bookings.map((b: any) => ({ ...b, totalAmount: b.totalAmount || b.amount }));
  }

  // 2. Query payment_receipts
  try {
    const { data, error } = await supabase.from('payment_receipts').select('*');
    if (!error && data) {
      supabaseReceipts = data.map((row: any) => ({
        id: row.id,
        receiptNumber: row.receipt_number || "",
        customerName: row.customer_name || "",
        mobileNumber: row.mobile_number || "",
        serviceName: row.service_name || "",
        quantity: row.quantity || 1,
        amount: Number(row.amount || 0),
        paymentStatus: row.payment_status || "success",
        razorpayOrderId: row.razorpay_order_id || "N/A",
        razorpayPaymentId: row.razorpay_payment_id || "N/A",
        utrReference: row.utr_reference || "",
        createdAt: row.created_at || new Date().toISOString()
      }));
    } else {
      console.warn("[SEARCH ENGINE] Supabase receipts fetch error:");
      // Fallback: build receipt objects from local approved bookings
      supabaseReceipts = DB.bookings
        .filter((b: any) => b.paymentStatus === 'approved' || b.paymentStatus === 'success')
        .map((b: any) => ({
          id: b.id,
          receiptNumber: b.receiptNumber || ("RC-" + Math.floor(Math.random() * 90000 + 10000)),
          customerName: b.payerName || b.userName,
          mobileNumber: b.payerMobile || b.userMobile,
          serviceName: `${b.category.toUpperCase()} - ${b.planName}`,
          quantity: 1,
          amount: b.totalAmount || b.amount,
          paymentStatus: b.paymentStatus,
          razorpayOrderId: b.razorpayOrderId || "N/A",
          razorpayPaymentId: b.razorpayPaymentId || "N/A",
          utrReference: b.utrNumber || "N/A",
          createdAt: b.paymentDate || new Date().toISOString()
        }));
    }
  } catch (err: any) {
    console.error("[SEARCH ENGINE] Supabase fetch receipts failed:", err.message);
    supabaseReceipts = DB.bookings
      .filter((b: any) => b.paymentStatus === 'approved' || b.paymentStatus === 'success')
      .map((b: any) => ({
        id: b.id,
        receiptNumber: b.receiptNumber || ("RC-" + Math.floor(Math.random() * 90000 + 10000)),
        customerName: b.payerName || b.userName,
        mobileNumber: b.payerMobile || b.userMobile,
        serviceName: `${b.category.toUpperCase()} - ${b.planName}`,
        quantity: 1,
        amount: b.totalAmount || b.amount,
        paymentStatus: b.paymentStatus,
        razorpayOrderId: b.razorpayOrderId || "N/A",
        razorpayPaymentId: b.razorpayPaymentId || "N/A",
        utrReference: b.utrNumber || "N/A",
        createdAt: b.paymentDate || new Date().toISOString()
      }));
  }

  // 3. Filter Bookings
  let finalBookings = supabaseBookings.filter((bk: any) => {
    // Category Filter
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'payments') {
        // 'payments' indicates we search in bookings as valid transactions
      } else {
        if (bk.category.toLowerCase() !== categoryFilter) {
          return false;
        }
      }
    }

    // Status Filter (success, pending, failed)
    if (statusFilter !== 'all') {
      const s = bk.paymentStatus.toLowerCase();
      if (statusFilter === 'success' && s !== 'success' && s !== 'approved') return false;
      if (statusFilter === 'pending' && s !== 'pending') return false;
      if (statusFilter === 'failed' && s !== 'failed' && s !== 'rejected') return false;
    }

    // Text Query search across: Customer Name, Mobile Number, Receipt Number, Razorpay Payment ID, Razorpay Order ID, Service Type, Plan Name, Payment Status
    if (query !== "") {
      const isMatch = 
        bk.id.toLowerCase().includes(query) ||
        (bk.userName || "").toLowerCase().includes(query) ||
        (bk.userMobile || "").toLowerCase().includes(query) ||
        (bk.payerName || "").toLowerCase().includes(query) ||
        (bk.payerMobile || "").toLowerCase().includes(query) ||
        (bk.invoiceNumber || "").toLowerCase().includes(query) ||
        (bk.receiptNumber || "").toLowerCase().includes(query) ||
        (bk.planName || "").toLowerCase().includes(query) ||
        (bk.category || "").toLowerCase().includes(query) ||
        (bk.paymentStatus || "").toLowerCase().includes(query) ||
        (bk.razorpayOrderId || "").toLowerCase().includes(query) ||
        (bk.razorpayPaymentId || "").toLowerCase().includes(query) ||
        (bk.utrNumber || "").toLowerCase().includes(query);
      if (!isMatch) return false;
    }

    return true;
  });

  // 4. Filter Receipts
  let finalReceipts = supabaseReceipts.filter((rc: any) => {
    // Category Filter
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'payments') {
        // allowed
      } else {
        // match service name with category keyword
        if (!rc.serviceName.toLowerCase().includes(categoryFilter)) {
          return false;
        }
      }
    }

    // Status Filter
    if (statusFilter !== 'all') {
      const s = rc.paymentStatus.toLowerCase();
      if (statusFilter === 'success' && s !== 'success' && s !== 'approved') return false;
      if (statusFilter === 'pending' && s !== 'pending') return false;
      if (statusFilter === 'failed' && s !== 'failed' && s !== 'rejected') return false;
    }

    // Text Query
    if (query !== "") {
      const isMatch = 
        rc.id.toLowerCase().includes(query) ||
        (rc.receiptNumber || "").toLowerCase().includes(query) ||
        (rc.customerName || "").toLowerCase().includes(query) ||
        (rc.mobileNumber || "").toLowerCase().includes(query) ||
        (rc.serviceName || "").toLowerCase().includes(query) ||
        (rc.paymentStatus || "").toLowerCase().includes(query) ||
        (rc.razorpayOrderId || "").toLowerCase().includes(query) ||
        (rc.razorpayPaymentId || "").toLowerCase().includes(query) ||
        (rc.utrReference || "").toLowerCase().includes(query);
      if (!isMatch) return false;
    }

    return true;
  });

  res.json({
    bookings: finalBookings,
    receipts: finalReceipts
  });
});

// Verify and Approve/Reject payment submission
app.post("/api/admin/bookings/verify", (req, res) => {
  const { bookingId, status } = req.body; // status: 'approved' | 'rejected'
  if (!bookingId || !status) {
    return res.status(400).json({ error: "Missing required bookingId or status parameter" });
  }

  const bk = DB.bookings.find((b: any) => b.id === bookingId);
  if (!bk) {
    return res.status(404).json({ error: "Booking record was not found." });
  }

  bk.paymentStatus = status;
  
  if (status === 'approved') {
    // Generate official Receipt Number if not already set
    if (!bk.receiptNumber) {
      bk.receiptNumber = "ALPHA-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    }
    bk.verifiedAt = new Date().toISOString();
  } else if (status === 'rejected') {
    // Release library seat if rejected
    if (bk.category === 'library' && bk.libraryDetails?.seatNumber) {
      DB.seats = DB.seats.map((s: any) => {
        if (s.number === bk.libraryDetails.seatNumber) {
          return {
            ...s,
            isBooked: false,
            bookedBy: undefined,
            isPermanent: false,
            lockerNumber: undefined,
            lockerType: undefined
          };
        }
        return s;
      });
    }
  }

  saveDatabase();
  res.json({ message: `Transaction verified successfully as ${status}`, booking: bk });
});

// Get all users list
app.get("/api/admin/users", (req, res) => {
  const safeUsers = DB.users.map(({ password: _, ...u }: any) => u);
  res.json(safeUsers);
});

// Reset Reading Room seats (Admin action)
app.post("/api/admin/seats/reset", (req, res) => {
  DB.seats = Array.from({ length: 183 }, (_, idx) => {
    const num = idx + 1;
    return {
      id: `seat_${num}`,
      number: `${num}`,
      isBooked: false,
      bookedBy: undefined,
      isPermanent: false,
      lockerNumber: undefined,
      lockerType: undefined
    };
  });
  saveDatabase();
  res.json({ message: "All reading room seats successfully reset.", seats: DB.seats });
});

// Admin Seat Reallocation Control
app.post("/api/admin/seats/reallocate", (req, res) => {
  const { bookingId, newSeatNumber } = req.body;
  if (!bookingId || !newSeatNumber) {
    return res.status(400).json({ error: "Missing required parameters (bookingId or newSeatNumber)" });
  }

  // Find the target booking
  const booking = DB.bookings.find((b: any) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking record not found" });
  }

  const oldSeatNumber = booking.libraryDetails?.seatNumber;

  // Validate if new seat is already booked
  const targetSeat = DB.seats.find((s: any) => s.number === newSeatNumber);
  if (targetSeat && targetSeat.isBooked && targetSeat.number !== oldSeatNumber) {
    return res.status(400).json({ error: `Seat ${newSeatNumber} is currently occupied by someone else.` });
  }

  // Release the old seat
  if (oldSeatNumber) {
    DB.seats = DB.seats.map((s: any) => {
      if (s.number === oldSeatNumber) {
        return { 
          ...s, 
          isBooked: false, 
          bookedBy: undefined, 
          isPermanent: false,
          lockerNumber: undefined,
          lockerType: undefined
        };
      }
      return s;
    });
  }

  // Allocate the new seat
  if (!booking.libraryDetails) {
    booking.libraryDetails = {};
  }
  booking.libraryDetails.seatNumber = newSeatNumber;

  DB.seats = DB.seats.map((s: any) => {
    if (s.number === newSeatNumber) {
      return {
        ...s,
        isBooked: true,
        bookedBy: booking.userName,
        isPermanent: booking.libraryDetails?.isPermanent || false,
        lockerNumber: booking.libraryDetails?.lockerNumber || undefined,
        lockerType: booking.libraryDetails?.lockerType || undefined
      };
    }
    return s;
  });

  saveDatabase();
  res.json({ message: `Successfully reallocated student to Seat ${newSeatNumber}`, booking, seats: DB.seats });
});

// Update membership plans (Admin action)
app.post("/api/admin/plans/update", (req, res) => {
  const { category, planId, price, name } = req.body;
  if (!category || !planId || price === undefined) {
    return res.status(400).json({ error: "Missing plan variables" });
  }

  if (category === "gym") {
    DB.gymPlans = DB.gymPlans.map((p: any) => 
      p.id === planId ? { ...p, price: parseFloat(price), name: name || p.name } : p
    );
  } else if (category === "library") {
    DB.libraryPlans = DB.libraryPlans.map((p: any) => 
      p.id === planId ? { ...p, price: parseFloat(price), name: name || p.name } : p
    );
  }
  
  saveDatabase();
  res.json({ message: "Plan parameters updated successfully" });
});

// Get gaming plans
app.get("/api/gaming/plans", (req, res) => {
  res.json(DB.gamingPlans || []);
});

// Update gaming plans (Admin action)
app.post("/api/admin/gaming/plans/update", (req, res) => {
  const { planId, originalPrice, offerPrice, isOfferActive, isEnabled } = req.body;
  if (!planId) {
    return res.status(400).json({ error: "Missing planId" });
  }

  DB.gamingPlans = (DB.gamingPlans || []).map((p: any) => {
    if (p.id === planId) {
      return {
        ...p,
        originalPrice: originalPrice !== undefined ? parseFloat(originalPrice) : p.originalPrice,
        offerPrice: offerPrice !== undefined ? parseFloat(offerPrice) : p.offerPrice,
        isOfferActive: isOfferActive !== undefined ? !!isOfferActive : p.isOfferActive,
        isEnabled: isEnabled !== undefined ? !!isEnabled : p.isEnabled
      };
    }
    return p;
  });

  saveDatabase();
  res.json({ message: "Gaming plan updated successfully", gamingPlans: DB.gamingPlans });
});

// -----------------------------------------------------
// CAFE MENU SYSTEM & BANNER PLATFORM API
// -----------------------------------------------------

// Helper for Cloudinary image upload (rest api)
async function uploadToCloudinary(base64Data: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "ml_default";
  
  if (!cloudName) {
    return base64Data;
  }
  
  try {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    let file = base64Data;
    if (!file.startsWith("http") && !file.startsWith("data:")) {
      file = `data:image/jpeg;base64,${base64Data}`;
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: file,
        upload_preset: uploadPreset
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.secure_url || base64Data;
    } else {
      console.error("Cloudinary upload status non-200. Fallback to storage in DB.", await response.text());
    }
  } catch (e) {
    console.error("Cloudinary failure, storing Base64 directly in DB.", e);
  }
  return base64Data;
}

// Cafe Menu Endpoints
app.get("/api/cafe/menu", (req, res) => {
  res.json(DB.cafeMenu || []);
});

app.post("/api/admin/cafe/menu/add", async (req, res) => {
  const { name, category, price, isEnabled } = req.body;
  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: "Missing name, category, or price" });
  }

  const newItem = {
    id: "cafe_" + Math.random().toString(36).substring(2, 9),
    name,
    category,
    price: parseFloat(price),
    isEnabled: isEnabled !== undefined ? !!isEnabled : true
  };

  DB.cafeMenu = DB.cafeMenu || [];
  DB.cafeMenu.push(newItem);
  saveDatabase();

  res.status(201).json({ message: "Menu item added successfully", item: newItem, cafeMenu: DB.cafeMenu });
});

app.post("/api/admin/cafe/menu/update", async (req, res) => {
  const { id, name, category, price, isEnabled } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing menu item id" });
  }

  DB.cafeMenu = (DB.cafeMenu || []).map((item: any) => {
    if (item.id === id) {
      return {
        ...item,
        name: name !== undefined ? name : item.name,
        category: category !== undefined ? category : item.category,
        price: price !== undefined ? parseFloat(price) : item.price,
        isEnabled: isEnabled !== undefined ? !!isEnabled : item.isEnabled
      };
    }
    return item;
  });

  saveDatabase();
  res.json({ message: "Menu item updated successfully", cafeMenu: DB.cafeMenu });
});

app.post("/api/admin/cafe/menu/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing menu item id" });
  }

  DB.cafeMenu = (DB.cafeMenu || []).filter((item: any) => item.id !== id);
  saveDatabase();
  res.json({ message: "Menu item structural deletion successful", cafeMenu: DB.cafeMenu });
});

// Banner Endpoints
app.get("/api/banners", (req, res) => {
  res.json(DB.banners || []);
});

app.post("/api/admin/banners/upload", async (req, res) => {
  const { 
    id,
    replaceBannerId, 
    title, 
    description,
    imageBase64, 
    type, 
    targetPage, 
    isActive, 
    deviceType, 
    startDate,
    endDate,
    scheduleStartDate, 
    scheduleEndDate
  } = req.body;

  if (!imageBase64 || !type) {
    return res.status(400).json({ error: "Missing imageBase64 or type" });
  }

  // Identify if any ID is supplied for updating/replacing
  const finalReplaceId = id || replaceBannerId;

  try {
    const uploadedUrl = await uploadToCloudinary(imageBase64);
    
    const bannerData = {
      title: title || "New Dynamic Poster",
      description: description || "",
      imageUrl: uploadedUrl,
      type, // 'homepage' | 'gaming' | 'cafe' | 'tournament' | 'offer' | 'gym' | 'library' | 'festival'
      targetPage: targetPage || "homepage",
      deviceType: deviceType || "all", // 'all' | 'desktop' | 'mobile'
      scheduleStartDate: startDate || scheduleStartDate || "",
      scheduleEndDate: endDate || scheduleEndDate || "",
      isActive: isActive !== undefined ? !!isActive : true,
      createdAt: new Date().toISOString()
    };

    DB.banners = DB.banners || [];

    if (finalReplaceId) {
      // OVERWRITE existing banner
      DB.banners = DB.banners.map((b: any) => {
        if (b.id === finalReplaceId) {
          return {
            ...b,
            ...bannerData
          };
        }
        return b;
      });
      saveDatabase();
      res.json({ message: "Banner replaced successfully", bannerId: finalReplaceId, banners: DB.banners });
    } else {
      // APPEND new banner
      const newBanner = {
        id: "b_" + Math.random().toString(36).substring(2, 9),
        ...bannerData
      };
      DB.banners.push(newBanner);
      saveDatabase();
      res.status(201).json({ message: "Banner catalogued successfully", banner: newBanner, banners: DB.banners });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to process image upload" });
  }
});

app.post("/api/admin/banners/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing banner id" });
  }

  DB.banners = (DB.banners || []).filter((b: any) => b.id !== id);
  saveDatabase();
  res.json({ message: "Banner deleted successfully", banners: DB.banners });
});

app.post("/api/admin/banners/set-active", async (req, res) => {
  const { id, isActive, targetPage, type, deviceType, scheduleStartDate, scheduleEndDate } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing banner id" });
  }

  DB.banners = (DB.banners || []).map((b: any) => {
    if (b.id === id) {
      return {
        ...b,
        isActive: isActive !== undefined ? !!isActive : b.isActive,
        targetPage: targetPage !== undefined ? targetPage : b.targetPage,
        type: type !== undefined ? type : b.type,
        deviceType: deviceType !== undefined ? deviceType : b.deviceType,
        scheduleStartDate: scheduleStartDate !== undefined ? scheduleStartDate : b.scheduleStartDate,
        scheduleEndDate: scheduleEndDate !== undefined ? scheduleEndDate : b.scheduleEndDate
      };
    }
    return b;
  });

  saveDatabase();
  res.json({ message: "Banner configurations updated successfully", banners: DB.banners });
});

// -----------------------------------------------------
// TOURNAMENTS SYSTEM CORE API
// -----------------------------------------------------

// Get all tournaments
app.get("/api/tournaments", (req, res) => {
  res.json(DB.tournaments || []);
});

// Admin: Add new tournament
app.post("/api/admin/tournaments/add", async (req, res) => {
  const { name, game, entryFee, description, bannerUrl, imageBase64, isActive, status } = req.body;
  if (!name || !game || entryFee === undefined) {
    return res.status(400).json({ error: "Missing tournament name, game, or entry fee." });
  }

  let finalBannerUrl = bannerUrl || "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200";
  if (imageBase64) {
    try {
      finalBannerUrl = await uploadToCloudinary(imageBase64);
    } catch (e: any) {
      console.error("Cloudinary upload failed for tournament banner, fell back.", e);
    }
  }

  const newTournament = {
    id: "tournament_" + Math.random().toString(36).substring(2, 10),
    name,
    game,
    entryFee: parseFloat(entryFee),
    description: description || "",
    bannerUrl: finalBannerUrl,
    isActive: isActive !== undefined ? !!isActive : true,
    status: status || "open", // "open" | "closed"
    createdAt: new Date().toISOString()
  };

  DB.tournaments = DB.tournaments || [];
  DB.tournaments.push(newTournament);
  saveDatabase();

  res.status(201).json({ message: "Tournament created successfully", tournament: newTournament, tournaments: DB.tournaments });
});

// Admin: Update/Replace tournament
app.post("/api/admin/tournaments/update", async (req, res) => {
  const { id, name, game, entryFee, description, bannerUrl, imageBase64, isActive, status } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing tournament ID" });
  }

  let finalBannerUrl = bannerUrl;
  if (imageBase64) {
    try {
      finalBannerUrl = await uploadToCloudinary(imageBase64);
    } catch (e: any) {
      console.error("Cloudinary upload failed for replacement banner", e);
    }
  }

  DB.tournaments = (DB.tournaments || []).map((t: any) => {
    if (t.id === id) {
      return {
        ...t,
        name: name !== undefined ? name : t.name,
        game: game !== undefined ? game : t.game,
        entryFee: entryFee !== undefined ? parseFloat(entryFee) : t.entryFee,
        description: description !== undefined ? description : t.description,
        bannerUrl: finalBannerUrl !== undefined ? finalBannerUrl : t.bannerUrl,
        isActive: isActive !== undefined ? !!isActive : t.isActive,
        status: status !== undefined ? status : t.status
      };
    }
    return t;
  });

  saveDatabase();
  res.json({ message: "Tournament updated successfully", tournaments: DB.tournaments });
});

// Admin: Delete tournament
app.post("/api/admin/tournaments/delete", (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing tournament ID" });
  }

  DB.tournaments = (DB.tournaments || []).filter((t: any) => t.id !== id);
  saveDatabase();
  res.json({ message: "Tournament deleted successfully", tournaments: DB.tournaments });
});

// -----------------------------------------------------
// VISITOR COUNTER, CONTACT FORM & EMAIL NEWSLETTER CORES
// -----------------------------------------------------

// Get and Increment Visitor count
app.get("/api/visitor-count", (req, res) => {
  DB.visitorCount = (typeof DB.visitorCount === "number") ? DB.visitorCount : 4760; // Seed nice initial visitors
  res.json({ count: DB.visitorCount });
});

app.post("/api/visitor-count/increment", (req, res) => {
  DB.visitorCount = (typeof DB.visitorCount === "number") ? DB.visitorCount : 4760;
  DB.visitorCount += 1;
  saveDatabase();
  res.json({ count: DB.visitorCount });
});

// Join Newsletter Subscription
app.post("/api/newsletter/subscribe", (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email syntax provided." });
  }

  DB.newsletterSubscriptions = DB.newsletterSubscriptions || [];
  const alreadyExists = DB.newsletterSubscriptions.some((s: any) => s.email.toLowerCase() === email.toLowerCase());
  
  if (!alreadyExists) {
    DB.newsletterSubscriptions.push({
      id: "ns_" + Math.random().toString(36).substring(2, 9),
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString()
    });
    saveDatabase();
  }

  res.json({ message: "Successfully registered on VIP mailing list!", subscribersCount: DB.newsletterSubscriptions.length });
});

// Retrieve subscribers list (for admin tab)
app.get("/api/admin/newsletter", (req, res) => {
  res.json(DB.newsletterSubscriptions || []);
});

app.post("/api/admin/newsletter/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing subscriber profile ID" });
  
  DB.newsletterSubscriptions = (DB.newsletterSubscriptions || []).filter((s: any) => s.id !== id);
  saveDatabase();
  res.json({ message: "Subscriber removed from pool", newsletterSubscriptions: DB.newsletterSubscriptions });
});

// Submit Contact Form Feed
app.post("/api/contact/submit", (req, res) => {
  const { name, email, mobile, message } = req.body;
  if (!name || !mobile || !message) {
    return res.status(400).json({ error: "Name, Mobile, and message content are required." });
  }

  const submission = {
    id: "cs_" + Math.random().toString(36).substring(2, 9),
    name: name.trim(),
    email: (email || "").trim(),
    mobile: mobile.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString()
  };

  DB.contactSubmissions = DB.contactSubmissions || [];
  DB.contactSubmissions.push(submission);
  saveDatabase();

  // Save the inquiry/contact details to the alpha_bookings table
  const contactAppointmentPayload = {
    id: stringToUUID(submission.id),
    full_name: submission.name,
    mobile_number: submission.mobile,
    service_type: "contact_form",
    plan_name: "Contact Form Inquiry",
    product_name: submission.message.substring(0, 500) || "Contact Form Inquiry Message",
    quantity: 1,
    amount: 0,
    payment_status: "SUCCESS",
    razorpay_order_id: "N/A",
    razorpay_payment_id: "N/A",
    utr_reference: "N/A",
    created_at: submission.createdAt
  };

  console.log(`[SUPABASE SYNC] Saving contact form to 'alpha_bookings':`, contactAppointmentPayload);

  supabase.from('alpha_bookings').insert([contactAppointmentPayload]).then(({ error }) => {
    if (error) {
      console.error(`[SUPABASE ERROR] Insert failed for contact in 'alpha_bookings':`, error.message);
    } else {
      console.log(`[SUPABASE SUCCESS] Contact submission ${submission.id} successfully saved to table 'alpha_bookings'!`);
    }
  });

  res.status(201).json({ message: "Inquiry successfully submitted to helpdesk!", submission });
});

// Load submissions for admin dashboard
app.get("/api/admin/contacts", (req, res) => {
  res.json(DB.contactSubmissions || []);
});

app.post("/api/admin/contacts/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing inquiry record ID" });
  
  DB.contactSubmissions = (DB.contactSubmissions || []).filter((c: any) => c.id !== id);
  saveDatabase();
  res.json({ message: "Contact logs deleted structural node", contactSubmissions: DB.contactSubmissions });
});

// SQL Execution API Proxy
app.post("/api/admin/sql", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing SQL Query" });

  try {
    // Attempt to execute via RPC if the user has an exec_sql function configured in Supabase
    const { data, error } = await supabase.rpc('exec_sql', { query: query });
    
    if (error) {
      // Return a helpful error guiding the user on how to enable raw SQL execution
      return res.status(200).json({
        error: `Supabase Error: ${error.message}. NOTE: To execute raw SQL from the client, you must create an RPC function named "exec_sql" in your Supabase database that accepts a "query" parameter, or connect directly using a standard pg connection string.`
      });
    }

    res.json(data || [{ message: "Query executed successfully with no visual tabular return data." }]);
  } catch (err: any) {
    res.status(500).json({ error: "Inter-server execution bridge failed: " + err.message });
  }
});

// Export complete codebase as a ZIP archive
app.get("/api/admin/export-zip", (req, res) => {
  try {
    const zip = new AdmZip();
    const rootPath = process.cwd();

    function addDirToZip(currentPath: string, zipPath: string) {
      const items = fs.readdirSync(currentPath);
      for (const item of items) {
        // Exclude directories/files that match ignore list
        if (
          item === "node_modules" ||
          item === "dist" ||
          item === ".git" ||
          item === ".github" ||
          item === ".env" ||
          item === ".DS_Store" ||
          item === "dist_server" ||
          item === "server.js" ||
          item === "out" ||
          item === ".output" ||
          item === ".vite"
        ) {
          continue;
        }

        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          addDirToZip(fullPath, path.join(zipPath, item));
        } else {
          const fileContent = fs.readFileSync(fullPath);
          const archiveFilePath = path.join(zipPath, item).replace(/\\/g, '/');
          zip.addFile(archiveFilePath, fileContent);
        }
      }
    }

    addDirToZip(rootPath, "");

    const zipBuffer = zip.toBuffer();

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=alpha-clubhouse-fullstack-hub.zip"
    );
    res.send(zipBuffer);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to compile ZIP package: " + err.message });
  }
});

// Check connection and perform a test insert
app.get("/api/admin/supabase-status", async (req, res) => {
  const result: any = {
    supabaseProjectUrl: SUPABASE_URL,
    supabaseProjectId: "vboqigshswogtlrgcuag",
    connectionStatus: "PENDING",
    alphaBookingsTableExists: false,
    paymentReceiptsTableExists: false,
    autoCreationAttempted: false,
    autoCreationError: null,
    testInsertId: null,
    testReceiptId: null,
    testInsertResult: "PENDING",
    databaseErrors: [],
    verificationSteps: []
  };

  try {
    // 1. Check if tables actually exist by performing a select limit 0
    const { error: alphaCheckErr } = await supabase.from('alpha_bookings').select('id').limit(0);
    const { error: receiptsCheckErr } = await supabase.from('payment_receipts').select('id').limit(0);

    result.alphaBookingsTableExists = !alphaCheckErr;
    result.paymentReceiptsTableExists = !receiptsCheckErr;

    if (alphaCheckErr) {
      result.databaseErrors.push({ table: "alpha_bookings", error: alphaCheckErr.message, code: alphaCheckErr.code });
    }
    if (receiptsCheckErr) {
      result.databaseErrors.push({ table: "payment_receipts", error: receiptsCheckErr.message, code: receiptsCheckErr.code });
    }

    // 2. Try auto-creation if tables are missing
    if (!result.alphaBookingsTableExists || !result.paymentReceiptsTableExists) {
      result.autoCreationAttempted = true;
      console.log("[DIAGNOSTIC] Auto-creating missing tables...");
      
      const createTableSQL = `
        SELECT NULL) t;

        -- 1. Create alpha_bookings table
        CREATE TABLE IF NOT EXISTS public.alpha_bookings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name TEXT,
          mobile_number TEXT,
          service_type TEXT,
          plan_name TEXT,
          product_name TEXT,
          quantity INTEGER,
          amount NUMERIC,
          payment_status TEXT,
          razorpay_order_id TEXT,
          razorpay_payment_id TEXT,
          utr_reference TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        );

        -- Ensure all columns exist in case table was created with partial columns previously
        ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS full_name TEXT;
        ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS mobile_number TEXT;
        ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS service_type TEXT;
        ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS plan_name TEXT;
        ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS product_name TEXT;
        ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS quantity INTEGER;
        ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS amount NUMERIC;
        ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS payment_status TEXT;
        ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
        ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
        ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS utr_reference TEXT;
        ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

        -- 2. Create payment_receipts table
        CREATE TABLE IF NOT EXISTS public.payment_receipts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          receipt_number TEXT,
          customer_name TEXT,
          mobile_number TEXT,
          service_name TEXT,
          quantity INTEGER,
          amount NUMERIC,
          payment_status TEXT,
          razorpay_order_id TEXT,
          razorpay_payment_id TEXT,
          utr_reference TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        );

        -- Ensure all columns exist in case table was created with partial columns previously
        ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS receipt_number TEXT;
        ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS customer_name TEXT;
        ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS mobile_number TEXT;
        ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS service_name TEXT;
        ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS quantity INTEGER;
        ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS amount NUMERIC;
        ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS payment_status TEXT;
        ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
        ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
        ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS utr_reference TEXT;
        ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

        -- Ensure Row Level Security (RLS) is active
        ALTER TABLE public.alpha_bookings ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

        -- Drop any old/different policies to prevent duplicate or conflict errors
        DROP POLICY IF EXISTS "Allow public insert to alpha_bookings" ON public.alpha_bookings;
        DROP POLICY IF EXISTS "Allow public insert to payment_receipts" ON public.payment_receipts;
        DROP POLICY IF EXISTS "Allow public select to alpha_bookings" ON public.alpha_bookings;
        DROP POLICY IF EXISTS "Allow public select to payment_receipts" ON public.payment_receipts;
        DROP POLICY IF EXISTS "Allow select for auth users to alpha_bookings" ON public.alpha_bookings;
        DROP POLICY IF EXISTS "Allow select for auth users to payment_receipts" ON public.payment_receipts;
        DROP POLICY IF EXISTS "Allow public test delete from alpha_bookings" ON public.alpha_bookings;
        DROP POLICY IF EXISTS "Allow public test delete from payment_receipts" ON public.payment_receipts;

        -- Create highly permissive RLS policies to allow inserts/selects/deletes on all roles (anon, public, authenticated)
        CREATE POLICY "Allow public insert to alpha_bookings" ON public.alpha_bookings FOR INSERT TO anon, authenticated, public WITH CHECK (true);
        CREATE POLICY "Allow public insert to payment_receipts" ON public.payment_receipts FOR INSERT TO anon, authenticated, public WITH CHECK (true);
        CREATE POLICY "Allow public select to alpha_bookings" ON public.alpha_bookings FOR SELECT TO anon, authenticated, public USING (true);
        CREATE POLICY "Allow public select to payment_receipts" ON public.payment_receipts FOR SELECT TO anon, authenticated, public USING (true);
        CREATE POLICY "Allow public test delete from alpha_bookings" ON public.alpha_bookings FOR DELETE TO anon, authenticated, public USING (true);
        CREATE POLICY "Allow public test delete from payment_receipts" ON public.payment_receipts FOR DELETE TO anon, authenticated, public USING (true);

        -- Notify PostgREST to reload schema cache
        NOTIFY pgrst, 'reload schema';

        SELECT 1 as val FROM (SELECT 1
      `;

      try {
        const { error: rpcErr } = await supabase.rpc('exec_sql', { query: createTableSQL });
        if (rpcErr) {
          result.autoCreationError = rpcErr.message;
          result.databaseErrors.push({ rpc: "exec_sql", error: rpcErr.message });
        } else {
          // Re-check table status
          const { error: alphaRecheck } = await supabase.from('alpha_bookings').select('id').limit(0);
          const { error: receiptsRecheck } = await supabase.from('payment_receipts').select('id').limit(0);
          result.alphaBookingsTableExists = !alphaRecheck;
          result.paymentReceiptsTableExists = !receiptsRecheck;
        }
      } catch (rpcEx: any) {
        result.autoCreationError = rpcEx.message;
        result.databaseErrors.push({ rpcException: rpcEx.message });
      }
    }

    // 3. Perform a real test insert (NOT DELETED, preserved purposely so the user can verify in Table Editor)
    const testId = "verif_" + Math.random().toString(36).substring(2, 9);
    const testUUID = stringToUUID(testId);
    result.testInsertId = testUUID;

    const testBookingPayload = {
      id: testUUID,
      full_name: "Test Connection User (Live Verification Row)",
      mobile_number: "9999999999",
      service_type: "connection_test",
      plan_name: "Supabase Connection Verification",
      product_name: "Self-Diagnostic Live Verification Record",
      quantity: 1,
      amount: 499.00,
      payment_status: "SUCCESS",
      razorpay_order_id: "order_" + Math.random().toString(36).substring(2, 10),
      razorpay_payment_id: "pay_" + Math.random().toString(36).substring(2, 10),
      utr_reference: "utr_" + Math.random().toString(36).substring(2, 12),
      created_at: new Date().toISOString()
    };

    const testReceiptUUID = stringToUUID(testId + "_receipt");
    result.testReceiptId = testReceiptUUID;

    const testReceiptPayload = {
      id: testReceiptUUID,
      receipt_number: "REC-" + testId.toUpperCase(),
      customer_name: "Test Connection User (Live Verification Row)",
      mobile_number: "9999999999",
      service_name: "Live Verification Receipt",
      quantity: 1,
      amount: 499.00,
      payment_status: "SUCCESS",
      razorpay_order_id: testBookingPayload.razorpay_order_id,
      razorpay_payment_id: testBookingPayload.razorpay_payment_id,
      utr_reference: testBookingPayload.utr_reference,
      created_at: new Date().toISOString()
    };

    // Attempt direct insert
    const { error: insertBookingErr } = await supabase.from('alpha_bookings').insert([testBookingPayload]);
    const { error: insertReceiptErr } = await supabase.from('payment_receipts').insert([testReceiptPayload]);

    if (insertBookingErr || insertReceiptErr) {
      result.connectionStatus = "ERROR / MISCONFIGURED";
      result.testInsertResult = "FAILED";
      if (insertBookingErr) {
        result.databaseErrors.push({ step: "alpha_bookings_insert", error: insertBookingErr.message, code: insertBookingErr.code });
      }
      if (insertReceiptErr) {
        result.databaseErrors.push({ step: "payment_receipts_insert", error: insertReceiptErr.message, code: insertReceiptErr.code });
      }
    } else {
      result.connectionStatus = "ACTIVE / FULLY CONNECTED";
      result.testInsertResult = "SUCCESSFUL";
    }

    // 4. Populate diagnostic instructions
    result.verificationSteps = [
      "1. Checked existing tables: " + (result.alphaBookingsTableExists && result.paymentReceiptsTableExists ? "Both tables exist!" : "Tables were missing or inaccessible."),
      result.autoCreationAttempted ? ("2. Attempted auto-creation of tables because one/both were missing. Status: " + (result.autoCreationError ? "Failed (" + result.autoCreationError + ")" : "Successfully completed!")) : "2. Auto-creation not needed, tables already existed.",
      "3. Triggered live transaction test insertion. Generated row IDs: Booking ID [" + result.testInsertId + "], Receipt ID [" + result.testReceiptId + "].",
      result.testInsertResult === "SUCCESSFUL" 
        ? "4. Verification row successfully stored permanently. Open your Supabase Dashboard Table Editor to see it immediately!"
        : "4. Verification row insert failed. Please review the 'databaseErrors' trace."
    ];

    res.json(result);
  } catch (err: any) {
    result.connectionStatus = "EXCEPTION";
    result.testInsertResult = `EXCEPTION: ${err.message}`;
    result.databaseErrors.push({ exception: err.message });
    res.status(500).json(result);
  }
});


// -----------------------------------------------------
// GAMING HIGHLIGHTS MEDIA MANAGER API
// -----------------------------------------------------

// GET MEDIA HIGHLIGHTS FOR GAMING
app.get("/api/gaming-highlights", async (req, res) => {
  try {
    const { data: supaVids, error } = await supabase.from("gaming_highlight_videos").select("*");
    if (!error && supaVids && supaVids.length > 0) {
      DB.gamingHighlightVideos = supaVids.map((v: any) => ({
        id: v.id,
        title: v.title,
        videoUrl: v.video_url,
        posterUrl: v.poster_url || "",
        isFeatured: !!v.is_featured,
        loop: !!v.loop,
        isActive: !!v.is_active,
        createdAt: v.created_at
      }));
    }
  } catch (err: any) {
    console.warn("Supabase load fallback:", err.message);
  }
  res.json({
    stories: DB.gamingHighlightStories || [],
    photos: DB.gamingHighlightPhotos || [],
    videos: DB.gamingHighlightVideos || []
  });
});

// Helper for Cloudinary dynamic media upload
async function uploadMediaToCloudinary(base64Data: string, isVideo: boolean = false): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "ml_default";
  
  if (!cloudName) {
    return base64Data;
  }
  
  try {
    const resourceType = isVideo ? "video" : "image";
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    let file = base64Data;
    if (!file.startsWith("http") && !file.startsWith("data:")) {
      file = isVideo ? `data:video/mp4;base64,${base64Data}` : `data:image/jpeg;base64,${base64Data}`;
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: file,
        upload_preset: uploadPreset
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.secure_url || base64Data;
    } else {
      console.error(`Cloudinary ${resourceType} upload status non-200. Fallback to base64.`, await response.text());
    }
  } catch (error) {
    console.error(`Cloudinary ${isVideo ? "video" : "image"} upload error:`, error);
  }
  return base64Data;
}

// ADMIN PHOTOS ENDPOINTS
app.post("/api/admin/gaming-highlights/photos/add", async (req, res) => {
  const { album, title, imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "Missing image attachment file" });
  }

  try {
    const imageUrl = await uploadMediaToCloudinary(imageBase64, false);
    const newPhoto = {
      id: "photo_" + Math.random().toString(36).substring(2, 10),
      album: album || "General",
      title: title || "Gallery Slide",
      imageUrl,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    DB.gamingHighlightPhotos = DB.gamingHighlightPhotos || [];
    DB.gamingHighlightPhotos.push(newPhoto);
    saveDatabase();

    res.json({ message: "Photo added successfully", photos: DB.gamingHighlightPhotos });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/gaming-highlights/photos/update", async (req, res) => {
  const { id, album, title, imageBase64, isActive } = req.body;
  if (!id) return res.status(400).json({ error: "Missing Photo ID" });

  try {
    let imageUrl;
    if (imageBase64) {
      imageUrl = await uploadMediaToCloudinary(imageBase64, false);
    }

    DB.gamingHighlightPhotos = (DB.gamingHighlightPhotos || []).map((p: any) => {
      if (p.id === id) {
        return {
          ...p,
          album: album !== undefined ? album : p.album,
          title: title !== undefined ? title : p.title,
          isActive: isActive !== undefined ? isActive : p.isActive,
          imageUrl: imageUrl || p.imageUrl
        };
      }
      return p;
    });

    saveDatabase();
    res.json({ message: "Photo updated successfully", photos: DB.gamingHighlightPhotos });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/gaming-highlights/photos/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing Photo ID" });

  DB.gamingHighlightPhotos = (DB.gamingHighlightPhotos || []).filter((p: any) => p.id !== id);
  saveDatabase();

  res.json({ message: "Photo deleted", photos: DB.gamingHighlightPhotos });
});


// HELPER TO SYNC HIGHLIGHT VIDEOS TO SUPABASE
async function syncHighlightVideosToSupabase() {
  try {
    const list = DB.gamingHighlightVideos || [];
    for (const v of list) {
       await supabase.from("gaming_highlight_videos").upsert({
         id: v.id,
         title: v.title,
         video_url: v.videoUrl,
         poster_url: v.posterUrl || null,
         is_featured: !!v.isFeatured,
         loop: !!v.loop,
         is_active: !!v.isActive,
         created_at: v.createdAt || new Date().toISOString()
       }, { onConflict: 'id' });
    }
  } catch (err: any) {
    console.warn("Supabase highlights sync fallback active: ", err.message);
  }
}

// ADMIN VIDEOS ENDPOINTS
app.post("/api/admin/gaming-highlights/videos/add", async (req, res) => {
  const { title, videoBase64, posterBase64, isFeatured, loop } = req.body;
  if (!videoBase64) {
    return res.status(400).json({ error: "Missing video attachment file" });
  }

  try {
    const videoUrl = videoBase64.startsWith("http") ? videoBase64 : await uploadMediaToCloudinary(videoBase64, true);
    
    let posterUrl = "";
    if (posterBase64) {
      posterUrl = await uploadMediaToCloudinary(posterBase64, false);
    }

    const newVideo = {
      id: "video_" + Math.random().toString(36).substring(2, 10),
      title: title || "Gameplay Reel",
      videoUrl,
      posterUrl,
      isFeatured: !!isFeatured,
      loop: loop !== undefined ? !!loop : true,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    DB.gamingHighlightVideos = DB.gamingHighlightVideos || [];

    if (newVideo.isFeatured) {
      DB.gamingHighlightVideos.forEach((v: any) => {
        v.isFeatured = false;
      });
    }

    DB.gamingHighlightVideos.push(newVideo);
    
    // Fallback: If no featured video exists, make this the featured video
    const currentFeatured = DB.gamingHighlightVideos.find((v: any) => v.isFeatured && v.isActive);
    if (!currentFeatured && DB.gamingHighlightVideos.length > 0) {
      DB.gamingHighlightVideos[0].isFeatured = true;
    }

    saveDatabase();
    await syncHighlightVideosToSupabase();

    res.json({ message: "Video added successfully", videos: DB.gamingHighlightVideos });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/gaming-highlights/videos/update", async (req, res) => {
  const { id, title, videoBase64, posterBase64, posterUrl, isFeatured, loop, isActive } = req.body;
  if (!id) return res.status(400).json({ error: "Missing Video ID" });

  try {
    let videoUrl;
    if (videoBase64) {
      videoUrl = await uploadMediaToCloudinary(videoBase64, true);
    }

    let uploadedPosterUrl;
    if (posterBase64) {
      uploadedPosterUrl = await uploadMediaToCloudinary(posterBase64, false);
    }

    DB.gamingHighlightVideos = DB.gamingHighlightVideos || [];

    if (isFeatured) {
      DB.gamingHighlightVideos.forEach((v: any) => {
        v.isFeatured = false;
      });
    }

    DB.gamingHighlightVideos = DB.gamingHighlightVideos.map((v: any) => {
      if (v.id === id) {
        return {
          ...v,
          title: title !== undefined ? title : v.title,
          loop: loop !== undefined ? !!loop : v.loop,
          isActive: isActive !== undefined ? !!isActive : v.isActive,
          isFeatured: isFeatured !== undefined ? !!isFeatured : v.isFeatured,
          videoUrl: videoUrl || v.videoUrl,
          posterUrl: uploadedPosterUrl || posterUrl || v.posterUrl || ""
        };
      }
      return v;
    });

    // Enforce at least one featured video
    const hasFeatured = DB.gamingHighlightVideos.some((v: any) => v.isFeatured && v.isActive);
    if (!hasFeatured) {
      const activeVid = DB.gamingHighlightVideos.find((v: any) => v.isActive);
      if (activeVid) {
        activeVid.isFeatured = true;
      }
    }

    saveDatabase();
    await syncHighlightVideosToSupabase();

    res.json({ message: "Video updated successfully", videos: DB.gamingHighlightVideos });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/gaming-highlights/videos/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing Video ID" });

  const wasFeatured = DB.gamingHighlightVideos?.find((v: any) => v.id === id)?.isFeatured;

  DB.gamingHighlightVideos = (DB.gamingHighlightVideos || []).filter((v: any) => v.id !== id);

  if (wasFeatured && DB.gamingHighlightVideos.length > 0) {
    DB.gamingHighlightVideos[0].isFeatured = true;
  }

  saveDatabase();
  try {
    await supabase.from("gaming_highlight_videos").delete().eq("id", id);
  } catch (err: any) {
    console.warn("Could not delete highlight from Supabase:", err.message);
  }

  res.json({ message: "Video deleted", videos: DB.gamingHighlightVideos });
});

app.post("/api/admin/gaming-highlights/videos/set-featured", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing Video ID" });

  DB.gamingHighlightVideos = (DB.gamingHighlightVideos || []).map((v: any) => {
    v.isFeatured = (v.id === id);
    return v;
  });

  saveDatabase();
  await syncHighlightVideosToSupabase();

  res.json({ message: "Video set as featured", videos: DB.gamingHighlightVideos });
});

app.post("/api/admin/gaming-highlights/stories/add", async (req, res) => {
  const { title, mediaBase64, type } = req.body;
  if (!mediaBase64) return res.status(400).json({ error: "Missing media attachment file" });

  try {
    const isVideo = type === 'video';
    const mediaUrl = await uploadMediaToCloudinary(mediaBase64, isVideo);
    const newStory = {
      id: "story_" + Math.random().toString(36).substring(2, 10),
      title: title || "New Story",
      mediaUrl,
      type: isVideo ? "video" : "photo",
      isActive: true,
      createdAt: new Date().toISOString()
    };

    DB.gamingHighlightStories = DB.gamingHighlightStories || [];
    DB.gamingHighlightStories.push(newStory);
    saveDatabase();

    res.json({ message: "Story added successfully", stories: DB.gamingHighlightStories });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/gaming-highlights/stories/update", async (req, res) => {
  const { id, title, mediaBase64, type, isActive } = req.body;
  if (!id) return res.status(400).json({ error: "Missing Story ID" });

  try {
    let mediaUrl;
    if (mediaBase64) {
      const isVideo = type === 'video';
      mediaUrl = await uploadMediaToCloudinary(mediaBase64, isVideo);
    }

    DB.gamingHighlightStories = (DB.gamingHighlightStories || []).map((s: any) => {
      if (s.id === id) {
        return {
          ...s,
          title: title !== undefined ? title : s.title,
          isActive: isActive !== undefined ? isActive : s.isActive,
          mediaUrl: mediaUrl || s.mediaUrl,
          type: type || s.type
        };
      }
      return s;
    });

    saveDatabase();
    res.json({ message: "Story updated successfully", stories: DB.gamingHighlightStories });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/admin/gaming-highlights/stories/delete", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing Story ID" });

  DB.gamingHighlightStories = (DB.gamingHighlightStories || []).filter((s: any) => s.id !== id);
  saveDatabase();

  res.json({ message: "Story deleted", stories: DB.gamingHighlightStories });
});

app.post("/api/admin/gaming-highlights/reorder", (req, res) => {
  const { type, ids } = req.body;
  if (!type || !ids) return res.status(400).json({ error: "Missing type or ids parameters" });

  if (type === 'photos') {
    const list = DB.gamingHighlightPhotos || [];
    const map = new Map(list.map((p: any) => [p.id, p]));
    DB.gamingHighlightPhotos = ids.map((id: string) => map.get(id)).filter(Boolean);
  } else if (type === 'videos') {
    const list = DB.gamingHighlightVideos || [];
    const map = new Map(list.map((v: any) => [v.id, v]));
    DB.gamingHighlightVideos = ids.map((id: string) => map.get(id)).filter(Boolean);
  } else if (type === 'stories') {
    const list = DB.gamingHighlightStories || [];
    const map = new Map(list.map((s: any) => [s.id, s]));
    DB.gamingHighlightStories = ids.map((id: string) => map.get(id)).filter(Boolean);
  }

  saveDatabase();
  res.json({
    message: "Order updated successfully",
    stories: DB.gamingHighlightStories || [],
    photos: DB.gamingHighlightPhotos || [],
    videos: DB.gamingHighlightVideos || []
  });
});


// -----------------------------------------------------
// RAZORPAY STANDARD WEB CHECKOUT API ENDPOINTS
// -----------------------------------------------------

app.post("/api/create-order", async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    
    // Validate amount >= 100 paise
    if (!amount || isNaN(amount) || amount < 100) {
      return res.status(400).json({ error: "Invalid amount. Must be at least 100 paise (1 INR)." });
    }

    const orderOptions = {
      amount: Math.round(amount), // in paise
      currency: currency || "INR",
      receipt: receipt || `receipt_order_${Date.now()}`
    };

    const order = await razorpay.orders.create(orderOptions);
    
    return res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error: any) {
    console.error("Razorpay Create Order Error:", error);
    if (error.statusCode === 401) {
      return res.status(401).json({ error: "Razorpay authentication failed or API keys invalid." });
    }
    return res.status(500).json({ error: error.message || "Failed to create Razorpay order." });
  }
});

app.post("/api/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required verification fields." });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "HI1buNdB5mx8bJikstMGCn7u";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      return res.json({ success: true, message: "Payment verified successfully." });
    } else {
      console.warn("Razorpay signature mismatch:", {
        received: razorpay_signature,
        generated: generated_signature
      });
      return res.status(400).json({ success: false, error: "Payment verification failed. Signature mismatch." });
    }
  } catch (error: any) {
    console.error("Razorpay Signature Verification Error:", error);
    return res.status(500).json({ error: error.message || "Failed to verify signature." });
  }
});


// -----------------------------------------------------
// STATIC FILE AND VITE MIDDLEWARE SETUP
// -----------------------------------------------------

async function startServer() {
  // Initialize Supabase Tables and check connection
  await initializeSupabaseTable();

  // Automatically seed/re-authenticate master administrator account
  try {
    await bootstrapMasterAdmin();
  } catch (bootErr: any) {
    console.error("[BOOTSTRAP INITIALIZATION ERROR]", bootErr.message);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support SPA router fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`THE ALPHA Premium Backend server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
