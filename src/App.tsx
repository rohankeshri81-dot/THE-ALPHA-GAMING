import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  Dumbbell, 
  BookOpen, 
  Gamepad2, 
  User, 
  ShieldCheck, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Briefcase,
  Layers,
  Sparkles,
  Award,
  ChevronDown,
  MapPin,
  Phone,
  ArrowRight,
  Mail,
  Globe,
  Instagram,
  Clock,
  ShoppingCart,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';
import { Booking, User as UserType } from './types';
import GymSection from './components/GymSection';
import LibrarySection from './components/LibrarySection';
import GamingSection from './components/GamingSection';
import CafeMenuSection from './components/CafeMenuSection';
import UserDashboard from './components/UserDashboard';
import AdminPanel from './components/AdminPanel';
import TournamentSection from './components/TournamentSection';
import PaymentModal from './components/PaymentModal';

function HelpDeskContactForm() {
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientMsg, setClientMsg] = useState('');
  const [formSubmitMsg, setFormSubmitMsg] = useState<string | null>(null);
  const [formErrMsg, setFormErrMsg] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientMobile || !clientMsg) {
      setFormErrMsg("Name, contact number, and content details are required.");
      return;
    }
    setLoadingSubmit(true);
    setFormErrMsg(null);
    setFormSubmitMsg(null);
    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName,
          mobile: clientMobile,
          email: clientEmail,
          message: clientMsg
        })
      });
      if (res.ok) {
        setFormSubmitMsg("Inquiry dispatched successfully! Our operations administrator will call you shortly.");
        setClientName('');
        setClientMobile('');
        setClientEmail('');
        setClientMsg('');
      } else {
        const data = await res.json();
        setFormErrMsg(data.error || "Inquiry drop failure.");
      }
    } catch (_) {
      setFormErrMsg("Failed to link with backend system.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <form onSubmit={handleSubmitInquiry} className="space-y-4 pt-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1 text-left">
          <label className="text-[9px] font-mono uppercase text-zinc-400">YOUR FULL NAME <span className="text-amber-500">*</span></label>
          <input 
            id="contact_form_name"
            type="text"
            required
            placeholder="e.g. Rohan Keshri"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full bg-black border border-zinc-900 focus:border-amber-500/40 text-xs text-white rounded-xl px-3.5 py-3 outline-none"
          />
        </div>

        <div className="space-y-1 text-left">
          <label className="text-[9px] font-mono uppercase text-zinc-400">MOBILE TELEPHONY HOTKEY <span className="text-amber-500">*</span></label>
          <input 
            id="contact_form_mobile"
            type="text"
            required
            placeholder="e.g. +91 98765 43210"
            value={clientMobile}
            maxLength={15}
            onChange={(e) => setClientMobile(e.target.value)}
            className="w-full bg-black border border-zinc-900 focus:border-amber-500/40 text-xs text-white rounded-xl px-3.5 py-3 outline-none font-mono"
          />
        </div>
      </div>

      <div className="space-y-1 text-left">
        <label className="text-[9px] font-mono uppercase text-zinc-400">CORRESPONDENCE EMAIL (OPTIONAL)</label>
        <input 
          id="contact_form_email"
          type="email"
          placeholder="e.g. yourname@domain.com"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          className="w-full bg-black border border-zinc-900 focus:border-amber-500/40 text-xs text-white rounded-xl px-3.5 py-3 outline-none font-mono"
        />
      </div>

      <div className="space-y-1 text-left">
        <label className="text-[9px] font-mono uppercase text-zinc-400">MESSAGE SUMMARY & DESIRED PLAN INFO <span className="text-amber-500">*</span></label>
        <textarea 
          id="contact_form_msg"
          rows={3}
          required
          placeholder="Enter notes about seats selection, physical trainer support, or corporate subscriptions..."
          value={clientMsg}
          onChange={(e) => setClientMsg(e.target.value)}
          className="w-full bg-black border border-zinc-900 focus:border-amber-500/40 text-xs text-white rounded-xl px-3.5 py-3 outline-none font-sans"
        />
      </div>

      {formErrMsg && (
        <p className="text-[9px] font-mono text-red-400 uppercase tracking-wider">⚠️ {formErrMsg}</p>
      )}

      {formSubmitMsg && (
        <div className="p-3 bg-zinc-900 border border-amber-500/25 rounded-xl text-[10px] font-mono text-amber-400 uppercase tracking-wide leading-relaxed font-sans">
          {formSubmitMsg}
        </div>
      )}

      <button 
        id="contact_form_submit_btn"
        type="submit"
        disabled={loadingSubmit}
        className="w-full cursor-pointer py-3.5 bg-[#c5a059] hover:bg-[#dfc288] disabled:bg-zinc-900 disabled:text-zinc-500 text-black font-semibold text-xxs font-mono uppercase tracking-widest rounded-lg transition-transform"
      >
        {loadingSubmit ? 'TRANSMITTING DISPATCH...' : 'TRANSMIT CALL REQUEST'}
      </button>
    </form>
  );
}

