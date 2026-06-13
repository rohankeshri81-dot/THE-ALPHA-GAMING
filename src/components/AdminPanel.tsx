import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck,
  Users, 
  TrendingUp, 
  Calendar, 
  Download, 
  Dumbbell, 
  BookOpen, 
  Gamepad2, 
  CreditCard,
  Building,
  RefreshCw,
  Trash2,
  Lock,
  PieChart,
  FileText,
  Upload,
  Image,
  Film,
  Star,
  Eye,
  EyeOff,
  Edit3,
  CheckCircle,
  X,
  Search,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { Booking, User, SystemStats, GamingPlan } from '../types';

interface AdminPanelProps {
  bookings: Booking[];
  users: User[];
  onRefreshData: () => void;
  onSelectTab: (tab: string) => void;
  onAdminLogin?: (user: any, token: string) => void;
  onAdminLogout?: () => void;
}

export default function AdminPanel({
  bookings,
  users,
  onRefreshData,
  onSelectTab,
  onAdminLogin,
  onAdminLogout
}: AdminPanelProps) {
  // Shadow and intercept standard global fetch to dynamically append the secure x-admin-token header
  const fetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const token = localStorage.getItem('alpha_admin_token');
    const headers = new Headers(init?.headers || {});
    if (token) {
      headers.set('x-admin-token', token);
    }
    return globalThis.fetch(url, {
      ...init,
      headers
    });
  };

  // Stats state managers
  const [stats, setStats] = useState<SystemStats>({
    totalMembers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    activeMemberships: 0
  });

  // Authentication configuration
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return !!localStorage.getItem('alpha_admin_token');
  });
  const [isSignUpPage, setIsSignUpPage] = useState(false);
  const [hasAdminAccount, setHasAdminAccount] = useState(true);
  const [checkingAdminAccount, setCheckingAdminAccount] = useState(true);

  // Form states
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // On mount, verify with the database if any admin account is registered
  useEffect(() => {
    const checkAdminExist = async () => {
      try {
        const response = await fetch('/api/admin/auth/check');
        if (response.ok) {
          const data = await response.json();
          setHasAdminAccount(data.registered);
          if (!data.registered) {
            setIsSignUpPage(true);
          }
        }
      } catch (err) {
        console.error('Error checking admin presence:', err);
      } finally {
        setCheckingAdminAccount(false);
      }
    };
    checkAdminExist();
  }, [isAdminLoggedIn]);

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    if (!signupUsername || !signupPassword) {
      setSignupError('All fields are required.');
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch('/api/admin/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: signupUsername, password: signupPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        setSignupError(data.error || 'Registration failed.');
      } else {
        setSignupSuccess('Master Admin registered successfully!');
        setHasAdminAccount(true);
        setIsSignUpPage(false);
        setLoginUsername(signupUsername);
        setSignupUsername('');
        setSignupPassword('');
        setSignupConfirmPassword('');
      }
    } catch (err) {
      setSignupError('Network transmission failure.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername || !loginPassword) {
      setLoginError('All fields are required.');
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        setLoginError(data.error || 'Invalid credentials.');
      } else {
        localStorage.setItem('alpha_admin_token', data.token);
        setIsAdminLoggedIn(true);
        if (onAdminLogin) {
          onAdminLogin(data.user, data.token);
        }
        onRefreshData();
      }
    } catch (err) {
      setLoginError('Network transmission failure.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogoutAction = async () => {
    try {
      const token = localStorage.getItem('alpha_admin_token');
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: { 'x-admin-token': token || '' }
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('alpha_admin_token');
    setIsAdminLoggedIn(false);
    if (onAdminLogout) {
      onAdminLogout();
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<'members' | 'bookings' | 'settings' | 'cafe_menu' | 'banners' | 'tournaments' | 'highlights' | 'sql_editor'>('bookings');
  
  // Date Range and Calendar Filter states
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [quickRange, setQuickRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Delete Action Confirmation States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [targetDeleteType, setTargetDeleteType] = useState<'booking' | 'receipt' | 'user' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Trigger quick date range presets
  const applyQuickDateFilter = (range: 'all' | 'today' | 'week' | 'month') => {
    setQuickRange(range);
    const now = new Date();
    if (range === 'all') {
      setFilterStartDate('');
      setFilterEndDate('');
    } else if (range === 'today') {
      const yyyymmdd = now.toISOString().split('T')[0];
      setFilterStartDate(yyyymmdd);
      setFilterEndDate(yyyymmdd);
    } else if (range === 'week') {
      // Current week starting Monday
      const currentDay = now.getDay();
      const distance = currentDay === 0 ? -6 : 1 - currentDay; // distance to Monday
      const monday = new Date(now);
      monday.setDate(now.getDate() + distance);
      const startStr = monday.toISOString().split('T')[0];
      const endStr = now.toISOString().split('T')[0];
      setFilterStartDate(startStr);
      setFilterEndDate(endStr);
    } else if (range === 'month') {
      // Current month starting first day
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const startStr = firstDay.toISOString().split('T')[0];
      const endStr = now.toISOString().split('T')[0];
      setFilterStartDate(startStr);
      setFilterEndDate(endStr);
    }
  };

  // Open the deletion popup confirmation dialog
  const triggerDeleteRecordPopup = (id: string, type: 'booking' | 'receipt' | 'user') => {
    setTargetDeleteId(id);
    setTargetDeleteType(type);
    setDeleteConfirmOpen(true);
  };

  const executeDeletionAction = async () => {
    if (!targetDeleteId || !targetDeleteType) return;
    setIsDeleting(true);
    try {
      const endpoint = targetDeleteType === 'booking' ? '/api/admin/bookings/delete' :
                       targetDeleteType === 'receipt' ? '/api/admin/receipts/delete' :
                       '/api/admin/users/delete';
                       
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: targetDeleteId })
      });
      
      if (res.ok) {
        // Clear from searchResults state matches immediately so GUI disappears
        if (targetDeleteType === 'booking') {
          setSearchResults(prev => ({
            ...prev,
            bookings: prev.bookings.filter(bk => bk.id !== targetDeleteId)
          }));
        } else if (targetDeleteType === 'receipt') {
          setSearchResults(prev => ({
            ...prev,
            receipts: prev.receipts.filter(rc => rc.id !== targetDeleteId)
          }));
        }
        
        // Refresh structural parent indices
        onRefreshData();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to trigger deletion on database cluster");
      }
    } catch (err: any) {
      console.error("Deletion API failed:", err);
      alert("Error occurred contact live supabase support " + err.message);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setTargetDeleteId(null);
      setTargetDeleteType(null);
    }
  };

  // Advanced Global Search bar states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all'); // all, gym, library, gaming, tournament, payments
  const [searchStatus, setSearchStatus] = useState('all'); // all, success, pending, failed
  const [searchResults, setSearchResults] = useState<{ bookings: any[], receipts: any[] }>({ bookings: [], receipts: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchLoading(true);

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/supabase-search?q=${encodeURIComponent(searchQuery)}&category=${searchCategory}&status=${searchStatus}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Failed to query live search index:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchCategory, searchStatus, bookings]);

  // Payment Gateway verification states
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleVerifyPayment = async (bookingId: string, status: 'approved' | 'rejected') => {
    setActionLoading(bookingId);
    try {
      const response = await fetch('/api/admin/bookings/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingId, status })
      });
      if (response.ok) {
        onRefreshData();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to update verification status.');
      }
    } catch (err) {
      console.error(err);
      alert('Network transmission failed during admin payment auditing.');
    } finally {
      setActionLoading(null);
    }
  };
  
  // Highlights media state managers
  const [adminHighlights, setAdminHighlights] = useState<{ stories: any[]; photos: any[]; videos: any[] }>({ stories: [], photos: [], videos: [] });
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Add/Edit story shape
  const [storyForm, setStoryForm] = useState({
    id: '',
    title: '',
    mediaBase64: '',
    type: 'photo',
    isActive: true
  });

  // Add/Edit photo shape
  const [photoForm, setPhotoForm] = useState({
    id: '',
    album: '',
    title: '',
    imageBase64: '',
    isActive: true
  });

  // Add/Edit video shape
  const [videoForm, setVideoForm] = useState({
    id: '',
    title: '',
    videoBase64: '',
    posterBase64: '',
    posterUrl: '',
    isFeatured: false,
    loop: true,
    isActive: true
  });
  
  // Tournament state managers
  const [adminTournaments, setAdminTournaments] = useState<any[]>([]);
  const [loadingAdminTourneys, setLoadingAdminTourneys] = useState(false);
  const [newTourney, setNewTourney] = useState({
    id: '',
    name: '',
    game: 'Asphalt Legends',
    entryFee: '200',
    description: '',
    bannerUrl: '',
    imageBase64: '',
    isActive: true,
    status: 'open' as 'open' | 'closed'
  });
  // SQL Editor State
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);

  // Supabase Backend Check State
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [dbStatusLoading, setDbStatusLoading] = useState(false);

  const fetchDbStatus = async () => {
    setDbStatusLoading(true);
    try {
      const res = await fetch("/api/admin/supabase-status");
      const data = await res.json();
      setDbStatus(data);
    } catch (err: any) {
      setDbStatus({
        connectionStatus: "EXCEPTION FAILURE",
        tablesCreated: "Failed to query",
        testInsertResult: err.message,
        remainingSetup: "Check if server startup failed or ports are blocked."
      });
    } finally {
      setDbStatusLoading(false);
    }
  };

  const handleRunSql = async () => {
    if (!sqlQuery.trim()) return;
    setSqlLoading(true);
    setSqlError(null);
    setSqlResult(null);
    try {
      const response = await fetch('/api/admin/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      const data = await response.json();
      if (response.ok) {
        setSqlResult(data);
      } else {
        setSqlError(data.error || 'Failed to execute SQL Query');
      }
    } catch (err: any) {
      setSqlError(err.message || 'Execution error');
    } finally {
      setSqlLoading(false);
    }
  };

  const [isDragOver, setIsDragOver] = useState(false);

  // Settings pricing updates
  const [gymMonthlyPrice, setGymMonthlyPrice] = useState(1500);
  const [gymYearlyPrice, setGymYearlyPrice] = useState(13000);
  const [libMonthlyPrice, setLibMonthlyPrice] = useState(1500);
  const [updatingPlan, setUpdatingPlan] = useState(false);

  const [chargeAdmissionFee, setChargeAdmissionFee] = useState(true);

  // Gaming parameters states
  const [gamingPlans, setGamingPlans] = useState<GamingPlan[]>([]);
  const [loadingGaming, setLoadingGaming] = useState(false);

  // Cafe Menu Management states
  const [cafeMenu, setCafeMenu] = useState<any[]>([]);
  const [loadingCafe, setLoadingCafe] = useState(false);
  const [newCafeItem, setNewCafeItem] = useState({ name: '', category: 'Hot Beverages', price: '' });
  const [editingCafeId, setEditingCafeId] = useState<string | null>(null);
  const [editingCafeItem, setEditingCafeItem] = useState({ name: '', category: 'Hot Beverages', price: '', isEnabled: true });

  // Banners & Posters states
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [newBanner, setNewBanner] = useState({ 
    title: '', 
    description: '',
    imageBase64: '', 
    type: 'homepage', 
    targetPage: 'homepage', 
    deviceType: 'all', // all, desktop, mobile
    startDate: '',     // e.g. '2026-06-01'
    endDate: '',       // e.g. '2026-06-30'
    isActive: true 
  });
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerUploadDebug, setBannerUploadDebug] = useState<string[]>([]);

  // Load backend stats
  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data && data.chargeAdmissionFee !== undefined) {
          setChargeAdmissionFee(data.chargeAdmissionFee);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGamingPlans = async () => {
    try {
      setLoadingGaming(true);
      const res = await fetch('/api/gaming/plans');
      if (res.ok) {
        const data = await res.json();
        setGamingPlans(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGaming(false);
    }
  };

  const handleUpdateGamingPlan = async (
    planId: string, 
    originalPrice: number, 
    offerPrice: number, 
    isOfferActive: boolean, 
    isEnabled: boolean
  ) => {
    try {
      setUpdatingPlan(true);
      const res = await fetch('/api/admin/gaming/plans/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, originalPrice, offerPrice, isOfferActive, isEnabled })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.gamingPlans) {
          setGamingPlans(data.gamingPlans);
        } else {
          fetchGamingPlans();
        }
        alert('Success: Gaming plan updated and cached successfully!');
        onRefreshData();
      } else {
        alert('Failed to save gaming plan update.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingPlan(false);
    }
  };

  const fetchCafeMenu = async () => {
    try {
      setLoadingCafe(true);
      const res = await fetch('/api/cafe/menu');
      if (res.ok) {
        const data = await res.json();
        setCafeMenu(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCafe(false);
    }
  };

  const fetchBanners = async () => {
    try {
      setLoadingBanners(true);
      const res = await fetch('/api/banners');
      if (res.ok) {
        const data = await res.json();
        setBanners(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBanners(false);
    }
  };

  const fetchAdminTournaments = async () => {
    try {
      setLoadingAdminTourneys(true);
      const res = await fetch('/api/tournaments');
      if (res.ok) {
        const data = await res.json();
        setAdminTournaments(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdminTourneys(false);
    }
  };

  const fetchAdminHighlights = async () => {
    try {
      setLoadingMedia(true);
      const res = await fetch('/api/gaming-highlights');
      if (res.ok) {
        const data = await res.json();
        setAdminHighlights({
          stories: data.stories || [],
          photos: data.photos || [],
          videos: data.videos || []
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
    fetchAdminSettings();
    fetchGamingPlans();
    fetchCafeMenu();
    fetchBanners();
    fetchAdminTournaments();
    fetchAdminHighlights();
  }, [bookings, users]);

  // --- Cafe Menu Admin Operations ---
  const handleAddCafeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCafeItem.name || !newCafeItem.price) {
      alert("Please fill in item name and price configuration");
      return;
    }
    try {
      const res = await fetch('/api/admin/cafe/menu/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCafeItem.name,
          category: newCafeItem.category,
          price: parseFloat(newCafeItem.price)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCafeMenu(data.cafeMenu);
        setNewCafeItem({ name: '', category: 'Hot Beverages', price: '' });
        alert("Success: Cafe menu item published to database!");
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCafeItem = async (id: string, updatedFields: any) => {
    try {
      const res = await fetch('/api/admin/cafe/menu/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updatedFields })
      });
      if (res.ok) {
        const data = await res.json();
        setCafeMenu(data.cafeMenu);
        setEditingCafeId(null);
        alert("Success: Cafe item configuration updated!");
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCafeItem = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this Cafe menu item?")) return;
    try {
      const res = await fetch('/api/admin/cafe/menu/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setCafeMenu(data.cafeMenu);
        alert("Cafe menu item removed successfully!");
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Banner & poster Slide Admin Operations ---
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBanner(prev => ({ ...prev, imageBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.imageBase64) {
      alert("Please choose or drop an image poster file first");
      return;
    }
    try {
      setUploadingBanner(true);
      setBannerUploadDebug([
        "⏳ STEP 1/4: Loading asset data stream...",
        "⏳ STEP 2/4: Packing metadata fields..."
      ]);

      const payload = {
        id: editingBannerId || undefined,
        title: newBanner.title || "Dynamic Poster",
        description: newBanner.description,
        imageBase64: newBanner.imageBase64,
        type: newBanner.type,
        targetPage: newBanner.targetPage,
        deviceType: newBanner.deviceType,
        startDate: newBanner.startDate,
        endDate: newBanner.endDate,
        isActive: newBanner.isActive
      };

      setBannerUploadDebug(prev => [
        ...prev,
        "⏳ STEP 3/4: Uploading to Supabase bucket (with fallback preset)..."
      ]);

      const res = await fetch('/api/admin/banners/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        
        setBannerUploadDebug([
          "✓ Upload Success",
          "✓ Publish Success",
          "✓ Database Updated",
          "✓ Public Website Synced",
          `✓ Image URL Saved: ${data.imageUrl || (data.banner && data.banner.imageUrl) || "verified connection sync"}`
        ]);

        setBanners(data.banners);
        setNewBanner({ 
          title: '', 
          description: '',
          imageBase64: '', 
          type: 'homepage', 
          targetPage: 'homepage', 
          deviceType: 'all',
          startDate: '',
          endDate: '',
          isActive: true 
        });
        setEditingBannerId(null);
        alert(editingBannerId ? "Success: Banner replaced with updated settings!" : "Success: Visual poster catalogued in active slider pools!");
        onRefreshData();
      } else {
        const errDetails = await res.json();
        const errMsg = errDetails.error || "Failed to upload visual asset poster";
        setBannerUploadDebug([
          `❌ upload/publish failed: ${errMsg}`
        ]);
        alert(errMsg);
      }
    } catch (err: any) {
      console.error(err);
      setBannerUploadDebug([
        `❌ publish call exception: ${err.message}`
      ]);
      alert("Exception: " + err.message);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this poster asset?")) return;
    try {
      const res = await fetch('/api/admin/banners/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners);
        alert("Poster asset removed successfully!");
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Tournament Admin Operations ---
  const handleTourneyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTourney(prev => ({ ...prev, imageBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTourneyDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleTourneyDragLeave = () => {
    setIsDragOver(false);
  };

  const handleTourneyDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTourney(prev => ({ ...prev, imageBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourney.name || !newTourney.game || !newTourney.entryFee) {
      alert("Please fill in tournament name, game selection, and entry fee.");
      return;
    }

    const endpoint = newTourney.id 
      ? '/api/admin/tournaments/update' 
      : '/api/admin/tournaments/add';

    try {
      setLoadingAdminTourneys(true);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newTourney.id || undefined,
          name: newTourney.name,
          game: newTourney.game,
          entryFee: parseFloat(newTourney.entryFee),
          description: newTourney.description,
          bannerUrl: newTourney.bannerUrl || undefined,
          imageBase64: newTourney.imageBase64 || undefined,
          isActive: newTourney.isActive,
          status: newTourney.status
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAdminTournaments(data.tournaments);
        setNewTourney({
          id: '',
          name: '',
          game: 'Asphalt Legends',
          entryFee: '200',
          description: '',
          bannerUrl: '',
          imageBase64: '',
          isActive: true,
          status: 'open'
        });
        alert(newTourney.id ? "Success: Tournament details updated!" : "Success: New Esports event created!");
        onRefreshData();
      } else {
        alert("Failed to save tournament.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdminTourneys(false);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tournament? This will remove it from the page.")) return;
    try {
      setLoadingAdminTourneys(true);
      const res = await fetch('/api/admin/tournaments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setAdminTournaments(data.tournaments);
        alert("Success: Tournament has been dropped.");
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdminTourneys(false);
    }
  };

  const handleExportTournamentParticipants = (tourneyName: string) => {
    const participants = bookings.filter(b => b.category === 'tournament' && b.planName === tourneyName);
    if (participants.length === 0) {
      alert("No registered participants found for this event yet.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Invoice ID,Participant Name,Mobile,Email,Age,City,Gaming ID,Entry Fee Paid,Date\n";

    participants.forEach(p => {
      const row = [
        p.invoiceNumber,
        `"${p.tournamentDetails?.fullName || p.userName}"`,
        p.tournamentDetails?.mobileNumber || p.userMobile,
        p.tournamentDetails?.email || p.userEmail,
        p.tournamentDetails?.age || '',
        `"${p.tournamentDetails?.city || ''}"`,
        p.tournamentDetails?.gamingId || '',
        p.totalAmount,
        p.paymentDate
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${tourneyName.replace(/\s+/g, '-')}-Participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSetBannerActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/banners/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive })
      });
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners);
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Admin Gaming Highlights operations ---
  const handleStoryFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyForm.title) {
      alert("Missing story title.");
      return;
    }
    if (!storyForm.id && !storyForm.mediaBase64) {
      alert("Please upload a local photo or video first.");
      return;
    }

    try {
      const isEdit = !!storyForm.id;
      const endpoint = isEdit ? '/api/admin/gaming-highlights/stories/update' : '/api/admin/gaming-highlights/stories/add';
      const body = isEdit 
        ? { id: storyForm.id, title: storyForm.title, isActive: storyForm.isActive, mediaBase64: storyForm.mediaBase64 || undefined, type: storyForm.type }
        : { title: storyForm.title, mediaBase64: storyForm.mediaBase64, type: storyForm.type };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        setAdminHighlights(prev => ({ ...prev, stories: data.stories || prev.stories }));
        alert(isEdit ? "Success: Story localized." : "Success: New Story mounted!");
        setStoryForm({ id: '', title: '', mediaBase64: '', isActive: true, type: 'photo' });
        onRefreshData();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Execution failed"}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;
    try {
      const res = await fetch('/api/admin/gaming-highlights/stories/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setAdminHighlights(prev => ({ ...prev, stories: data.stories || prev.stories }));
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoForm.title || !photoForm.album) {
      alert("Missing photo title or album definition.");
      return;
    }
    if (!photoForm.id && !photoForm.imageBase64) {
      alert("Please upload a local photo first.");
      return;
    }

    try {
      const isEdit = !!photoForm.id;
      const endpoint = isEdit ? '/api/admin/gaming-highlights/photos/update' : '/api/admin/gaming-highlights/photos/add';
      const body = isEdit 
        ? { id: photoForm.id, album: photoForm.album, title: photoForm.title, isActive: photoForm.isActive, imageBase64: photoForm.imageBase64 || undefined }
        : { album: photoForm.album, title: photoForm.title, imageBase64: photoForm.imageBase64 };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        setAdminHighlights(prev => ({ ...prev, photos: data.photos || prev.photos }));
        alert(isEdit ? "Success: Photo highlight modernized." : "Success: New Photo card mounted to stage!");
        setPhotoForm({ id: '', album: '', title: '', imageBase64: '', isActive: true });
        onRefreshData();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Execution failed"}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm("Are you sure you want to delete this highlight photo?")) return;
    try {
      const res = await fetch('/api/admin/gaming-highlights/photos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setAdminHighlights(prev => ({ ...prev, photos: data.photos || prev.photos }));
        onRefreshData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMoveStory = async (index: number, direction: 'up' | 'down') => {
    const list = [...adminHighlights.stories];
    if (direction === 'up' && index > 0) {
      [list[index - 1], list[index]] = [list[index], list[index - 1]];
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
    } else {
      return;
    }

    setAdminHighlights(prev => ({ ...prev, stories: list }));

    try {
      const res = await fetch('/api/admin/gaming-highlights/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stories', ids: list.map(s => s.id) })
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStoryActive = async (id: string, newActiveState: boolean) => {
    try {
      const res = await fetch('/api/admin/gaming-highlights/stories/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: newActiveState })
      });
      if (res.ok) {
        const data = await res.json();
        setAdminHighlights(prev => ({ ...prev, stories: data.stories || prev.stories }));
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMovePhoto = async (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...adminHighlights.photos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPhotos.length) return;
    
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIndex];
    newPhotos[targetIndex] = temp;
    
    try {
      const res = await fetch('/api/admin/gaming-highlights/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'photos',
          reorderedIds: newPhotos.map(p => p.id)
        })
      });
      if (res.ok) {
        setAdminHighlights(prev => ({ ...prev, photos: newPhotos }));
        onRefreshData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMoveVideo = async (index: number, direction: 'up' | 'down') => {
    const newVideos = [...adminHighlights.videos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newVideos.length) return;
    
    const temp = newVideos[index];
    newVideos[index] = newVideos[targetIndex];
    newVideos[targetIndex] = temp;
    
    try {
      const res = await fetch('/api/admin/gaming-highlights/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'videos',
          reorderedIds: newVideos.map(v => v.id)
        })
      });
      if (res.ok) {
        setAdminHighlights(prev => ({ ...prev, videos: newVideos }));
        onRefreshData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTogglePhotoActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/admin/gaming-highlights/photos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: active })
      });
      if (res.ok) {
        const data = await res.json();
        setAdminHighlights(prev => ({ ...prev, photos: data.photos || prev.photos }));
        onRefreshData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Video Highlights operations
  const handleVideoFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.title) {
      alert("Missing video title description.");
      return;
    }
    if (!videoForm.id && !videoForm.videoBase64) {
      alert("Please upload a local MP4/WebM/MOV video file first.");
      return;
    }

    try {
      const isEdit = !!videoForm.id;
      const endpoint = isEdit ? '/api/admin/gaming-highlights/videos/update' : '/api/admin/gaming-highlights/videos/add';
      const body = isEdit 
        ? { 
            id: videoForm.id, 
            title: videoForm.title, 
            isFeatured: videoForm.isFeatured, 
            loop: videoForm.loop, 
            isActive: videoForm.isActive, 
            videoBase64: videoForm.videoBase64 || undefined,
            posterBase64: videoForm.posterBase64 || undefined,
            posterUrl: videoForm.posterUrl || undefined
          }
        : { 
            title: videoForm.title, 
            isFeatured: videoForm.isFeatured, 
            loop: videoForm.loop, 
            videoBase64: videoForm.videoBase64,
            posterBase64: videoForm.posterBase64 || undefined
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        setAdminHighlights(prev => ({ ...prev, videos: data.videos || prev.videos }));
        alert(isEdit ? "Success: Gaming video poster & specifications updated in Supabase pool!" : "Success: New Gameplay video deployed to stage!");
        setVideoForm({ id: '', title: '', videoBase64: '', posterBase64: '', posterUrl: '', isFeatured: false, loop: true, isActive: true });
        onRefreshData();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Execution failed"}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Are you sure you want to delete this highlight video?")) return;
    try {
      const res = await fetch('/api/admin/gaming-highlights/videos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setAdminHighlights(prev => ({ ...prev, videos: data.videos || prev.videos }));
        onRefreshData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSetFeaturedVideo = async (id: string) => {
    try {
      const res = await fetch('/api/admin/gaming-highlights/videos/set-featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setAdminHighlights(prev => ({ ...prev, videos: data.videos || prev.videos }));
        onRefreshData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleVideoActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/admin/gaming-highlights/videos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: active })
      });
      if (res.ok) {
        const data = await res.json();
        setAdminHighlights(prev => ({ ...prev, videos: data.videos || prev.videos }));
        onRefreshData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Handle Admission Fee Toggle
  const handleToggleAdmissionFee = async (checked: boolean) => {
    try {
      setUpdatingPlan(true);
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chargeAdmissionFee: checked })
      });
      if (res.ok) {
        const data = await res.json();
        setChargeAdmissionFee(data.settings.chargeAdmissionFee);
        alert(`Success: Admission Fee is now ${data.settings.chargeAdmissionFee ? 'ON (₹100)' : 'OFF (₹0)'}`);
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingPlan(false);
    }
  };

  // Handle plan price modification
  const handlePriceUpdate = async (category: string, planId: string, price: number) => {
    try {
      setUpdatingPlan(true);
      const res = await fetch('/api/admin/plans/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, planId, price })
      });

      if (res.ok) {
        alert('Plan price parameter saved to local filesystem database!');
        onRefreshData();
      } else {
        alert('Failed to modify plan.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingPlan(false);
    }
  };

  // Reset Reading Seats (Admin control override)
  const triggerSeatsReset = async () => {
    const doubleCheck = confirm('Are you sure you want to override and clear all Reading Room desk bookings? This cannot be undone.');
    if (!doubleCheck) return;
    try {
      const res = await fetch('/api/admin/seats/reset', { method: 'POST' });
      if (res.ok) {
        alert('Success: All desks have been set back to active available state.');
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Export full bookings database log as formal Excel-compatible CSV download
  const triggerCsvDataExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header columns
    csvContent += "Invoice Number,Customer Name,Customer Email,Category,Plan Details,Subtotal (Net),Paid Total,Payment Method,Transaction Date,Start Term,Expiry Term\n";
    
    bookings.forEach((bk) => {
      const row = [
        bk.invoiceNumber,
        `"${bk.userName}"`,
        bk.userEmail,
        bk.category.toUpperCase(),
        `"${bk.planName}"`,
        bk.totalAmount,
        bk.totalAmount,
        bk.paymentMethod.toUpperCase(),
        bk.paymentDate,
        bk.startDate,
        bk.endDate
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `THE-ALPHA-DATABASE-EXPORT-${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate beautiful cumulative GST tax Report Printable markup overlay
  const triggerGstTaxReportDownload = () => {
    const totalGstRepVal = bookings.reduce((sum, current) => sum + current.gstAmount, 0);
    const subtotalRepVal = bookings.reduce((sum, current) => sum + current.amount, 0);
    const totalGstReportMarkup = `
<!DOCTYPE html>
<html>
<head>
  <title>GST Tax Filings - Cumulative Summary Report</title>
  <style>
    body { font-family: sans-serif; padding: 40px; color: #1e1e24; line-height: 1.5; }
    h2 { border-bottom: 2px solid #cb8412; padding-bottom: 10px; color: #1e1e24; }
    .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
    .card { background: #fdfaf3; border: 1px solid #fbeaad; padding: 20px; border-radius: 8px; }
    .card-v { font-size: 22px; font-weight: bold; color: #a55f11; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #eaeaea; padding: 10px; font-size: 11px; text-transform: uppercase; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #f1f1f1; font-size: 12px; }
  </style>
</head>
<body>
  <h2>THE ALPHA EXECUTIVE CLUB - ANNUAL GST FILINGS LOG</h2>
  <p>Report Compiled At: ${new Date().toLocaleString()}</p>
  
  <div class="metric-grid">
    <div class="card">
      <div style="font-size: 11px; text-transform: uppercase; color: #76767d;">Taxable Turnover (Subtotal)</div>
      <div class="card-v">₹${subtotalRepVal.toLocaleString()}</div>
    </div>
    <div class="card">
      <div style="font-size: 11px; text-transform: uppercase; color: #76767d;">Collected GST Portion (18%)</div>
      <div class="card-v">₹${totalGstRepVal.toLocaleString()}</div>
    </div>
    <div class="card">
      <div style="font-size: 11px; text-transform: uppercase; color: #76767d;">Gross Transaction Turnover</div>
      <div class="card-v">₹${(subtotalRepVal + totalGstRepVal).toLocaleString()}</div>
    </div>
  </div>

  <h3>Individual Cleared Transaction Registry</h3>
  <table>
    <thead>
      <tr>
        <th>Invoice Number</th>
        <th>Date</th>
        <th>Member Billed</th>
        <th>GST Value</th>
        <th>Total Received</th>
      </tr>
    </thead>
    <tbody>
      ${bookings.map(bk => `
        <tr>
          <td style="font-family: monospace; font-weight: bold;">${bk.invoiceNumber}</td>
          <td>${new Date(bk.paymentDate).toLocaleDateString()}</td>
          <td>${bk.userName} (${bk.userEmail})</td>
          <td style="font-family: monospace;">₹${bk.gstAmount.toLocaleString()}</td>
          <td style="font-family: monospace; font-weight: bold;">₹${bk.totalAmount.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <p style="margin-top: 50px; text-align: center; font-size: 11px; color:#9c9c9c;">Generated automatically using internal billing nodes.</p>
</body>
</html>
    `;
    const element = document.createElement("a");
    const file = new Blob([totalGstReportMarkup], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `CUMULATIVE-GST-REPORT-${new Date().toISOString().substring(0, 10)}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (checkingAdminAccount) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-xxs font-mono uppercase tracking-widest text-zinc-500">Checking Administrative Security...</span>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return (
      <div id="admin_auth_root" className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#030303]">
        <div className="max-w-md w-full space-y-8 p-8 bg-[#0a0a0a] border border-zinc-900 rounded-3xl relative overflow-hidden text-left shadow-2xl">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

          <div className="text-center">
            <div className="mx-auto w-12 h-12 border-2 border-amber-500 rounded-xl flex items-center justify-center font-display font-black text-amber-500 text-sm mb-4">
              A
            </div>
            <h2 className="font-display font-bold text-2xl text-white tracking-tight uppercase">
              {isSignUpPage ? 'Create Admin Account' : 'Authorized Admin Console'}
            </h2>
            <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-amber-500">
              {isSignUpPage ? 'Register the sole administrator account' : 'Protected Server Dashboard'}
            </p>
          </div>

          {isSignUpPage ? (
            <form id="admin_signup_form" className="mt-8 space-y-5" onSubmit={handleSignUpSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="signup_username" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Admin Username
                  </label>
                  <input
                    id="signup_username"
                    name="username"
                    type="text"
                    required
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-zinc-850 focus:border-amber-500 rounded-xl text-xs font-mono text-white placeholder-zinc-700 focus:outline-none transition-colors border-zinc-800"
                    placeholder="e.g. admin_office"
                  />
                </div>

                <div>
                  <label htmlFor="signup_password" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Choose Passcode
                  </label>
                  <input
                    id="signup_password"
                    name="password"
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-zinc-850 focus:border-amber-500 rounded-xl text-xs font-mono text-white placeholder-zinc-700 focus:outline-none transition-colors border-zinc-800"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label htmlFor="signup_confirm_password" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Verify Passcode
                  </label>
                  <input
                    id="signup_confirm_password"
                    name="confirmPassword"
                    type="password"
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-zinc-850 focus:border-amber-500 rounded-xl text-xs font-mono text-white placeholder-zinc-700 focus:outline-none transition-colors border-zinc-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {signupError && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xxs font-mono text-red-400">
                  {signupError}
                </div>
              )}

              {signupSuccess && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xxs font-mono text-emerald-400">
                  {signupSuccess}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-semibold rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? 'creating...' : 'Initialize Administrator'}
                </button>
              </div>

              {hasAdminAccount && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSignUpPage(false)}
                    className="text-xxs font-mono text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    Back to Secure Login
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form id="admin_login_form" className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="login_username" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Admin Username
                  </label>
                  <input
                    id="login_username"
                    name="username"
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-zinc-850 focus:border-amber-500 rounded-xl text-xs font-mono text-white placeholder-zinc-700 focus:outline-none transition-colors border-zinc-800"
                    placeholder="admin_office"
                  />
                </div>

                <div>
                  <label htmlFor="login_password" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Passcode
                  </label>
                  <input
                    id="login_password"
                    name="password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-zinc-850 focus:border-amber-500 rounded-xl text-xs font-mono text-white placeholder-zinc-700 focus:outline-none transition-colors border-zinc-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xxs font-mono text-red-500 text-center">
                  {loginError}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-semibold rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? 'verifying...' : 'Access Central Console'}
                </button>
              </div>

              {!hasAdminAccount && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSignUpPage(true)}
                    className="text-xxs font-mono text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    No admin registered? Define Account
                  </button>
                </div>
              )}
            </form>
          )}

          <div className="text-center mt-6 pt-6 border-t border-zinc-900/40">
            <button
              onClick={() => onSelectTab('home')}
              className="text-xxs font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              ← Back to Client Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="admin_tab_root" className="space-y-8">
      
      {/* Visual top notification banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border bg-amber-500/[0.01] border-amber-500/20 rounded-3xl gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="flex items-center justify-center w-10 h-10 border border-amber-500/30 bg-amber-500/5 text-amber-500 rounded-lg">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white tracking-tight">ADMIN CENTRAL OFFICE AREA</h2>
            <p className="text-xxs font-mono uppercase tracking-widest text-amber-500">Authorized Personnel Session Only</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <button
            id="admin_csv_export_btn"
            onClick={triggerCsvDataExport}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-black rounded-lg text-xxs font-semibold uppercase font-mono tracking-wider flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel Export</span>
          </button>
          <button
            id="admin_console_logout_btn"
            onClick={handleAdminLogoutAction}
            className="px-3.5 py-2 bg-red-950/20 hover:bg-red-900/30 text-red-440 text-red-405 border border-red-900/30 rounded-lg text-xxs font-semibold uppercase font-mono tracking-wider flex items-center space-x-1.5 cursor-pointer text-red-400"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Logout Console</span>
          </button>
        </div>
      </div>

      {/* ADVANCED LIVE SEARCH BAR */}
      <div id="admin_advanced_search_container" className="p-6 border border-zinc-900 bg-zinc-950/35 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-300 font-bold">Advanced Central Registry Search</h3>
          </div>
          {isSearching && (
            <button
              id="clear_search_btn"
              onClick={() => {
                setSearchQuery('');
                setSearchCategory('all');
                setSearchStatus('all');
              }}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded text-[10px] uppercase font-mono transition-all cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Main lookup input search field */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-650 text-zinc-500" />
            <input
              id="admin_live_search_input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers, payments, receipts, mobile number..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
            />
          </div>

          {/* Module and Status filters dropdowns */}
          <div className="flex gap-2">
            <div className="relative">
              <select
                id="search_category_filter"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="bg-zinc-1000 bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50 font-mono cursor-pointer"
              >
                <option value="all">🗂️ All Records</option>
                <option value="gym">🏋️ Gym</option>
                <option value="library">📚 Library</option>
                <option value="gaming">🎮 Gaming</option>
                <option value="tournament">🏆 Tournament</option>
                <option value="payments">💳 Payments</option>
              </select>
            </div>

            <div className="relative">
              <select
                id="search_status_filter"
                value={searchStatus}
                onChange={(e) => setSearchStatus(e.target.value)}
                className="bg-zinc-1000 bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50 font-mono cursor-pointer"
              >
                <option value="all">🚦 All Statuses</option>
                <option value="success">✓ Success</option>
                <option value="pending">⌛ Pending</option>
                <option value="failed">✗ Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* DATE CALENDAR PICKER & RANGE CONTROLS WITH PRESET BUTTONS */}
        <div id="admin_date_filter_row" className="pt-4 border-t border-zinc-900/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mr-2 flex items-center gap-1.5 matches-label">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Date Filter Preset:
            </span>
            <button
              id="date_all_btn"
              type="button"
              onClick={() => applyQuickDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xxs font-mono uppercase font-bold border transition-all cursor-pointer ${
                quickRange === 'all'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              All Records
            </button>
            <button
              id="date_today_btn"
              type="button"
              onClick={() => applyQuickDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xxs font-mono uppercase font-bold border transition-all cursor-pointer ${
                quickRange === 'today'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              id="date_week_btn"
              type="button"
              onClick={() => applyQuickDateFilter('week')}
              className={`px-3 py-1.5 rounded-lg text-xxs font-mono uppercase font-bold border transition-all cursor-pointer ${
                quickRange === 'week'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              id="date_month_btn"
              type="button"
              onClick={() => applyQuickDateFilter('month')}
              className={`px-3 py-1.5 rounded-lg text-xxs font-mono uppercase font-bold border transition-all cursor-pointer ${
                quickRange === 'month'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              This Month
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden lg:inline">Custom Range:</span>
            <div className="flex items-center space-x-1.5 bg-zinc-950 px-3 py-1.5 border border-zinc-900 rounded-xl w-full sm:w-auto">
              <input
                id="filter_start_date"
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  setFilterStartDate(e.target.value);
                  setQuickRange('all');
                }}
                className="bg-transparent text-xxs font-mono text-white focus:outline-none focus:text-amber-400 cursor-pointer [color-scheme:dark]"
              />
              <span className="text-[10px] text-zinc-600 font-mono">to</span>
              <input
                id="filter_end_date"
                type="date"
                value={filterEndDate}
                onChange={(e) => {
                  setFilterEndDate(e.target.value);
                  setQuickRange('all');
                }}
                className="bg-transparent text-xxs font-mono text-white focus:outline-none focus:text-amber-400 cursor-pointer [color-scheme:dark]"
              />
            </div>
            {(filterStartDate || filterEndDate) && (
              <button
                id="clear_date_filter_btn"
                type="button"
                onClick={() => {
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setQuickRange('all');
                }}
                className="p-1.5 px-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded text-[9px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Reset Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LIVE SEARCH RESULTS DISPLAY PANEL */}
      {isSearching && (() => {
        // Apply Date Filtering AND Search criteria combined!
        const matchingUsers = users.filter(u => {
          if (!searchQuery.trim()) return false;
          const q = searchQuery.toLowerCase();
          
          // Apply Date Range
          const uTime = new Date(u.createdAt).getTime();
          if (filterStartDate) {
            const start = new Date(filterStartDate);
            start.setHours(0,0,0,0);
            if (uTime < start.getTime()) return false;
          }
          if (filterEndDate) {
            const end = new Date(filterEndDate);
            end.setHours(23,59,59,999);
            if (uTime > end.getTime()) return false;
          }

          return (
            u.id.toLowerCase().includes(q) ||
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.mobileNumber || "").toLowerCase().includes(q) ||
            (u.role || "").toLowerCase().includes(q)
          );
        });

        const matchingBookings = searchResults.bookings.filter(bk => {
          // Apply Date Filter
          if (!bk.paymentDate) return true;
          const recTime = new Date(bk.paymentDate).getTime();
          if (filterStartDate) {
            const start = new Date(filterStartDate);
            start.setHours(0,0,0,0);
            if (recTime < start.getTime()) return false;
          }
          if (filterEndDate) {
            const end = new Date(filterEndDate);
            end.setHours(23,59,59,999);
            if (recTime > end.getTime()) return false;
          }
          return true;
        });

        const matchingReceipts = searchResults.receipts.filter(rc => {
          // Apply Date Filter
          const dateStr = rc.createdAt || rc.paymentDate;
          if (!dateStr) return true;
          const recTime = new Date(dateStr).getTime();
          if (filterStartDate) {
            const start = new Date(filterStartDate);
            start.setHours(0,0,0,0);
            if (recTime < start.getTime()) return false;
          }
          if (filterEndDate) {
            const end = new Date(filterEndDate);
            end.setHours(23,59,59,999);
            if (recTime > end.getTime()) return false;
          }
          return true;
        });

        return (
          <div id="live_search_results_panel" className="p-6 border border-zinc-900 bg-zinc-950/20 rounded-3xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold">
                Live Search Results for "{searchQuery}" {searchCategory !== 'all' && `in ${searchCategory.toUpperCase()}`} {searchStatus !== 'all' && `(${searchStatus.toUpperCase()})`}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {searchLoading ? 'Looking up...' : `${matchingBookings.length + matchingReceipts.length + matchingUsers.length} matches discovered`}
              </span>
            </div>

            {searchLoading ? (
              <div className="p-12 text-center border border-zinc-900 bg-zinc-950/10 rounded-2xl">
                <RefreshCw className="w-5 h-5 text-amber-500 animate-spin mx-auto mb-3" />
                <p className="text-xxs font-mono uppercase text-zinc-500 tracking-wider">Searching direct Supabase cluster records...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* SECTION A: BOOKINGS & REGISTERED CUSTOMER LOGS */}
                {matchingBookings.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xxs font-mono uppercase tracking-wider text-zinc-400 font-bold border-l-2 border-amber-500 pl-2">
                      Matched Registry Bookings & Payments ({matchingBookings.length})
                    </h4>
                    <div className="overflow-x-auto border border-zinc-900 bg-zinc-950/30 rounded-2xl">
                      <table className="w-full text-left border-collapse text-xxs font-mono">
                        <thead>
                          <tr className="border-b border-zinc-900 text-zinc-500 bg-zinc-900/10">
                            <th className="p-4 uppercase">Reference ID / Invoice</th>
                            <th className="p-4 uppercase">Customer Name & Contact</th>
                            <th className="p-4 uppercase">Space Class / Plan</th>
                            <th className="p-4 uppercase">UTR / Receipt No</th>
                            <th className="p-4 uppercase text-right">Paid Amount</th>
                            <th className="p-4 uppercase text-center">Status</th>
                            <th className="p-4 uppercase text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchingBookings.map((bk) => {
                            const isPending = bk.paymentStatus === 'pending';
                            const isApproved = bk.paymentStatus === 'approved' || bk.paymentStatus === 'success';
                            const isRejected = bk.paymentStatus === 'rejected' || bk.paymentStatus === 'failed';
                            return (
                              <tr key={bk.id} className="border-b border-zinc-950 text-zinc-300 hover:bg-zinc-900/10">
                                <td className="p-4 font-bold text-white">
                                  <span className="block">{bk.id}</span>
                                  <span className="text-[9px] text-zinc-500 block font-normal">{bk.invoiceNumber}</span>
                                </td>
                                <td className="p-4">
                                  <span className="font-semibold block text-zinc-200 capitalize">{bk.payerName || bk.userName}</span>
                                  <span className="text-zinc-500 block">{bk.payerMobile || bk.userMobile}</span>
                                </td>
                                <td className="p-4 uppercase">
                                  <span className="inline-block px-1.5 py-0.5 bg-zinc-900 border border-zinc-850 rounded text-amber-500 text-[8px] mr-1.5 font-bold">
                                    {bk.category}
                                  </span>
                                  <span className="text-zinc-200">{bk.planName}</span>
                                </td>
                                <td className="p-4 font-bold">
                                  {bk.receiptNumber ? (
                                    <span className="text-amber-500 block">{bk.receiptNumber}</span>
                                  ) : (
                                    <span className="text-zinc-550 italic block text-zinc-500">—</span>
                                  )}
                                  {bk.utrNumber && <span className="text-[9px] text-zinc-500 font-normal">UTR: {bk.utrNumber}</span>}
                                  {bk.razorpayPaymentId && bk.razorpayPaymentId !== "N/A" && (
                                    <div className="text-[9px] text-zinc-500 font-normal">RPay ID: {bk.razorpayPaymentId}</div>
                                  )}
                                </td>
                                <td className="p-4 text-right text-white font-bold text-xs">
                                  ₹{(bk.totalAmount || bk.amount || 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    isPending ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                    isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    'bg-red-500/10 text-red-400 border border-red-500/20'
                                  }`}>
                                    {bk.paymentStatus}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    id={`delete_booking_search_${bk.id}`}
                                    onClick={() => triggerDeleteRecordPopup(bk.id, 'booking')}
                                    className="p-1 px-2.5 bg-red-950/25 text-red-500 border border-red-900/30 hover:bg-red-900/30 font-semibold rounded text-[9px] tracking-wide uppercase transition-all cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SECTION B: OFFICIAL AND SUPABASE PAYMENT RECEIPTS */}
                {matchingReceipts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xxs font-mono uppercase tracking-wider text-zinc-400 font-bold border-l-2 border-yellow-600 pl-2">
                      Matched Verified Invoices & Receipts ({matchingReceipts.length})
                    </h4>
                    <div className="overflow-x-auto border border-zinc-900 bg-zinc-950/30 rounded-2xl">
                      <table className="w-full text-left border-collapse text-xxs font-mono">
                        <thead>
                          <tr className="border-b border-zinc-900 text-zinc-500 bg-zinc-900/10">
                            <th className="p-4 uppercase">Receipt Number</th>
                            <th className="p-4 uppercase">Recipient Name</th>
                            <th className="p-4 uppercase">Mobile Phone</th>
                            <th className="p-4 uppercase">Registered Service</th>
                            <th className="p-4 uppercase text-right">Amount Store</th>
                            <th className="p-4 uppercase text-center">UTR Reference</th>
                            <th className="p-4 uppercase text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchingReceipts.map((rc) => (
                            <tr key={rc.id} className="border-b border-zinc-950 text-zinc-300 hover:bg-zinc-900/10">
                              <td className="p-4 font-bold text-amber-500">
                                {rc.receiptNumber}
                              </td>
                              <td className="p-4 font-semibold text-zinc-200 capitalize">
                                {rc.customerName}
                              </td>
                              <td className="p-4 text-zinc-400 font-mono">
                                {rc.mobileNumber}
                              </td>
                              <td className="p-4 text-zinc-300">
                                {rc.serviceName}
                              </td>
                              <td className="p-4 text-right text-white font-bold text-xs">
                                ₹{(rc.amount || 0).toLocaleString()}
                              </td>
                              <td className="p-4 text-center text-zinc-500 font-mono text-[9px]">
                                {rc.utrReference || rc.razorpayPaymentId || '—'}
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  id={`delete_receipt_search_${rc.id}`}
                                  onClick={() => triggerDeleteRecordPopup(rc.id, 'receipt')}
                                  className="p-1 px-2.5 bg-red-950/25 text-red-500 border border-red-900/30 hover:bg-red-900/30 font-semibold rounded text-[9px] tracking-wide uppercase transition-all cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SECTION C: MEMBER ACCOUNTS DIRECTORY */}
                {matchingUsers.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xxs font-mono uppercase tracking-wider text-zinc-400 font-bold border-l-2 border-indigo-500 pl-2">
                      Matched Member Profiles ({matchingUsers.length})
                    </h4>
                    <div className="overflow-x-auto border border-zinc-900 bg-zinc-950/30 rounded-2xl">
                      <table className="w-full text-left border-collapse text-xxs font-mono">
                        <thead>
                          <tr className="border-b border-zinc-900 text-zinc-500 bg-zinc-900/10">
                            <th className="p-4 uppercase">Member ID</th>
                            <th className="p-4 uppercase">Full Name</th>
                            <th className="p-4 uppercase">Secure Email</th>
                            <th className="p-4 uppercase">Mobile Phone</th>
                            <th className="p-4 uppercase">Role</th>
                            <th className="p-4 uppercase text-right">Date Joined</th>
                            <th className="p-4 uppercase text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchingUsers.map((u) => (
                            <tr key={u.id} className="border-b border-zinc-950 text-zinc-300 hover:bg-zinc-900/10">
                              <td className="p-4 text-white font-mono">{u.id}</td>
                              <td className="p-4 capitalize font-semibold">{u.fullName}</td>
                              <td className="p-4 font-mono text-zinc-400">{u.email}</td>
                              <td className="p-4 font-mono text-zinc-500">{u.mobileNumber}</td>
                              <td className="p-4 uppercase text-zinc-400">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-900 text-zinc-400'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-4 text-right text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td className="p-4 text-right">
                                <button
                                  id={`delete_user_search_${u.id}`}
                                  onClick={() => triggerDeleteRecordPopup(u.id, 'user')}
                                  className="p-1 px-2.5 bg-red-950/25 text-red-500 border border-red-900/30 hover:bg-red-900/30 font-semibold rounded text-[9px] tracking-wide uppercase transition-all cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* EMPTY LIVE RESULTS WORKFLOW */}
                {matchingBookings.length === 0 && matchingReceipts.length === 0 && matchingUsers.length === 0 && (
                  <div id="no_live_search_records" className="p-16 text-center border border-zinc-900 bg-zinc-950/10 rounded-2xl">
                    <p className="text-xxs text-zinc-500 font-mono uppercase tracking-widest leading-loose">
                      No registry entries, payment logs, or customer files match your query within the selected time window.<br/>
                      Try adjusting keywords or date range filters.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* METRIC NUMERICS WIDGETS ROW */}
      {(() => {
        const analytics = (() => {
          // Filter bookings strictly by Date Filters
          const filteredByDate = bookings.filter(bk => {
            if (!bk.paymentDate) return false;
            const recTime = new Date(bk.paymentDate).getTime();
            
            if (filterStartDate) {
              const start = new Date(filterStartDate);
              start.setHours(0,0,0,0);
              if (recTime < start.getTime()) return false;
            }
            if (filterEndDate) {
              const end = new Date(filterEndDate);
              end.setHours(23,59,59,999);
              if (recTime > end.getTime()) return false;
            }
            return true;
          });

          const approvedOnly = filteredByDate.filter(
            b => b.paymentStatus === 'approved' || b.paymentStatus === 'success'
          );

          const totalRev = approvedOnly.reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);
          const totalGym = approvedOnly.filter(b => b.category === 'gym').length;
          const totalLibrary = approvedOnly.filter(b => b.category === 'library').length;
          const totalGaming = approvedOnly.filter(b => b.category === 'gaming').length;
          const totalTournament = approvedOnly.filter(b => b.category === 'tournament').length;
          const totalPayments = approvedOnly.length;

          return {
            totalRevenue: totalRev,
            gymMembers: totalGym,
            libraryMembers: totalLibrary,
            gamingBookingsNum: totalGaming,
            tournamentRegistrations: totalTournament,
            totalPaymentsNum: totalPayments,
          };
        })();

        return (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {/* CARD 1: Total Revenue */}
            <div className="p-4 border border-zinc-900 bg-zinc-950/40 rounded-2xl flex flex-col justify-between min-h-[90px] hover:border-amber-500/20 transition-all">
              <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-amber-500" />
                Total Revenue
              </span>
              <div className="mt-2 flex items-baseline space-x-1">
                <span className="text-lg font-mono font-bold text-amber-400 leading-none">₹{analytics.totalRevenue.toLocaleString()}</span>
                <span className="text-[9px] text-zinc-650 font-mono text-zinc-500">INR</span>
              </div>
            </div>

            {/* CARD 2: Total Gym Members */}
            <div className="p-4 border border-zinc-900 bg-zinc-950/40 rounded-2xl flex flex-col justify-between min-h-[90px] hover:border-amber-500/20 transition-all">
              <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                <Dumbbell className="w-3 h-3 text-amber-500" />
                Total Gym Members
              </span>
              <div className="mt-2 flex items-baseline space-x-1">
                <span className="text-lg font-mono font-bold text-white leading-none">{analytics.gymMembers}</span>
                <span className="text-[9px] text-zinc-550 font-mono text-zinc-500">athletes</span>
              </div>
            </div>

            {/* CARD 3: Total Library Members */}
            <div className="p-4 border border-zinc-900 bg-zinc-950/40 rounded-2xl flex flex-col justify-between min-h-[90px] hover:border-amber-500/20 transition-all">
              <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-amber-500" />
                Total Library Members
              </span>
              <div className="mt-2 flex items-baseline space-x-1">
                <span className="text-lg font-mono font-bold text-white leading-none">{analytics.libraryMembers}</span>
                <span className="text-[9px] text-zinc-550 font-mono text-zinc-500">readers</span>
              </div>
            </div>

            {/* CARD 4: Total Gaming Bookings */}
            <div className="p-4 border border-zinc-900 bg-zinc-950/40 rounded-2xl flex flex-col justify-between min-h-[90px] hover:border-amber-500/20 transition-all">
              <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 text-amber-500" />
                Total Gaming Bookings
              </span>
              <div className="mt-2 flex items-baseline space-x-1">
                <span className="text-lg font-mono font-bold text-white leading-none">{analytics.gamingBookingsNum}</span>
                <span className="text-[9px] text-zinc-550 font-mono text-zinc-500">sessions</span>
              </div>
            </div>

            {/* CARD 5: Total Tournament Registrations */}
            <div className="p-4 border border-zinc-900 bg-zinc-950/40 rounded-2xl flex flex-col justify-between min-h-[90px] hover:border-amber-500/20 transition-all">
              <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 animate-pulse" />
                Total Tourneys
              </span>
              <div className="mt-2 flex items-baseline space-x-1">
                <span className="text-lg font-mono font-bold text-white leading-none">{analytics.tournamentRegistrations}</span>
                <span className="text-[9px] text-zinc-550 font-mono text-zinc-500">teams</span>
              </div>
            </div>

            {/* CARD 6: Total Payments */}
            <div className="p-4 border border-zinc-900 bg-amber-500/[0.01] rounded-2xl flex flex-col justify-between min-h-[90px] hover:border-amber-500/20 transition-all">
              <span className="text-[10px] font-mono uppercase text-zinc-450 font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-amber-500" />
                Total Payments
              </span>
              <div className="mt-2 flex items-baseline space-x-1">
                <span className="text-lg font-mono font-bold text-yellow-500 leading-none">{analytics.totalPaymentsNum}</span>
                <span className="text-[9px] text-zinc-550 font-mono text-zinc-500">cleared</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MID PANEL SUB TAB CONTROLS */}
      <div className="border-b border-zinc-900 flex space-x-6 text-xs font-mono uppercase">
        <button
          id="admin_subtab_bookings"
          onClick={() => setActiveSubTab('bookings')}
          className={`pb-3.5 transition-all text-left font-semibold ${
            activeSubTab === 'bookings'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Cleared Registry Bookings ({bookings.length})
        </button>
        <button
          id="admin_subtab_members"
          onClick={() => setActiveSubTab('members')}
          className={`pb-3.5 transition-all text-left font-semibold ${
            activeSubTab === 'members'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Registered Accounts Directory ({users.length})
        </button>
        <button
          id="admin_subtab_settings"
          onClick={() => setActiveSubTab('settings')}
          className={`pb-3.5 transition-all text-left font-semibold cursor-pointer ${
            activeSubTab === 'settings'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Pricing Override Controls
        </button>
        <button
          id="admin_subtab_cafe_menu"
          onClick={() => setActiveSubTab('cafe_menu')}
          className={`pb-3.5 transition-all text-left font-semibold cursor-pointer ${
            activeSubTab === 'cafe_menu'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Cafe Menu Manager
        </button>
        <button
          id="admin_subtab_banners"
          onClick={() => setActiveSubTab('banners')}
          className={`pb-3.5 transition-all text-left font-semibold cursor-pointer ${
            activeSubTab === 'banners'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Banners & Posters System
        </button>
        <button
          id="admin_subtab_tournaments"
          onClick={() => setActiveSubTab('tournaments')}
          className={`pb-3.5 transition-all text-left font-semibold cursor-pointer ${
            activeSubTab === 'tournaments'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Esports Tournaments Hub
        </button>
        <button
          id="admin_subtab_highlights"
          onClick={() => setActiveSubTab('highlights')}
          className={`pb-3.5 transition-all text-left font-semibold cursor-pointer ${
            activeSubTab === 'highlights'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Gaming Media Highlights
        </button>
        <button
          id="admin_subtab_sql_editor"
          onClick={() => setActiveSubTab('sql_editor')}
          className={`pb-3.5 transition-all text-left font-semibold cursor-pointer ${
            activeSubTab === 'sql_editor'
              ? 'text-amber-500 border-b-2 border-amber-500'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          SQL Studio
        </button>
      </div>

      {/* RENDER DYNAMIC TABLES */}
      <div className="space-y-4">
        {activeSubTab === 'bookings' && (() => {
          const filteredBookings = bookings.filter(bk => {
            if (paymentFilter === 'all') return true;
            if (paymentFilter === 'pending') return bk.paymentStatus === 'pending';
            if (paymentFilter === 'approved') return bk.paymentStatus === 'approved' || bk.paymentStatus === 'success';
            if (paymentFilter === 'rejected') return bk.paymentStatus === 'rejected' || bk.paymentStatus === 'failed';
            return true;
          });

          return (
            <div className="space-y-4">
              {/* Payment Filters Bar */}
              <div className="flex flex-wrap gap-2 pb-2">
                {[
                  { id: 'all', label: 'All Transactions' },
                  { id: 'pending', label: '⌛ Pending Verification' },
                  { id: 'approved', label: '✓ Approved' },
                  { id: 'rejected', label: '✗ Rejected' }
                ].map((filt) => {
                  const count = bookings.filter(b => {
                    if (filt.id === 'all') return true;
                    if (filt.id === 'pending') return b.paymentStatus === 'pending';
                    if (filt.id === 'approved') return b.paymentStatus === 'approved' || b.paymentStatus === 'success';
                    if (filt.id === 'rejected') return b.paymentStatus === 'rejected' || b.paymentStatus === 'failed';
                    return true;
                  }).length;

                  return (
                    <button
                      key={filt.id}
                      id={`btn_payment_filt_${filt.id}`}
                      onClick={() => setPaymentFilter(filt.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl border text-[10px] font-mono font-bold uppercase transition-all flex items-center space-x-2 cursor-pointer ${
                        paymentFilter === filt.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-zinc-900 bg-zinc-950 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      <span>{filt.label}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 text-zinc-400 text-[9px] font-mono leading-none">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="overflow-x-auto border border-zinc-900 bg-zinc-950/20 rounded-2xl">
                {filteredBookings.length === 0 ? (
                  <div id="no_records_msg" className="p-12 text-center">
                    <p className="text-xxs text-zinc-500 font-mono uppercase tracking-widest">No matching bookings logged in active index filtered as: {paymentFilter}</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xxs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 bg-zinc-900/10 hover:bg-transparent">
                        <th className="p-4 uppercase">Reference ID / Invoice</th>
                        <th className="p-4 uppercase">Receipt No</th>
                        <th className="p-4 uppercase">Name & Mobile</th>
                        <th className="p-4 uppercase">Registry Space Class</th>
                        <th className="p-4 uppercase">UTR ID / Screenshot</th>
                        <th className="p-4 uppercase">Timestamp</th>
                        <th className="p-4 uppercase text-right">Paid Total</th>
                        <th className="p-4 uppercase text-center">Status Badge</th>
                        <th className="p-4 uppercase text-right">Audit Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((bk) => {
                        const isPending = bk.paymentStatus === 'pending';
                        const isApproved = bk.paymentStatus === 'approved' || bk.paymentStatus === 'success';
                        const isRejected = bk.paymentStatus === 'rejected' || bk.paymentStatus === 'failed';

                        return (
                          <tr key={bk.id} className="border-b border-zinc-950 text-zinc-300 hover:bg-zinc-900/10">
                            {/* 1. Reference ID / Invoice */}
                            <td className="p-4 font-bold text-white">
                              <span className="block">{bk.id}</span>
                              <span className="text-[9px] text-zinc-500 block font-normal">{bk.invoiceNumber}</span>
                            </td>

                            {/* 2. Receipt No */}
                            <td className="p-4 text-amber-500 font-semibold uppercase">
                              {bk.receiptNumber || <span className="text-zinc-600 italic">—</span>}
                            </td>

                            {/* 3. Name & Mobile */}
                            <td className="p-4">
                              <span className="font-semibold block text-zinc-200 capitalize">{bk.payerName || bk.userName}</span>
                              <span className="text-zinc-500 block">{bk.payerMobile || bk.userMobile}</span>
                            </td>

                            {/* 4. Registry Space Class */}
                            <td className="p-4 uppercase">
                              <span className="inline-block px-1.5 py-0.5 bg-zinc-900 border border-zinc-850 rounded text-amber-500 text-[8px] mr-1.5 font-bold">
                                {bk.category}
                              </span>
                              <span className="text-zinc-200">{bk.planName}</span>
                            </td>

                            {/* 5. UTR / Deposit Proof */}
                            <td className="p-4">
                              {bk.utrNumber ? (
                                <code className="text-zinc-300 bg-zinc-950 border border-zinc-900 px-1.5 py-1 rounded text-[10px] tracking-wide block w-fit mb-1 font-bold">
                                  {bk.utrNumber}
                                </code>
                              ) : (
                                <span className="text-zinc-600 italic block mb-1">No UTR logged</span>
                              )}
                              {bk.screenshotUrl && (
                                <button
                                  id={`view_proof_btn_${bk.id}`}
                                  onClick={() => setActiveScreenshot(bk.screenshotUrl || null)}
                                  className="text-amber-500 hover:text-amber-400 hover:underline flex items-center space-x-1 font-bold cursor-pointer transition-all"
                                >
                                  <span>📸 View Proof Image</span>
                                </button>
                              )}
                            </td>

                            {/* 6. Date & Time */}
                            <td className="p-4 text-zinc-450 leading-relaxed">
                              {bk.paymentDate ? (
                                <>
                                  <span className="block">{new Date(bk.paymentDate).toLocaleDateString()}</span>
                                  <span className="text-[9px] text-zinc-600 block">{new Date(bk.paymentDate).toLocaleTimeString()}</span>
                                </>
                              ) : (
                                '—'
                              )}
                            </td>

                            {/* 7. Gross Amount paid */}
                            <td className="p-4 text-right text-white font-bold text-xs">
                              ₹{bk.totalAmount.toLocaleString()}
                            </td>

                            {/* 8. Status Badge */}
                            <td className="p-4 text-center">
                              {isPending && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-[8px] font-bold animate-pulse uppercase">
                                  ⌛ Pending Verification
                                </span>
                              )}
                              {isApproved && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[8px] font-bold uppercase">
                                  ✓ Approved
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[8px] font-bold uppercase">
                                  ✗ Rejected
                                </span>
                              )}
                            </td>

                            {/* 9. Action Buttons */}
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {isPending ? (
                                  <div className="flex gap-1.5">
                                    <button
                                      id={`btn_approve_booking_${bk.id}`}
                                      disabled={actionLoading === bk.id}
                                      onClick={() => handleVerifyPayment(bk.id, 'approved')}
                                      className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[9px] font-mono uppercase font-black rounded transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                    >
                                      {actionLoading === bk.id ? '...' : 'Approve'}
                                    </button>
                                    <button
                                      id={`btn_reject_booking_${bk.id}`}
                                      disabled={actionLoading === bk.id}
                                      onClick={() => handleVerifyPayment(bk.id, 'rejected')}
                                      className="px-2 py-1 bg-red-500 hover:bg-red-400 text-black text-[9px] font-mono uppercase font-black rounded transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                    >
                                      {actionLoading === bk.id ? '...' : 'Reject'}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-zinc-650 font-mono text-zinc-500 uppercase">Audited</span>
                                )}
                                <button
                                  id={`delete_booking_list_${bk.id}`}
                                  onClick={() => triggerDeleteRecordPopup(bk.id, 'booking')}
                                  className="p-1 px-2.5 bg-red-950/25 hover:bg-red-900/35 border border-red-900/40 text-red-500 font-semibold rounded text-[9px] tracking-wider uppercase transition-all cursor-pointer"
                                  title="Permanently remove record"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Render Full-screen Screenshot lightbox overlay */}
              {activeScreenshot && (
                <div id="full_screenshot_lightbox" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                  <div className="max-w-xl w-full flex flex-col items-center">
                    <div className="flex justify-between items-center w-full pb-3 border-b border-zinc-900 mb-5">
                      <span className="text-xxs font-mono text-zinc-400 uppercase tracking-widest">PhonePe Screen Receipt Proof</span>
                      <button 
                        id="close_screenshot_lightbox_btn"
                        onClick={() => setActiveScreenshot(null)}
                        className="text-zinc-500 hover:text-white hover:bg-zinc-900 p-2 rounded-lg transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <img 
                      src={activeScreenshot} 
                      alt="Active Transaction Proof screenshot" 
                      className="max-h-[75vh] w-auto rounded-3xl border border-zinc-800 object-contain shadow-2xl bg-zinc-950"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      id="lightbox_close_confirm_btn"
                      onClick={() => setActiveScreenshot(null)}
                      className="mt-6 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xxs font-semibold uppercase tracking-wider rounded-xl transition cursor-pointer"
                    >
                      Close Proof Preview
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {activeSubTab === 'members' && (
          <div className="overflow-x-auto border border-zinc-900 bg-zinc-950/20 rounded-2xl">
            {users.length === 0 ? (
              <div className="p-10 text-center text-xs text-zinc-500">No member profiles discovered.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xxs font-mono">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 bg-zinc-900/10">
                    <th className="p-4 uppercase">Member ID</th>
                    <th className="p-4 uppercase">Full Name</th>
                    <th className="p-4 uppercase">Secure Email</th>
                    <th className="p-4 uppercase">Mobile Phone</th>
                    <th className="p-4 uppercase">Role</th>
                    <th className="p-4 uppercase text-right">Added Stamp</th>
                    <th className="p-4 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-zinc-950 text-zinc-300 hover:bg-zinc-900/10">
                      <td className="p-4 text-white font-mono">{u.id}</td>
                      <td className="p-4 capitalize font-semibold">{u.fullName}</td>
                      <td className="p-4 font-mono text-zinc-400">{u.email}</td>
                      <td className="p-4 font-mono text-zinc-500">{u.mobileNumber}</td>
                      <td className="p-4 uppercase text-zinc-400">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-900 text-zinc-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-right text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button
                          id={`delete_user_list_${u.id}`}
                          onClick={() => triggerDeleteRecordPopup(u.id, 'user')}
                          className="p-1 px-2.5 bg-red-950/25 hover:bg-red-900/35 border border-red-900/40 text-red-500 font-semibold rounded text-[9px] tracking-wider uppercase transition-all cursor-pointer"
                          title="Permanently remove user"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeSubTab === 'settings' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* PRICING MODIFIER WIDGETS */}
            <div className="p-6 border border-zinc-900 bg-zinc-950/40 rounded-3xl space-y-6">
              <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase pb-2 border-b border-zinc-900">
                Core Membership Price Controls
              </h4>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-zinc-900 bg-zinc-950 rounded-xl gap-2 font-mono text-xs">
                  <div>
                    <p className="text-white font-medium">Gym Standard Monthly</p>
                    <p className="text-xxs text-zinc-500 uppercase">Interactive database parameter</p>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-zinc-500">₹</span>
                    <input
                      id="gym_monthly_price_override"
                      type="number"
                      value={gymMonthlyPrice}
                      onChange={(e) => setGymMonthlyPrice(parseInt(e.target.value) || 0)}
                      className="w-18 bg-zinc-900 border border-zinc-800 text-center py-1 rounded text-white text-xs font-bold font-mono focus:outline-none"
                    />
                    <button
                      id="gym_monthly_price_save"
                      onClick={() => handlePriceUpdate('gym', 'gym_monthly', gymMonthlyPrice)}
                      disabled={updatingPlan}
                      className="px-2 py-1 bg-amber-500 text-black rounded text-[10px] font-bold uppercase cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-zinc-900 bg-zinc-950 rounded-xl gap-2 font-mono text-xs">
                  <div>
                    <p className="text-white font-medium">Gym Ultimate Yearly VIP</p>
                    <p className="text-xxs text-zinc-500 uppercase">Large annual tier price</p>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-zinc-500">₹</span>
                    <input
                      id="gym_yearly_price_override"
                      type="number"
                      value={gymYearlyPrice}
                      onChange={(e) => setGymYearlyPrice(parseInt(e.target.value) || 0)}
                      className="w-18 bg-zinc-900 border border-zinc-800 text-center py-1 rounded text-white text-xs font-bold font-mono focus:outline-none"
                    />
                    <button
                      id="gym_yearly_price_save"
                      onClick={() => handlePriceUpdate('gym', 'gym_yearly', gymYearlyPrice)}
                      disabled={updatingPlan}
                      className="px-2 py-1 bg-amber-500 text-black rounded text-[10px] font-bold uppercase cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Admission Fee Toggle Option */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 border border-zinc-900 bg-zinc-950 rounded-xl gap-4 font-mono text-xs">
                  <div>
                    <p className="text-white font-medium">Charge Admission Fee (₹100)</p>
                    <p className="text-xxs text-zinc-500 uppercase">Turn admission fee ON or OFF anytime</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id="admin_admission_fee_on"
                      type="button"
                      onClick={() => handleToggleAdmissionFee(true)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        chargeAdmissionFee 
                          ? 'bg-amber-400 text-black shadow-md shadow-amber-500/10' 
                          : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      ✓ Enable (ON)
                    </button>
                    <button
                      id="admin_admission_fee_off"
                      type="button"
                      onClick={() => handleToggleAdmissionFee(false)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        !chargeAdmissionFee 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      ✗ Disable (OFF)
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* OVERRIDE CONTROLS */}
            <div className="p-6 border border-zinc-900 bg-zinc-950/40 rounded-3xl space-y-6 flex flex-col justify-between">
              <div>
                <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase pb-2 border-b border-zinc-900 mb-4 animate-pulse">
                  System Administration Override Tools
                </h4>
                <p className="text-xxs text-zinc-500 font-sans leading-relaxed mb-4">
                  For maintenance override. Force reset all reading room seats back to active vacancy statuses to clean up old abandoned reservations. Warning: This modifies disk configurations immediately.
                </p>
              </div>

              <div className="space-y-3 mt-auto">
                <button
                  id="admin_reset_seats_tool"
                  onClick={triggerSeatsReset}
                  className="w-full py-3 border border-dashed border-red-500/40 hover:border-red-500 bg-red-950/5 text-red-400 hover:text-red-300 font-semibold rounded-xl text-xxs font-mono tracking-wider uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Execute Overrides: Vacuum Reading Seats</span>
                </button>
              </div>
            </div>

            {/* FULL-STACK EXPORT UTILITY */}
            <div id="codebase_zip_exporter_panel" className="p-6 border border-zinc-900 bg-zinc-950/40 rounded-3xl col-span-1 md:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-zinc-900">
                <div>
                  <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase">
                    Full-Stack Codebase Backup & Zip Exporter
                  </h4>
                  <p className="text-xxs text-zinc-500 font-mono mt-1">Export your entire source, assets, databases configurations, and routes</p>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1 bg-zinc-900/60 border border-zinc-800 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Release Ready</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xxs text-zinc-400">
                <div className="space-y-1 bg-zinc-950/60 p-4 border border-zinc-900/60 rounded-xl">
                  <span className="text-white font-bold block mb-1">📦 Source & Configs</span>
                  <ul className="list-disc list-inside space-y-1.5 text-zinc-500 text-[10px]">
                    <li>Full React 19 Frontend + routing</li>
                    <li>Vite configuration presets</li>
                    <li>TypeScript typing & manifests</li>
                    <li>Express production server bundle</li>
                  </ul>
                </div>
                <div className="space-y-1 bg-zinc-950/60 p-4 border border-zinc-900/60 rounded-xl">
                  <span className="text-white font-bold block mb-1">🔌 Multi-Layer Sync</span>
                  <ul className="list-disc list-inside space-y-1.5 text-zinc-500 text-[10px]">
                    <li>Supabase client schemas</li>
                    <li>Razorpay transaction handlers</li>
                    <li>Admin SQL database query console</li>
                    <li>Dynamic local DB persistent storage</li>
                  </ul>
                </div>
                <div className="space-y-1 bg-zinc-950/60 p-4 border border-zinc-900/60 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-white font-bold block mb-1">🚀 Quick Local Bootcamp</span>
                    <p className="text-zinc-500 text-[10px] leading-relaxed">
                      Includes comprehensive <span className="text-amber-500">README.md</span> instructions to set up, build, migrate, and deploy this project locally on your machine in under 2 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <span className="text-xxs text-zinc-500 leading-relaxed font-sans max-w-lg">
                  Every asset, frontend module, backend API, configuration, and structural dependency is packaged dynamically into a single structured archive file (.zip) bypassing local environment variables blockages.
                </span>
                <button
                  id="admin_download_zip_archive_btn"
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/api/admin/export-zip';
                    link.setAttribute('download', 'alpha-clubhouse-fullstack-hub.zip');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-all duration-150 transform active:scale-95 flex items-center justify-center space-x-2.5 shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <Download className="w-4 h-4 font-bold" />
                  <span>Download Codebase (.ZIP)</span>
                </button>
              </div>
            </div>

          </div>

          {/* THE ALPHA GAMING & CAFE CONTROLS PANEL */}
          <div className="p-6 border border-zinc-900 bg-zinc-950/20 rounded-3xl space-y-6 mt-8">
            <div className="flex items-center space-x-3 pb-3 border-b border-zinc-900 justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-3">
                <Gamepad2 className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className="font-display text-sm font-bold text-white tracking-wider uppercase">
                    The Alpha Gaming & Cafe Controls Settings
                  </h4>
                  <p className="text-xxs text-zinc-500 font-mono">10 dynamic console booking configurations synced with database</p>
                </div>
              </div>
            </div>

            {gamingPlans.length === 0 ? (
              <p className="text-xxs text-zinc-500 font-mono">Loading gaming configuration profiles...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {gamingPlans.map((g) => {
                  return (
                    <div 
                      key={g.id} 
                      className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between space-y-4"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold mr-2 ${g.type === 'monthly' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'}`}>
                            {g.type === 'monthly' ? 'Pass' : 'Play & Pay'}
                          </span>
                          <span className="text-xxs font-mono text-zinc-500">{g.screenSize}" Screen</span>
                          <h5 className="text-xs font-bold text-white font-sans mt-1.5 leading-none">{g.name}</h5>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {/* Offer Switcher */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-zinc-500">Offer Promo:</span>
                            <button
                              id={`admin_gaming_offer_toggle_${g.id}`}
                              type="button"
                              onClick={() => handleUpdateGamingPlan(g.id, g.originalPrice, g.offerPrice, !g.isOfferActive, g.isEnabled)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all duration-150 cursor-pointer ${g.isOfferActive ? 'bg-emerald-550 text-black' : 'bg-zinc-800 text-zinc-400'}`}
                            >
                              {g.isOfferActive ? 'ON' : 'OFF'}
                            </button>
                          </div>
                          
                          {/* Disable / Enable Switcher - specifically requested as Enable/Disable Monthly Pass */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-zinc-500">Active State:</span>
                            <button
                              id={`admin_gaming_enable_toggle_${g.id}`}
                              type="button"
                              onClick={() => handleUpdateGamingPlan(g.id, g.originalPrice, g.offerPrice, g.isOfferActive, !g.isEnabled)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all duration-150 cursor-pointer ${g.isEnabled ? 'bg-amber-400 text-black font-bold' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                            >
                              {g.isEnabled ? 'Enabled' : 'Disabled'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Inputs Row */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-900 font-mono text-xxs">
                        <div className="space-y-1">
                          <span className="text-zinc-500 uppercase block">Original Price (₹)</span>
                          <input
                            id={`admin_gaming_original_price_input_${g.id}`}
                            type="number"
                            value={g.originalPrice}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setGamingPlans(prev => prev.map(p => p.id === g.id ? { ...p, originalPrice: val } : p));
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded py-1 px-2 text-white font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-zinc-500 uppercase block">Offer Price (₹)</span>
                          <input
                            id={`admin_gaming_offer_price_input_${g.id}`}
                            type="number"
                            value={g.offerPrice}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setGamingPlans(prev => prev.map(p => p.id === g.id ? { ...p, offerPrice: val } : p));
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded py-1 px-2 text-white font-bold"
                          />
                        </div>
                      </div>

                      {/* Manual Save Button */}
                      <button
                        id={`admin_gaming_save_btn_${g.id}`}
                        type="button"
                        onClick={() => handleUpdateGamingPlan(g.id, g.originalPrice, g.offerPrice, g.isOfferActive, g.isEnabled)}
                        className="w-full py-2 bg-gradient-to-r from-zinc-900 to-zinc-850 hover:from-zinc-800 hover:to-zinc-750 text-amber-500 border border-zinc-800 font-mono text-[9px] font-bold uppercase rounded-lg tracking-wider transition-all cursor-pointer"
                      >
                        ✓ Commit Configuration Changes
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </>
        )}

        {/* CAFE MENU SYSTEM MANAGEMENT */}
        {activeSubTab === 'cafe_menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ADD MENU ITEM */}
            <div className="lg:col-span-4 p-6 border border-zinc-900 bg-zinc-950/45 rounded-3xl space-y-5">
              <div>
                <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase mb-1">
                  Add Fresh Menu Item
                </h4>
                <p className="text-xxs text-zinc-500">Configure item name, category, and standard price values</p>
              </div>

              <form onSubmit={handleAddCafeItem} className="space-y-4 font-sans text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono text-[10px] uppercase block">Item Display Name</label>
                  <input
                    id="admin_cafe_add_name"
                    type="text"
                    placeholder="e.g. Cheese Paneer Sandwich"
                    value={newCafeItem.name}
                    onChange={(e) => setNewCafeItem(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 focus:border-amber-500 focus:outline-none text-white rounded-xl transition-colors text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono text-[10px] uppercase block">Menu Category</label>
                  <select
                    id="admin_cafe_add_category"
                    value={newCafeItem.category}
                    onChange={(e) => setNewCafeItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 text-white rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Hot Beverages">1. Hot Beverages</option>
                    <option value="Sandwiches">2. Sandwiches</option>
                    <option value="Quick Bites">3. Quick Bites</option>
                    <option value="Cold Drinks">4. Cold Drinks</option>
                    <option value="Falooda Specials">5. Falooda Specials</option>
                    <option value="Mocktails">6. Mocktails</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono text-[10px] uppercase block">Standard Price (₹)</label>
                  <input
                    id="admin_cafe_add_price"
                    type="number"
                    placeholder="e.g. 120"
                    value={newCafeItem.price}
                    onChange={(e) => setNewCafeItem(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 focus:border-amber-500 focus:outline-none text-white rounded-xl transition-colors text-xs font-mono"
                    required
                  />
                </div>

                <button
                  id="admin_cafe_add_submit"
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-semibold text-xxs font-mono tracking-wider uppercase rounded-xl transition-all shadow-md hover:shadow-yellow-950/20 cursor-pointer"
                >
                  + Publish Menu Item
                </button>
              </form>
            </div>

            {/* MANAGE ACTIVE MENU LIST */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <div>
                  <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase">
                    Active Catalogued Menu
                  </h4>
                  <p className="text-xxs text-zinc-500">Live price points and availability status indicators</p>
                </div>
                <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded text-amber-500 font-semibold">
                  {cafeMenu.length} Total Items
                </span>
              </div>

              {loadingCafe ? (
                <p className="text-xxs text-zinc-500 font-mono animate-pulse">Synchronizing cafe menu catalog...</p>
              ) : cafeMenu.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-900 rounded-2xl text-center text-xs text-zinc-500">
                  No food menu items catalogued yet. Add some to bootstrap.
                </div>
              ) : (
                <div className="space-y-4">
                  {['Hot Beverages', 'Sandwiches', 'Quick Bites', 'Cold Drinks', 'Falooda Specials', 'Mocktails'].map(category => {
                    const items = cafeMenu.filter(itm => itm.category === category);
                    if (items.length === 0) return null;
                    return (
                      <div key={category} className="space-y-2 border border-zinc-900/60 p-4 bg-zinc-950/15 rounded-2xl">
                        <h5 className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold mb-3">{category}</h5>
                        <div className="divide-y divide-zinc-900/40">
                          {items.map(itm => (
                            <div key={itm.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
                              {editingCafeId === itm.id ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                                  <input
                                    id={`admin_cafe_edit_name_${itm.id}`}
                                    type="text"
                                    value={editingCafeItem.name}
                                    onChange={(e) => setEditingCafeItem(p => ({ ...p, name: e.target.value }))}
                                    className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-white rounded text-xs"
                                  />
                                  <input
                                    id={`admin_cafe_edit_price_${itm.id}`}
                                    type="number"
                                    value={editingCafeItem.price}
                                    onChange={(e) => setEditingCafeItem(p => ({ ...p, price: e.target.value }))}
                                    className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-white rounded text-xs font-mono"
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      id={`admin_cafe_edit_save_${itm.id}`}
                                      onClick={() => handleUpdateCafeItem(itm.id, { name: editingCafeItem.name, price: parseFloat(editingCafeItem.price) })}
                                      className="px-2 py-1 bg-emerald-500 text-black text-[9px] font-bold uppercase rounded cursor-pointer"
                                    >
                                      Save
                                    </button>
                                    <button
                                      id={`admin_cafe_edit_cancel_${itm.id}`}
                                      onClick={() => setEditingCafeId(null)}
                                      className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[9px] font-bold uppercase rounded cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${itm.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                    <div>
                                      <p className="text-white font-medium">{itm.name}</p>
                                      <p className="text-[9px] text-zinc-500 font-mono uppercase">Category: {itm.category}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-white font-bold font-mono">₹{itm.price}</span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        id={`admin_cafe_toggle_status_${itm.id}`}
                                        onClick={() => handleUpdateCafeItem(itm.id, { isEnabled: !itm.isEnabled })}
                                        className={`px-2 py-1 rounded text-[9px] font-bold uppercase cursor-pointer ${itm.isEnabled ? 'bg-emerald-450/10 text-emerald-400 border border-emerald-500/15' : 'bg-red-500/10 text-red-400 border border-red-500/15'}`}
                                      >
                                        {itm.isEnabled ? 'Enabled' : 'Disabled'}
                                      </button>
                                      <button
                                        id={`admin_cafe_trigger_edit_${itm.id}`}
                                        onClick={() => {
                                          setEditingCafeId(itm.id);
                                          setEditingCafeItem({ name: itm.name, category: itm.category, price: String(itm.price), isEnabled: itm.isEnabled });
                                        }}
                                        className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded text-[9px] font-mono tracking-wider uppercase cursor-pointer"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        id={`admin_cafe_trigger_delete_${itm.id}`}
                                        onClick={() => handleDeleteCafeItem(itm.id)}
                                        className="p-1 px-1.5 bg-red-950/20 text-red-400 hover:text-red-305 border border-red-950/30 rounded cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BANNERS & POSTERS SYSTEM MANAGEMENT */}
        {activeSubTab === 'banners' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* UPLOAD PANEL */}
            <div className="lg:col-span-5 p-6 border border-zinc-900 bg-zinc-950/45 rounded-3xl space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase mb-1">
                    {editingBannerId ? "Replace Existing Slide Poster" : "Upload Visual Slide Poster"}
                  </h4>
                  <p className="text-xxs text-zinc-500">Supports JPG, PNG, WEBP. Integrates with Cloudinary API pools.</p>
                </div>
                {editingBannerId && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingBannerId(null);
                      setNewBanner({ 
                        title: '', 
                        description: '',
                        imageBase64: '', 
                        type: 'homepage', 
                        targetPage: 'homepage', 
                        deviceType: 'all',
                        startDate: '',
                        endDate: '',
                        isActive: true 
                      });
                    }}
                    className="px-2 py-1 bg-red-950/30 border border-red-900 text-red-400 text-[9px] font-mono rounded"
                  >
                    Cancel Rep
                  </button>
                )}
              </div>

              {editingBannerId && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xxs font-mono text-amber-500 uppercase tracking-widest text-left select-none animate-pulse">
                  ⚡ STATUS: Replacing Banner ID: {editingBannerId}
                </div>
              )}

              <form onSubmit={handleUploadBanner} className="space-y-4 font-sans text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono text-[10px] uppercase block text-left">Poster Label / Title</label>
                  <input
                    id="admin_banner_add_title"
                    type="text"
                    required
                    placeholder="e.g. Yearly Alpha Gym Bonanza"
                    value={newBanner.title}
                    onChange={(e) => setNewBanner(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 focus:border-amber-500 focus:outline-none text-white rounded-xl transition-colors text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-zinc-400 font-mono text-[10px] uppercase block">Subtext / Description copy</label>
                  <textarea
                    id="admin_banner_add_desc"
                    rows={2}
                    placeholder="Enter secondary poster marketing text or rules..."
                    value={newBanner.description}
                    onChange={(e) => setNewBanner(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 focus:border-amber-500 focus:outline-none text-white rounded-xl transition-colors text-xs font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[10px] uppercase block">Poster Category / Type</label>
                    <select
                      id="admin_banner_add_type"
                      value={newBanner.type}
                      onChange={(e) => setNewBanner(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-900 text-white rounded-xl text-xs"
                    >
                      <option value="homepage">Homepage Banner</option>
                      <option value="gym">Gym Banner</option>
                      <option value="library">Library Banner</option>
                      <option value="gaming">Gaming & Cafe</option>
                      <option value="tournament">Tournament Spec</option>
                      <option value="offer">Offer Banner</option>
                      <option value="festival">Festival Campaign</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[10px] uppercase block">Dynamic Tab Link Target</label>
                    <select
                      id="admin_banner_add_target"
                      value={newBanner.targetPage}
                      onChange={(e) => setNewBanner(prev => ({ ...prev, targetPage: e.target.value }))}
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-900 text-white rounded-xl text-xs"
                    >
                      <option value="homepage">None / Default</option>
                      <option value="gym">Gym Colosseum Tab</option>
                      <option value="library">Library Scholar Tab</option>
                      <option value="gaming">Gaming Hot Tab</option>
                      <option value="cafe">Cafe Food Menu Tab</option>
                      <option value="dashboard">Membership Hub Tab</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[10px] uppercase block">Device Scope constraints</label>
                    <select
                      id="admin_banner_add_device"
                      value={newBanner.deviceType}
                      onChange={(e) => setNewBanner(prev => ({ ...prev, deviceType: e.target.value }))}
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-900 text-white rounded-xl text-xs"
                    >
                      <option value="all">Display All Screens (Responsive)</option>
                      <option value="desktop">Desktop Web Only</option>
                      <option value="mobile">Mobile Phones Only</option>
                    </select>
                  </div>
                </div>

                {/* SCHEDULING DATE LIMITERS */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[9px] uppercase block">Schedule Activation Date</label>
                    <input 
                      type="date"
                      value={newBanner.startDate}
                      onChange={(e) => setNewBanner(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-905 text-white rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[9px] uppercase block">Schedule Expiration Date</label>
                    <input 
                      type="date"
                      value={newBanner.endDate}
                      onChange={(e) => setNewBanner(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-905 text-white rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* FILE ATTACH BLOCK */}
                <div className="space-y-2">
                  <label className="text-zinc-400 font-mono text-[10px] uppercase block text-left">Poster Graphic File</label>
                  
                  {newBanner.imageBase64 ? (
                    <div className="relative border border-zinc-800 rounded-xl overflow-hidden p-2 bg-black">
                      <img
                        src={newBanner.imageBase64}
                        alt="Preview"
                        className="w-full h-36 object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        id="admin_banner_add_image_clear"
                        type="button"
                        onClick={() => setNewBanner(prev => ({ ...prev, imageBase64: '' }))}
                        className="absolute top-4 right-4 bg-red-650 hover:bg-red-700 px-3 py-1.5 rounded-lg text-white font-mono text-[10px] shadow-md cursor-pointer"
                      >
                        Reset Image File
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-zinc-800 hover:border-amber-500/40 bg-zinc-950/20 rounded-2xl p-6 text-center cursor-pointer relative transition-all">
                      <input
                        id="admin_banner_file_input"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleBannerFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2 animate-pulse" />
                      <p className="text-zinc-400 text-xxs font-medium mb-1">Click to attach or drag-and-drop file</p>
                      <p className="text-zinc-600 leading-none text-xxxs">JPG, PNG or WEBP (Max 4MB bytes)</p>
                    </div>
                  )}
                </div>

                <button
                  id="admin_banner_add_submit"
                  type="submit"
                  disabled={uploadingBanner}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-semibold text-xxs font-mono tracking-wider middle-align uppercase  rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {uploadingBanner ? "Processing upload..." : editingBannerId ? "✓ Replace Active Poster" : "✓ Publish Poster Banner"}
                </button>
              </form>

              {bannerUploadDebug && bannerUploadDebug.length > 0 && (
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 text-left space-y-1.5 font-mono text-[9px] mt-4">
                  <div className="text-zinc-500 uppercase tracking-widest font-bold text-[8px] pb-1 border-b border-zinc-900 flex justify-between items-center select-none">
                    <span>⚡ UPLOAD PIPELINE CONSOLE LOG</span>
                    <button 
                      type="button" 
                      onClick={() => setBannerUploadDebug([])} 
                      className="text-zinc-650 hover:text-white font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  {bannerUploadDebug.map((log, i) => {
                    let color = "text-zinc-400";
                    if (log.startsWith("✓")) color = "text-emerald-400 font-bold";
                    if (log.startsWith("❌")) color = "text-red-500 font-bold";
                    if (log.startsWith("⏳")) color = "text-amber-400";
                    return (
                      <div key={i} className={`leading-relaxed break-all ${color}`}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MANAGE INSTALLED SLIDERS */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <div>
                  <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase">
                    Active Catalogued Slides & Posters
                  </h4>
                  <p className="text-xxs text-zinc-500">Live dynamic uploads serving the homepage and sections</p>
                </div>
                <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded text-amber-500 font-semibold">
                  {banners.length} Files Set
                </span>
              </div>

              {loadingBanners ? (
                <p className="text-xxs text-zinc-500 font-mono animate-pulse">Scanning poster library...</p>
              ) : banners.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-900 rounded-2xl text-center text-xs text-zinc-500">
                  No visual posters uploaded yet. The app falls back to defaults.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {banners.map(b => {
                    const hasDates = b.scheduleStartDate || b.scheduleEndDate;
                    return (
                      <div key={b.id} className="p-4 border border-zinc-900 bg-zinc-950/20 rounded-2xl space-y-3 flex flex-col justify-between text-left">
                        <div className="relative h-28 border border-zinc-900/60 rounded-xl overflow-hidden bg-black/60">
                          <img
                            src={b.imageUrl}
                            alt={b.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-black/80 text-amber-400 uppercase tracking-widest border border-zinc-900">
                            {b.type ? b.type.toUpperCase() : 'GENERAL'}
                          </span>
                          
                          {b.deviceType && b.deviceType !== 'all' && (
                            <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[7px] font-mono bg-zinc-950 text-zinc-350 uppercase tracking-wide border border-zinc-800">
                              {b.deviceType.toUpperCase()} SCREEN
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <h5 className="text-xs font-bold text-white truncate leading-none">{b.title}</h5>
                          {b.description && (
                            <p className="text-[10px] text-zinc-400 font-sans leading-normal line-clamp-2 pt-0.5">
                              {b.description}
                            </p>
                          )}
                          <p className="text-[9px] font-mono text-zinc-500 pt-1">Route Target: <span className="text-zinc-300">{b.targetPage}</span></p>
                          
                          {hasDates && (
                            <div className="p-2 bg-zinc-900/60 rounded border border-zinc-900 text-[8px] font-mono text-amber-500 tracking-wide mt-1 leading-normal uppercase">
                              📅 ACTIVE: {b.scheduleStartDate || 'Immediate'} to {b.scheduleEndDate || 'Perpetual'}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 justify-between items-center pt-2.5 border-t border-zinc-900">
                          <div className="flex gap-2">
                            <button
                              id={`admin_banner_toggle_status_${b.id}`}
                              onClick={() => handleSetBannerActive(b.id, !b.isActive)}
                              className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${b.isActive ? 'bg-emerald-450/10 text-emerald-400' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                            >
                              {b.isActive ? 'Active' : 'Offline'}
                            </button>

                            <button
                              id={`admin_banner_replace_trigger_${b.id}`}
                              type="button"
                              onClick={() => {
                                setEditingBannerId(b.id);
                                setNewBanner({
                                  title: b.title || '',
                                  description: b.description || '',
                                  imageBase64: b.imageUrl,
                                  type: b.type || 'homepage',
                                  targetPage: b.targetPage || 'homepage',
                                  deviceType: b.deviceType || 'all',
                                  startDate: b.scheduleStartDate || '',
                                  endDate: b.scheduleEndDate || '',
                                  isActive: b.isActive !== undefined ? b.isActive : true
                                });
                                alert(`Ready to replace poster: "${b.title}". Please modify settings or choose a new image file, then click Publish Poster.`);
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded text-[9px] font-mono uppercase font-bold tracking-wide transition-all cursor-pointer border border-amber-500/20"
                              title="Replace existing banner details or file"
                            >
                              Replace
                            </button>
                          </div>

                          <button
                            id={`admin_banner_delete_btn_${b.id}`}
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-1 px-2.5 bg-red-950/20 text-red-405 hover:text-red-305 hover:bg-black/30 border border-red-950/30 rounded focus:outline-none flex items-center space-x-1 text-[9px] font-mono tracking-wider cursor-pointer font-bold"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TOURNEY SYSTEM ADMIN SUB PANEL */}
        {activeSubTab === 'tournaments' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
            
            {/* Create & Modify Form */}
            <div className="lg:col-span-5 p-6 border border-zinc-900 bg-zinc-950/45 rounded-3xl space-y-5">
              <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                <div>
                  <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase">
                    {newTourney.id ? "Edit Esports Tournament Details" : "Inscribe Esports Tournament"}
                  </h4>
                  <p className="text-[10px] text-zinc-550 pt-0.5">Define rules, dynamic entrance fees, and custom banner sheets.</p>
                </div>
                {newTourney.id && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setNewTourney({ 
                        id: '', 
                        name: '', 
                        game: 'Asphalt Legends', 
                        entryFee: '200', 
                        description: '', 
                        bannerUrl: '', 
                        imageBase64: '', 
                        isActive: true, 
                        status: 'open' 
                      });
                    }}
                    className="text-[9px] font-mono text-amber-500 hover:underline uppercase"
                  >
                    Clear Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveTournament} className="space-y-4 text-xs font-sans">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">Tournament Title / Name *</label>
                  <input
                    id="admin_tourney_name"
                    type="text"
                    required
                    placeholder="E.G. ASPHALT LEGENDS CHAMPIONSHIP 2026"
                    value={newTourney.name}
                    onChange={(e) => setNewTourney(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2.5 bg-black border border-zinc-900 text-white rounded-xl focus:border-amber-500 focus:outline-none uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">Game Title</label>
                    <select
                      id="admin_tourney_game"
                      value={newTourney.game}
                      onChange={(e) => setNewTourney(prev => ({ ...prev, game: e.target.value }))}
                      className="w-full p-2.5 bg-black border border-zinc-900 text-zinc-400 rounded-xl text-xs cursor-not-allowed"
                      disabled
                    >
                      <option value="Asphalt Legends">Asphalt Legends</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">Entry Fee Amount (₹) *</label>
                    <input
                      id="admin_tourney_fee"
                      type="number"
                      required
                      min={0}
                      placeholder="200"
                      value={newTourney.entryFee}
                      onChange={(e) => setNewTourney(prev => ({ ...prev, entryFee: e.target.value }))}
                      className="w-full p-2.5 bg-black border border-zinc-900 text-white rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">Brief Details / Rules Description</label>
                  <textarea
                    id="admin_tourney_desc"
                    rows={3}
                    placeholder="Details about prize pools, reporting schedules, qualifiers etc."
                    value={newTourney.description}
                    onChange={(e) => setNewTourney(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2.5 bg-black border border-zinc-900 text-white rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">Registration Status</label>
                    <select
                      id="admin_tourney_status"
                      value={newTourney.status}
                      onChange={(e) => setNewTourney(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full p-2.5 bg-black border border-zinc-900 text-white rounded-xl text-xs font-mono"
                    >
                      <option value="open">Registration Open</option>
                      <option value="closed">Registration Closed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">Visibility Status</label>
                    <select
                      id="admin_tourney_is_active"
                      value={newTourney.isActive ? "true" : "false"}
                      onChange={(e) => setNewTourney(prev => ({ ...prev, isActive: e.target.value === "true" }))}
                      className="w-full p-2.5 bg-black border border-zinc-905 text-white rounded-xl text-xs font-mono"
                    >
                      <option value="true">Active (Visible)</option>
                      <option value="false">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>

                {/* Banner Upload File Controls */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">Tournament Poster Banner / Poster Asset</label>
                  
                  {/* File Upload drag-and-drop support */}
                  <div
                    onDragOver={handleTourneyDragOver}
                    onDragLeave={handleTourneyDragLeave}
                    onDrop={handleTourneyDrop}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                      isDragOver 
                        ? 'border-amber-500 bg-amber-500/5' 
                        : newTourney.imageBase64 || newTourney.bannerUrl
                          ? 'border-zinc-800 bg-zinc-900/10'
                          : 'border-zinc-900 bg-black'
                    }`}
                  >
                    <input
                      id="admin_tourney_file_input"
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleTourneyFileChange}
                      className="hidden"
                    />
                    <label htmlFor="admin_tourney_file_input" className="cursor-pointer space-y-1.5 block">
                      {newTourney.imageBase64 || newTourney.bannerUrl ? (
                        <div className="space-y-2">
                          <img
                            src={newTourney.imageBase64 || newTourney.bannerUrl}
                            alt="Preview"
                            className="h-20 w-auto mx-auto object-cover rounded-md border border-zinc-900"
                            referrerPolicy="no-referrer"
                          />
                          <p className="text-[9px] text-zinc-550 uppercase">Drag or Click to Replace Poster WebSheet</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Download className="w-5 h-5 text-zinc-550 mx-auto animate-pulse" />
                          <p className="text-[10px] text-zinc-350">Drag & Drop Tournament Poster Here</p>
                          <p className="text-[9px] text-zinc-550 uppercase">or Click to Browse (JPG, PNG, WEBP)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="save_tournament_admin_btn"
                    type="submit"
                    disabled={loadingAdminTourneys}
                    className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 disabled:from-zinc-900 disabled:to-zinc-900 disabled:text-zinc-500 text-black font-extrabold uppercase rounded-xl tracking-wider text-xxs font-mono transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>{newTourney.id ? "Publish Details Override" : "Publish Live Esports Tournament"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Esports tournaments dynamic tables list */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex justify-between items-center bg-zinc-950/20 p-4 border border-zinc-900 rounded-2xl">
                <div>
                  <h4 className="font-display text-sm font-semibold text-white tracking-widest uppercase">ACTIVE ESORTS REPERTOIRE</h4>
                  <p className="text-[10px] text-zinc-500">Live, inactive, and archived tournaments on the main floor.</p>
                </div>
                <span className="text-[10px] font-mono bg-zinc-900 px-3 py-1 font-bold text-amber-500 border border-zinc-900 rounded-lg">
                  {adminTournaments.length} REGISTERED
                </span>
              </div>

              {adminTournaments.length === 0 ? (
                <div className="p-16 border border-zinc-900 bg-zinc-950/20 rounded-3xl text-center space-y-2">
                  <TrendingUp className="w-8 h-8 text-zinc-700 mx-auto" />
                  <p className="text-xs text-zinc-500 font-mono">NO ACTIVE TOURNAMENTS RECORDED YET</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {adminTournaments.map(t => {
                    const count = bookings.filter(b => b.category === 'tournament' && b.planName === t.name).length;
                    return (
                      <div 
                        key={t.id}
                        className="p-4 border border-zinc-900 bg-zinc-950/45 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-800 transition-colors"
                      >
                        <div className="flex gap-4 items-center text-left">
                          <img
                            src={t.bannerUrl}
                            alt={t.name}
                            className="w-16 h-16 object-cover rounded-xl border border-zinc-900"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-mono bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded uppercase">
                                {t.game}
                              </span>
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                                t.status === 'open' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
                              }`}>
                                REG {t.status.toUpperCase()}
                              </span>
                              {!t.isActive && (
                                <span className="text-[8px] font-mono bg-zinc-900 text-zinc-550 px-1.5 py-0.5 rounded uppercase border border-zinc-850">
                                  HIDDEN
                                </span>
                              )}
                            </div>
                            <h4 className="font-display font-bold text-white text-xs tracking-tight leading-snug">{t.name}</h4>
                            <div className="flex gap-4 text-[9px] font-mono text-zinc-550 uppercase">
                              <span>Entry Fee: <span className="text-amber-400 font-bold">₹{t.entryFee}</span></span>
                              <span>Participants Billed: <span className="text-white font-bold">{count}</span></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap md:flex-col gap-2 shrink-0 w-full md:w-auto text-xxs">
                          <button
                            id={`admin_tourney_edit_trigger_${t.id}`}
                            onClick={() => {
                              setNewTourney({
                                id: t.id,
                                name: t.name,
                                game: t.game,
                                entryFee: t.entryFee.toString(),
                                description: t.description || '',
                                bannerUrl: t.bannerUrl || '',
                                imageBase64: '',
                                isActive: t.isActive !== undefined ? t.isActive : true,
                                status: t.status || 'open'
                              });
                              alert(`Ready to edit tournament details: "${t.name}". Please modify the details in the left form and hit Publish Details Override.`);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className="flex-1 md:w-full px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-lg text-center cursor-pointer transition-colors"
                          >
                            Edit Features
                          </button>

                          <button
                            id={`admin_tourney_export_participants_${t.id}`}
                            onClick={() => handleExportTournamentParticipants(t.name)}
                            disabled={count === 0}
                            className="flex-1 md:w-full px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-zinc-950/20 disabled:text-zinc-650 text-amber-500 rounded-lg text-center cursor-pointer border border-amber-500/20 disabled:border-zinc-900 transition-colors font-bold uppercase tracking-wider"
                            title="Export participant directory to CSV spreadsheet"
                          >
                            Export List ({count})
                          </button>

                          <button
                            id={`admin_tourney_delete_btn_${t.id}`}
                            onClick={() => handleDeleteTournament(t.id)}
                            className="flex-1 md:w-full px-3 py-1.5 bg-red-950/10 hover:bg-red-950/20 text-red-400 rounded-lg text-center cursor-pointer transition-colors"
                          >
                            Delete Event
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {activeSubTab === 'highlights' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
            {/* LEFT COLUMN: UPLOAD / UPDATE HIGHLIGHT MEDIA FORMS */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
              
              {/* STORY FORM CARD */}
              <div className="p-6 border border-zinc-900 bg-zinc-950/45 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <Star className="w-5 h-5 text-amber-500" />
                  <div>
                    <h4 className="font-display text-sm font-semibold text-white uppercase tracking-wider">
                      {storyForm.id ? "Edit Story Highlight" : "Inscribe Story Highlight"}
                    </h4>
                    <p className="text-[10px] text-zinc-500">Instagram-style circular story highlights.</p>
                  </div>
                </div>

                <form onSubmit={handleStoryFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Story Title</label>
                    <input
                      type="text"
                      id="admin_story_form_title"
                      placeholder="e.g., Setup, Rules, Food..."
                      value={storyForm.title}
                      onChange={(e) => setStoryForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStoryForm(prev => ({ ...prev, type: 'photo' }))}
                      className={`py-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-colors ${storyForm.type === 'photo' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
                    >
                      Use Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoryForm(prev => ({ ...prev, type: 'video' }))}
                      className={`py-2 rounded-lg text-xs font-mono uppercase tracking-wider border transition-colors ${storyForm.type === 'video' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
                    >
                      Use Video
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Story Media File</label>
                    <div 
                      className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 p-5 rounded-2xl text-center space-y-2 cursor-pointer transition-colors relative"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setStoryForm(prev => ({ ...prev, mediaBase64: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      onClick={() => document.getElementById('admin_story_file_selector')?.click()}
                    >
                      <input
                        type="file"
                        id="admin_story_file_selector"
                        accept={storyForm.type === 'video' ? ".mp4,.mov,.webm" : ".jpg,.jpeg,.png,.webp"}
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setStoryForm(prev => ({ ...prev, mediaBase64: reader.result as string }));
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                      />
                      {storyForm.mediaBase64 ? (
                        <div className="space-y-2 p-2">
                           <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono text-xs">
                             <CheckCircle className="w-4 h-4" />
                             <span>Media Local Source Saved</span>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-1 py-4 text-zinc-500">
                          <Upload className="w-6 h-6 text-zinc-700 mx-auto mb-1" />
                          <p className="text-[11px] font-medium text-zinc-450">Drag & Drop or Click to browse</p>
                          <p className="text-[9px] text-zinc-650">{storyForm.type === 'video' ? 'Supported: MP4, MOV, WEBM' : 'Supported: JPG, JPEG, PNG, WEBP'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="admin_story_form_is_active"
                      checked={storyForm.isActive}
                      onChange={(e) => setStoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <label htmlFor="admin_story_form_is_active" className="text-xxs text-zinc-300 font-mono select-none uppercase">Published / Enabled</label>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      id="admin_story_submit_btn"
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl text-xxs uppercase tracking-wider cursor-pointer"
                    >
                      {storyForm.id ? "Apply Override Specs" : (storyForm.type === 'video' ? 'Upload Story Video' : 'Upload Story Photo')}
                    </button>
                    {storyForm.id && (
                      <button
                        type="button"
                        id="admin_story_cancel_btn"
                        onClick={() => setStoryForm({ id: '', title: '', mediaBase64: '', isActive: true, type: 'photo' })}
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-xxs uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* PHOTO FORM CARD */}
              <div className="p-6 border border-zinc-900 bg-zinc-950/45 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <Image className="w-5 h-5 text-amber-500" />
                  <div>
                    <h4 className="font-display text-sm font-semibold text-white uppercase tracking-wider">
                      {photoForm.id ? "Edit Photo Highlight" : "Inscribe Photo Highlight"}
                    </h4>
                    <p className="text-[10px] text-zinc-500">Add dynamic pictures with customized album categorizations.</p>
                  </div>
                </div>

                <form onSubmit={handlePhotoFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Photo Title Description</label>
                    <input
                      type="text"
                      id="admin_photo_form_title"
                      placeholder="e.g., Dual Console Setup Showcase"
                      value={photoForm.title}
                      onChange={(e) => setPhotoForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Album Name</label>
                    <input
                      type="text"
                      id="admin_photo_form_album"
                      placeholder="e.g., Tournaments, Arena Setup, Cafe, Gaming Seats"
                      value={photoForm.album}
                      onChange={(e) => setPhotoForm(prev => ({ ...prev, album: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Photo Media File</label>
                    <div 
                      className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 p-5 rounded-2xl text-center space-y-2 cursor-pointer transition-colors relative"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPhotoForm(prev => ({ ...prev, imageBase64: reader.result as string }));
                          };
                          reader.readAsDataURL(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => document.getElementById('admin_photo_file_selector')?.click()}
                    >
                      <input
                        type="file"
                        id="admin_photo_file_selector"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setPhotoForm(prev => ({ ...prev, imageBase64: reader.result as string }));
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                      />
                      {photoForm.imageBase64 ? (
                        <div className="space-y-2">
                          <img src={photoForm.imageBase64} alt="Preview" className="h-28 mx-auto object-cover rounded-lg border border-zinc-900" />
                          <p className="text-[10px] text-amber-500">Image successfully loaded. Click to replace.</p>
                        </div>
                      ) : (
                        <div className="space-y-1 py-4 text-zinc-500">
                          <Upload className="w-6 h-6 text-zinc-700 mx-auto mb-1" />
                          <p className="text-[11px] font-medium text-zinc-450">Drag & Drop or Click to browse</p>
                          <p className="text-[9px] text-zinc-650">Supported: JPG, JPEG, PNG, WEBP</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="admin_photo_form_is_active"
                      checked={photoForm.isActive}
                      onChange={(e) => setPhotoForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <label htmlFor="admin_photo_form_is_active" className="text-xxs text-zinc-300 font-mono select-none uppercase">Published / Enabled</label>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      id="admin_photo_submit_btn"
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl text-xxs uppercase tracking-wider cursor-pointer"
                    >
                      {photoForm.id ? "Apply Override Specs" : "Upload Photo Highlight"}
                    </button>
                    {photoForm.id && (
                      <button
                        type="button"
                        id="admin_photo_cancel_btn"
                        onClick={() => setPhotoForm({ id: '', album: '', title: '', imageBase64: '', isActive: true })}
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-xxs uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* VIDEO FORM CARD */}
              <div className="p-6 border border-zinc-900 bg-zinc-950/45 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <Film className="w-5 h-5 text-amber-500" />
                  <div>
                    <h4 className="font-display text-sm font-semibold text-white uppercase tracking-wider">
                      {videoForm.id ? "Edit Video Highlight" : "Inscribe Video Highlight"}
                    </h4>
                    <p className="text-[10px] text-zinc-500">Deploy elite video playback clips from live gameplay.</p>
                  </div>
                </div>

                <form onSubmit={handleVideoFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Video Title</label>
                    <input
                      type="text"
                      id="admin_video_form_title"
                      placeholder="e.g., Asphalt Legends Alpha Championship Final Lap"
                      value={videoForm.title}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Video Media File</label>
                    <div 
                      className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 p-5 rounded-2xl text-center space-y-2 cursor-pointer transition-colors relative"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          const ext = file.name.split('.').pop()?.toLowerCase();
                          if (!['mp4', 'mov', 'webm'].includes(ext || '')) {
                            alert("Error: Unsupported video format. Supported formats: MP4, MOV, WEBM");
                            return;
                          }
                          if (file.size > 500 * 1024 * 1024) {
                            alert("Error: File size exceeds the maximum limit of 500 MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setVideoForm(prev => ({ ...prev, videoBase64: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      onClick={() => document.getElementById('admin_video_file_selector')?.click()}
                    >
                      <input
                        type="file"
                        id="admin_video_file_selector"
                        accept=".mp4,.mov,.webm"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const ext = file.name.split('.').pop()?.toLowerCase();
                            if (!['mp4', 'mov', 'webm'].includes(ext || '')) {
                              alert("Error: Unsupported video format. Supported formats: MP4, MOV, WEBM");
                              return;
                            }
                            if (file.size > 500 * 1024 * 1024) {
                              alert("Error: File size exceeds the maximum limit of 500 MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setVideoForm(prev => ({ ...prev, videoBase64: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {videoForm.videoBase64 ? (
                        <div className="space-y-2 p-2">
                          <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono text-xs">
                            <CheckCircle className="w-4 h-4" />
                            <span>Video Local Source Saved</span>
                          </div>
                          <p className="text-[9px] text-zinc-550 break-all">{videoForm.videoBase64.substring(0, 80)}...</p>
                        </div>
                      ) : (
                        <div className="space-y-1 py-4 text-zinc-500">
                          <Upload className="w-6 h-6 text-zinc-700 mx-auto" />
                          <p className="text-[11px] font-medium text-zinc-450">Drag & Drop or Click to browse</p>
                          <p className="text-[9px] text-zinc-650">Supported: MP4, MOV, WEBM (Max 500 MB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Video Poster / Cover Image</label>
                    <div 
                      className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 p-5 rounded-2xl text-center space-y-2 cursor-pointer transition-colors relative"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setVideoForm(prev => ({ ...prev, posterBase64: reader.result as string }));
                          };
                          reader.readAsDataURL(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => document.getElementById('admin_video_poster_file_selector')?.click()}
                    >
                      <input
                        type="file"
                        id="admin_video_poster_file_selector"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setVideoForm(prev => ({ ...prev, posterBase64: reader.result as string }));
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                      />
                      {videoForm.posterBase64 || videoForm.posterUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={videoForm.posterBase64 || videoForm.posterUrl} 
                            alt="Poster Preview" 
                            className="h-28 mx-auto object-cover rounded-lg border border-zinc-900" 
                          />
                          <p className="text-[10px] text-amber-500 font-mono text-center">✓ Poster Loaded. Click to Replace Poster</p>
                        </div>
                      ) : (
                        <div className="space-y-1 py-4 text-zinc-500">
                          <Upload className="w-5 h-5 text-zinc-700 mx-auto mb-1" />
                          <p className="text-[11px] font-medium text-zinc-450">Drag & Drop or Click to browse</p>
                          <p className="text-[9px] text-zinc-650">Supported: JPG, PNG, WEBP</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 bg-zinc-950/25 p-3.5 border border-zinc-900 rounded-xl space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="admin_video_form_is_featured"
                        checked={videoForm.isFeatured}
                        onChange={(e) => setVideoForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      />
                      <label htmlFor="admin_video_form_is_featured" className="text-xxs text-amber-400 font-mono select-none uppercase font-bold tracking-wider">★ SPOTLIGHT FEATURED VIDEO</label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="admin_video_form_loop"
                        checked={videoForm.loop}
                        onChange={(e) => setVideoForm(prev => ({ ...prev, loop: e.target.checked }))}
                      />
                      <label htmlFor="admin_video_form_loop" className="text-xxs text-zinc-300 font-mono select-none uppercase">Loop Continuous Playback</label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="admin_video_form_is_active"
                        checked={videoForm.isActive}
                        onChange={(e) => setVideoForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <label htmlFor="admin_video_form_is_active" className="text-xxs text-zinc-300 font-mono select-none uppercase">Published / Enabled</label>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      id="admin_video_submit_btn"
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl text-xxs uppercase tracking-wider cursor-pointer font-bold animate-pulse hover:animate-none"
                    >
                      {videoForm.id ? "Save Changes" : "Upload Video"}
                    </button>
                    {videoForm.id && (
                      <button
                        type="button"
                        id="admin_video_cancel_btn"
                        onClick={() => setVideoForm({ id: '', title: '', videoBase64: '', posterBase64: '', posterUrl: '', isFeatured: false, loop: true, isActive: true })}
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xxs uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

            </div>

            {/* RIGHT COLUMN: ACTIVE MEDIA LISTS DIRECTORY */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-6">
              
              {/* STORY LIST GALLERY */}
              <div className="p-6 border border-zinc-900 bg-zinc-950/25 rounded-3xl space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <div>
                    <h4 className="font-display text-sm font-semibold text-white uppercase tracking-wider">Active Stories Gallery</h4>
                    <p className="text-[10px] text-zinc-500">Manage Instagram-style circular highlights.</p>
                  </div>
                  <span className="text-[10px] font-mono text-amber-500 font-bold bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded-lg">
                    {adminHighlights.stories?.length || 0} story{(adminHighlights.stories?.length !== 1) ? 's' : ''}
                  </span>
                </div>

                {(!adminHighlights.stories || adminHighlights.stories.length === 0) ? (
                  <div className="p-10 text-center text-xs text-zinc-500 font-mono">No gaming highlight stories deployed.</div>
                ) : (
                  <div className="space-y-3.5">
                    {adminHighlights.stories.map((s, idx) => (
                      <div key={s.id} className="p-3.5 bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={s.type === 'video' ? 'https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&q=80&w=150' : s.mediaUrl} 
                            alt={s.title} 
                            className="w-12 h-12 object-cover rounded-xl border border-zinc-950 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-1 min-w-0 flex-1">
                            <span className="inline-block text-[8px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase select-none">
                              {s.type}
                            </span>
                            <h5 className="font-display text-xxs font-bold text-white leading-tight truncate">{s.title}</h5>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 font-mono text-[9px] flex-wrap justify-end">
                          <button
                            onClick={() => handleToggleStoryActive(s.id, !s.isActive)}
                            className={`flex items-center gap-1 font-bold ${s.isActive ? 'text-emerald-400' : 'text-zinc-500'}`}
                          >
                            {s.isActive ? "Enabled" : "Disabled"}
                          </button>
                          
                          <span className="text-zinc-700">|</span>

                          <button
                            onClick={() => setStoryForm({
                              id: s.id,
                              title: s.title,
                              mediaBase64: '',
                              type: s.type || 'photo',
                              isActive: s.isActive !== false
                            })}
                            className="text-amber-450 hover:underline font-bold text-xxs uppercase tracking-wider text-amber-500"
                          >
                            Edit
                          </button>

                          <span className="text-zinc-700">|</span>

                          <button
                            onClick={() => handleDeleteStory(s.id)}
                            className="text-red-400 hover:underline font-bold text-xxs uppercase tracking-wider text-red-500"
                          >
                            Drop
                          </button>

                          {(idx > 0 || idx < adminHighlights.stories.length - 1) && (
                            <>
                              <span className="text-zinc-700">|</span>
                              <div className="flex items-center gap-1.5">
                                {idx > 0 && (
                                  <button
                                    onClick={() => handleMoveStory(idx, 'up')}
                                    className="text-zinc-500 hover:text-amber-500 font-bold px-1 transition-colors"
                                    title="Move Up"
                                  >
                                    ▲
                                  </button>
                                )}
                                {idx < adminHighlights.stories.length - 1 && (
                                  <button
                                    onClick={() => handleMoveStory(idx, 'down')}
                                    className="text-zinc-500 hover:text-amber-500 font-bold px-1 transition-colors"
                                    title="Move Down"
                                  >
                                    ▼
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PHOTO LIST GALLERY */}
              <div className="p-6 border border-zinc-900 bg-zinc-950/25 rounded-3xl space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <div>
                    <h4 className="font-display text-sm font-semibold text-white uppercase tracking-wider">Active Photo Gallery</h4>
                    <p className="text-[10px] text-zinc-500">Enlist, toggle status, or override details.</p>
                  </div>
                  <span className="text-[10px] font-mono text-amber-500 font-bold bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded-lg">
                    {adminHighlights.photos.length} item{adminHighlights.photos.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {adminHighlights.photos.length === 0 ? (
                  <div className="p-10 text-center text-xs text-zinc-500 font-mono">No gaming highlight photos deployed.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {adminHighlights.photos.map((p, idx) => (
                      <div key={p.id} className="p-3 bg-zinc-900/50 border border-zinc-900 rounded-2xl flex gap-3 text-left">
                        <img 
                          src={p.imageUrl} 
                          alt={p.title} 
                          className="w-16 h-16 object-cover rounded-lg border border-zinc-950 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 space-y-1 min-w-0">
                          <span className="inline-block text-[8px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase select-none">
                            {p.album}
                          </span>
                          <h5 className="font-display text-xxs font-bold text-white truncate">{p.title}</h5>
                          
                          <div className="flex items-center gap-2 pt-1 font-mono text-[9px] flex-wrap">
                            {/* Enable Toggle click */}
                            <button
                              id={`admin_photo_active_toggle_${p.id}`}
                              onClick={() => handleTogglePhotoActive(p.id, !p.isActive)}
                              className={`flex items-center gap-1 font-bold ${p.isActive ? 'text-emerald-400' : 'text-zinc-500'}`}
                            >
                              {p.isActive ? "Enabled" : "Disabled"}
                            </button>
                            
                            <span className="text-zinc-700">|</span>

                            <button
                              id={`admin_photo_edit_btn_${p.id}`}
                              onClick={() => setPhotoForm({
                                id: p.id,
                                album: p.album,
                                title: p.title,
                                imageBase64: '', // leave empty to not upload new by default Unless changed
                                isActive: p.isActive !== false
                              })}
                              className="text-amber-450 hover:underline font-bold text-xxs uppercase tracking-wider text-amber-500"
                            >
                              Edit
                            </button>

                            <span className="text-zinc-700">|</span>

                            <button
                              id={`admin_photo_delete_btn_${p.id}`}
                              onClick={() => handleDeletePhoto(p.id)}
                              className="text-red-400 hover:underline font-bold text-xxs uppercase tracking-wider text-red-500"
                            >
                              Drop
                            </button>

                            {(idx > 0 || idx < adminHighlights.photos.length - 1) && (
                              <>
                                <span className="text-zinc-700">|</span>
                                <div className="flex items-center gap-1.5">
                                  {idx > 0 && (
                                    <button
                                      onClick={() => handleMovePhoto(idx, 'up')}
                                      className="text-zinc-500 hover:text-amber-500 font-bold px-1 transition-colors"
                                      title="Move Up"
                                    >
                                      ▲
                                    </button>
                                  )}
                                  {idx < adminHighlights.photos.length - 1 && (
                                    <button
                                      onClick={() => handleMovePhoto(idx, 'down')}
                                      className="text-zinc-500 hover:text-amber-500 font-bold px-1 transition-colors"
                                      title="Move Down"
                                    >
                                      ▼
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* VIDEO LIST GALLERY */}
              <div className="p-6 border border-zinc-900 bg-zinc-950/25 rounded-3xl space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <div>
                    <h4 className="font-display text-sm font-semibold text-white uppercase tracking-wider">Active Video Clips</h4>
                    <p className="text-[10px] text-zinc-500">Configure autoplay spotlight and gameplay highlights.</p>
                  </div>
                  <span className="text-[10px] font-mono text-amber-500 font-bold bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded-lg">
                    {adminHighlights.videos.length} clip{adminHighlights.videos.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {adminHighlights.videos.length === 0 ? (
                  <div className="p-10 text-center text-xs text-zinc-500 font-mono">No gaming gameplay clips deployed.</div>
                ) : (
                  <div className="space-y-3.5">
                    {adminHighlights.videos.map((v, idx) => (
                      <div key={v.id} className="p-3.5 bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 bg-zinc-950/80 border border-zinc-900 rounded-xl flex items-center justify-center shrink-0">
                            <Film className="w-5 h-5 text-zinc-500" />
                          </div>
                          
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {v.isFeatured && (
                                <span className="text-[8px] font-mono bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded uppercase select-none">
                                  ★ SPOTLIGHT FEATURED
                                </span>
                              )}
                              {v.loop && (
                                <span className="text-[8px] font-mono bg-zinc-950 text-zinc-400 border border-zinc-850 px-1.5 py-0.5 rounded uppercase select-none">
                                  LOOP
                                </span>
                              )}
                            </div>
                            <h5 className="font-display text-xs font-bold text-white leading-tight truncate">{v.title}</h5>
                            <p className="text-[9px] text-zinc-500 truncate font-mono">{v.videoUrl}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[9px] shrink-0 w-full sm:w-auto justify-end flex-wrap">
                          {idx > 0 && (
                            <button
                              onClick={() => handleMoveVideo(idx, 'up')}
                              className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-amber-500 rounded-lg text-[8px]"
                              title="Move Up in list layout"
                            >
                              ▲
                            </button>
                          )}
                          {idx < adminHighlights.videos.length - 1 && (
                            <button
                              onClick={() => handleMoveVideo(idx, 'down')}
                              className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-amber-500 rounded-lg text-[8px]"
                              title="Move Down in list layout"
                            >
                              ▼
                            </button>
                          )}

                          <button
                            id={`admin_video_active_toggle_${v.id}`}
                            onClick={() => handleToggleVideoActive(v.id, !v.isActive)}
                            className={`px-2.5 py-1.5 border rounded-lg hover:bg-zinc-850 transition-colors cursor-pointer ${
                              v.isActive 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold' 
                                : 'bg-zinc-950 text-zinc-500 border border-zinc-900'
                            }`}
                          >
                            {v.isActive ? "Enabled" : "Disabled"}
                          </button>

                          {!v.isFeatured && v.isActive && (
                            <button
                              id={`admin_video_set_featured_${v.id}`}
                              onClick={() => handleSetFeaturedVideo(v.id)}
                              className="px-2.5 py-1.5 bg-[#dfc288]/10 text-[#dfc288] border border-[#dfc288]/20 hover:bg-[#dfc288]/25 rounded-lg cursor-pointer font-bold uppercase text-[8px]"
                              title="Make this the main autoplay video spotlight on the highlights gallery list"
                            >
                              Set Featured Video
                            </button>
                          )}

                          <button
                            id={`admin_video_edit_btn_${v.id}`}
                            onClick={() => {
                              setVideoForm({
                                id: v.id,
                                title: v.title,
                                videoBase64: '', 
                                posterBase64: '',
                                posterUrl: v.posterUrl || '',
                                isFeatured: v.isFeatured === true,
                                loop: v.loop !== false,
                                isActive: v.isActive !== false
                              });
                              // Scroll form into view
                              const el = document.getElementById('admin_video_form_title');
                              if (el) {
                                el.focus();
                                el.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-900 text-zinc-300 rounded-lg hover:text-white font-semibold uppercase text-[8px]"
                          >
                            Edit Features & Poster
                          </button>

                          <button
                            id={`admin_video_delete_btn_${v.id}`}
                            onClick={() => handleDeleteVideo(v.id)}
                            className="px-2.5 py-1.5 bg-red-950/10 hover:bg-red-950/20 text-red-500 rounded-lg cursor-pointer transition-colors border border-red-900/10 uppercase text-[8px]"
                          >
                            Delete Video
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {activeSubTab === 'sql_editor' && (
          <div className="space-y-6 text-left">
            {/* Supabase Connection Verification Card */}
            <div className="bg-[#050505] border border-zinc-900 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div>
                  <h4 className="text-xs font-mono text-amber-500 uppercase font-black tracking-wider">SUPABASE BACKEND CONNECTOR STATUS</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Verify database status, schema tables, and test transactional insertions live.</p>
                </div>
                <button
                  onClick={fetchDbStatus}
                  disabled={dbStatusLoading}
                  className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xxs font-mono uppercase tracking-widest rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  {dbStatusLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{dbStatusLoading ? 'Checking...' : 'Verify Supabase Sync'}</span>
                </button>
              </div>

              {dbStatus ? (
                <div className="space-y-4 font-mono text-[10px]">
                  {/* Status Badges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-3.5 space-y-1">
                      <span className="text-zinc-500 uppercase text-[9px] block font-black">Connection Status</span>
                      <span className={`font-bold uppercase tracking-wider text-xs ${
                        dbStatus.connectionStatus.includes('ACTIVE') || dbStatus.connectionStatus.includes('SUCCESS')
                          ? 'text-emerald-500' 
                          : 'text-red-500 animate-pulse'
                      }`}>
                        {dbStatus.connectionStatus}
                      </span>
                    </div>

                    <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-3.5 space-y-1">
                      <span className="text-zinc-500 uppercase text-[9px] block font-black">Active Project ID</span>
                      <span className="text-white font-medium block overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                        {dbStatus.supabaseProjectId || 'vboqigshswogtlrgcuag'}
                      </span>
                    </div>

                    <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-3.5 space-y-1">
                      <span className="text-zinc-500 uppercase text-[9px] block font-black">alpha_bookings</span>
                      <span className={`font-bold block text-xs ${dbStatus.alphaBookingsTableExists ? 'text-emerald-500' : 'text-red-500'}`}>
                        {dbStatus.alphaBookingsTableExists ? '✓ EXISTS' : '✗ MISSING'}
                      </span>
                    </div>

                    <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-3.5 space-y-1">
                      <span className="text-zinc-500 uppercase text-[9px] block font-black">payment_receipts</span>
                      <span className={`font-bold block text-xs ${dbStatus.paymentReceiptsTableExists ? 'text-emerald-500' : 'text-red-500'}`}>
                        {dbStatus.paymentReceiptsTableExists ? '✓ EXISTS' : '✗ MISSING'}
                      </span>
                    </div>
                  </div>

                  {/* Active Configuration Details */}
                  <div className="bg-zinc-950/30 border border-zinc-900/40 rounded-xl p-4 space-y-2">
                    <div className="flex flex-col md:flex-row md:justify-between text-zinc-400 border-b border-zinc-900 pb-2">
                      <span>SUPABASE URL: <strong className="text-zinc-200">{dbStatus.supabaseProjectUrl}</strong></span>
                      <a 
                        href={`https://supabase.com/dashboard/project/${dbStatus.supabaseProjectId}/editor`}
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-amber-500 hover:underline mt-1 md:mt-0"
                      >
                        Open Supabase Table Editor ↗
                      </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-zinc-500 block uppercase text-[8px] font-bold">Latest Booking Row ID (Inserted UUID)</span>
                        <code className="text-sky-400 block break-all font-mono text-[9px] bg-zinc-950 p-1.5 rounded-md border border-zinc-900/80 mt-1 select-all">
                          {dbStatus.testInsertId || 'N/A'}
                        </code>
                      </div>
                      <div>
                        <span className="text-zinc-500 block uppercase text-[8px] font-bold">Latest Receipt Row ID (Inserted UUID)</span>
                        <code className="text-purple-400 block break-all font-mono text-[9px] bg-zinc-950 p-1.5 rounded-md border border-zinc-900/80 mt-1 select-all">
                          {dbStatus.testReceiptId || 'N/A'}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Verification Logs */}
                  <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-3.5 space-y-2">
                    <span className="text-zinc-400 uppercase text-[9px] font-black block">Live Verification Checklist</span>
                    <ul className="space-y-1 text-zinc-300">
                      {dbStatus.verificationSteps?.map((step: string, idx: number) => (
                        <li key={idx} className="leading-relaxed whitespace-pre-wrap border-b border-zinc-900/40 pb-1.5 last:border-0 last:pb-0">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Schema / Diagnostics errors, if any exist */}
                  {dbStatus.databaseErrors && dbStatus.databaseErrors.length > 0 && (
                    <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-3.5 space-y-1.5">
                      <span className="text-red-400 uppercase text-[9px] font-black block animate-pulse">ACTIVE DATABASE ERRORS RETRIEVED</span>
                      <div className="space-y-1">
                        {dbStatus.databaseErrors.map((err: any, ind: number) => (
                          <div key={ind} className="font-mono text-[9px] text-red-300 bg-red-950/40 border border-red-900/30 p-2 rounded">
                            <span className="font-bold uppercase text-[8px] block text-red-400">
                              {err.table ? `Table: ${err.table}` : (err.step ? `Step: ${err.step}` : 'System Exception')}
                            </span>
                            {err.error || JSON.stringify(err)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-zinc-500 font-mono text-[10px] py-5 text-center bg-zinc-950/20 border border-dashed border-zinc-900 rounded-xl">
                  Click "Verify Supabase Sync" to execute live end-to-end diagnostics on your configured Supabase database.
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-sm font-mono text-amber-500 uppercase font-black tracking-widest">SupaBase Database Studio</h3>
                  <p className="text-zinc-400 text-xs mt-1">Execute raw SQL queries against your connected database backend.</p>
                </div>
                <button
                  onClick={handleRunSql}
                  disabled={sqlLoading || !sqlQuery.trim()}
                  className="px-6 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-bold uppercase tracking-widest text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center space-x-2"
                >
                  {sqlLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{sqlLoading ? 'Executing...' : 'Run Query'}</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="SELECT * FROM users LIMIT 10;"
                  className="w-full h-48 bg-[#0a0a0a] border-2 border-zinc-900 focus:border-amber-500/50 text-emerald-400 font-mono text-xs rounded-xl p-4 outline-none resize-y"
                  spellCheck={false}
                />
              </div>
            </div>

            {sqlError && (
              <div className="p-4 bg-red-950/20 border-l-4 border-red-500 text-red-400 font-mono text-xs rounded-r-xl">
                {sqlError}
              </div>
            )}

            {sqlResult && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-wider font-bold">Query Result</h4>
                <div className="overflow-x-auto bg-zinc-950 border border-zinc-900 rounded-xl max-h-96">
                  {Array.isArray(sqlResult) && sqlResult.length > 0 ? (
                    <table className="w-full text-left font-mono text-[10px] whitespace-nowrap">
                      <thead className="bg-[#111] sticky top-0 border-b border-zinc-800">
                        <tr>
                          {Object.keys(sqlResult[0]).map((key) => (
                            <th key={key} className="px-4 py-3 text-zinc-400 uppercase font-bold">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/50">
                        {sqlResult.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                            {Object.values(row).map((val: any, j: number) => (
                              <td key={j} className="px-4 py-2.5 text-zinc-300">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-zinc-500 font-mono text-xs">
                      {JSON.stringify(sqlResult, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONFIRMATION POPUP FOR DELETION ACTION */}
      {deleteConfirmOpen && (
        <div id="delete_entry_confirmation_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6">
            <div className="space-y-2">
              <h3 className="font-display font-medium text-sm text-red-500 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                Confirm Deletion
              </h3>
              <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                Are you sure you want to delete this record? This action will permanently drop the entry from active databases.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="cancel_delete_action_btn"
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setTargetDeleteId('');
                  setTargetDeleteType('');
                }}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl text-xxs font-mono uppercase font-bold transition-all cursor-pointer border border-zinc-850"
              >
                Cancel
              </button>
              <button
                id="execute_delete_action_btn"
                type="button"
                disabled={isDeleting}
                onClick={executeDeletionAction}
                className="flex-1 py-2.5 bg-red-900 hover:bg-red-800 text-white rounded-xl text-xxs font-mono uppercase font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
