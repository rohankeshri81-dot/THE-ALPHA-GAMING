import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Gamepad2, 
  Tv2, 
  Users, 
  Clock, 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  ArrowRight, 
  MapPin, 
  Info,
  Calendar,
  Sparkles,
  Award,
  BookOpen,
  Trophy,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Send,
  Eye,
  X,
  Utensils,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  Printer,
  ChevronRight,
  Film,
  Heart,
  Share2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import { Booking, GamingPlan } from '../types';

interface GamingSectionProps {
  currentUser: any;
  onBookingSuccess: (booking: Booking) => void;
  onOpenDashboard: () => void;
  banners?: any[];
  masterCart?: any[];
  addToMasterCart?: (item: any) => void;
  removeFromMasterCart?: (itemId: string) => void;
  openCartDrawer?: () => void;
  updateMasterCartQty?: (itemId: string, increment: number) => void;
}

const FALLBACK_GAMING_PLANS: GamingPlan[] = [
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

export default function GamingSection({ 
  currentUser, 
  onBookingSuccess, 
  onOpenDashboard, 
  banners: propBanners,
  masterCart,
  addToMasterCart,
  removeFromMasterCart,
  openCartDrawer,
  updateMasterCartQty
}: GamingSectionProps) {
  const [plans, setPlans] = useState<GamingPlan[]>(FALLBACK_GAMING_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("game_55_1p");
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [activeScreenTab, setActiveScreenTab] = useState<'55' | '75' | 'passes'>('55');

  // Synchronize cartQuantities from masterCart if provided
  useEffect(() => {
    if (masterCart) {
      const gQ: Record<string, number> = {};
      masterCart.forEach(item => {
        if (item.category === 'gaming') {
          const planId = item.details?.planId || item.id.replace('gaming_', '');
          gQ[planId] = item.quantity;
        }
      });
      setCartQuantities(gQ);
    }
  }, [masterCart]);

  const handleIncrement = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    if (addToMasterCart && updateMasterCartQty) {
      const existing = masterCart?.find(i => i.id === `gaming_${planId}`);
      if (existing) {
        updateMasterCartQty(existing.id, 1);
      } else {
        addToMasterCart({
          id: `gaming_${planId}`,
          category: 'gaming',
          name: plan.name,
          price: plan.isOfferActive ? plan.offerPrice : plan.originalPrice,
          quantity: 1,
          details: {
            planId: plan.id,
            name: plan.name,
            screenSize: plan.screenSize,
            playersCount: plan.players,
            category: 'gaming'
          }
        });
      }
    } else {
      setCartQuantities(prev => ({
        ...prev,
        [planId]: (prev[planId] || 0) + 1
      }));
    }
  };

  const handleDecrement = (planId: string) => {
    if (addToMasterCart && updateMasterCartQty) {
      const existing = masterCart?.find(i => i.id === `gaming_${planId}`);
      if (existing) {
        if (existing.quantity === 1) {
          removeFromMasterCart?.(existing.id);
        } else {
          updateMasterCartQty(existing.id, -1);
        }
      }
    } else {
      setCartQuantities(prev => {
        const nextVal = (prev[planId] || 0) - 1;
        if (nextVal <= 0) {
          const copy = { ...prev };
          delete copy[planId];
          return copy;
        }
        return {
          ...prev,
          [planId]: nextVal
        };
      });
    }
  };

  // Payment states
  const [showPayment, setShowPayment] = useState(false);
  const [lastGamingInvoice, setLastGamingInvoice] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Banners state
  const [banners, setBanners] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- NEW INTEGRATIONS STATE MANAGERS ---
  
  // 1. Tournaments Zone State
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const [tourneyLoading, setTourneyLoading] = useState(true);
  const [showTourneyPayment, setShowTourneyPayment] = useState(false);
  const [lastTourneyTicket, setLastTourneyTicket] = useState<Booking | null>(null);
  
  // Tournament Registry Form Fields
  const [tourneyName, setTourneyName] = useState('');
  const [tourneyMobile, setTourneyMobile] = useState('');
  const [tourneyEmail, setTourneyEmail] = useState('');
  const [tourneyAge, setTourneyAge] = useState('');
  const [tourneyCity, setTourneyCity] = useState('');
  const [tourneyGamingId, setTourneyGamingId] = useState('');
  const [tourneyProfileBase64, setTourneyProfileBase64] = useState('');
  const [isTourneyDragOver, setIsTourneyDragOver] = useState(false);

  // 2. Gaming Highlights State (Photos Gallery & Video Player)
  const [highlightStories, setHighlightStories] = useState<any[]>([]);
  const [highlightPhotos, setHighlightPhotos] = useState<any[]>([]);
  const [highlightVideos, setHighlightVideos] = useState<any[]>([]);
  const [activePhotoAlbum, setActivePhotoAlbum] = useState<string>('All');
  const [activePhotoModal, setActivePhotoModal] = useState<any | null>(null);
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  
  // Reels and Highlights Tab Custom States
  const [highlightsTab, setHighlightsTab] = useState<'stories' | 'reels' | 'photos' | 'mixed'>('reels');
  const [currentReelIndex, setCurrentReelIndex] = useState<number>(0);

  // Story Viewer States
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const storyVideoRef = useRef<HTMLVideoElement>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [reelsLikes, setReelsLikes] = useState<Record<string, number>>({});
  const [reelsMuted, setReelsMuted] = useState<boolean>(false);
  const [fullscreenReel, setFullscreenReel] = useState<boolean>(false);
  const [reelsSuccessToast, setReelsSuccessToast] = useState<string | null>(null);
  
  // Video player custom controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [isMuted, setIsMuted] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const featuredVideoRef = useRef<HTMLVideoElement>(null);

  // Cinema modal custom controls
  const [cinemaVideo, setCinemaVideo] = useState<any | null>(null);
  const cinemaVideoRef = useRef<HTMLVideoElement>(null);
  const [cinemaPlaying, setCinemaPlaying] = useState(false);
  const [cinemaMuted, setCinemaMuted] = useState(false);
  const [cinemaVolume, setCinemaVolume] = useState(0.8);
  const [cinemaDuration, setCinemaDuration] = useState(0);
  const [cinemaCurrentTime, setCinemaCurrentTime] = useState(0);

  // 3. Cafe Menu state
  const [cafeItems, setCafeItems] = useState<any[]>([]);
  const [cafeLoading, setCafeLoading] = useState(true);
  const [cafeCart, setCafeCart] = useState<Array<{ item: any; quantity: number }>>([]);
  const [showCafePayment, setShowCafePayment] = useState(false);
  const [lastCafeInvoice, setLastCafeInvoice] = useState<Booking | null>(null);
  const [cafeFullName, setCafeFullName] = useState('');
  const [cafeMobile, setCafeMobile] = useState('');
  const [cafeEmail, setCafeEmail] = useState('');

  // 4. Contact/Feedback section state
  const [contactName, setContactName] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [submittingContact, setSubmittingContact] = useState(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    let videoId = '';
    try {
      if (url.includes('/shorts/')) {
        const parts = url.split('/shorts/');
        if (parts[1]) {
          videoId = parts[1].split('?')[0].split('/')[0];
        }
      } else if (url.includes('watch?v=')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (url.includes('youtu.be/')) {
        const parts = url.split('youtu.be/');
        if (parts[1]) {
          videoId = parts[1].split('?')[0].split('/')[0];
        }
      } else if (url.includes('/embed/')) {
        const parts = url.split('/embed/');
        if (parts[1]) {
          videoId = parts[1].split('?')[0].split('/')[0];
        }
      } else if (url.includes('youtube.com/')) {
        const match = url.match(/(?:embed|v|shorts|watch\?v=)([^#\&\?]*)/);
        if (match && match[1]) videoId = match[1];
      }
    } catch (e) {
      console.error("Failed to parse YouTube ID:", e);
    }
    return videoId || null;
  };

  const getYoutubeEmbedUrl = (url: string, autoplay: boolean = false, muted: boolean = false, loop: boolean = true) => {
    const videoId = getYoutubeId(url);
    if (!videoId) return '';
    const originUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
    let embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&controls=1&origin=${originUrl}`;
    if (autoplay) {
      embedUrl += `&autoplay=1`;
    }
    if (muted) {
      embedUrl += `&mute=1`;
    }
    if (loop) {
      embedUrl += `&playlist=${videoId}&loop=1`;
    }
    return embedUrl;
  };

  const getReelLikesCount = (id: string) => {
    if (!id) return 0;
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    const starter = (sum % 80) + 180;
    const currentLikes = reelsLikes[id] || starter;
    return currentLikes + (likedReels[id] ? 1 : 0);
  };

  const handleToggleReelLike = (id: string) => {
    setLikedReels(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleShareReelLink = (videoUrl: string) => {
    try {
      navigator.clipboard.writeText(videoUrl);
      setReelsSuccessToast("Reel link loaded to clipboard! Forward to your guild 🚀");
      setTimeout(() => setReelsSuccessToast(null), 3000);
    } catch (e) {
      setReelsSuccessToast("Copied Link: " + videoUrl);
      setTimeout(() => setReelsSuccessToast(null), 3000);
    }
  };

  const handlePrevReel = () => {
    if (highlightVideos.length > 0) {
      setCurrentReelIndex(prev => (prev > 0 ? prev - 1 : highlightVideos.length - 1));
    }
  };

  const handleNextReel = () => {
    if (highlightVideos.length > 0) {
      setCurrentReelIndex(prev => (prev < highlightVideos.length - 1 ? prev + 1 : 0));
    }
  };

  const handleAddReel = async () => {
    const url = window.prompt("Upload Reel:\nEnter a Video URL (YouTube Shorts/Link or direct mp4/webm link):");
    if (!url) return;
    
    try {
      const res = await fetch("/api/admin/gaming-highlights/videos/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Community Highlight",
          videoBase64: url,
          isFeatured: false,
          loop: true
        })
      });
      if (res.ok) {
        setReelsSuccessToast("Reel added successfully! 🚀");
        setTimeout(() => setReelsSuccessToast(null), 3000);
        fetchUnifiedGamingPageData();
      } else {
        const err = await res.json();
        alert("Failed to add reel: " + (err.error || "Unknown"));
      }
    } catch {
      alert("Error adding reel");
    }
  };

  // Auto-advance youtube reels after 15 seconds to simulate end playing
  useEffect(() => {
    if (highlightsTab !== 'reels' || highlightVideos.length === 0) return;
    const currentVid = highlightVideos[currentReelIndex];
    if (currentVid && getYoutubeId(currentVid.videoUrl) && !currentVid.loop) {
      const timer = setTimeout(() => {
        handleNextReel();
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [currentReelIndex, highlightsTab, highlightVideos]);

  const handleFeaturedPlayPause = () => {
    if (!featuredVideoRef.current) return;
    if (isPlaying) {
      featuredVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      featuredVideoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.log("Failed to play:", err));
    }
  };

  const handleFeaturedSeekChange = (value: number) => {
    if (!featuredVideoRef.current) return;
    featuredVideoRef.current.currentTime = value;
    setVideoCurrentTime(value);
  };

  const handleFeaturedVolumeChange = (value: number) => {
    if (!featuredVideoRef.current) return;
    featuredVideoRef.current.volume = value;
    setVolume(value);
    if (value > 0) {
      featuredVideoRef.current.muted = false;
      setIsMuted(false);
    } else {
      featuredVideoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleFeaturedMuteToggle = () => {
    if (!featuredVideoRef.current) return;
    const nextMute = !isMuted;
    featuredVideoRef.current.muted = nextMute;
    setIsMuted(nextMute);
    if (!nextMute && volume === 0) {
      featuredVideoRef.current.volume = 0.5;
      setVolume(0.5);
    }
  };

  const handleFeaturedFullscreen = () => {
    if (!featuredVideoRef.current) return;
    const el = featuredVideoRef.current;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    } else if ((el as any).msRequestFullscreen) {
      (el as any).msRequestFullscreen();
    }
  };

  // Cinema handlers
  const handleCinemaPlayPause = () => {
    if (!cinemaVideoRef.current) return;
    if (cinemaPlaying) {
      cinemaVideoRef.current.pause();
      setCinemaPlaying(false);
    } else {
      cinemaVideoRef.current.play().then(() => {
        setCinemaPlaying(true);
      }).catch(err => console.log("Failed to play:", err));
    }
  };

  const handleCinemaSeekChange = (value: number) => {
    if (!cinemaVideoRef.current) return;
    cinemaVideoRef.current.currentTime = value;
    setCinemaCurrentTime(value);
  };

  const handleCinemaVolumeChange = (value: number) => {
    if (!cinemaVideoRef.current) return;
    cinemaVideoRef.current.volume = value;
    setCinemaVolume(value);
    if (value > 0) {
      cinemaVideoRef.current.muted = false;
      setCinemaMuted(false);
    } else {
      cinemaVideoRef.current.muted = true;
      setCinemaMuted(true);
    }
  };

  const handleCinemaMuteToggle = () => {
    if (!cinemaVideoRef.current) return;
    const nextMute = !cinemaMuted;
    cinemaVideoRef.current.muted = nextMute;
    setCinemaMuted(nextMute);
    if (!nextMute && cinemaVolume === 0) {
      cinemaVideoRef.current.volume = 0.5;
      setCinemaVolume(0.5);
    }
  };

  const handleCinemaFullscreen = () => {
    if (!cinemaVideoRef.current) return;
    const el = cinemaVideoRef.current;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    } else if ((el as any).msRequestFullscreen) {
      (el as any).msRequestFullscreen();
    }
  };

  const triggerFullscreenOnId = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const el = document.getElementById(id) as HTMLVideoElement;
    if (el) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen();
      }
    }
  };

  const openCinemaVideoModal = (video: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setCinemaVideo(video);
    setCinemaPlaying(true);
    setCinemaMuted(false);
    setCinemaVolume(0.8);
    setCinemaCurrentTime(0);
  };

  const fetchActiveBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      if (res.ok) {
        const data = await res.json();
        const activeBanners = (data || []).filter((b: any) => 
          b.isActive && (
            b.targetPage === 'gaming' || 
            b.targetPage === 'cafe' || 
            b.targetPage === 'tournament' || 
            b.targetPage === 'offer' || 
            b.type === 'gaming' || 
            b.type === 'tournament' || 
            b.type === 'offer'
          )
        );
        setBanners(activeBanners);
      }
    } catch (e) {
      console.error("Failed to load banners", e);
    }
  };

  // Fetch plans on load and update whenever database is fetched
  const loadGamingPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/gaming/plans');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setPlans(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch gaming plans", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnifiedGamingPageData = async () => {
    try {
      setTourneyLoading(true);
      // Fetch tournaments and filter for Asphalt Legends only
      const tRes = await fetch('/api/tournaments');
      if (tRes.ok) {
        const tData = await tRes.json();
        const asphaltOnly = (tData || []).filter((t: any) => t.game === 'Asphalt Legends' && t.isActive !== false);
        setTournaments(asphaltOnly);
        if (asphaltOnly.length > 0) {
          setSelectedTournament(asphaltOnly[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load tournament info", e);
    } finally {
      setTourneyLoading(false);
    }

    try {
      // Fetch media highlights (photos and videos)
      const mRes = await fetch('/api/gaming-highlights');
      if (mRes.ok) {
        const mData = await mRes.json();
        const activeStories = (mData.stories || []).filter((s: any) => s.isActive !== false);
        const activePhotos = (mData.photos || []).filter((p: any) => p.isActive !== false);
        const activeVideos = (mData.videos || []).filter((v: any) => v.isActive !== false);
        setHighlightStories(activeStories);
        setHighlightPhotos(activePhotos);
        setHighlightVideos(activeVideos);
        const featuredVid = activeVideos.find((v: any) => v.isFeatured) || activeVideos[0];
        if (featuredVid) {
          setActiveVideo(featuredVid);
        }
      }
    } catch (e) {
      console.error("Failed to load highlights media assets", e);
    }

    try {
      setCafeLoading(true);
      // Fetch cafe items from database
      const cRes = await fetch('/api/cafe/menu');
      if (cRes.ok) {
        const cData = await cRes.json();
        const enabledCafe = (cData || []).filter((item: any) => item.isEnabled !== false);
        setCafeItems(enabledCafe);
      }
    } catch (e) {
      console.error("Failed to load cafe menu items", e);
    } finally {
      setCafeLoading(false);
    }
  };

  useEffect(() => {
    loadGamingPlans();
    fetchUnifiedGamingPageData();
    if (propBanners && propBanners.length > 0) {
      setBanners(propBanners);
    } else {
      fetchActiveBanners();
    }
  }, [propBanners]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (highlightsTab !== 'reels') return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevReel();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextReel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [highlightsTab, highlightVideos]);

  // YouTube player state message listener for autoplaying the next reel automatically on ended
  useEffect(() => {
    const handleYoutubePostMessage = (event: MessageEvent) => {
      if (typeof event.origin === 'string' && event.origin.includes('youtube.com')) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          if (data) {
            let playerState: any = undefined;
            if (data.info !== undefined) {
              if (typeof data.info === 'object' && data.info !== null) {
                playerState = data.info.playerState;
              } else {
                playerState = data.info;
              }
            } else if (data.playerState !== undefined) {
              playerState = data.playerState;
            } else if (data.event === 'onStateChange') {
              playerState = data.info;
            }
            
            // PlayerState 0 represents ENDED in YouTube Player API
            if (playerState === 0) {
              handleNextReel();
            }
          }
        } catch (e) {
          // Ignore json parsing errors for other non-YouTube frames messages
        }
      }
    };
    window.addEventListener('message', handleYoutubePostMessage);
    return () => window.removeEventListener('message', handleYoutubePostMessage);
  }, [highlightVideos, currentReelIndex]);

  // Autoplay slider interval
  useEffect(() => {
    const slideMax = banners.length > 0 ? banners.length : 3;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev === slideMax - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [banners]);

  // Story auto-advance (photo or youtube)
  useEffect(() => {
    if (activeStoryIndex === null) return;
    const story = highlightStories[activeStoryIndex];
    if (story) {
      const isYoutube = story.type === 'video' && getYoutubeId(story.mediaUrl);
      if (story.type === 'photo' || isYoutube) {
        const durationMs = isYoutube ? 15000 : 5000;
        const intervalMs = 50;
        let elapsed = 0;
        const interval = setInterval(() => {
          elapsed += intervalMs;
          const progress = (elapsed / durationMs) * 100;
          setStoryProgress(progress);
          if (elapsed >= durationMs) {
            clearInterval(interval);
            if (activeStoryIndex < highlightStories.length - 1) {
              setActiveStoryIndex(activeStoryIndex + 1);
              setStoryProgress(0);
            } else {
              setActiveStoryIndex(null);
            }
          }
        }, intervalMs);
        return () => clearInterval(interval);
      }
    }
  }, [activeStoryIndex, highlightStories]);

  const activeCartItems = plans
    .filter(p => (cartQuantities[p.id] || 0) > 0)
    .map(plan => {
      const quantity = cartQuantities[plan.id] || 0;
      const unitPrice = plan.isOfferActive ? plan.offerPrice : plan.originalPrice;
      const totalPrice = quantity * unitPrice;
      return { plan, quantity, unitPrice, totalPrice };
    });

  const finalPayableAmount = activeCartItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

  const cartSummaryName = activeCartItems
    .map(item => `${item.plan.screenSize}"${item.plan.type === 'monthly' ? ' Pass' : ''} (${item.plan.players} Player${item.plan.players > 1 ? 's' : ''}) x${item.quantity}`)
    .join(', ') || 'PS5 Gaming Pass';

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  const handleCheckoutTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCartItems.length === 0) {
      alert('Your cart is empty. Please select at least one screen and set its quantity above ₹0.');
      return;
    }
    if (openCartDrawer) {
      openCartDrawer();
    } else {
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = (booking: Booking) => {
    setShowPayment(false);
    setLastGamingInvoice(booking);
    onBookingSuccess(booking);
  };

  // --- NEW HANDLERS ---
  
  // Tournament Registry Checkout Trigger
  const handleTourneyCheckoutTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    if (selectedTournament.status === 'closed') {
      alert("Registration is closed for this tournament.");
      return;
    }
    if (!tourneyName || !tourneyMobile || !tourneyEmail || !tourneyAge || !tourneyCity) {
      alert("Please fill in all mandatory tournament participant fields.");
      return;
    }
    setShowTourneyPayment(true);
  };

  const handleTourneyPaymentSuccess = (booking: Booking) => {
    setShowTourneyPayment(false);
    setLastTourneyTicket(booking);
    onBookingSuccess(booking);
  };

  // Cafe Cart Management functions for Gaming Zone Page
  const addToCafeCart = (item: any) => {
    setCafeCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCafeQuantity = (itemId: string, delta: number) => {
    setCafeCart(prev => {
      const existing = prev.find(i => i.item.id === itemId);
      if (!existing) {
        if (delta > 0) {
          const itm = cafeItems.find(m => m.id === itemId);
          if (itm) {
            return [...prev, { item: itm, quantity: 1 }];
          }
        }
        return prev;
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prev.filter(i => i.item.id !== itemId);
      }
      return prev.map(i => i.item.id === itemId ? { ...i, quantity: newQty } : i);
    });
  };

  const removeCafeFromCart = (itemId: string) => {
    setCafeCart(prev => prev.filter(i => i.item.id !== itemId));
  };

  const cafeCartSubtotal = cafeCart.reduce((acc, current) => acc + (current.item.price * current.quantity), 0);

  const handleCafeCheckoutTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (cafeCart.length === 0) {
      alert("Please add at least one item to your cafe cart before checking out.");
      return;
    }
    if (!cafeFullName || !cafeMobile) {
      alert("Please fill in your name and contact number for delivery.");
      return;
    }
    setShowCafePayment(true);
  };

  const handleCafePaymentSuccess = (booking: Booking) => {
    setShowCafePayment(false);
    setCafeCart([]);
    setLastCafeInvoice(booking);
    onBookingSuccess(booking);
  };

  // Support / Live hotline message submission
  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactMobile || !contactEmail || !contactMessage) {
      setContactError("All message fields are required.");
      return;
    }
    setContactError(null);
    setContactSuccess(null);
    setSubmittingContact(true);
    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          mobile: contactMobile,
          email: contactEmail,
          message: contactMessage
        })
      });
      if (res.ok) {
        setContactSuccess("Your support inquiry or feedback has been registered. Our staff will call you back shortly!");
        setContactMessage('');
      } else {
        const data = await res.json();
        setContactError(data.error || "Failed to catalog message.");
      }
    } catch (_) {
      setContactError("Web connection interrupted.");
    } finally {
      setSubmittingContact(false);
    }
  };

  // Filter plans for rendering based on tab
  const getFilteredPlans = () => {
    if (activeScreenTab === 'passes') {
      return plans.filter(p => p.type === 'monthly' && p.isEnabled);
    } else {
      return plans.filter(p => p.screenSize === activeScreenTab && p.type === 'hourly');
    }
  };

  const getAlbumsList = () => {
    const list = new Set<string>();
    list.add('All');
    highlightPhotos.forEach(p => {
      if (p.album) list.add(p.album);
    });
    return Array.from(list);
  };

  const getFilteredPhotos = () => {
    if (activePhotoAlbum === 'All') return highlightPhotos;
    return highlightPhotos.filter(p => p.album === activePhotoAlbum);
  };

  const classifyItemTag = (item: any) => {
    const nameLower = item.name.toLowerCase();
    const idLower = item.id.toLowerCase();
    const catLower = (item.category || '').toLowerCase();

    if (idLower === 'cafe_hot_coffee' || catLower === 'hot beverages' || nameLower.includes('coffee')) {
      return 'Hot Coffee';
    }
    if (catLower === 'sandwiches' || nameLower.includes('sandwich')) {
      return 'Sandwiches';
    }
    if (idLower.includes('maggie') || nameLower.includes('maggie')) {
      return 'Maggie';
    }
    if (idLower === 'cafe_french_fries' || nameLower.includes('fries') || nameLower.includes('chips')) {
      return 'French Fries';
    }
    if (idLower === 'cafe_potato_cheese_shots' || nameLower.includes('cheese shot') || nameLower.includes('cheese snack')) {
      return 'Cheese Snacks';
    }
    if (catLower.includes('falooda') || nameLower.includes('falooda')) {
      return 'Falooda Specials';
    }
    if (catLower === 'mocktails' || nameLower.includes('mojito') || nameLower.includes('curacao') || nameLower.includes('mocktail') || idLower === 'cafe_paan_shot' || idLower === 'cafe_green_apple' || idLower === 'cafe_khus' || idLower === 'cafe_lime_ice_tea' || idLower === 'cafe_kala_khatta' || idLower === 'cafe_grenadine' || idLower === 'cafe_kesar' || idLower === 'cafe_kacha_aam') {
      return 'Mocktails';
    }
    if (catLower === 'cold drinks' || nameLower.includes('coca cola') || nameLower.includes('sprite')) {
      return 'Cold Drinks';
    }
    return null; // Ignore or group under general
  };

  const getCategorizedCafeItems = () => {
    const categories: { [key: string]: any[] } = {
      'Hot Coffee': [],
      'Sandwiches': [],
      'Maggie': [],
      'French Fries': [],
      'Cheese Snacks': [],
      'Falooda Specials': [],
      'Mocktails': [],
      'Cold Drinks': []
    };

    cafeItems.forEach(item => {
      const tag = classifyItemTag(item);
      if (tag && categories[tag]) {
        categories[tag].push(item);
      }
    });

    return categories;
  };

  return (
    <div id="gaming_section_container" className="py-2.5 space-y-12">
      {/* VISUAL BRAND HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-3 animate-fade-in">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full mb-2">
          <Gamepad2 className="w-6 h-6 animate-bounce" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl uppercase">
          THE ALPHA <span className="text-amber-400">GAMING ZONE</span>
        </h2>
        <p className="text-xs text-zinc-400 font-sans tracking-wide leading-relaxed">
          The ultimate next-gen gaming stadium. Featuring high-definition PS5 Play & Pay hubs, premium dual-sense controls, and cozy lounge setups.
        </p>
      </div>

      {/* MODERN DYNAMIC DESIGN CAROUSEL */}
      <div className="max-w-4xl mx-auto overflow-hidden relative rounded-3xl border border-zinc-900 bg-zinc-950/20 group select-none">
        <div className="h-48 sm:h-72 w-full relative">
          {banners.length > 0 ? (
            banners.map((b, idx) => (
              <div
                key={b.id}
                className={`absolute inset-0 transition-all duration-700 flex items-center justify-center ${
                  idx === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent flex flex-col justify-end p-6">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-amber-400 bg-black/85 px-2.5 py-1 rounded w-fit border border-zinc-900 mb-2 uppercase">
                    {b.type} ADVERTISEMENT POSTER
                  </span>
                  <h3 className="font-display text-lg sm:text-2xl font-bold text-white tracking-tight leading-none uppercase">
                    {b.title}
                  </h3>
                </div>
              </div>
            ))
          ) : (
            // Default elegant slider fallbacks
            [
              {
                title: "NEXT GEN PS5 GAMING ZONE",
                subtitle: "Play solo, duo or squad. Fully calibrated DualSense controllers & premium lounge seating.",
                type: "gaming",
                color: "from-amber-500/20"
              },
              {
                title: "THE ALPHA LUXURY CAFE & BISTRO",
                subtitle: "Order cheese paneer sandwiches, classic maggi, potato shots, faloodas and ice cold mocktails.",
                type: "cafe",
                color: "from-teal-550/20"
              },
              {
                title: "PREMIUM CONSOLE LOUNGE Setup",
                subtitle: "Relax in cozy dual-sense seating with high-speed fiber internet and dynamic surround sound.",
                type: "lounge",
                color: "from-blue-550/15"
              }
            ].map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-700 flex flex-col justify-end p-6 sm:p-10 bg-gradient-to-t ${slide.color} via-zinc-950/90 to-transparent ${
                  idx === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'
                }`}
              >
                <div>
                  <span className="inline-block text-[9px] font-mono font-bold tracking-widest text-amber-400 uppercase bg-black/60 px-2.5 py-1 rounded mb-3 border border-zinc-900">
                    {slide.type} Showcase
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight uppercase mb-1">
                    {slide.title}
                  </h3>
                  <p className="text-xxs sm:text-xs text-zinc-400 max-w-lg leading-relaxed font-sans mt-0.5">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Slider controls */}
          <button
            id="gaming_slider_prev"
            type="button"
            onClick={() => {
              const max = banners.length > 0 ? banners.length : 3;
              setCurrentSlide(prev => (prev === 0 ? max - 1 : prev - 1));
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 border border-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            ←
          </button>
          <button
            id="gaming_slider_next"
            type="button"
            onClick={() => {
              const max = banners.length > 0 ? banners.length : 3;
              setCurrentSlide(prev => (prev === max - 1 ? 0 : prev + 1));
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 border border-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            →
          </button>
        </div>

        {/* Indicators dot bar */}
        <div className="absolute bottom-4 right-6 z-20 flex space-x-2">
          {(banners.length > 0 ? banners : [0, 1, 2]).map((_, idx) => (
            <button
              id={`gaming_slider_dot_${idx}`}
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentSlide ? 'bg-amber-400 w-3' : 'bg-zinc-650'
              }`}
            />
          ))}
        </div>
      </div>

      {!lastGamingInvoice ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: PLANS GRID SELECTOR */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Category / Size selection sequential list: PS5 Pricing and Monthly Passes */}
            {/* SECTION 1: 55 INCH SCREEN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-zinc-900 text-amber-500 block">
                  <Tv2 className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  🎮 PS5 - 55 INCH SCREEN
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.filter(p => p.screenSize === '55' && p.type === 'hourly' && p.isEnabled).map((plan) => {
                  const qty = cartQuantities[plan.id] || 0;
                  return (
                    <div
                      id={`gaming_plan_card_${plan.id}`}
                      key={plan.id}
                      className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[140px] ${
                        qty > 0 
                          ? 'bg-zinc-950 border-amber-500 shadow-lg shadow-yellow-950/10 scale-[1.01]' 
                          : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      {qty > 0 && (
                        <div className="absolute right-0 top-0 bg-gradient-to-l from-amber-500 to-yellow-600 text-black text-[8px] font-mono font-bold py-0.5 px-2.5 uppercase rounded-bl-lg">
                          {qty} Selected
                        </div>
                      )}
                      
                      <div>
                        <span className="inline-flex items-center gap-1 text-[8px] font-mono tracking-widest text-[#dfc288] uppercase mb-1">
                          Play Panel setup
                        </span>
                        
                        <h4 className="font-display font-bold text-white text-xs leading-snug mt-1">
                          {plan.players} Player{plan.players > 1 ? 's' : ''} Play
                        </h4>
                        
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Fidelity setup • cozy dual setups
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          {plan.isOfferActive ? (
                            <>
                              <span className="text-base font-mono font-bold text-amber-500">₹{plan.offerPrice}/hr</span>
                              <span className="text-[10px] text-zinc-500 line-through font-mono">₹{plan.originalPrice}</span>
                            </>
                          ) : (
                            <span className="text-base font-mono font-bold text-white">₹{plan.originalPrice}/hr</span>
                          )}
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleDecrement(plan.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold transition-all text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-[11px] font-mono font-bold text-white w-4 text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrement(plan.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold transition-all text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: 75 INCH SCREEN */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-zinc-900 text-amber-500 block">
                  <Tv2 className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  🎮 PS5 - 75 INCH SCREEN
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.filter(p => p.screenSize === '75' && p.type === 'hourly' && p.isEnabled).map((plan) => {
                  const qty = cartQuantities[plan.id] || 0;
                  return (
                    <div
                      id={`gaming_plan_card_${plan.id}`}
                      key={plan.id}
                      className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[140px] ${
                        qty > 0 
                          ? 'bg-zinc-950 border-amber-500 shadow-lg shadow-yellow-950/10 scale-[1.01]' 
                          : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      {qty > 0 && (
                        <div className="absolute right-0 top-0 bg-gradient-to-l from-amber-500 to-yellow-600 text-black text-[8px] font-mono font-bold py-0.5 px-2.5 uppercase rounded-bl-lg">
                          {qty} Selected
                        </div>
                      )}
                      
                      <div>
                        <span className="inline-flex items-center gap-1 text-[8px] font-mono tracking-widest text-[#dfc288] uppercase mb-1">
                          Play Panel setup
                        </span>
                        
                        <h4 className="font-display font-bold text-white text-xs leading-snug mt-1">
                          {plan.players} Player{plan.players > 1 ? 's' : ''} Play
                        </h4>
                        
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Fidelity setup • cozy dual setups
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          {plan.isOfferActive ? (
                            <>
                              <span className="text-base font-mono font-bold text-amber-500 font-bold">₹{plan.offerPrice}/hr</span>
                              <span className="text-[10px] text-zinc-500 line-through font-mono">₹{plan.originalPrice}</span>
                            </>
                          ) : (
                            <span className="text-base font-mono font-bold text-white">₹{plan.originalPrice}/hr</span>
                          )}
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleDecrement(plan.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold transition-all text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-[11px] font-mono font-bold text-white w-4 text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrement(plan.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold transition-all text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MONTHLY PASS SECTION */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-zinc-900 text-amber-500">
                  <Clock className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Monthly Pass Section
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.filter(p => p.type === 'monthly' && p.isEnabled).map((plan) => {
                  const qty = cartQuantities[plan.id] || 0;
                  return (
                    <div
                      id={`gaming_plan_card_${plan.id}`}
                      key={plan.id}
                      className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[140px] ${
                        qty > 0 
                          ? 'bg-zinc-950 border-amber-500 shadow-lg shadow-yellow-950/10 scale-[1.01]' 
                          : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      {qty > 0 && (
                        <div className="absolute right-0 top-0 bg-gradient-to-l from-amber-500 to-yellow-600 text-black text-[8px] font-mono font-bold py-0.5 px-2.5 uppercase rounded-bl-lg">
                          {qty} Selected
                        </div>
                      )}
                      
                      <div>
                        <span className="inline-flex items-center gap-1 text-[8px] font-mono tracking-widest text-amber-500 uppercase mb-1">
                          <Sparkles className="w-3 h-3" />
                          Saver Clip-Card Pass
                        </span>
                        
                        <h4 className="font-display font-bold text-white text-xs leading-snug mt-1">
                          {plan.name}
                        </h4>
                        
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Provides a total of <strong className="text-white font-mono">{plan.gameplayTime || '15 Hours'}</strong> gameplay quota.
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          {plan.isOfferActive ? (
                            <>
                              <span className="text-base font-mono font-bold text-amber-500 font-bold">₹{plan.offerPrice}</span>
                              <span className="text-[10px] text-zinc-500 line-through font-mono">₹{plan.originalPrice}</span>
                            </>
                          ) : (
                            <span className="text-base font-mono font-bold text-white font-bold">₹{plan.originalPrice}</span>
                          )}
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleDecrement(plan.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold transition-all text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-[11px] font-mono font-bold text-white w-4 text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrement(plan.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold transition-all text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Poster reference styling element */}
            <div className="p-4 border border-zinc-900 bg-zinc-950/30 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-zinc-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs flex-shrink-0 font-mono">
                PS5
              </div>
              <div className="text-left space-y-1">
                <p className="text-xs font-semibold text-white uppercase font-display tracking-wider">High Fidelity Gaming Hub</p>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  All systems feature authentic high frame-rate Playstations paired with 55" or 75" extreme color panels. Zero lag, immersive acoustics. Drinks, snacks, and catering available on request at the adjacent bistro cafe.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT: REGISTRATION / BOOKING FORM */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">
              SHOPPING CART & CHECKOUT
            </h3>

            <div className="p-6 bg-zinc-900/20 border border-zinc-900 rounded-3xl space-y-5">
              
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3">
                <h4 className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest block leading-none">
                  Cart Items ({activeCartItems.length})
                </h4>
                
                {activeCartItems.length === 0 ? (
                  <p className="text-xxs font-sans text-zinc-500 italic py-2">
                    No screens selected yet. Choose quantities from the left lists to build your session!
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {activeCartItems.map(({ plan, quantity, unitPrice, totalPrice }) => (
                      <div key={plan.id} className="flex justify-between items-center text-xxs pb-2 border-b border-zinc-900/45 last:border-b-0 last:pb-0">
                        <div>
                          <div className="font-extrabold text-white">
                            {plan.screenSize}" {plan.type === 'monthly' ? 'Pass' : 'Screen'} - {plan.players} Player{plan.players > 1 ? 's' : ''}
                          </div>
                          <div className="text-zinc-500 font-mono mt-0.5">
                            {quantity} x ₹{unitPrice}
                          </div>
                        </div>
                        <div className="text-right font-mono text-white font-bold">
                          ₹{totalPrice}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeCartItems.length > 0 && (
                  <div className="pt-2.5 border-t border-zinc-900 flex justify-between items-center font-mono text-xs">
                    <span className="text-zinc-400 font-sans">Grand Total:</span>
                    <span className="text-amber-400 font-extrabold text-sm">₹{finalPayableAmount}</span>
                  </div>
                )}
              </div>

              {/* Booking Action */}
              <div id="gaming_booking_form" className="space-y-4">

                <div className="pt-2">
                  <button
                    id="gaming_submit_booking"
                    onClick={handleCheckoutTrigger}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-black font-semibold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>{addToMasterCart ? "View Shopping Cart & Checkout" : `Proceed to Pay ₹${finalPayableAmount}`}</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>
      ) : (
        /* SUCCESS / CONFIRMATION HUD */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto border border-zinc-800 bg-zinc-950/80 rounded-3xl p-6 sm:p-10 space-y-8 text-center shadow-2xl"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-2xl font-bold text-white tracking-tight">GAME STATION BOOKING GENERATED</h3>
            <p className="text-xs text-amber-400 font-mono tracking-widest uppercase">
              Invoice Node: {lastGamingInvoice.invoiceNumber}
            </p>
            <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed pt-2">
              Welcome to **THE ALPHA GAMING & CAFE**. Your console session reservation has been securely logged and mapped to the active booking database.
            </p>
          </div>

          {/* Printable Ticket Receipt Visual */}
          <div className="max-w-md mx-auto border border-zinc-900 bg-zinc-900/30 p-5 rounded-2xl text-left space-y-4 relative overflow-hidden font-mono text-xs text-zinc-400">
            <div className="absolute top-0 right-0 p-1 bg-amber-500 text-[6.5px] font-bold uppercase py-0.5 px-3 rounded-bl text-black">
              SECURE STATION RECEIPT
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 block uppercase leading-none">Console Hub Tier</span>
              <span className="text-sm font-semibold text-white font-display leading-tight">{lastGamingInvoice.planName}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-900">
              <div>
                <span className="text-zinc-550 text-[9px] uppercase">Athlete Billed</span>
                <p className="text-white font-semibold font-sans">{lastGamingInvoice.userName}</p>
              </div>
              <div>
                <span className="text-zinc-550 text-[9px] uppercase">Registered Email</span>
                <p className="text-white font-mono break-all">{lastGamingInvoice.userEmail}</p>
              </div>
              <div>
                <span className="text-zinc-550 text-[9px] uppercase">Mobile hotline</span>
                <p className="text-white font-mono">{lastGamingInvoice.userMobile}</p>
              </div>
              <div>
                <span className="text-zinc-550 text-[9px] uppercase">Booking Validity</span>
                <p className="text-amber-400 font-semibold font-mono">
                  {lastGamingInvoice.gamingDetails?.isMonthlyPass ? 'CLIP-CARD (15 Hrs)' : 'Hourly Play pass'}
                </p>
              </div>
            </div>

            {lastGamingInvoice.gamingDetails?.cartItems && lastGamingInvoice.gamingDetails.cartItems.length > 0 && (
              <div className="pt-3 border-t border-zinc-900 space-y-1.5 text-zinc-400">
                <span className="text-zinc-550 text-[9px] uppercase block">Itemized Details</span>
                <div className="space-y-1">
                  {lastGamingInvoice.gamingDetails.cartItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-[10px]">
                      <span>
                        {item.screenSize}" {item.name ? 'Pass' : 'Screen'} - {item.playersCount}P (x{item.quantity})
                      </span>
                      <span className="text-white">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-900/80 flex justify-between font-bold text-white">
              <span className="uppercase text-[9.5px]">Final Payable Amount</span>
              <span className="text-amber-500">₹{lastGamingInvoice.totalAmount}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              id="gaming_done_to_dashboard"
              onClick={onOpenDashboard}
              className="px-6 py-3 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Verify Session in Dashboard
            </button>
            <button
              id="gaming_done_dismiss"
              onClick={() => setLastGamingInvoice(null)}
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Add Another Booking
            </button>
          </div>
        </motion.div>
      )}

      {/* ==========================================
          🔥 GAMING HIGHLIGHTS (Videos Reels, Photos & Mixed Arena)
          ========================================== */}

      {true ? null : (
        <div>
          <div>
            <div>
              
              {/* TOURNAMENT HERO BANNER */}
              <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-zinc-950 shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-950/80 to-transparent z-10" />
                
                {/* Visual Hot Red Ambient Accent */}
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-red-600/15 blur-3xl" />
                <div className="absolute -bottom-12 -left-12 w-60 h-60 rounded-full bg-amber-600/10 blur-3xl" />

                <div className="relative z-20 p-6 sm:p-8 space-y-4">
                  <span className="text-[10px] font-mono font-bold text-red-500 tracking-widest uppercase">
                    OFFICIAL ESPORTS ARENA EVENT
                  </span>
                  <h4 className="font-display text-3xl font-black text-white leading-tight uppercase tracking-tight">
                    {selectedTournament.name}
                  </h4>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-xxs text-zinc-300 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 text-red-500" />
                      <span>Game: <b className="text-white font-sans">{selectedTournament.game}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Prize Pool: <b className="text-white font-sans">₹{selectedTournament.prizePool || '10,000'}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Entry: <b className="text-red-400 font-sans text-xs font-bold">₹{selectedTournament.entryFee}</b></span>
                    </div>
                  </div>

                  {/* Date details indicators */}
                  <div className="grid grid-cols-2 gap-4 mt-6 p-4 border border-zinc-900/90 rounded-2xl bg-zinc-950/90 max-w-md">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-zinc-550 block uppercase">START DATE</span>
                      <span className="text-xxs font-bold text-white font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-red-500" />
                        {selectedTournament.startDate || '10-06-2026'}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-zinc-550 block uppercase">STATUS STATUS</span>
                      <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                        {selectedTournament.status || 'OPEN FOR REGISTRATION'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* HANDBOOK: OFFICIAL TERMS & CONDITIONS */}
              <div className="p-6 border border-zinc-900/60 rounded-3xl bg-zinc-950/20 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-zinc-900 text-zinc-400">
                    <BookOpen className="w-4 h-4 text-red-500" />
                  </span>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                    Official Tournament Guidelines & Terms
                  </h5>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xxs font-sans text-zinc-400 leading-normal">
                  {[
                    "Registration Fee: ₹200 per participant is fully final.",
                    "Only physically registered participants will be allowed on the grid.",
                    "Players must carry their logged-in Asphalt Legends profiles.",
                    "Late reports or absent players will forfeit match credentials instantly.",
                    "Fair-play protocols enforced. Modding or macro helpers gets instant bans.",
                    "Organizers holds the final verdict on disputes, tracks, and group brackets."
                  ].map((ruleText, ruleIdx) => (
                    <div key={ruleIdx} className="p-2.5 rounded-xl bg-zinc-900/30 border border-zinc-900/20 flex gap-2.5">
                      <span className="text-[8.5px] font-mono text-red-500 font-bold block shrink-0">
                        0{ruleIdx + 1}
                      </span>
                      <span>{ruleText}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: INTERACTIVE REGISTRATION PORTAL (5 cols) */}
            <div className="lg:col-span-5">
              {!lastTourneyTicket ? (
                <div className="p-6 border border-red-500/15 bg-zinc-950/40 rounded-3xl space-y-5">
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-extrabold text-white uppercase tracking-tight">
                      REGISTRATION FORM
                    </h5>
                    <p className="text-[10px] text-zinc-400 font-sans">
                      Complete participant fields to secure your Esports tournament pass.
                    </p>
                  </div>

                  <form onSubmit={handleTourneyCheckoutTrigger} className="space-y-4">
                    
                    {/* Participant Name */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">FULL NAME *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={tourneyName}
                        onChange={(e) => setTourneyName(e.target.value)}
                        className="w-full bg-black border border-zinc-800 focus:border-red-500 focus:outline-none px-3.5 py-2.5 text-xs text-white rounded-xl transition-all"
                      />
                    </div>

                    {/* Participant Mobile & Email Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">MOBILE *</label>
                        <input
                          type="tel"
                          required
                          placeholder="9472835855"
                          value={tourneyMobile}
                          onChange={(e) => setTourneyMobile(e.target.value)}
                          className="w-full bg-black border border-zinc-805 focus:border-red-500 focus:outline-none px-3.5 py-2.5 text-xs text-white rounded-xl transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">EMAIL *</label>
                        <input
                          type="email"
                          required
                          placeholder="john@alpha.com"
                          value={tourneyEmail}
                          onChange={(e) => setTourneyEmail(e.target.value)}
                          className="w-full bg-black border border-zinc-805 focus:border-red-500 focus:outline-none px-3.5 py-2.5 text-xs text-white rounded-xl transition-all"
                        />
                      </div>
                    </div>

                    {/* Demographics: Age & Home City */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block font-sans">AGE TRACKER *</label>
                        <input
                          type="number"
                          required
                          min="10"
                          max="99"
                          placeholder="18"
                          value={tourneyAge}
                          onChange={(e) => setTourneyAge(e.target.value)}
                          className="w-full bg-black border border-zinc-805 focus:border-red-500 focus:outline-none px-3.5 py-2.5 text-xs text-white rounded-xl transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">HOME CITY *</label>
                        <input
                          type="text"
                          required
                          placeholder="Purnea"
                          value={tourneyCity}
                          onChange={(e) => setTourneyCity(e.target.value)}
                          className="w-full bg-black border border-zinc-850 focus:border-red-500 focus:outline-none px-3.5 py-2.5 text-xs text-white rounded-xl transition-all"
                        />
                      </div>
                    </div>

                    {/* In-Game Tag ID */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">ASPHALT PLAYER ID (GAMER TAG)</label>
                      <input
                        type="text"
                        placeholder="e.g. ALPHA_DRIVER_07"
                        value={tourneyGamingId}
                        onChange={(e) => setTourneyGamingId(e.target.value)}
                        className="w-full bg-black border border-zinc-800 focus:border-red-500 focus:outline-none px-3.5 py-2.5 text-xs text-white rounded-xl transition-all font-mono"
                      />
                    </div>

                    {/* Draggable Participant Avatar Photo */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">PLAYER PHOTO CARD (DRAG-DROP)</label>
                      
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsTourneyDragOver(true); }}
                        onDragLeave={() => setIsTourneyDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsTourneyDragOver(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            const reader = new FileReader();
                            reader.onloadend = () => setTourneyProfileBase64(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                          isTourneyDragOver ? 'border-red-500 bg-red-500/10' : 'border-zinc-800 bg-black/60 hover:bg-zinc-950'
                        }`}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.files && target.files[0]) {
                              const file = target.files[0];
                              const reader = new FileReader();
                              reader.onloadend = () => setTourneyProfileBase64(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        {tourneyProfileBase64 ? (
                          <div className="flex items-center justify-between gap-3 text-left">
                            <div className="flex items-center gap-2">
                              <img src={tourneyProfileBase64} className="w-9 h-9 object-cover rounded-md border border-zinc-750" referrerPolicy="no-referrer" />
                              <span className="text-[10px] text-emerald-400 font-mono">Photo card mapped successfully!</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setTourneyProfileBase64(''); }}
                              className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-[10px] text-zinc-400 font-medium">Click or Drag Image representation</p>
                            <p className="text-[8px] text-zinc-550 font-mono header-mono uppercase">JPG, PNG, WEBP allowed</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>Acquire Tournament Ticket ● ₹200</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </form>
                </div>
              ) : (
                /* OFFICIAL TOURNAMENT PASS TICKET visual print page representation */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="bg-red-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-2xl text-center text-xxs font-mono">
                    ✓ CHALLENGER ENTRANCE CONFIRMED IN DATA CORE
                  </div>

                  <div className="border border-red-500/20 bg-zinc-950 rounded-3xl overflow-hidden shadow-xl font-mono text-xxs text-zinc-400 p-5 space-y-4 relative">
                    <div className="absolute top-0 right-0 py-1.5 px-3.5 bg-red-600 text-white text-[7.5px] uppercase font-black uppercase">
                      OFFICIAL DRIVER PASS
                    </div>

                    <div className="space-y-1">
                      <span className="text-[7.5px] text-zinc-650 tracking-widest block uppercase">THE ARENA BRACKET</span>
                      <h6 className="text-[10.5px] font-bold text-white leading-snug">{lastTourneyTicket.planName}</h6>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-900">
                      <div>
                        <span className="text-zinc-650 text-[7px] uppercase block">CHALLENGER ATHLETE</span>
                        <p className="text-white font-semibold uppercase">{lastTourneyTicket.userName}</p>
                      </div>
                      <div>
                        <span className="text-zinc-650 text-[7px] uppercase block">HOTLINE ADDR</span>
                        <p className="text-white font-mono">{lastTourneyTicket.userMobile}</p>
                      </div>
                      <div>
                        <span className="text-zinc-650 text-[7px] uppercase block">ASPHALT PLAYER ID</span>
                        <p className="text-red-400 font-bold tracking-wider">{lastTourneyTicket.tournamentDetails?.gamingId || 'RECRUIT'}</p>
                      </div>
                      <div>
                        <span className="text-zinc-650 text-[7px] uppercase block">TICKET TRACE</span>
                        <p className="text-zinc-300">{lastTourneyTicket.invoiceNumber}</p>
                      </div>
                    </div>

                    {lastTourneyTicket.tournamentDetails?.profileImageBase64 && (
                      <div className="flex gap-3 items-center border-t border-zinc-900/60 pt-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0">
                          <img src={lastTourneyTicket.tournamentDetails.profileImageBase64} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-650 text-[7px] uppercase block font-sans">PLAYER AVATAR MAPPING</span>
                          <span className="text-[7.5px] text-emerald-400 flex items-center gap-1 font-bold">
                            🔒 BIOMETRIC STAMP SIGNED
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="text-center pt-3 border-t border-zinc-900 flex justify-between items-center text-[9px] text-zinc-550">
                      <span>ALPHA ESPORTS STADIUM ●</span>
                      <span className="text-red-500 font-bold">PAID ₹200</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-805 text-zinc-350 text-[10.5px] font-bold tracking-wider rounded-xl uppercase transition-all"
                    >
                      Print/PDF PASS
                    </button>
                    <button
                      onClick={() => setLastTourneyTicket(null)}
                      className="px-4 py-2.5 bg-zinc-950 text-zinc-500 hover:text-white text-[10.5px] font-bold rounded-xl transition-all border border-zinc-900"
                    >
                      Reset form
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          🔥 GAMING HIGHLIGHTS (Videos Reels, Photos & Mixed Arena)
          ========================================== */}
      <div id="gaming_highlights_unified" className="pt-12 border-t border-zinc-900/80 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-mono tracking-wider uppercase">
            <Sparkles className="w-3 h-3 animate-spin" />
            <span>Stadium Broadcasting</span>
          </div>
          <h3 className="font-display text-2xl font-black tracking-tight text-white uppercase flex items-center justify-center gap-2">
            🔥 GAMING <span className="text-amber-500">HIGHLIGHTS</span>
          </h3>
          <p className="text-xxs text-zinc-400 font-mono tracking-widest uppercase leading-relaxed max-w-md mx-auto">
            Live from the Arena. Watch high-fidelity gaming reels, frozen moments, and custom setups.
          </p>
        </div>

        {/* INSTAGRAM STYLE STORIES ROW */}
        {highlightStories && highlightStories.length > 0 && (
          <div className="max-w-4xl mx-auto overflow-x-auto custom-scrollbar pb-4 flex items-center gap-4 px-4 snap-x relative z-10 scroll-smooth">
            {highlightStories.map((story, idx) => (
              <button
                key={story.id}
                onClick={() => {
                  setActiveStoryIndex(idx);
                  setStoryProgress(0);
                }}
                className="flex flex-col items-center gap-2 min-w-[72px] shrink-0 outline-none group snap-center"
              >
                <div className={`w-[72px] h-[72px] rounded-full p-[3px] transition-transform group-hover:scale-105 active:scale-95 ${activeStoryIndex === idx ? 'bg-zinc-800' : 'bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400'}`}>
                  <div className="w-full h-full rounded-full border-[3px] border-black overflow-hidden bg-zinc-900">
                    <img 
                      src={story.type === 'video' ? 'https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&q=80&w=150' : story.mediaUrl} 
                      alt={story.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-zinc-400 font-medium truncate w-full text-center tracking-tight">
                  {story.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Fullscreen Story Viewer */}
        {activeStoryIndex !== null && highlightStories[activeStoryIndex] && (
          <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center group">
            <div className="relative w-full max-w-[420px] h-[100dvh] sm:h-[800px] sm:max-h-[100dvh] bg-zinc-950 sm:rounded-[32px] overflow-hidden">
              {/* Progress Bar Container */}
              <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/80 to-transparent z-20 px-3 pt-3 flex gap-1">
                {highlightStories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                    {idx < activeStoryIndex ? (
                      <div className="h-full bg-white w-full" />
                    ) : idx === activeStoryIndex ? (
                      <div className="h-full bg-white origin-left" style={{ width: `${storyProgress}%` }} />
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Story Header */}
              <div className="absolute top-6 inset-x-0 z-20 px-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-zinc-800 overflow-hidden bg-black">
                    <img 
                      src={highlightStories[activeStoryIndex].type === 'video' ? 'https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&q=80&w=150' : highlightStories[activeStoryIndex].mediaUrl} 
                      className="w-full h-full object-cover" 
                      alt="Story"
                    />
                  </div>
                  <span className="text-xs font-bold truncate max-w-[150px] shadow-sm">{highlightStories[activeStoryIndex].title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveStoryIndex(null)} className="text-white drop-shadow-md">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Media Content */}
              <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center pointer-events-none">
                {highlightStories[activeStoryIndex].type === 'video' ? (
                  getYoutubeId(highlightStories[activeStoryIndex].mediaUrl) ? (
                    <iframe
                      src={getYoutubeEmbedUrl(highlightStories[activeStoryIndex].mediaUrl, true, false, false)}
                      className="w-[140%] h-[120%] border-0 pointer-events-none scale-105"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Story Video"
                    />
                  ) : (
                    <video
                      ref={storyVideoRef}
                      src={highlightStories[activeStoryIndex].mediaUrl}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted={false}
                      onEnded={() => {
                        if (activeStoryIndex < highlightStories.length - 1) {
                          setActiveStoryIndex(activeStoryIndex + 1);
                          setStoryProgress(0);
                        } else {
                          setActiveStoryIndex(null);
                        }
                      }}
                      onTimeUpdate={(e) => {
                        const video = e.currentTarget;
                        const p = (video.currentTime / video.duration) * 100;
                        setStoryProgress(p);
                      }}
                    />
                  )
                ) : (
                  <img
                    src={highlightStories[activeStoryIndex].mediaUrl}
                    className="w-full h-full object-cover"
                    alt="Story Content"
                  />
                )}
              </div>

              {/* Navigation Touch Areas */}
              <div className="absolute inset-0 z-10 flex">
                <div 
                  className="w-1/3 h-full cursor-pointer"
                  onClick={() => {
                    if (activeStoryIndex > 0) {
                      setActiveStoryIndex(activeStoryIndex - 1);
                      setStoryProgress(0);
                    }
                  }}
                />
                <div 
                  className="w-2/3 h-full cursor-pointer"
                  onClick={() => {
                    if (activeStoryIndex < highlightStories.length - 1) {
                      setActiveStoryIndex(activeStoryIndex + 1);
                      setStoryProgress(0);
                    } else {
                      setActiveStoryIndex(null);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab Controls Bar */}
        <div className="max-w-md mx-auto flex p-1.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl shadow-xl">
          <button
            onClick={() => setHighlightsTab('reels')}
            className={`flex-1 py-2 text-xxs font-mono tracking-wider uppercase rounded-xl transition-all cursor-pointer ${
              highlightsTab === 'reels'
                ? 'bg-amber-500 text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📹 Videos Reels
          </button>
          <button
            onClick={() => setHighlightsTab('photos')}
            className={`flex-1 py-2 text-xxs font-mono tracking-wider uppercase rounded-xl transition-all cursor-pointer ${
              highlightsTab === 'photos'
                ? 'bg-amber-500 text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🖼 Photos Gallery
          </button>
          <button
            onClick={() => setHighlightsTab('mixed')}
            className={`flex-1 py-2 text-xxs font-mono tracking-wider uppercase rounded-xl transition-all cursor-pointer ${
              highlightsTab === 'mixed'
                ? 'bg-amber-500 text-black font-extrabold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🎮 Mixed Feed
          </button>
        </div>

        {/* Successful Share Link Toast Overlay */}
        {reelsSuccessToast && (
          <div className="fixed top-24 left-6 right-6 md:left-auto md:right-8 z-50 bg-amber-500 text-black border border-amber-400 text-xxs font-mono tracking-wider font-extrabold px-6 py-3.5 rounded-xl uppercase flex items-center gap-2 shadow-2xl animate-bounce">
            <CheckCircle className="w-4 h-4 animate-ping shrink-0" />
            <span>{reelsSuccessToast}</span>
          </div>
        )}

        {/* TAB 1: INSTAGRAM STYLE REELS SLIDER ELEMENT */}
        {highlightsTab === 'reels' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-zinc-950/20 p-6 md:p-8 border border-zinc-900/60 rounded-3xl">
            {/* Left Column: Swiping / Instruction Sidebar */}
            <div className="md:col-span-4 text-left space-y-4">
              <div className="flex justify-between items-center bg-zinc-950/20">
                <span className="text-[9.5px] font-mono text-amber-500 font-extrabold tracking-widest uppercase block flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Live Reels Station
                </span>
                <button
                  onClick={handleAddReel}
                  className="p-1 rounded-full bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-400 transition-colors shadow"
                  title="Add Reel Video"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <h4 className="font-display text-lg font-bold text-white uppercase tracking-tight leading-snug">
                Instagram-style <span className="text-amber-500">Gameplay Reels</span>
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Swipe up or down to cruise through esports matches, custom lighting tours, and tournament battles. Auto-advances smoothly on completion.
              </p>
              
              <div className="space-y-2 pt-2 text-[10px] font-mono text-zinc-500 uppercase">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-zinc-900 flex items-center justify-center border border-zinc-800 text-white font-bold text-xxs leading-none select-none">▲</span>
                  <span>Keyboard Arrow Up / Scroll Up</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-zinc-900 flex items-center justify-center border border-zinc-805 text-white font-bold text-xxs leading-none select-none">▼</span>
                  <span>Keyboard Arrow Down / Scroll Down</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-zinc-900 flex items-center justify-center border border-zinc-805 text-white font-bold text-xxs leading-none select-none">⚙</span>
                  <span>Double Click Card to Loop Video</span>
                </div>
              </div>

              {/* Slider Continuous Progress Indicators */}
              <div className="py-2.5">
                <p className="text-[9px] font-mono text-zinc-400 mb-2 uppercase tracking-widest font-black">
                  BROADCAST CLIP SPEC ({currentReelIndex + 1} OF {highlightVideos.length})
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {highlightVideos.map((v, idx) => (
                    <button
                      key={v.id}
                      onClick={() => setCurrentReelIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentReelIndex ? 'w-6 bg-amber-500' : 'w-2 bg-zinc-900 hover:bg-zinc-750'
                      }`}
                      title={v.title}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Smartphone bezel vertical player component */}
            <div className="md:col-span-8 flex justify-center">
              {highlightVideos.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-zinc-900 rounded-3xl text-zinc-500 text-xxs font-mono uppercase">
                  No highlighted videos mapped to database inventory.
                </div>
              ) : (
                (() => {
                  const reel = highlightVideos[currentReelIndex];
                  if (!reel) return null;
                  const isYoutube = getYoutubeId(reel.videoUrl);
                  
                  return (
                    <div 
                      className="relative w-full max-w-[420px] aspect-[9/16] rounded-[48px] bg-black border-[8px] border-zinc-900 shadow-[0_0_60px_rgba(30,30,30,0.4)] overflow-hidden group select-none flex flex-col justify-between transition-all"
                      style={{ height: '740px' }}
                    >
                      {/* Swipe / Navigation Control Floating Arrows Overlay */}
                      <div className="absolute inset-x-0 top-0 h-16 z-25 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/90 to-transparent">
                        <button 
                          onClick={handlePrevReel} 
                          className="pointer-events-auto p-1.5 rounded-full bg-black/80 hover:bg-zinc-900 border border-zinc-800 text-white transition-all cursor-pointer shadow"
                          title="Swipe Up / Previous Reel"
                        >
                          <ChevronUp className="w-5 h-5 animate-pulse" />
                        </button>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 h-18 z-25 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/90 to-transparent">
                        <button 
                          onClick={handleNextReel} 
                          className="pointer-events-auto p-1.5 rounded-full bg-black/80 hover:bg-zinc-900 border border-zinc-800 text-white transition-all cursor-pointer shadow"
                          title="Swipe Down / Next Reel"
                        >
                          <ChevronDown className="w-5 h-5 animate-pulse" />
                        </button>
                      </div>

                      {/* Prime Video stream player */}
                      <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center z-10">
                        {isYoutube ? (
                          <iframe
                            src={getYoutubeEmbedUrl(reel.videoUrl, true, reelsMuted, reel.loop)}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={reel.title}
                          />
                        ) : (
                          <video
                            key={reel.id}
                            src={reel.videoUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted={reelsMuted}
                            loop={!reel.loop}
                            playsInline
                            onCanPlay={(e) => { e.currentTarget.volume = 0.8; }}
                            onEnded={handleNextReel} // Autoplay next reel on ended
                            referrerPolicy="no-referrer"
                            onClick={(e) => {
                              const videoEl = e.currentTarget;
                              if (videoEl.paused) {
                                videoEl.play().catch(ev => console.log(ev));
                              } else {
                                videoEl.pause();
                              }
                            }}
                          />
                        )}
                      </div>

                      {/* Right Hand floating quick social keys menu bar */}
                      <div className="absolute right-4 bottom-16 z-30 flex flex-col gap-4.5 items-center">
                        {/* Like/Heart Toggler */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleToggleReelLike(reel.id)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow ${
                              likedReels[reel.id] 
                                ? 'bg-red-500/20 border-red-500 text-red-500 scale-110 shadow-lg shadow-red-500/10' 
                                : 'bg-black/70 border-zinc-855 text-white hover:bg-zinc-900'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${likedReels[reel.id] ? 'fill-current text-red-500' : ''}`} />
                          </button>
                          <span className="text-[9px] font-mono text-white font-extrabold drop-shadow tracking-wider">
                            {getReelLikesCount(reel.id)}
                          </span>
                        </div>

                        {/* Share Clipboard Copy Button */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleShareReelLink(reel.videoUrl)}
                            className="w-10 h-10 rounded-full bg-black/70 border border-zinc-850 flex items-center justify-center text-white hover:bg-amber-500 hover:text-black transition-all cursor-pointer shadow"
                            title="Copy Reel Absolute URL"
                          >
                            <Share2 className="w-4.5 h-4.5" />
                          </button>
                          <span className="text-[8.5px] font-mono text-zinc-350 font-bold drop-shadow uppercase font-black">Share</span>
                        </div>

                        {/* Full Screen overlay cinema lightbox mode */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => setFullscreenReel(true)}
                            className="w-10 h-10 rounded-full bg-black/70 border border-zinc-850 flex items-center justify-center text-white hover:bg-zinc-900 transition-all cursor-pointer shadow"
                            title="Expand Cinema Overlay Theatre"
                          >
                            <Maximize className="w-4.5 h-4.5" />
                          </button>
                          <span className="text-[8.5px] font-mono text-zinc-350 font-bold drop-shadow uppercase font-black">Cinema</span>
                        </div>

                        {/* Sound Controller Mute Key */}
                        {!isYoutube && (
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => setReelsMuted(!reelsMuted)}
                              className="w-10 h-10 rounded-full bg-black/70 border border-zinc-850 flex items-center justify-center text-white hover:bg-zinc-900 transition-all cursor-pointer shadow"
                              title={reelsMuted ? "Unmute audio" : "Mute audio"}
                            >
                              {reelsMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                            </button>
                            <span className="text-[8.5px] font-mono text-zinc-350 font-bold drop-shadow uppercase font-black">
                              {reelsMuted ? "Muted" : "Sound"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description foot panel sticker inside smartphone frame */}
                      <div className="absolute bottom-0 inset-x-0 z-25 bg-gradient-to-t from-black via-black/85 to-transparent p-4.5 pt-12 text-left space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[7px] font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 rounded">
                            {reel.isFeatured ? "★ FEATURED SPECTACLE" : "GAMEPLAY VIDEO"}
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-white truncate drop-shadow uppercase tracking-wide">{reel.title}</h5>
                        <p className="text-[9.5px] text-zinc-400 line-clamp-2 drop-shadow font-mono">
                          Raw direct live high-definition broadcast feed. Tap card once inside frame to cycle loop status dynamically.
                        </p>
                      </div>

                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STADIUM PHOTO HIGHLIGHTS GALLERY */}
        {highlightsTab === 'photos' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-900 pb-4">
              <div className="text-left font-sans">
                <span className="text-[8px] font-mono text-amber-500 font-extrabold uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  Albums Telemetry
                </span>
                <p className="text-[10px] text-zinc-500 font-mono text-xxs uppercase tracking-widest pt-1.5">
                  Filter by capture theme. Captured live at the Alpha Arena.
                </p>
              </div>

              {highlightPhotos.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
                  {getAlbumsList().map(albumName => (
                    <button
                      key={albumName}
                      onClick={() => setActivePhotoAlbum(albumName)}
                      className={`px-3 py-1.5 text-[10px] font-mono tracking-wider uppercase rounded-lg transition-all cursor-pointer border ${
                        activePhotoAlbum === albumName 
                          ? 'bg-amber-500 border-amber-500 text-black font-extrabold shadow' 
                          : 'bg-zinc-950/45 border-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {albumName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {highlightPhotos.length === 0 ? (
              <div className="p-10 border border-zinc-900 rounded-3xl bg-zinc-950/20 text-center text-zinc-500 text-xxs font-mono uppercase">
                No telemetry photos registered in storage vaults.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {getFilteredPhotos().map((p: any) => (
                  <div
                    key={p.id}
                    onClick={() => setActivePhotoModal(p)}
                    className="group relative h-40 sm:h-48 overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950 cursor-pointer shadow hover:border-zinc-800 transition-all"
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3.5 text-left">
                      <span className="text-[8px] font-mono text-amber-400 uppercase tracking-widest block mb-0.5">
                        {p.album || 'LAN'}
                      </span>
                      <p className="text-[10px] font-bold text-white truncate font-sans uppercase">
                        {p.title}
                      </p>
                      <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-lg bg-black/80 flex items-center justify-center border border-zinc-800">
                        <Eye className="w-3 h-3 text-amber-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMBINED MIXED STREAMS BENTO-STYLE GRID */}
        {highlightsTab === 'mixed' && (
          <div className="space-y-6">
            <p className="text-left text-xxs font-mono text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2 pl-1">
              Live Integrated Stream ({highlightVideos.length + highlightPhotos.length} blocks registered)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Combine both arrays */}
              {[
                ...highlightVideos.map(v => ({ ...v, type: 'video' })),
                ...highlightPhotos.map(p => ({ ...p, type: 'photo' }))
              ].map((item: any, idx) => (
                <div
                  key={item.id + '_' + idx}
                  className="group relative bg-zinc-950/40 p-3.5 border border-zinc-900 hover:border-zinc-800 rounded-2xl flex flex-col justify-between transition-all shadow"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-zinc-900 flex items-center justify-center">
                    {item.type === 'video' ? (
                      <>
                        {getYoutubeId(item.videoUrl) ? (
                          <img
                            src={`https://img.youtube.com/vi/${getYoutubeId(item.videoUrl)}/hqdefault.jpg`}
                            alt={item.title}
                            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <video
                            src={item.videoUrl}
                            preload="metadata"
                            className="w-full h-full object-cover transition-all animate-none"
                            muted
                            playsInline
                            referrerPolicy="no-referrer"
                          />
                        )}
                        {/* Play overlay overlay */}
                        <button
                          type="button"
                          onClick={() => {
                            const index = highlightVideos.findIndex(hv => hv.id === item.id);
                            if (index !== -1) {
                              setCurrentReelIndex(index);
                              setHighlightsTab('reels');
                            }
                          }}
                          className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-amber-500 text-black flex items-center justify-center hover:bg-amber-450 transition-all scale-95 group-hover:scale-100 cursor-pointer shadow z-10"
                        >
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        {/* Expand overlay button */}
                        <button
                          type="button"
                          onClick={() => setActivePhotoModal(item)}
                          className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-zinc-900 transition-all scale-95 group-hover:scale-100 cursor-pointer shadow z-10 border border-zinc-800"
                        >
                          <Eye className="w-5 h-5 text-amber-500" />
                        </button>
                      </>
                    )}

                    {/* Badge spec overlay */}
                    <div className="absolute top-2.5 left-2.5 flex gap-1 z-10 pr-2">
                      <span className={`text-[6.5px] font-mono font-bold tracking-wider rounded uppercase px-1.5 py-0.5 ${
                        item.type === 'video' ? 'bg-amber-500 text-black' : 'bg-zinc-950 text-zinc-400 border border-zinc-850'
                      }`}>
                        {item.type === 'video' ? "📹 Video" : "🖼 Photo"}
                      </span>
                      {item.isFeatured && (
                        <span className="bg-red-600 text-white text-[6.5px] font-mono font-bold tracking-wider rounded px-1.5 py-0.5 font-black">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 text-left">
                    <h5 className="text-xxs font-extrabold text-white truncate group-hover:text-amber-500 uppercase leading-snug">
                      {item.title}
                    </h5>
                    <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 pt-1">
                      <span>{item.type === 'video' ? "Gameplay Broadcast" : `Album: ${item.album || "General"}`}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.type === 'video') {
                            const index = highlightVideos.findIndex(hv => hv.id === item.id);
                            if (index !== -1) {
                              setCurrentReelIndex(index);
                              setHighlightsTab('reels');
                            }
                          } else {
                            setActivePhotoModal(item);
                          }
                        }}
                        className="text-zinc-400 hover:text-white uppercase font-bold text-[8.5px] transition-colors"
                      >
                        {item.type === 'video' ? "Reels Player" : "Zoom Slide"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PHOTO LIGHTBOX MODAL */}
        {activePhotoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 select-none animate-fade-in">
            <div className="absolute inset-0 cursor-zoom-out" onClick={() => setActivePhotoModal(null)} />
            
            <div className="relative max-w-4xl w-full max-h-[85vh] bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden z-20 flex flex-col">
              
              {/* Header metadata */}
              <div className="p-4 border-b border-zinc-900 flex justify-between items-center text-xxs font-mono text-zinc-400">
                <div className="space-y-0.5 text-left">
                  <span className="text-[8px] text-amber-500 uppercase">ALBUM: {activePhotoModal.album || 'ARENA'}</span>
                  <h5 className="font-sans text-xs font-bold text-white uppercase">{activePhotoModal.title}</h5>
                </div>
                <button
                  onClick={() => setActivePhotoModal(null)}
                  className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Central high resolution slot */}
              <div className="flex-1 bg-black p-2 flex items-center justify-center min-h-[300px]">
                <img
                  src={activePhotoModal.imageUrl}
                  alt={activePhotoModal.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Description foot stamp */}
              {activePhotoModal.description && (
                <div className="p-4 bg-zinc-950/90 border-t border-zinc-900 text-center text-xxs font-sans text-zinc-400">
                  {activePhotoModal.description}
                </div>
              )}

            </div>
          </div>
        )}

        {/* REELS THEATRE FULL SCREEN SYSTEM MODAL OVERLAY */}
        {fullscreenReel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/98 p-4 md:p-8 animate-fade-in select-none">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setFullscreenReel(false)} />
            
            <div className="relative max-w-lg w-full aspect-[9/16] bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden z-25 flex flex-col justify-between" style={{ height: '90vh' }}>
              
              {/* Top header navigation specs */}
              <div className="absolute top-4 inset-x-4 z-40 flex justify-between items-center bg-black/45 backdrop-blur-md p-3 rounded-xl border border-zinc-900/50">
                <div className="text-left">
                  <span className="text-[7.5px] font-mono uppercase bg-amber-500 text-black px-1.5 py-0.5 rounded font-extrabold tracking-wider">REELS CINEMA</span>
                  <h6 className="text-[10px] font-sans font-bold text-white uppercase truncate max-w-[180px] pt-0.5">
                    {highlightVideos[currentReelIndex]?.title}
                  </h6>
                </div>
                <button
                  onClick={() => setFullscreenReel(false)}
                  className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Central HD stream */}
              <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                {(() => {
                  const reel = highlightVideos[currentReelIndex];
                  if (!reel) return null;
                  const isYoutube = getYoutubeId(reel.videoUrl);
                  
                  return isYoutube ? (
                    <iframe
                      src={getYoutubeEmbedUrl(reel.videoUrl, true, reelsMuted, reel.loop)}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      key={'fs_' + reel.id}
                      src={reel.videoUrl}
                      className="w-full h-full object-contain"
                      autoPlay
                      muted={reelsMuted}
                      loop={!reel.loop}
                      playsInline
                      onCanPlay={(e) => { e.currentTarget.volume = 0.8; }}
                      onEnded={handleNextReel}
                      referrerPolicy="no-referrer"
                      onClick={(e) => {
                        const videoEl = e.currentTarget;
                        if (videoEl.paused) {
                          videoEl.play().catch(ev => console.log(ev));
                        } else {
                          videoEl.pause();
                        }
                      }}
                    />
                  );
                })()}
              </div>

              {/* Carousel directional button swipe controllers */}
              <div className="absolute inset-y-0 inset-x-2 z-35 flex justify-between items-center pointer-events-none">
                <button
                  onClick={handlePrevReel}
                  className="pointer-events-auto w-9 h-9 rounded-full bg-black/75 border border-zinc-800 text-white flex items-center justify-center hover:bg-zinc-900 transition-all cursor-pointer shadow"
                  title="Previous Clip"
                >
                  <ChevronUp className="w-5 h-5 -rotate-90" />
                </button>
                <button
                  onClick={handleNextReel}
                  className="pointer-events-auto w-9 h-9 rounded-full bg-black/75 border border-zinc-800 text-white flex items-center justify-center hover:bg-zinc-900 transition-all cursor-pointer shadow"
                  title="Next Clip"
                >
                  <ChevronDown className="w-5 h-5 -rotate-90" />
                </button>
              </div>

              {/* Cinema control dashboard on bottom */}
              <div className="absolute bottom-4 inset-x-4 z-40 bg-black/70 p-3.5 rounded-xl backdrop-blur-md border border-zinc-900/60 text-left flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">
                    CLIP INDEX {currentReelIndex + 1} OF {highlightVideos.length}
                  </span>
                  <h5 className="font-display text-[11px] font-extrabold text-white uppercase truncate">
                    {highlightVideos[currentReelIndex]?.title}
                  </h5>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleReelLike(highlightVideos[currentReelIndex]?.id)}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-lg cursor-pointer w-8 h-8 flex items-center justify-center"
                    title="Toggle Like stamp"
                  >
                    <Heart className={`w-3.5 h-3.5 ${likedReels[highlightVideos[currentReelIndex]?.id] ? 'fill-current text-red-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleShareReelLink(highlightVideos[currentReelIndex]?.videoUrl)}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-lg cursor-pointer w-8 h-8 flex items-center justify-center"
                    title="Copy Reel Link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setReelsMuted(!reelsMuted)}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-lg cursor-pointer w-8 h-8 flex items-center justify-center"
                    title="Toggle sound"
                  >
                    {reelsMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-450" />}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Removed Cafe introduction text below Gaming Zone as required */}

      {true ? null : (
        <div id="cafe_menu_showcase_section">
          <div>
            
            {/* LEFT COLUMN: THE 8 SECTIONS (8 COLS) */}
            <div className="lg:col-span-8 space-y-8">
              {Object.entries(getCategorizedCafeItems()).map(([catName, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={catName} className="space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold border-b border-zinc-900 pb-2 flex items-center justify-between">
                      <span>{catName}</span>
                      <span className="text-[9px] text-zinc-650 font-medium font-sans">({items.length} items)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {items.map((item: any) => {
                        const cartMatch = cafeCart.find(c => c.item.id === item.id);
                        const quantity = cartMatch ? cartMatch.quantity : 0;
                        return (
                          <div
                            key={item.id}
                            id={`cafe_item_card_${item.id}`}
                            className="p-4 border border-zinc-900 rounded-2xl bg-zinc-950/40 relative overflow-hidden flex flex-col justify-between hover:border-zinc-805 transition-all shadow-inner group text-left"
                          >
                            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
                            
                            <div className="space-y-2.5">
                              {item.imageUrl ? (
                                <div className="h-28 rounded-xl overflow-hidden border border-zinc-900">
                                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-all" referrerPolicy="no-referrer" />
                                </div>
                              ) : null}

                              <div className="space-y-1">
                                <span className="text-[7.5px] font-mono text-emerald-500 uppercase tracking-widest block font-bold">
                                  {item.category || 'Refuel Snack Item'}
                                </span>
                                <h5 className="text-[11.5px] font-bold text-white uppercase tracking-tight line-clamp-1">{item.name}</h5>
                                <p className="text-[10px] text-zinc-500 font-sans leading-snug line-clamp-2">{item.description || 'Delectable companion to power up your active sessions.'}</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 mt-3 border-t border-zinc-900">
                              <span className="text-[13.5px] font-mono font-bold text-emerald-450">₹{item.price}</span>
                              
                              {/* Quantity selection controller with Add/Remove buttons */}
                              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-850 rounded-lg p-0.5">
                                <button
                                  id={`cafe_item_minus_${item.id}`}
                                  type="button"
                                  onClick={() => updateCafeQuantity(item.id, -1)}
                                  className="w-6 h-6 rounded bg-zinc-950 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:bg-zinc-800"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                
                                <span className="w-6 text-center text-[11px] font-mono font-semibold text-white">
                                  {quantity}
                                </span>

                                <button
                                  id={`cafe_item_plus_${item.id}`}
                                  type="button"
                                  onClick={() => updateCafeQuantity(item.id, 1)}
                                  className="w-6 h-6 rounded bg-zinc-950 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:bg-emerald-500 hover:text-black"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT COLUMN: CART PANEL & DISPATCH (4 COLS) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
              <div className="p-6 bg-zinc-900/20 border border-zinc-900 rounded-3xl space-y-5">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-mono uppercase tracking-widest text-emerald-450 font-bold">
                    Cafe Basket
                  </h4>
                  <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-855 px-2 py-0.5 rounded text-zinc-400 ml-auto font-bold">
                    {cafeCart.length} item{cafeCart.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {cafeCart.length === 0 ? (
                  <div className="py-8 text-center space-y-2 text-zinc-500">
                    <Utensils className="w-8 h-8 text-zinc-800 mx-auto" />
                    <p className="text-xxs font-mono uppercase">Your basket is empty</p>
                    <p className="text-[10px] text-zinc-600 max-w-[200px] mx-auto">Click the (+) button on any menu card to add items to your deskside order.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {cafeCart.map((cartItem) => (
                        <div key={cartItem.item.id} className="flex justify-between items-center gap-2 p-2 bg-zinc-950/45 rounded-xl border border-zinc-900">
                          <div className="text-left flex-1 min-w-0">
                            <h5 className="text-[10.5px] font-bold text-white truncate uppercase">{cartItem.item.name}</h5>
                            <p className="text-[9px] font-mono text-zinc-500">₹{cartItem.item.price} × {cartItem.quantity}</p>
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => updateCafeQuantity(cartItem.item.id, -1)}
                              className="w-5 h-5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-450 flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="w-4 text-center text-[10px] font-mono text-white">{cartItem.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCafeQuantity(cartItem.item.id, 1)}
                              className="w-5 h-5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-450 flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCafeFromCart(cartItem.item.id)}
                              className="ml-1 p-1 hover:bg-zinc-900 text-zinc-550 hover:text-red-500 rounded transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex justify-between items-baseline font-mono text-xxs">
                      <span className="uppercase text-zinc-500 font-bold">Cart Total</span>
                      <span className="text-sm font-bold text-emerald-405">₹{cafeCartSubtotal}</span>
                    </div>

                    {/* Delivery Credentials Input Form */}
                    <form onSubmit={handleCafeCheckoutTrigger} className="space-y-3.5 border-t border-zinc-900 pt-3 text-left">
                      <h5 className="text-[9px] font-mono uppercase tracking-widest text-zinc-450 font-bold">deskside delivery details</h5>
                      
                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">ATHLETE NAME *</label>
                        <input
                          type="text"
                          required
                          placeholder="Your full name"
                          value={cafeFullName}
                          onChange={(e) => setCafeFullName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 focus:border-emerald-500 focus:outline-none px-3.5 py-2.5 text-xs text-white rounded-xl transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block font-bold font-sans">DELIVERY MOBILE *</label>
                        <input
                          type="tel"
                          required
                          placeholder="9472835855"
                          value={cafeMobile}
                          onChange={(e) => setCafeMobile(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 focus:border-emerald-500 focus:outline-none px-3.5 py-2.5 text-xs text-white rounded-xl transition-all font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2 shadow"
                      >
                        <span>Dispatch Order ● ₹{cafeCartSubtotal}</span>
                        <ArrowRight className="w-4 h-4 text-black" />
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* CAFE ORDER PLACED SLIP SUCCESS HUD */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto border border-zinc-800 bg-zinc-950/80 rounded-3xl p-6 sm:p-10 space-y-6 text-center shadow-2xl"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold text-white tracking-tight uppercase">CAFE ORDER DISPATCHED</h3>
              <p className="text-xs text-emerald-400 font-mono tracking-widest uppercase">
                Invoice ID: {lastCafeInvoice.invoiceNumber}
              </p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed pt-1">
                Your order has been logged in our kitchen. Kitchen staff will deliver these items straight to your console shortly!
              </p>
            </div>

            {/* Printable Food Receipt Visual */}
            <div className="max-w-md mx-auto border border-zinc-900 bg-zinc-900/30 p-5 rounded-2xl text-left space-y-3.5 font-mono text-xxs text-zinc-400 relative">
              <div className="absolute top-0 right-0 py-0.5 px-3 bg-emerald-500 text-[6.5px] font-bold text-black uppercase rounded-bl">
                KITCHEN DELIV SLIP
              </div>

              <div className="space-y-1">
                <span className="text-[7.5px] text-zinc-550 block uppercase">Athlete Served</span>
                <span className="text-xs font-semibold text-white leading-tight">{lastCafeInvoice.userName} ({lastCafeInvoice.userMobile})</span>
              </div>

              <div className="border-t border-zinc-900/80 pt-2.5 space-y-1.5">
                <span className="text-[7px] text-zinc-550 block uppercase">Ordered Items</span>
                {lastCafeInvoice.cafeDetails?.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-zinc-300">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-900 flex justify-between font-bold text-white">
                <span className="uppercase text-[8px]">TOTAL PAID</span>
                <span className="text-emerald-400">₹{lastCafeInvoice.totalAmount}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3 justify-center">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-350 text-[10px] font-bold rounded-xl uppercase transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Kitchen Slip</span>
              </button>
              
              <button
                onClick={() => setLastCafeInvoice(null)}
                className="px-5 py-2.5 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 text-[10px] font-bold rounded-xl uppercase transition-all cursor-pointer"
              >
                Order More Bites
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ==========================================
          SECTION 8: SECURE SUPPORT HOTLINE / INQUIRIES 
          ========================================== */}
      <div id="support_hotline_inquires_section" className="pt-8 border-t border-zinc-900/80 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/5 border border-amber-500/15 text-amber-505 text-[10px] font-mono tracking-widest uppercase">
            <span>SECURE ENCRYPTED ENVELOPE SUPPORT</span>
          </div>
          <h3 className="font-display text-xl font-bold tracking-tight text-white uppercase">
            Support Desk & <span className="text-amber-500">Client Hotline</span>
          </h3>
          <p className="text-xxs text-zinc-400 font-mono tracking-widest uppercase">
            Dispatched inquiries route directly to operations logs for swift callbacks.
          </p>
        </div>

        <div className="p-6 sm:p-8 bg-zinc-950/30 border border-zinc-900 rounded-3xl">
          <form onSubmit={handleContactFormSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Client Name */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-mono text-zinc-455 uppercase tracking-widest block font-bold">CLIENT NAME</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-black border border-zinc-850 focus:border-amber-500 focus:outline-none px-3.5 py-2.5 text-xs text-white rounded-xl transition-all"
                />
              </div>

              {/* Client Phone */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-mono text-zinc-455 uppercase tracking-widest block font-bold">HOTLINE MOBILE</label>
                <input
                  type="tel"
                  required
                  placeholder="9472835855"
                  value={contactMobile}
                  onChange={(e) => setContactMobile(e.target.value)}
                  className="w-full bg-black border border-zinc-850 focus:border-amber-500 focus:outline-none px-3.5 py-2.5 text-xs text-white rounded-xl transition-all"
                />
              </div>

              {/* Client Email */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-mono text-zinc-455 uppercase tracking-widest block font-bold">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  placeholder="jane@thealpha.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-black border border-zinc-850 focus:border-amber-500 focus:outline-none px-3.5 py-2.5 text-xs text-white rounded-xl transition-all font-mono"
                />
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-mono text-zinc-455 uppercase tracking-widest block font-bold font-sans">SUPPORT MESSAGE BOX</label>
              <textarea
                rows={3}
                required
                placeholder="List your specific requirement here (e.g. reserving dual terminal layouts for special LAN meets or feedback)..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="w-full bg-black border border-zinc-850 focus:border-amber-500 focus:outline-none px-3.5 py-2.5 text-xs text-white rounded-xl transition-all"
              />
            </div>

            {/* Response Diagnostics */}
            {contactSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xxs font-mono rounded-xl text-center">
                {contactSuccess}
              </div>
            )}
            {contactError && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 text-xxs font-mono rounded-xl text-center">
                {contactError}
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                type="submit"
                disabled={submittingContact}
                className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-amber-500 hover:text-amber-400 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border border-zinc-800 inline-flex items-center gap-2"
              >
                {submittingContact ? (
                  <span>TRANSMITTING MESSAGE CORE...</span>
                ) : (
                  <>
                    <span>Transmit Support Envelope</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* RENDER DYNAMIC PAYMENTS MODAL */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={finalPayableAmount}
        itemName={cartSummaryName}
        category="gaming"
        userName={currentUser?.name || 'Guest User'}
        userEmail={currentUser?.email || 'guest@thealpha.com'}
        userMobile={currentUser?.mobile || '0000000000'}
        userId={currentUser?.id || 'usr_' + Math.random().toString(36).substring(2, 9)}
        categoryDetails={{
          gamingDetails: {
            isCartBooking: true,
            isOfferApplied: true,
            isMonthlyPass: activeCartItems.length === 1 && activeCartItems[0].plan.type === 'monthly',
            screenSize: activeCartItems[0]?.plan.screenSize || '55',
            playersCount: activeCartItems[0]?.plan.players || 1,
            cartItems: activeCartItems.map(item => ({
              planId: item.plan.id,
              name: item.plan.name,
              screenSize: item.plan.screenSize,
              playersCount: item.plan.players,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            }))
          }
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* RENDER ESPORTS TOURNAMENTS RESERVATIONS MODAL */}
      <PaymentModal
        isOpen={showTourneyPayment} 
        onClose={() => setShowTourneyPayment(false)}
        amount={200}
        itemName={selectedTournament?.name || "THE ALPHA ASPHALT LEGENDS CHAMPIONSHIP"}
        category="tournament"
        userName={tourneyName}
        userEmail={tourneyEmail}
        userMobile={tourneyMobile}
        userId={currentUser?.id || 'usr_' + Math.random().toString(36).substring(2, 9)}
        categoryDetails={{
          tournamentDetails: {
            tournamentId: selectedTournament?.id || 'tourney_asphalt',
            tournamentName: selectedTournament?.name || "THE ALPHA ASPHALT LEGENDS CHAMPIONSHIP",
            fullName: tourneyName,
            mobileNumber: tourneyMobile,
            email: tourneyEmail,
            age: parseInt(tourneyAge, 10) || 18,
            city: tourneyCity,
            gamingId: tourneyGamingId,
            entryFee: selectedTournament?.entryFee || 200,
            profileImageBase64: tourneyProfileBase64 || undefined
          }
        }}
        onPaymentSuccess={handleTourneyPaymentSuccess}
      />

      {/* ==========================================
          CINEMA VIDEOS HIGH DEFINITION LIGHTBOX MODAL
          ========================================== */}
      {cinemaVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 select-none animate-fade-in backdrop-blur-md">
          {/* Click background to close */}
          <div className="absolute inset-0 cursor-zoom-out" onClick={() => { if (cinemaVideoRef.current) cinemaVideoRef.current.pause(); setCinemaVideo(null); }} />

          <div className="relative max-w-4xl w-full bg-zinc-950 rounded-3xl border border-zinc-850 overflow-hidden z-10 flex flex-col shadow-2xl">
            {/* Header section with metadata & exit button */}
            <div className="p-4 bg-zinc-900 border-b border-zinc-850 flex justify-between items-center text-xxs font-mono text-zinc-400">
              <div className="space-y-0.5">
                <span className="text-[8px] text-red-500 uppercase font-bold tracking-widest block">🔒 CINEMA PLAYBACK IN PROGRESS</span>
                <h5 className="font-sans text-xs font-bold text-white uppercase">{cinemaVideo.title}</h5>
              </div>
              <button
                type="button"
                onClick={() => { if (cinemaVideoRef.current) cinemaVideoRef.current.pause(); setCinemaVideo(null); }}
                className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer hover:border-zinc-700 transition"
                title="Exit Cinema View"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Video element slot */}
            <div className="bg-black aspect-video flex items-center justify-center relative group">
              {getYoutubeId(cinemaVideo.videoUrl) ? (
                <iframe
                  src={getYoutubeEmbedUrl(cinemaVideo.videoUrl, true, cinemaMuted)}
                  className="w-full h-full border-0 bg-black animate-fade-in"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={cinemaVideo.title}
                />
              ) : (
                <video
                  ref={cinemaVideoRef}
                  id="cinema_hd_video_element"
                  src={cinemaVideo.videoUrl}
                  className="w-full h-full object-contain"
                  autoPlay
                  muted={cinemaMuted}
                  loop
                  playsInline
                  onTimeUpdate={() => {
                    if (cinemaVideoRef.current) {
                      setCinemaCurrentTime(cinemaVideoRef.current.currentTime);
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (cinemaVideoRef.current) {
                      setCinemaDuration(cinemaVideoRef.current.duration);
                      setCinemaPlaying(true);
                    }
                  }}
                  referrerPolicy="no-referrer"
                />
              )}

              {/* Autoplay / Load indicator badge */}
              <div className="absolute top-4 left-4 z-10 bg-black/85 text-[7.5px] font-mono border border-zinc-800 px-2 py-0.5 rounded tracking-widest text-emerald-400 uppercase font-semibold pointer-events-none">
                {cinemaPlaying ? 'Broadcasting Stream Active' : 'Broadcast Paused'}
              </div>
            </div>

            {/* Custom Cinema Control Hub */}
            {!getYoutubeId(cinemaVideo.videoUrl) && (
              <div className="p-4 bg-zinc-90 w-full flex flex-col gap-2.5 border-t border-zinc-900">
              {/* Timeline Seek bar */}
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono text-zinc-400">{formatTime(cinemaCurrentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={cinemaDuration || 100}
                  step="any"
                  value={cinemaCurrentTime}
                  onChange={(e) => handleCinemaSeekChange(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-zinc-850 rounded appearance-none cursor-pointer accent-red-500 hover:h-1.5 transition-all"
                />
                <span className="text-[8px] font-mono text-zinc-400">{formatTime(cinemaDuration)}</span>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCinemaPlayPause}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white hover:text-red-505 hover:bg-zinc-850 transition-all cursor-pointer"
                  >
                    {cinemaPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleCinemaMuteToggle}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-850 transition-all cursor-pointer"
                  >
                    {cinemaMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-450" />}
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step="0.05"
                    value={cinemaMuted ? 0 : cinemaVolume}
                    onChange={(e) => handleCinemaVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-zinc-805 rounded appearance-none cursor-pointer accent-white hidden sm:block"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[7.5px] font-mono text-zinc-550 border border-zinc-900 px-2 py-0.5 rounded uppercase font-bold tracking-widest bg-zinc-950">
                    High Fidelity Stream Loop
                  </span>
                  <button
                    type="button"
                    onClick={handleCinemaFullscreen}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white hover:text-red-405 hover:bg-zinc-850 transition-all cursor-pointer"
                    title="Fullscreen Mode"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

    </div>
  );
}