export default function App() {
  // Real-time server side session state syncing
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    try {
      const storedAdmin = localStorage.getItem('alpha_admin_user');
      if (storedAdmin) {
        return JSON.parse(storedAdmin);
      }
    } catch (_) {}
    return null;
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<string>('home'); // home, gym, library, gaming, dashboard, admin
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleNavigateHome = () => {
      setActiveTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('navigate-home', handleNavigateHome);
    return () => window.removeEventListener('navigate-home', handleNavigateHome);
  }, []);
  
  // Unified Master Cart System States
  const [masterCart, setMasterCart] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('alpha_master_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cart Checkout States
  const [showCartPayment, setShowCartPayment] = useState(false);
  const [cartCheckoutName, setCartCheckoutName] = useState('');
  const [cartCheckoutMobile, setCartCheckoutMobile] = useState('');
  const [cartCheckoutEmail, setCartCheckoutEmail] = useState('');

  const addToMasterCart = (item: any) => {
    setMasterCart(prev => {
      const existingIdx = prev.findIndex(i => i.id === item.id);
      let nextCart = [];
      if (existingIdx > -1) {
        nextCart = prev.map((i, idx) => {
          if (idx === existingIdx) {
            return { ...i, quantity: i.quantity + (item.quantity || 1) };
          }
          return i;
        });
      } else {
        nextCart = [...prev, { ...item, quantity: item.quantity || 1 }];
      }
      localStorage.setItem('alpha_master_cart', JSON.stringify(nextCart));
      return nextCart;
    });
  };

  const updateMasterCartQty = (itemId: string, delta: number) => {
    setMasterCart(prev => {
      const nextCart = prev.map(i => {
        if (i.id === itemId) {
          return { ...i, quantity: i.quantity + delta };
        }
        return i;
      }).filter(i => i.quantity > 0);
      localStorage.setItem('alpha_master_cart', JSON.stringify(nextCart));
      return nextCart;
    });
  };

  const removeFromMasterCart = (itemId: string) => {
    setMasterCart(prev => {
      const nextCart = prev.filter(i => i.id !== itemId);
      localStorage.setItem('alpha_master_cart', JSON.stringify(nextCart));
      return nextCart;
    });
  };

  const clearMasterCart = () => {
    setMasterCart([]);
    localStorage.removeItem('alpha_master_cart');
  };

  // Derive cart totals and summaries
  const cartSubtotals = React.useMemo(() => {
    let gym = 0;
    let library = 0;
    let gaming = 0;
    let cafe = 0;

    masterCart.forEach(item => {
      const itemCost = item.price * item.quantity;
      if (item.category === 'gym') gym += itemCost;
      else if (item.category === 'library') library += itemCost;
      else if (item.category === 'gaming') gaming += itemCost;
      else if (item.category === 'cafe') cafe += itemCost;
    });

    return { gym, library, gaming, cafe, grandTotal: gym + library + gaming + cafe };
  }, [masterCart]);
  
  // Alpha Membership system state
  interface AlphaMemberAccount {
    id: string;
    name: string;
    category: string;
    simpleCategoryName: string;
    type: string;
    startDate: string;
    expiryDate: string;
  }
  const [activeAlphaMember, setActiveAlphaMember] = useState<AlphaMemberAccount | null>(() => {
    try {
      const stored = localStorage.getItem('alpha_member');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });



  // Advanced Banners, Visitor counter, and Notice/Newsletter states
  const [banners, setBanners] = useState<any[]>([]);
  const [visitorCount, setVisitorCount] = useState<number>(4785);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [announcements] = useState<string[]>([
    "🎉 ACADEMY NOTICE: Gym Yearly Memberships have an active 15% discount code applied this weekend!",
    "🏋️ NEW CARDIO SECTION: Fully calibrated high-grade commercial incline treadmills configured.",
    "📚 STUDY SPACE SHIELD: Silent double-cabin library seat clusters now live for booking blocks."
  ]);
  const [noticeBoard] = useState<any[]>([
    { title: "BGMI TOURNAMENT SLOTS", content: "Offline LAN tournament registrations are closing shortly. Register under gaming roster logs.", date: "June 06" },
    { title: "MEMBERSHIP FEE AMENDMENT", content: "Pricing structures revised to match custom locker additions. No hidden surcharge will apply.", date: "June 04" },
    { title: "LIBRARY EXTENDED SHIFT", content: "During national holiday intervals, library will stay active from 6:00 AM till 11:30 PM.", date: "May 31" }
  ]);

  // Handle subscriber feedback message
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);

  // Visitor statistic increment and pull
  const fetchBannersAndStats = async () => {
    try {
      const res = await fetch('/api/banners');
      if (res.ok) {
        const data = await res.json();
        setBanners(data || []);
      }
      
      const vRes = await fetch('/api/visitor-count/increment', { method: 'POST' });
      if (vRes.ok) {
        const vData = await vRes.json();
        setVisitorCount(vData.count);
      } else {
        const vResGet = await fetch('/api/visitor-count');
        if (vResGet.ok) {
          const vData = await vResGet.json();
          setVisitorCount(vData.count);
        }
      }
    } catch (e) {
      console.error("Failed to load visitor or banner sets", e);
    }
  };

  useEffect(() => {
    fetchBannersAndStats();
    
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter banners based on layout schedules and screen sizes
  const getFilteredBanners = (targetPageName: string) => {
    if (targetPageName === 'homepage') return [];

    return banners.filter(b => {
      // IsActive checking
      if (!b.isActive) return false;
      
      // Layout sizing
      const isMobileSize = windowWidth < 640;
      if (b.deviceType === 'mobile' && !isMobileSize) return false;
      if (b.deviceType === 'desktop' && isMobileSize) return false;

      // Activation schedule window checking
      const now = new Date();
      if (b.scheduleStartDate) {
        const start = new Date(b.scheduleStartDate);
        if (now < start) return false;
      }
      if (b.scheduleEndDate) {
        const end = new Date(b.scheduleEndDate);
        if (now > end) return false;
      }

      // Check targets and types: matching gym, library, gaming & cafe, tournament, or offers.
      // Filter out any mocktail, cafe, food, beverage, and drink related posters from Gym and Library sections.
      const isCafeMocktailContent = (() => {
        const title = (b.title || b.name || '').toLowerCase();
        const desc = (b.description || '').toLowerCase();
        const type = (b.type || '').toLowerCase();
        const target = (b.targetPage || '').toLowerCase();
        const keywords = ['mocktail', 'cafe', 'food', 'beverage', 'drink', 'refreshment', 'tea', 'coffee', 'cocktail', 'deluxe cafe', 'dine', 'dining', 'recipe', 'beverages', 'juices', 'menu', 'shake', 'smoothie'];
        return keywords.some(keyword => title.includes(keyword) || desc.includes(keyword) || type.includes(keyword) || target.includes(keyword));
      })();

      if (targetPageName === 'gym') {
        if (isCafeMocktailContent) return false;
        return b.targetPage === 'gym' || b.type === 'gym' || b.type === 'offer' || b.targetPage === 'offer';
      }

      if (targetPageName === 'library') {
        if (isCafeMocktailContent) return false;
        return b.targetPage === 'library' || b.type === 'library' || b.type === 'offer' || b.targetPage === 'offer';
      }

      if (targetPageName === 'gaming') {
        return b.targetPage === 'gaming' || b.type === 'gaming' || b.type === 'tournament' || b.targetPage === 'tournament' || b.type === 'offer' || b.targetPage === 'offer';
      }

      if (targetPageName === 'cafe') {
        return b.targetPage === 'cafe' || b.type === 'cafe' || b.type === 'offer' || b.targetPage === 'offer';
      }

      if (targetPageName === 'tournament') {
        return b.targetPage === 'tournament' || b.type === 'tournament';
      }

      if (targetPageName === 'offer') {
        return b.targetPage === 'offer' || b.type === 'offer' || b.type === 'festival' || b.targetPage === 'festival';
      }

      return b.targetPage === targetPageName;
    });
  };

  // Automatic sliding carousel controller state
  const [homeSlide, setHomeSlide] = useState(0);

  useEffect(() => {
    if (activeTab !== 'home') return;
    const activeBanners = getFilteredBanners('homepage');
    const totalCount = activeBanners.length > 0 ? activeBanners.length : 3;
    const interval = setInterval(() => {
      setHomeSlide(prev => (prev >= totalCount - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [activeTab, banners, windowWidth]);

  // Auto load data on mount
  const refreshAllDatabaseData = async () => {
    try {
      setLoading(true);
      // Re-load banners as well
      const bannerRes = await fetch('/api/banners');
      if (bannerRes.ok) {
        const bData = await bannerRes.json();
        setBanners(bData || []);
      }

      // If user is logged index, pull their distinct bookings
      if (currentUser) {
        const profileRes = await fetch(`/api/user/profile?email=${currentUser.email}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setBookings(profileData.bookings || []);
          setCurrentUser(profileData.user);
        }
      }

      // Load master lists for analytical tables
      const adminTokenVal = localStorage.getItem('alpha_admin_token') || '';
      const bookingsRes = await fetch('/api/admin/bookings', {
        headers: { 'x-admin-token': adminTokenVal }
      });
      if (bookingsRes.ok) {
        const bookingsList = await bookingsRes.json();
        if (currentUser?.role === 'admin') {
          setBookings(bookingsList);
        } else if (currentUser) {
          const userSpecific = bookingsList.filter((b: any) => b.userEmail.toLowerCase() === currentUser.email.toLowerCase());
          setBookings(userSpecific);
        }
      }

      const usersRes = await fetch('/api/admin/users', {
        headers: { 'x-admin-token': adminTokenVal }
      });
      if (usersRes.ok) {
        const usersList = await usersRes.json();
        setUsers(usersList);
      }
    } catch (e) {
      console.error("Failed to load local DB state", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllDatabaseData();
  }, [currentUser?.email, currentUser?.role]);

  // Auto-redirect to home tab upon successful membership activation has been disabled to keep the user on the overlay/page until they interact

  // Auth logins
  const handleLogIn = (user: UserType) => {
    setCurrentUser(user);
    setActiveTab('dashboard'); // take him immediately to dashboard
  };

  const handleLogOut = () => {
    localStorage.removeItem('alpha_admin_token');
    localStorage.removeItem('alpha_admin_user');
    setCurrentUser(null);
    setBookings([]);
    setActiveTab('home');
  };

  const handleBookingSuccess = (newBooking: Booking) => {
    // Re-pull and synchronize everything
    refreshAllDatabaseData();

    // Check if the purchase is an Alpha Membership category
    if (newBooking.category === 'gym' || newBooking.category === 'library' || newBooking.category === 'gaming') {
      let simpleName = 'Gym';
      let typeLabel = 'THE ALPHA GYM';
      if (newBooking.category === 'library') {
        simpleName = 'Library';
        typeLabel = 'THE ALPHA LIBRARY';
      } else if (newBooking.category === 'gaming') {
        simpleName = 'Gaming & Cafe';
        typeLabel = 'THE ALPHA GAMING & CAFE';
      }

      const newAccount: AlphaMemberAccount = {
        id: newBooking.id || 'ALPHA-' + Math.floor(Math.random() * 90000 + 10000),
        name: newBooking.userName || currentUser?.fullName || 'Valued Member',
        category: newBooking.category,
        simpleCategoryName: simpleName,
        type: typeLabel,
        startDate: newBooking.startDate || new Date().toISOString().substring(0, 10),
        expiryDate: newBooking.endDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().substring(0, 10)
      };

      // Set active alpha member details
      setActiveAlphaMember(newAccount);
      
      // Store to local persistent registry
      localStorage.setItem('alpha_member', JSON.stringify(newAccount));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-500 selection:text-black">
      
      {/* SOLID PREMIUM HEADER */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* BRAND LOGO */}
            <button 
              id="brand_logo_link"
              onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-1 focus:outline-none group cursor-pointer"
            >
              <div className="w-10 h-10 border-2 border-amber-500 flex items-center justify-center font-display font-medium text-amber-500 text-base tracking-tighter group-hover:scale-105 transition-transform">
                A
              </div>
              <div className="text-left">
                <span className="font-display font-bold text-sm sm:text-base tracking-[0.25em] text-[#f5f5f5] leading-none block">THE ALPHA</span>
              </div>
            </button>

            {/* DESKTOP NAV TABS */}
            <nav className="hidden md:flex space-x-1.5 text-xxs font-mono uppercase tracking-widest">
              <button
                id="dekstop_nav_home"
                onClick={() => setActiveTab('home')}
                className={`px-4.5 py-2.5 rounded-lg transition-all ${activeTab === 'home' ? 'text-amber-400 font-semibold bg-zinc-900/40 border border-zinc-900' : 'text-zinc-400 hover:text-white'}`}
              >
                Home
              </button>
              <button
                id="dekstop_nav_gym"
                onClick={() => setActiveTab('gym')}
                className={`px-4.5 py-2.5 rounded-lg transition-all ${activeTab === 'gym' ? 'text-amber-400 font-semibold bg-zinc-900/40 border border-zinc-900' : 'text-zinc-400 hover:text-white'}`}
              >
                Gym
              </button>
              <button
                id="dekstop_nav_library"
                onClick={() => setActiveTab('library')}
                className={`px-4.5 py-2.5 rounded-lg transition-all ${activeTab === 'library' ? 'text-amber-400 font-semibold bg-zinc-900/40 border border-zinc-900' : 'text-zinc-400 hover:text-white'}`}
              >
                Library
              </button>
              <button
                id="dekstop_nav_gaming"
                onClick={() => setActiveTab('gaming')}
                className={`px-4.5 py-2.5 rounded-lg transition-all ${activeTab === 'gaming' ? 'text-amber-400 font-semibold bg-zinc-900/40 border border-zinc-900' : 'text-zinc-400 hover:text-white'}`}
              >
                Gaming Zone
              </button>
              <button
                id="dekstop_nav_tournament"
                onClick={() => setActiveTab('tournament')}
                className={`px-4.5 py-2.5 rounded-lg transition-all ${activeTab === 'tournament' ? 'text-amber-400 font-semibold bg-zinc-900/40 border border-zinc-900' : 'text-zinc-400 hover:text-white'}`}
              >
                Tournament Zone
              </button>
              <button
                id="dekstop_nav_cafe"
                onClick={() => setActiveTab('cafe')}
                className={`px-4.5 py-2.5 rounded-lg transition-all ${activeTab === 'cafe' ? 'text-amber-400 font-semibold bg-zinc-900/40 border border-zinc-900' : 'text-zinc-400 hover:text-white'}`}
              >
                Deluxe Cafe
              </button>
              <button
                id="dekstop_nav_dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`px-4.5 py-2.5 rounded-lg transition-all flex items-center space-x-1 ${activeTab === 'dashboard' ? 'text-amber-400 font-semibold bg-zinc-900/40 border border-zinc-900' : 'text-zinc-400 hover:text-white'}`}
              >
                <User className="w-3.5 h-3.5 mr-1 text-amber-500" />
                <span>Portal</span>
              </button>
              
              {currentUser?.role === 'admin' && (
                <button
                  id="dekstop_nav_admin"
                  onClick={() => setActiveTab('admin')}
                  className={`px-4 py-2 bg-gradient-to-r from-amber-400/10 to-yellow-600/10 border border-amber-500/25 rounded-lg transition-all flex items-center space-x-1 text-amber-400 ${activeTab === 'admin' ? 'border-amber-400 bg-amber-400/20' : ''}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Admin Panel</span>
                </button>
              )}

              {/* MASTER SHOPPING CART BUTTON */}
              <button
                id="desktop_nav_cart"
                onClick={() => setIsCartOpen(true)}
                className="relative px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-white rounded-lg transition-all flex items-center space-x-1.5 font-mono text-xxs tracking-wider cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
                <span>Cart</span>
                {masterCart.length > 0 && (
                  <span className="bg-amber-500 text-black text-[9px] px-1.5 py-0.5 rounded-full font-sans font-black animate-pulse">
                    {masterCart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </nav>

            {/* MOBILE MENU TOGGLE & CART LINK */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                id="mobile_nav_cart"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 border border-zinc-800 rounded-lg text-white hover:bg-zinc-900 transition-colors flex items-center justify-center"
              >
                <ShoppingCart className="w-4 h-4 text-amber-500" />
                {masterCart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[8px] px-1.5 py-0.5 rounded-full font-black">
                    {masterCart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>

              <button
                id="mobile_nav_toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 px-2 border border-zinc-850 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile_drawer_overlay"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-950 border-b border-zinc-900 overflow-hidden text-xs uppercase font-mono tracking-wider text-zinc-400"
          >
            <div className="px-4 py-6 space-y-4">
              <button
                id="mobile_nav_home"
                onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 hover:text-amber-400"
              >
                Home Suite
              </button>
              <button
                id="mobile_nav_gym"
                onClick={() => { setActiveTab('gym'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 hover:text-amber-400"
              >
                THE ALPHA GYM
              </button>
              <button
                id="mobile_nav_library"
                onClick={() => { setActiveTab('library'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 hover:text-amber-400"
              >
                THE ALPHA LIBRARY
              </button>
              <button
                id="mobile_nav_gaming"
                onClick={() => { setActiveTab('gaming'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 hover:text-amber-400"
              >
                THE ALPHA GAMING ZONE
              </button>
              <button
                id="mobile_nav_tournament"
                onClick={() => { setActiveTab('tournament'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 hover:text-amber-400"
              >
                THE ALPHA TOURNAMENT ZONE
              </button>
              <button
                id="mobile_nav_cafe"
                onClick={() => { setActiveTab('cafe'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 hover:text-amber-400"
              >
                THE ALPHA DELUXE CAFE
              </button>
              <button
                id="mobile_nav_portal"
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-white font-bold flex items-center space-x-1.5"
              >
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Member Portal Closet</span>
              </button>
              {currentUser?.role === 'admin' && (
                <button
                  id="mobile_nav_admin"
                  onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-amber-400 tracking-widest font-semibold"
                >
                  Admin Workspace Access
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE HERO ACCENT GRID OVERLAY */}
      <div className="absolute inset-x-0 h-[500px] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent pointer-events-none z-0"></div>

      {/* MASTER CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HOMEPAGE INTRO & 3 TIER CARD SLATE */}
          {activeTab === 'home' && (
            <motion.div
              id="homepage_index_view"
              key="tab-home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-12 sm:py-20 space-y-16"
            >
              {/* Alpha Member Welcome Message */}
              {activeAlphaMember && (
                <motion.div
                  id="alpha_member_welcome_banner"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-xl mx-auto p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/50 text-center space-y-2 relative overflow-hidden shadow-xl"
                >
                  <div className="absolute top-0 right-0 p-1 bg-amber-500 text-[8px] font-mono font-bold uppercase tracking-wider py-0.5 px-3 rounded-bl text-black">
                    Active Alpha Member
                  </div>
                  <h3 className="text-sm font-sans font-extrabold text-white tracking-wide">
                    Welcome Back, <span className="text-amber-400 font-black">{activeAlphaMember.name}</span>
                  </h3>
                  <div className="text-xs font-mono font-medium text-zinc-400">
                    Membership: <strong className="text-white uppercase">{activeAlphaMember.simpleCategoryName}</strong>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    ID: <span className="text-zinc-400 uppercase font-bold">{activeAlphaMember.id}</span>
                  </div>
                </motion.div>
              )}

              {/* Premium Brand Hero section */}
              <div className="text-center space-y-6 max-w-4xl mx-auto py-4">
                <h1 className="font-display text-5xl sm:text-7xl font-extrabold tracking-widest text-[#f5f5f5] uppercase">
                  THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600">ALPHA</span>
                </h1>
                
                <h2 className="text-xs sm:text-base font-mono font-medium text-amber-500 tracking-[0.2em] uppercase">
                  One Destination For Fitness, Learning & Gaming
                </h2>
              </div>

              {/* THE 3 GORGEOUS CARDS */}
              <div id="home_branch_cards_grid" className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* BRANCH CARD 1: THE ALPHA GAMING & CAFE */}
                <motion.div 
                  id="home_branch_card_gaming"
                  whileHover={{ y: -8, scale: 1.01, boxShadow: "0 0 30px rgba(197, 160, 89, 0.25)" }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setActiveTab('gaming')}
                  className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[380px] shadow-xl hover:border-amber-500/50 group cursor-pointer transition-colors duration-300"
                >
                  <div className="absolute top-0 right-0 p-5 opacity-5 text-amber-500 group-hover:scale-110 transition-transform">
                    <Gamepad2 className="w-32 h-32" />
                  </div>

                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#c5a059] uppercase block mb-3.5 opacity-90">PS5 Gaming • Tournaments • Cafe</span>
                    <h2 className="font-display text-2xl font-bold text-white mt-2 group-hover:text-amber-400 transition-colors">THE ALPHA GAMING & CAFE</h2>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed mt-4 font-light">
                      Ultrafast lag-shielded gaming stations, private tournament battle grids, discord integration, custom rosters registration for BGMI, Valorant, and CS2, plus fine-dining cafe menus.
                    </p>
                  </div>

                  <div className="pt-8">
                    <div
                      id="card_trigger_gaming_btn"
                      className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold group-hover:translate-x-1.5 transition-transform"
                    >
                      <span>Join Gaming Arena</span>
                      <ChevronRight className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                </motion.div>

                {/* BRANCH CARD 2: THE ALPHA LIBRARY */}
                <motion.div 
                  id="home_branch_card_library"
                  whileHover={{ y: -8, scale: 1.01, boxShadow: "0 0 30px rgba(197, 160, 89, 0.25)" }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setActiveTab('library')}
                  className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[380px] shadow-xl hover:border-amber-500/50 group cursor-pointer transition-colors duration-300"
                >
                  <div className="absolute top-0 right-0 p-5 opacity-5 text-amber-500 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-32 h-32" />
                  </div>

                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#c5a059] uppercase block mb-3.5 opacity-90">Study • Reading Room • Seat Booking</span>
                    <h2 className="font-display text-2xl font-bold text-white mt-2 group-hover:text-amber-400 transition-colors">THE ALPHA LIBRARY</h2>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed mt-4 font-light">
                      Silent intellectual capsule room designed for dedicated exam preparation or research logs, complete with sound-shielded workspace cells, raw optical fiber Wi-Fi networks, and printing.
                    </p>
                  </div>

                  <div className="pt-8">
                    <div
                      id="card_trigger_library_btn"
                      className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold group-hover:translate-x-1.5 transition-transform"
                    >
                      <span>Access Library Booking</span>
                      <ChevronRight className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                </motion.div>

                {/* BRANCH CARD 3: THE ALPHA GYM */}
                <motion.div 
                  id="home_branch_card_gym"
                  whileHover={{ y: -8, scale: 1.01, boxShadow: "0 0 30px rgba(197, 160, 89, 0.25)" }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setActiveTab('gym')}
                  className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[380px] shadow-xl hover:border-amber-500/50 group cursor-pointer transition-colors duration-300"
                >
                  <div className="absolute top-0 right-0 p-5 opacity-5 text-amber-500 group-hover:scale-110 transition-transform">
                    <Dumbbell className="w-32 h-32" />
                  </div>

                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#c5a059] uppercase block mb-3.5 opacity-90">Fitness • Membership • Training</span>
                    <h2 className="font-display text-2xl font-bold text-white mt-2 group-hover:text-amber-400 transition-colors">THE ALPHA GYM</h2>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed mt-4 font-light">
                      Heavy iron weights training colosseum equipped with bespoke veteran coaching support, advanced cardiovascular sensors, locker systems, and full biometric tracking.
                    </p>

                    <div className="mt-4 pt-4 border-t border-zinc-900 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">📞 Gym Contact:</span>
                      <a 
                        href="tel:7003008536" 
                        onClick={(e) => e.stopPropagation()} 
                        className="text-xs font-mono font-bold text-amber-400 hover:underline"
                        title="Click to call on mobile devices"
                      >
                        7003008536
                      </a>
                    </div>
                  </div>

                  <div className="pt-8">
                    <div
                      id="card_trigger_gym_btn"
                      className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold group-hover:translate-x-1.5 transition-transform"
                    >
                      <span>Access Gym Booking</span>
                      <ChevronRight className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                </motion.div>

              </div>
            </motion.div>
          )}

          {/* TAB: MEMBERSHIP SELECTION FOR ALPHA */}
          {activeTab === 'membership-select' && (
            <motion.div
              id="view_membership_select"
              key="tab-membership-select"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="py-12 space-y-8 max-w-4xl mx-auto"
            >
              <div className="text-center space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 font-mono text-[10px] tracking-widest uppercase">
                  Alpha Executive Access
                </span>
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-widest text-white uppercase">
                  SELECT YOUR ALPHA SPACE
                </h1>
                <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
                  Apply for the premium subscription layer. Select which specialized chamber you want to register under to unlock full member-only amenities.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                
                {/* 1. THE ALPHA GYM */}
                <button
                  id="select_alpha_gym"
                  onClick={() => setActiveTab('gym')}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-amber-500/35 rounded-3xl p-6 text-left flex flex-col justify-between min-h-[220px] transition-all group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute -right-4 -bottom-4 text-zinc-900/10 opacity-30 group-hover:scale-110 transition-transform">
                    <Dumbbell className="w-24 h-24 text-amber-500" />
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-6">
                      <Dumbbell className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-extrabold text-white text-base uppercase tracking-wider">
                      Option 1: THE ALPHA GYM
                    </h3>
                    <p className="text-xxs text-zinc-500 mt-2 leading-relaxed">
                      Heavy power colosseum, premium trainer assistance, biometric tracking.
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                      <span>📞 Gym Contact:</span>
                      <a 
                        href="tel:7003008536" 
                        onClick={(e) => e.stopPropagation()} 
                        className="text-amber-400 font-bold hover:underline"
                      >
                        7003008536
                      </a>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono uppercase text-amber-500 font-bold tracking-wider pt-4 inline-flex items-center gap-1">
                    <span>Apply Gym Membership</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* 2. THE ALPHA LIBRARY */}
                <button
                  id="select_alpha_library"
                  onClick={() => setActiveTab('library')}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-amber-500/35 rounded-3xl p-6 text-left flex flex-col justify-between min-h-[220px] transition-all group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute -right-4 -bottom-4 text-zinc-900/10 opacity-30 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-24 h-24 text-amber-500" />
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-6">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-extrabold text-white text-base uppercase tracking-wider">
                      Option 2: THE ALPHA LIBRARY
                    </h3>
                    <p className="text-xxs text-zinc-500 mt-2 leading-relaxed">
                      Silent reading capsules, ergonomic desks, hi-speed fiber WiFi networks.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono uppercase text-amber-500 font-bold tracking-wider pt-4 inline-flex items-center gap-1">
                    <span>Apply Library Membership</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* 3. THE ALPHA GAMING & CAFE */}
                <button
                  id="select_alpha_gaming"
                  onClick={() => setActiveTab('gaming')}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-amber-500/35 rounded-3xl p-6 text-left flex flex-col justify-between min-h-[220px] transition-all group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute -right-4 -bottom-4 text-zinc-900/10 opacity-30 group-hover:scale-110 transition-transform">
                    <Gamepad2 className="w-24 h-24 text-amber-500" />
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-6">
                      <Gamepad2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-extrabold text-white text-base uppercase tracking-wider">
                      Option 3: THE ALPHA GAMING & CAFE
                    </h3>
                    <p className="text-xxs text-zinc-500 mt-2 leading-relaxed">
                      esports console setups, PS5 multi-hour play, gourmet custom cafe menu.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono uppercase text-amber-500 font-bold tracking-wider pt-4 inline-flex items-center gap-1">
                    <span>Apply Gaming Membership</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>

              </div>

              <div className="text-center pt-6">
                <button
                  id="btn_cancel_membership_select"
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xxs font-mono uppercase text-zinc-500 hover:text-white transition-colors"
                >
                  Cancel & Return to Portal Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 2: GYM REGISTRATION WORKSPACE */}
          {activeTab === 'gym' && (
            <motion.div id="view_gym_tab" key="tab-gym" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GymSection 
                currentUser={currentUser} 
                onBookingSuccess={handleBookingSuccess} 
                onOpenDashboard={() => setActiveTab('dashboard')} 
                banners={getFilteredBanners('gym')}
                masterCart={masterCart}
                addToMasterCart={addToMasterCart}
                removeFromMasterCart={removeFromMasterCart}
                openCartDrawer={() => setIsCartOpen(true)}
              />
            </motion.div>
          )}

          {/* TAB 3: LIBRARY SEAT BOOKING WORKSPACE */}
          {activeTab === 'library' && (
            <motion.div id="view_library_tab" key="tab-library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LibrarySection 
                currentUser={currentUser} 
                onBookingSuccess={handleBookingSuccess} 
                onOpenDashboard={() => setActiveTab('dashboard')} 
                banners={getFilteredBanners('library')}
                masterCart={masterCart}
                addToMasterCart={addToMasterCart}
                removeFromMasterCart={removeFromMasterCart}
                openCartDrawer={() => setIsCartOpen(true)}
              />
            </motion.div>
          )}

          {/* TAB 4: GAMING ARENA TOURNAY BRACKETS */}
          {activeTab === 'gaming' && (
            <motion.div id="view_gaming_tab" key="tab-gaming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GamingSection 
                currentUser={currentUser} 
                onBookingSuccess={handleBookingSuccess} 
                onOpenDashboard={() => setActiveTab('dashboard')} 
                banners={getFilteredBanners('gaming')}
                masterCart={masterCart}
                addToMasterCart={addToMasterCart}
                removeFromMasterCart={removeFromMasterCart}
                openCartDrawer={() => setIsCartOpen(true)}
                updateMasterCartQty={updateMasterCartQty}
              />
            </motion.div>
          )}

          {/* TAB 4b: DELUXE CAFE MENU */}
          {activeTab === 'cafe' && (
            <motion.div id="view_cafe_tab" key="tab-cafe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CafeMenuSection 
                currentUser={currentUser} 
                onBookingSuccess={handleBookingSuccess} 
                onOpenDashboard={() => setActiveTab('dashboard')} 
                masterCart={masterCart}
                addToMasterCart={addToMasterCart}
                removeFromMasterCart={removeFromMasterCart}
                openCartDrawer={() => setIsCartOpen(true)}
                updateMasterCartQty={updateMasterCartQty}
              />
            </motion.div>
          )}

          {/* TAB 4c: TOURNAMENT ZONE */}
          {activeTab === 'tournament' && (
            <motion.div id="view_tournament_tab" key="tab-tournament" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TournamentSection 
                currentUser={currentUser} 
                onBookingSuccess={handleBookingSuccess} 
                onOpenDashboard={() => setActiveTab('dashboard')} 
              />
            </motion.div>
          )}

          {/* TAB 5: USER PORTAL AND BILLING CREDENTIALS */}
          {activeTab === 'dashboard' && (
            <motion.div id="view_dashboard_tab" key="tab-dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UserDashboard 
                currentUser={currentUser}
                onLogIn={handleLogIn}
                onLogOut={handleLogOut}
                bookings={bookings}
                onRefreshData={refreshAllDatabaseData}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                }}
              />
            </motion.div>
          )}

          {/* TAB 6: ADMIN STUDIO OVERLAY */}
          {activeTab === 'admin' && (
            <motion.div id="view_admin_tab" key="tab-admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminPanel 
                bookings={bookings} 
                users={users} 
                onRefreshData={refreshAllDatabaseData} 
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                }} 
                onAdminLogin={(adminUser: any, token: string) => {
                  localStorage.setItem('alpha_admin_token', token);
                  localStorage.setItem('alpha_admin_user', JSON.stringify(adminUser));
                  setCurrentUser(adminUser);
                }}
                onAdminLogout={() => {
                  localStorage.removeItem('alpha_admin_token');
                  localStorage.removeItem('alpha_admin_user');
                  if (currentUser?.role === 'admin') {
                    setCurrentUser(null);
                  }
                  setActiveTab('home');
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* SOLID LUXURY WEB FOOTER COMPONENT */}
      <footer id="alpha_global_footer" className="bg-[#050505] border-t border-zinc-900 py-16 mt-20 text-zinc-400 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* TOP FOOTER ROW (MAP EMBED & META) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMN 1: THE ALPHA CONCEPT (span 4) */}
            <div className="lg:col-span-4 space-y-5 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border-2 border-amber-500 rounded flex items-center justify-center font-display font-black text-amber-500 text-sm">
                  A
                </div>
                <div>
                  <h3 className="font-display font-extrabold tracking-widest text-[#f5f5f5] text-sm uppercase leading-none">THE ALPHA</h3>
                  <span className="text-[10px] text-zinc-500 block font-mono mt-1">Fitness | Learning | Gaming</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                The absolute premium modern oasis in Purnea, Bihar. Integrating heavy colosseum gym coaching, distraction-free reading chambers, and esports performance gaming consoles with custom-refined cafe menus.
              </p>
              
              {/* SOCIAL MEDIA GLOBE WITH ICONS */}
              <div className="space-y-2">
                <h4 className="text-[9px] uppercase tracking-widest text-zinc-600 block">ALPHA SOCIAL ECOSYSTEM</h4>
                <div className="flex items-center space-x-4">
                  <a href="https://instagram.com/alphagamingcafe" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-amber-400 transition-colors" title="Instagram">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.281.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.44-.645 1.44-1.44s-.644-1.44-1.44-1.44z"/>
                    </svg>
                  </a>
                  <a href="https://facebook.com/thealphagroup" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-amber-400 transition-colors" title="Facebook">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                    </svg>
                  </a>
                  <a href="https://wa.me/919472835855" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-amber-400 transition-colors" title="WhatsApp">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm5.835-3.273c1.682.998 3.328 1.517 5.163 1.518 5.568 0 10.101-4.52 10.104-10.08.002-2.695-1.044-5.228-2.946-7.132-1.903-1.905-4.433-2.952-7.131-2.953-5.572 0-10.104 4.522-10.107 10.081-.001 1.933.518 3.528 1.52 5.17L1.625 22l4.267-1.273z"/>
                    </svg>
                  </a>
                  <a href="https://youtube.com/thealphagroup" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-amber-400 transition-colors" title="YouTube">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.163s-.233-1.64-.946-2.363c-.905-.947-1.919-.952-2.383-1.007C16.837 2.5 12 2.5 12 2.5s-4.837 0-8.169.293c-.464.055-1.478.06-2.383 1.007-.713.723-.946 2.363-.946 2.363S.216 8.1 0 10.038v3.924c.216 1.937.286 3.875.286 3.875s.233 1.64.946 2.363c.905.947 2.083.917 2.61.101C5.702 20.15 12 20.15 12 20.15s4.837 0 8.169-.293c.464-.055 1.478-.06 2.383-1.007.713-.723.946-2.363.946-2.363s.202-1.938.202-3.875v-3.924c0-1.938-.202-3.875-.202-3.875zM9.545 15.568V8.132l6.518 3.72-6.518 3.716z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* COLUMN 2: QUICK NAVIGATION TABS (span 2) */}
            <div className="lg:col-span-2 space-y-4 text-left">
              <h4 className="text-[10px] font-mono tracking-widest text-[#f5f5f5] uppercase font-bold">DIRECTORY</h4>
              <ul className="space-y-2 text-xxs font-mono text-zinc-400">
                <li><button onClick={() => { setActiveTab('home'); window.scrollTo(0, 0); }} className="hover:text-amber-400 text-left block transition-colors">Home Landing</button></li>
                <li><button onClick={() => { setActiveTab('gym'); window.scrollTo(0, 0); }} className="hover:text-amber-400 text-left block transition-colors">Gym Colosseum</button></li>
                <li><button onClick={() => { setActiveTab('library'); window.scrollTo(0, 0); }} className="hover:text-amber-400 text-left block transition-colors">Quiet Library</button></li>
                <li><button onClick={() => { setActiveTab('gaming'); window.scrollTo(0, 0); }} className="hover:text-amber-400 text-left block transition-colors">Gaming Zones</button></li>
                <li><button onClick={() => { setActiveTab('cafe'); window.scrollTo(0, 0); }} className="hover:text-amber-400 text-left block transition-colors">Deluxe Cafe</button></li>
                <li><button onClick={() => { setActiveTab('dashboard'); window.scrollTo(0, 0); }} className="hover:text-amber-400 text-left block transition-colors">Membership Portal</button></li>
                <li><button onClick={() => { document.getElementById('home_interactive_bento_grid')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-amber-400 text-left block transition-colors">Contact Us</button></li>
                <li><button id="footer_admin_login_link" onClick={() => { setActiveTab('admin'); window.scrollTo(0, 0); }} className="hover:text-amber-400 text-left block transition-colors text-zinc-500 font-bold border-t border-zinc-900 pt-1.5 mt-1.5">Admin Login</button></li>
                <li><span className="text-zinc-650 cursor-not-allowed">Privacy Policy</span></li>
                <li><span className="text-zinc-650 cursor-not-allowed">Terms of Service</span></li>
              </ul>
            </div>

            {/* COLUMN 3: CONTACT TELEKINESIS DETAILS (span 3) */}
            <div className="lg:col-span-3 space-y-4 text-left">
              <h4 className="text-[10px] font-mono tracking-widest text-[#f5f5f5] uppercase font-bold">ALPHA HELPDESK</h4>
              <div className="space-y-3.5 text-xxs font-mono text-zinc-400 leading-relaxed">
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-650 block uppercase tracking-widest">OUTPOST LANDMARKS</span>
                  <p className="font-light leading-normal">
                    2nd Floor, Above SBI (SME Branch) &amp; The Alpha Gym,<br />
                    Opposite Hotel Grand Palace,<br />
                    Sanoli Chowk, Gulabbagh,<br />
                    Purnea, Bihar – 854326
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-[8px] text-zinc-650 block uppercase tracking-widest">HOTLINES TELEPHONY</span>
                  <div>
                    <span className="text-zinc-500 font-mono">📞 Gym Contact: </span>
                    <a href="tel:7003008536" className="text-zinc-200 hover:text-amber-400 font-extrabold pb-0.5">7003008536</a>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-mono">Library Cell: </span>
                    <a href="tel:+919341152967" className="text-zinc-200 hover:text-amber-400 font-extrabold">+91 9341152967</a>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-mono">Gaming Arena: </span>
                    <a href="tel:+919472835855" className="text-zinc-200 hover:text-amber-400 font-extrabold">+91 9472835855</a>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-650 block uppercase tracking-widest font-bold">CORRESPONDENCE LOGS</span>
                  <a href="mailto:thealphalibrary@gmail.com" className="hover:text-amber-400 block break-all">thealphalibrary@gmail.com</a>
                  <a href="mailto:connect@thealphagroup.in" className="hover:text-amber-400 block break-all">connect@thealphagroup.in</a>
                  <a href="https://www.thealphagroup.in" target="_blank" rel="noreferrer" className="text-amber-500 underline block mt-1 font-bold">www.thealphagroup.in</a>
                </div>
              </div>
            </div>

            {/* COLUMN 4: EMBEDDED GOOGLE MAP (span 3) */}
            <div className="lg:col-span-3 space-y-4 text-left">
              <h4 className="text-[10px] font-mono tracking-widest text-[#f5f5f5] uppercase font-bold">EMBEDDED COORDS MAP</h4>
              <div className="border border-zinc-900 rounded-2xl overflow-hidden h-[120px] relative w-full bg-zinc-950">
                <iframe 
                  title="The Alpha Location Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3593.748641470438!2d87.514083!3d25.778841!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eff96aa8ca4711%3A0xe54e5884bbbb552e!2sSanoli%20Chowk%2C%20Gulabbagh%2C%20Purnea%2C%20Bihar%20854326!5e0!3m2!1sen!2sin!4v1717612000000!5m2!1sen!2sin" 
                  className="w-full h-full border-0 opacity-80 hover:opacity-100 transition-opacity" 
                  allowFullScreen={true} 
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              <a 
                href="https://maps.google.com/?q=The+Alpha+Gym,+Above+SBI+SME+Branch,+Sanoli+Chowk,+Gulabbagh,+Purnea,+Bihar+854326"
                target="_blank" 
                rel="noreferrer"
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl flex items-center justify-center space-x-2 text-xxs font-mono uppercase tracking-widest transition-all shadow-md"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Get Directions Radar</span>
              </a>
            </div>

          </div>

          {/* LOWER FOOTER RIGHTS */}
          <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-zinc-600">
            <p className="tracking-wider text-center md:text-left select-none uppercase">
              &copy; 2026 THE ALPHA. ALL RIGHTS RESERVED // REGISTRATION ID: GSTIN 07ALPH9988G1Z3
            </p>
            <p className="uppercase text-[9px] tracking-[0.2em] text-zinc-500 font-bold select-none">
              DESIGNED & MANAGED BY <span className="text-amber-500 text-[10px]">THE ALPHA GROUP</span>
            </p>
          </div>

        </div>
      </footer>

      {/* PERSISTENT FLOATING QUICK COMMUNICATIONS CLUSTER */}
      <div id="alpha_floating_telecomm" className="fixed bottom-6 right-6 z-[9999] flex flex-col space-y-3.5 select-none pointer-events-auto">
        {/* Call Now button */}
        <a 
          href="tel:+919472835855"
          className="p-3.5 bg-zinc-950 text-white rounded-full border border-zinc-900 shadow-xl shadow-black/80 hover:border-amber-500/50 hover:text-amber-400 hover:scale-105 transition-all flex items-center justify-center group"
          title="Call Now hotkey"
        >
          <Phone className="w-5 h-5 text-amber-500" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-mono text-[9px] uppercase tracking-widest pl-0 group-hover:pl-2 text-zinc-350">
            CALL_DESK
          </span>
        </a>

        {/* Floating WhatsApp button */}
        <a 
          href="https://wa.me/919472835855?text=Hello%20The%20Alpha%2C%20I'd%20like%20to%20inquire%20about%20your%20Gym%2C%20Library%2C%20or%20Gaming%20selections."
          target="_blank"
          rel="noreferrer"
          className="p-3.5 bg-zinc-950 text-white rounded-full border border-zinc-900 shadow-xl shadow-black/80 hover:border-green-500/50 hover:text-green-400 hover:scale-105 transition-all flex items-center justify-center group"
          title="WhatsApp Hotline"
        >
          <svg className="w-5 h-5 fill-green-500" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm5.835-3.273c1.682.998 3.328 1.517 5.163 1.518 5.568 0 10.101-4.52 10.104-10.08.002-2.695-1.044-5.228-2.946-7.132-1.903-1.905-4.433-2.952-7.131-2.953-5.572 0-10.104 4.522-10.107 10.081-.001 1.933.518 3.528 1.52 5.17L1.625 22l4.267-1.273z"/>
          </svg>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-mono text-[9px] uppercase tracking-widest pl-0 group-hover:pl-2 text-zinc-350">
            WHATSAPP
          </span>
        </a>
      </div>





      {/* ----------------- UNIFIED MASTER SHOPPING CART DRAWER ----------------- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              id="cart_backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9200] cursor-pointer"
            />

            {/* Sliding Panel */}
            <motion.div
              id="cart_drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-[#0b0c10] border-l border-zinc-900 shadow-2xl z-[9201] flex flex-col focus:outline-none"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-zinc-900 bg-zinc-950/50 flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <ShoppingCart className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h3 className="text-sm font-display font-black uppercase tracking-wider text-white">
                    Unified Shopping Cart
                  </h3>
                </div>
                <button
                  id="close_cart_drawer_btn"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 border border-zinc-900 hover:border-zinc-700 hover:text-red-400 rounded-lg text-zinc-400 transition-colors cursor-pointer"
                  aria-label="Close Shopping Cart"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {masterCart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                    <div className="w-16 h-16 rounded-full border border-zinc-900 bg-zinc-950/40 flex items-center justify-center text-zinc-650">
                      <ShoppingCart className="w-8 h-8 text-zinc-600" />
                    </div>
                    <div>
                      <h4 className="font-display text-xs font-semibold uppercase text-zinc-300 tracking-wider">Your Shopping Cart is Empty</h4>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase leading-relaxed">
                        Add Gym Memberships, Study Room Desks, Gaming Screens or Cafe Refreshments to checkout your combined invoice.
                      </p>
                    </div>
                    <button
                      id="cart_empty_btn"
                      onClick={() => { setIsCartOpen(false); setActiveTab('gym'); }}
                      className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-amber-500 font-mono text-xxs uppercase tracking-widest border border-zinc-800 rounded-lg transition-all cursor-pointer"
                    >
                      Browse Selections
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Item Roster list */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Cart items ({masterCart.length})</span>
                      
                      {masterCart.map((item) => (
                        <div 
                          key={item.id} 
                          className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2 relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1 text-left">
                              {/* Category identifier tag */}
                              <span className={`inline-block px-1.5 py-0.5 text-[8.5px] font-mono uppercase rounded font-bold ${
                                item.category === 'gym' ? 'bg-amber-400/15 text-amber-400 border border-amber-400/20' :
                                item.category === 'library' ? 'bg-blue-400/15 text-blue-400 border border-blue-400/20' :
                                item.category === 'gaming' ? 'bg-purple-400/15 text-purple-400 border border-purple-400/20' :
                                'bg-green-400/15 text-green-400 border border-green-400/20'
                              }`}>
                                {item.category}
                              </span>
                              <h5 className="text-xxs sm:text-xs font-sans font-extrabold text-white leading-snug">
                                {item.name}
                              </h5>
                              <p className="text-[10px] font-mono font-bold text-zinc-500 mt-0.5">
                                ₹{item.price.toLocaleString()} each
                              </p>
                            </div>
                            
                            {/* Delete button (Trash icon) */}
                            <button
                              id={`remove_cart_item_${item.id}`}
                              onClick={() => removeFromMasterCart(item.id)}
                              className="p-1 hover:text-red-400 text-zinc-650 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
                            </button>
                          </div>

                          {/* Control Actions footer row */}
                          <div className="pt-2 border-t border-zinc-900/60 flex justify-between items-center">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase font-semibold">Quantity:</span>
                            
                            {/* Adjust numeric quantities */}
                            <div className="flex items-center space-x-2.5">
                              <button
                                id={`dec_qty_btn_${item.id}`}
                                onClick={() => updateMasterCartQty(item.id, -1)}
                                className="w-6 h-6 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white transition-colors cursor-pointer"
                              >
                                <Minus className="w-3 h-3 text-zinc-400" />
                              </button>
                              <span className="text-xs font-mono font-black text-white px-1">
                                {item.quantity}
                              </span>
                              <button
                                id={`inc_qty_btn_${item.id}`}
                                onClick={() => updateMasterCartQty(item.id, 1)}
                                className="w-6 h-6 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3 text-zinc-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Surcharges Subtotals breakdown */}
                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2 text-xxs font-mono text-zinc-500 text-left">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block border-b border-zinc-900 pb-1.5 mb-1.5 font-bold">Purchase Summary Breakdown</span>
                      {cartSubtotals.gym > 0 && (
                        <div className="flex justify-between">
                          <span>Gym Membership Total</span>
                          <span className="text-white">₹{cartSubtotals.gym.toLocaleString()}</span>
                        </div>
                      )}
                      {cartSubtotals.library > 0 && (
                        <div className="flex justify-between">
                          <span>Library Seat Space Total</span>
                          <span className="text-white">₹{cartSubtotals.library.toLocaleString()}</span>
                        </div>
                      )}
                      {cartSubtotals.gaming > 0 && (
                        <div className="flex justify-between">
                          <span>Gaming bookings Total</span>
                          <span className="text-white">₹{cartSubtotals.gaming.toLocaleString()}</span>
                        </div>
                      )}
                      {cartSubtotals.cafe > 0 && (
                        <div className="flex justify-between">
                          <span>Deluxe Cafe Products Total</span>
                          <span className="text-white">₹{cartSubtotals.cafe.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t border-dashed border-zinc-900 pt-2 flex justify-between font-bold text-amber-500 text-xs">
                        <span>Combined Grand Total</span>
                        <span>₹{cartSubtotals.grandTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Customer Registry Form fields inside Cart panel */}
                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3 text-left">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block border-b border-zinc-900 pb-1.5 font-bold">Customer Registry Verification</span>
                      
                      {/* Name input */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">Full Name</label>
                        <input
                          id="cart_fullname_input"
                          type="text"
                          required
                          placeholder="Robert Drake"
                          value={cartCheckoutName}
                          onChange={(e) => setCartCheckoutName(e.target.value)}
                          className="w-full bg-zinc-900/50 border border-zinc-900 focus:border-amber-500 focus:outline-none px-3 py-2 text-xs text-white rounded-lg transition-all"
                        />
                      </div>

                      {/* Phone input */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">Mobile Number</label>
                        <input
                          id="cart_mobile_input"
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="9472835855"
                          value={cartCheckoutMobile}
                          onChange={(e) => setCartCheckoutMobile(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full bg-zinc-900/50 border border-zinc-900 focus:border-amber-500 focus:outline-none px-3 py-2 text-xs text-white rounded-lg transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Checkout Action footer */}
              {masterCart.length > 0 && (
                <div className="p-6 border-t border-zinc-900 bg-zinc-950/60 space-y-3.5">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5 text-left">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Payable Total</span>
                      <span className="text-[10px] font-mono text-zinc-600 block">Express Auto-Activation</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-display font-black text-amber-400 tracking-tight">
                        ₹{cartSubtotals.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    id="cart_submit_checkout_btn"
                    disabled={!cartCheckoutName.trim() || cartCheckoutMobile.trim().length < 10}
                    onClick={() => {
                      setShowCartPayment(true);
                      setIsCartOpen(false); // Close cart popup/drawer automatically!
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 disabled:from-zinc-900 disabled:to-zinc-900 disabled:border-zinc-850 border border-transparent disabled:text-zinc-500 text-black font-semibold text-xxs font-mono uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Proceed to Pay ₹{cartSubtotals.grandTotal.toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ----------------- GLOBAL UNIFIED CART PAYMENT MODAL ----------------- */}
      <PaymentModal
        isOpen={showCartPayment}
        onClose={() => {
          setShowCartPayment(false);
          setIsCartOpen(true); // Cart remains available if closed/cancelled
        }}
        amount={cartSubtotals.grandTotal}
        itemName="SECURE COMBINED CLUB PASSAGE"
        category="gaming" // Leverages Cart Booking list rendering Support
        userName={cartCheckoutName}
        userEmail={currentUser?.email || cartCheckoutEmail || 'guest@thealpha.com'}
        userMobile={cartCheckoutMobile}
        userId={currentUser?.id || 'usr_' + Math.random().toString(36).substring(2, 9)}
        categoryDetails={{
          gamingDetails: {
            isCartBooking: true,
            isOfferApplied: false,
            isMonthlyPass: false,
            screenSize: 'Combined Space' as any,
            playersCount: 1,
            cartItems: masterCart.map(item => ({
              planId: item.id,
              name: item.name,
              screenSize: item.details?.screenSize || 'N/A',
              playersCount: item.details?.playersCount || 1,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
              category: item.category,
              details: item.details
            }))
          }
        }}
        onPaymentSuccess={(newBooking) => {
          setShowCartPayment(false);
          setIsCartOpen(false);
          clearMasterCart();
          handleBookingSuccess(newBooking);
          setActiveTab('home'); // Redirect instantly to Homepage
        }}
      />

    </div>
  );
}
