import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  ArrowRight, 
  CheckCircle, 
  User, 
  Phone, 
  MapPin, 
  FileText,
  Lock,
  Calendar,
  Globe,
  UserPlus
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import { Booking, Seat } from '../types';

interface LibrarySectionProps {
  currentUser: any;
  onBookingSuccess: (booking: Booking) => void;
  onOpenDashboard: () => void;
  banners?: any[];
  masterCart?: any[];
  addToMasterCart?: (item: any) => void;
  removeFromMasterCart?: (itemId: string) => void;
  openCartDrawer?: () => void;
}

export default function LibrarySection({ 
  currentUser, 
  onBookingSuccess, 
  onOpenDashboard, 
  banners,
  masterCart,
  addToMasterCart,
  removeFromMasterCart,
  openCartDrawer
}: LibrarySectionProps) {
  // Banner transition slide state
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev >= banners.length - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [banners]);

  // Seats status
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatNumber, setSelectedSeatNumber] = useState<string>('');
  const [loadingSeats, setLoadingSeats] = useState<boolean>(true);
  
  // Registration credentials
  const [fullName, setFullName] = useState('');
  const [fathersName, setFathersName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [dob, setDob] = useState('');
  
  // Locker Configuration
  const [lockerType, setLockerType] = useState<'none' | 'small' | 'big'>('none');
  
  // Permanent Seat option
  const [isPermanent, setIsPermanent] = useState<boolean>(false);
  
  // Start date
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  
  // Settings from admin toggle
  const [chargeAdmissionFee, setChargeAdmissionFee] = useState<boolean>(true);
  const [userWantsAdmissionFee, setUserWantsAdmissionFee] = useState<boolean>(false);

  // File uploads
  const [photoName, setPhotoName] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');

  // Payment popup
  const [showPayment, setShowPayment] = useState(false);
  const [lastLibraryInvoice, setLastLibraryInvoice] = useState<Booking | null>(null);

  // Computed End Date (1 Month duration only!)
  const computeEndDate = () => {
    if (!startDate) return '';
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().substring(0, 10);
  };
  const computedEndDate = computeEndDate();

  // Dynamic live simple pricing calculation - No GST
  const libraryBaseFee = 899;
  const lockerBaseFee = lockerType === 'none' ? 0 : lockerType === 'small' ? 100 : 150;
  const registrationFee = (chargeAdmissionFee && userWantsAdmissionFee) ? 100 : 0;
  const permanentSeatFee = isPermanent ? 100 : 0;
  const grandTotalPrice = libraryBaseFee + registrationFee + lockerBaseFee + permanentSeatFee;

  // Fetch admin settings for admission charge
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
      console.error("Failed to load admin settings", e);
    }
  };

  // Fetch seats availability from Express backend state dynamically on load!
  const fetchLibrarySeats = async () => {
    try {
      setLoadingSeats(true);
      const res = await fetch('/api/library/seats');
      if (res.ok) {
        const data = await res.json();
        setSeats(data);
        // Find first available seat number to allocate
        const availableSeat = data.find((s: any) => !s.isBooked);
        if (availableSeat) {
          setSelectedSeatNumber(availableSeat.number);
        } else {
          setSelectedSeatNumber('Pending Allocation');
        }
      }
    } catch (e) {
      console.error("Failed to load live seat state", e);
    } finally {
      setLoadingSeats(false);
    }
  };

  useEffect(() => {
    fetchAdminSettings();
    fetchLibrarySeats();
  }, []);

  // Photo converter
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckoutTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeatNumber || selectedSeatNumber === 'Pending Allocation') {
      alert('All seats are currently occupied. Please contact library administration.');
      return;
    }
    if (!fathersName) {
      alert("Father's Name is mandatory for library registry registration.");
      return;
    }
    if (!aadhaarNumber || aadhaarNumber.length < 12) {
      alert('Please enter a valid 12-digit Aadhaar Number.');
      return;
    }
    if (!dob) {
      alert('Date of Birth is required for registration.');
      return;
    }
    
    if (addToMasterCart) {
      const libraryCartItem = {
        id: `library_membership_${selectedSeatNumber}`,
        category: 'library',
        name: `Library Seat: Desk ${selectedSeatNumber}`,
        price: grandTotalPrice,
        quantity: 1,
        details: {
          planId: 'library_monthly_pass',
          planName: 'Library Monthly Pass',
          seatNumber: selectedSeatNumber,
          fathersName,
          lockerType,
          isPermanent,
          startDate,
          endDate: computedEndDate,
          includeAdmissionFee: userWantsAdmissionFee,
          fullName,
          mobileNumber,
          email,
          address,
          aadhaarNumber,
          dob,
          photoBase64,
          photoName
        }
      };
      addToMasterCart(libraryCartItem);
      if (openCartDrawer) openCartDrawer();
    } else {
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = (booking: Booking) => {
    setShowPayment(false);
    setLastLibraryInvoice(booking);
    onBookingSuccess(booking);
    fetchLibrarySeats();
  };

  return (
    <div id="library_section_container" className="py-2.5 space-y-8">
      {/* LIBRARY SPECIFIC CAMPAIGN BANNERS */}
      <div id="library_section_banners_hub" className="relative w-full h-[180px] sm:h-[260px] border border-zinc-900 rounded-3xl overflow-hidden shadow-xl bg-zinc-950 animate-fade-in w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none"></div>
        {banners && banners.length > 0 ? (
          banners.map((b, idx) => (
            <div 
              key={b.id || idx} 
              className={`absolute inset-0 w-full h-full transition-all duration-700 ${
                idx === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'
              }`}
            >
              <img 
                src={`${b.imageUrl}${b.imageUrl.includes('?') ? '&' : '?'}v=${b.updatedAt ? encodeURIComponent(b.updatedAt) : Date.now()}`} 
                alt={b.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-4 left-6 z-20 text-left max-w-xl">
                {b.type && (
                  <span className="px-2 py-0.5 bg-amber-500 text-black text-[8px] font-mono font-bold rounded uppercase tracking-wider block w-fit mb-1 shadow font-mono">
                    {b.type.toUpperCase()} CAMPAIGN
                  </span>
                )}
                <h3 className="text-sm sm:text-base font-display font-black text-white uppercase tracking-wide">{b.title}</h3>
                {b.description && (
                  <p className="text-[10px] text-zinc-300 font-sans leading-relaxed line-clamp-2">
                    {b.description}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          // System fallback default study banner
          <div className="absolute inset-0 w-full h-full">
            <img 
              src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1200" 
              alt="Premium Library Cabinets" 
              className="w-full h-full object-cover opacity-30" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-4 left-6 z-20 text-left max-w-xl">
              <span className="px-2 py-0.5 bg-amber-500 text-black text-[8px] font-mono font-bold rounded uppercase tracking-wider block w-fit mb-1 shadow animate-pulse font-mono">
                PRIMARY PORTAL NOTICE
              </span>
              <h3 className="text-sm sm:text-base font-display font-black text-white uppercase tracking-wide">PREMIUM SILENT READING & CONDUCIVE STUDY ENVIRONMENT</h3>
              <p className="text-[10px] text-zinc-300 font-sans leading-relaxed font-light">
                Secure double-cabin personal reservation slots. Raw high-speed fiber channels & sound insulated environments calibrated for extreme exam preparations.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Description Headers */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full mb-1">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          THE ALPHA <span className="text-amber-400">LIBRARY</span>
        </h2>
        <div className="inline-flex flex-wrap justify-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xxs font-mono tracking-wider uppercase font-bold">
            <span>📞 Library Contact:</span>
            <a href="tel:7003008536" className="underline hover:text-white transition-colors">7003008536</a>
          </div>
        </div>
        <p className="text-xs text-zinc-400 font-sans tracking-wide leading-relaxed">
          Premium quiet study space with dedicated personal desks and lockable biometric storage units.
        </p>
      </div>

      {!lastLibraryInvoice ? (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* LIBRARY STATE / PRICE CARDS BLOCK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Main Plan Card */}
            <div className="p-5 rounded-2xl border border-amber-500/30 bg-zinc-950/60 space-y-1.5">
              <span className="text-[9px] font-mono uppercase bg-amber-400/10 text-amber-400 px-2.5 py-0.5 rounded border border-amber-300/10">Active Membership</span>
              <h3 className="text-base font-bold text-white font-display">Monthly Library Membership</h3>
              <p className="text-xxs text-zinc-500 leading-normal">Full 1-Month quiet retreat study access to premium resources.</p>
              <div className="pt-2 font-mono text-xl font-bold text-amber-400 font-bold">₹899 <span className="text-[10px] text-zinc-500 font-normal">/ month</span></div>
            </div>

            {/* Live Seat Allocation Panel - No Grid */}
            <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-3 text-center sm:text-left">
              <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">Seat Allocation Status</span>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-center">
                <div className="p-2 border border-zinc-900 bg-zinc-900/10 rounded-xl">
                  <span className="text-[8px] text-zinc-500 uppercase block leading-none mb-1">Total Seats</span>
                  <span className="text-xs font-bold text-white block">183</span>
                </div>
                <div className="p-2 border border-zinc-900 bg-zinc-900/15 rounded-xl">
                  <span className="text-[8px] text-amber-500 uppercase block leading-none mb-1 font-bold">Assigned Seat</span>
                  <span className={`text-xs font-bold block ${selectedSeatNumber === 'Pending Allocation' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedSeatNumber === 'Pending Allocation' ? 'N/A' : `Desk ${selectedSeatNumber}`}
                  </span>
                </div>
              </div>
              <p className="text-[9px] font-mono text-zinc-500 tracking-tight text-center leading-normal">
                Dispatched by library desk manager dynamically post-payment.
              </p>
            </div>
          </div>

          {/* FORM WRAPPER */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold text-center sm:text-left">
              Scholar Registry Validation Form
            </h3>

            <form id="lib_reg_form" onSubmit={handleCheckoutTrigger} className="bg-zinc-900/20 border border-zinc-900 p-6 sm:p-8 rounded-3xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block font-semibold">Student Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 py-1 text-zinc-500"><User className="w-4 h-4" /></span>
                    <input
                      id="lib_fullname_input"
                      type="text"
                      required
                      placeholder="Enter Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none pl-9 pr-3 py-2.5 text-xs text-white rounded-xl transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Father's Name */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block font-semibold">Father's / Guardian Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 py-1 text-zinc-500"><User className="w-4 h-4" /></span>
                    <input
                      id="lib_fathersname_input"
                      type="text"
                      required
                      placeholder="Enter Father's Name"
                      value={fathersName}
                      onChange={(e) => setFathersName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none pl-9 pr-3 py-2.5 text-xs text-white rounded-xl transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block font-semibold">Mobile Contact Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 py-1 text-zinc-500"><Phone className="w-4 h-4" /></span>
                    <input
                      id="lib_mobile_input"
                      type="tel"
                      required
                      placeholder="Enter Mobile Number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none pl-9 pr-3 py-2.5 text-xs text-white rounded-xl transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block font-semibold">Date of Birth (DOB)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 py-1 text-zinc-500"><Calendar className="w-4 h-4" /></span>
                    <input
                      id="lib_dob_input"
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none pl-9 pr-3 py-2.5 text-xs text-white rounded-xl transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Aadhaar Number */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block font-semibold">12-Digit Aadhaar ID Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 py-1 text-zinc-500"><FileText className="w-4 h-4" /></span>
                    <input
                      id="lib_aadhaarnum_input"
                      type="text"
                      required
                      maxLength={12}
                      pattern="\d{12}"
                      placeholder="Enter 12-Digit Aadhaar ID Number"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none pl-9 pr-3 py-2.5 text-xs text-white rounded-xl transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Postal Address */}
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block font-semibold">Present Address</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 py-1 text-zinc-500"><MapPin className="w-4 h-4" /></span>
                    <input
                      id="lib_address_input"
                      type="text"
                      required
                      placeholder="Enter Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none pl-9 pr-3 py-2.5 text-xs text-white rounded-xl transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Locker Selection */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block font-semibold font-sans">Biometric Locker Selection</label>
                  <select
                    id="lib_locker_select"
                    value={lockerType}
                    onChange={(e) => setLockerType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none px-3 py-2.5 text-xs text-white rounded-xl transition-all"
                  >
                    <option value="none">No Physical locker (₹0)</option>
                    <option value="small">Small Smart Locker (+₹100)</option>
                    <option value="big">Large Executive Locker (+₹150)</option>
                  </select>
                </div>

                {/* Membership Start date selection */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block font-semibold">Membership Activation Date</label>
                  <input
                    id="lib_startdate_input"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none px-3 py-2.5 text-xs text-white rounded-xl transition-all font-mono"
                  />
                </div>

                {/* Permanent seat Booking Option */}
                <div className="col-span-1 sm:col-span-2 bg-zinc-950/55 p-4 border border-zinc-900 rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-white">Permanent Seat Booking option</p>
                    <p className="text-[9px] text-zinc-550 leading-tight">Secure the exact same desk layout permanently for a flat ₹100 reservation fee.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      id="lib_permanent_seat_checkbox"
                      type="checkbox"
                      checked={isPermanent}
                      onChange={(e) => setIsPermanent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-black peer-checked:bg-amber-400"></div>
                  </label>
                </div>

                {/* Optional Admission Fee Option */}
                {chargeAdmissionFee && (
                  <div className="col-span-1 sm:col-span-2 bg-zinc-950/55 p-4 border border-zinc-900 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-white">☐ Add One-Time Admission Fee (+₹100)</p>
                      <p className="text-[9px] text-zinc-500 leading-tight">Apply optional one-time library registry validation & enrollment fee.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        id="lib_admission_fee_checkbox"
                        type="checkbox"
                        checked={userWantsAdmissionFee}
                        onChange={(e) => setUserWantsAdmissionFee(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-black peer-checked:bg-amber-400"></div>
                    </label>
                  </div>
                )}

                {/* Photo upload */}
                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block font-semibold">Candidate Photo Upload</label>
                  <div className="border border-dashed border-zinc-800 rounded-xl p-4 bg-zinc-950/40 hover:border-zinc-700 transition-colors flex flex-col items-center justify-center text-center min-h-[100px] relative">
                    {photoBase64 ? (
                      <div className="space-y-2 flex flex-col items-center">
                        <img 
                          referrerPolicy="no-referrer"
                          src={photoBase64} 
                          alt="Student preview" 
                          className="w-14 h-14 rounded-full object-cover border border-amber-500/30"
                        />
                        <p className="text-[10px] text-emerald-400 font-mono">Photo secured.</p>
                        <button 
                          type="button" 
                          onClick={() => { setPhotoName(''); setPhotoBase64(''); }} 
                          className="text-[9px] text-red-400 hover:underline cursor-pointer"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center">
                        <UserPlus className="w-6 h-6 text-zinc-550 mb-1" />
                        <span className="text-[11px] font-semibold text-zinc-400">Attach headshot photo</span>
                        <input 
                          id="photo_upload_hidden_input"
                          type="file" 
                          required
                          accept="image/*"
                          onChange={handlePhotoFileChange}
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Pre-billing summary - NO TAXES */}
                <div className="col-span-1 sm:col-span-2 pt-4 border-t border-zinc-900 mt-2">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2 font-mono">
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-none mb-1">Fee Settlement Check</p>
                    <ul className="text-xxs space-y-1.5 text-zinc-400">
                      <li className="flex justify-between">
                        <span>Monthly Library Fee:</span>
                        <span className="text-white">₹{libraryBaseFee}</span>
                      </li>
                      {chargeAdmissionFee && userWantsAdmissionFee && (
                        <li className="flex justify-between text-zinc-400">
                          <span>One-time Admission Fee:</span>
                          <span className="text-white">₹100</span>
                        </li>
                      )}
                      {lockerType !== 'none' && (
                        <li className="flex justify-between text-amber-500/85">
                          <span>Option Smart Locker ({lockerType === 'small' ? 'Small' : 'Big'}):</span>
                          <span>+₹{lockerBaseFee}</span>
                        </li>
                      )}
                      {isPermanent && (
                        <li className="flex justify-between text-amber-500/84">
                          <span>Permanent Desk Booking Charge:</span>
                          <span>+₹100</span>
                        </li>
                      )}
                      <li className="flex justify-between border-t border-zinc-900 pt-2 text-xs font-bold text-amber-400 font-sans">
                        <span>Total Payable (All-Inclusive Final Price):</span>
                        <span className="text-amber-400 font-mono font-bold">₹{grandTotalPrice}</span>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>

              <div className="pt-2">
                <button
                  id="lib_submit_booking"
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-black font-semibold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{addToMasterCart ? "Add Library Seat to Cart" : `Reserve & pay ₹${grandTotalPrice}`}</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* CONFIRMATION BLOCK */
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto border border-zinc-850 bg-zinc-950/80 rounded-3xl p-6 sm:p-10 space-y-6 text-center shadow-2xl"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-2xl font-bold text-white tracking-tight">LIBRARY SEAT RESERVED</h3>
            <p className="text-xs text-amber-500 font-mono tracking-widest uppercase">
              Invoice Reference: {lastLibraryInvoice.invoiceNumber}
            </p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed pt-2">
              Desk **{lastLibraryInvoice.libraryDetails?.seatNumber}** has been securely locked for your academic study.
            </p>
          </div>

          <div className="p-4 border border-zinc-900 bg-zinc-900/10 rounded-2xl text-left font-mono text-xxs text-zinc-400 space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-500">Student Name</span>
              <span className="text-white font-sans font-medium">{lastLibraryInvoice.userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Reserved Desk</span>
              <span className="text-emerald-400 font-bold">Desk {lastLibraryInvoice.libraryDetails?.seatNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Membership Valid</span>
              <span className="text-zinc-300 font-mono">{lastLibraryInvoice.startDate} to {lastLibraryInvoice.endDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Total Paid Amount</span>
              <span className="text-white font-mono">₹{lastLibraryInvoice.totalAmount}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              id="lib_done_to_dashboard"
              onClick={onOpenDashboard}
              className="px-6 py-3 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Examine Pass in Dashboard
            </button>
            <button
              id="lib_done_dismiss"
              onClick={() => setLastLibraryInvoice(null)}
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 font-medium rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              New Booking Section
            </button>
          </div>
        </motion.div>
      )}

      {/* PAYMENT WINDOW */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={grandTotalPrice}
        itemName={`Desk ${selectedSeatNumber} Booking`}
        category="library"
        userName={fullName}
        userEmail={currentUser?.email || `${fullName.replace(/\s+/g, '')}@gmail.com`}
        userMobile={mobileNumber}
        userId={currentUser?.id || 'usr_' + Math.random().toString(36).substring(2, 9)}
        categoryDetails={{
          libraryDetails: {
            seatNumber: selectedSeatNumber,
            idProofName: 'Aadhaar Verification Approved',
            fathersName,
            address,
            aadhaarNumber,
            dob,
            isPermanent,
            lockerType,
            startDate,
            endDate: computedEndDate,
            photoBase64,
            aadhaarBase64: 'Verified ID Uploaded',
            includeAdmissionFee: userWantsAdmissionFee
          }
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
