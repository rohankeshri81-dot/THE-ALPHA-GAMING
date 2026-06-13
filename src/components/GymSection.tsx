import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Dumbbell, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  HeartHandshake, 
  AlertCircle,
  QrCode,
  Upload,
  X as CloseIcon
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import { Booking } from '../types';

interface GymSectionProps {
  currentUser: any;
  onBookingSuccess: (booking: Booking) => void;
  onOpenDashboard: () => void;
  banners?: any[];
  masterCart?: any[];
  addToMasterCart?: (item: any) => void;
  removeFromMasterCart?: (itemId: string) => void;
  openCartDrawer?: () => void;
}

const MALE_PLANS = [
  { id: 'gym_male_1m', name: '1 Month Membership', duration: '1 Month', price: 1500, description: 'Cardio, strength & conditioning equipment. Inclusive of lockroom amenities.' },
  { id: 'gym_male_3m', name: '3 Months Membership', duration: '3 Months', price: 4000, description: 'Cardio, strength, elite biomechanics &steam bath guidance.' },
  { id: 'gym_male_6m', name: '6 Months Membership', duration: '6 Months', price: 7200, description: 'Full access + specialized personal evaluation sessions.' },
  { id: 'gym_male_12m', name: '12 Months Membership', duration: '12 Months', price: 13000, description: 'VIP Alpha status, kit bag & veteran physical trainer consults.' },
];

const FEMALE_PLANS = [
  { id: 'gym_female_1m', name: '1 Month Membership', duration: '1 Month', price: 1250, description: 'Cardio, strength & conditioning equipment. Inclusive of lockroom amenities.' },
  { id: 'gym_female_3m', name: '3 Months Membership', duration: '3 Months', price: 3500, description: 'Cardio, strength, elite biomechanics &steam bath guidance.' },
  { id: 'gym_female_6m', name: '6 Months Membership', duration: '6 Months', price: 6500, description: 'Full access + specialized personal evaluation sessions.' },
  { id: 'gym_female_12m', name: '12 Months Membership', duration: '12 Months', price: 12000, description: 'VIP Alpha status, kit bag & veteran physical trainer consults.' },
];

export default function GymSection({ 
  currentUser, 
  onBookingSuccess, 
  onOpenDashboard, 
  banners,
  masterCart,
  addToMasterCart,
  removeFromMasterCart,
  openCartDrawer
}: GymSectionProps) {
  // Configured gender choice first
  const [gender, setGender] = useState<string>('Male');
  
  // Membership plan index
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);

  // Optional One-time Registration Fee (+₹100)
  const [includeRegistrationFee, setIncludeRegistrationFee] = useState<boolean>(false);
  
  // Registration Form Fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Photo uploads
  const [photoName, setPhotoName] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string>('');

  // Payment popup state
  const [showPayment, setShowPayment] = useState(false);
  const [lastBookingInvoice, setLastBookingInvoice] = useState<Booking | null>(null);

  // Determine current active plans and details based on chosen gender
  const activePlans = gender === 'Female' ? FEMALE_PLANS : MALE_PLANS;
  const selectedPlan = activePlans[selectedPlanIndex] || activePlans[0];

  // Price calculations
  const basePlanPrice = selectedPlan.price;
  const registrationFee = includeRegistrationFee ? 100 : 0;
  const finalPayableAmount = basePlanPrice + registrationFee;

  // Support photo image loading
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!fullName || !mobileNumber || !email || !emergencyContact) {
      alert('Please complete all registration fields including emergency contacts.');
      return;
    }
    
    if (addToMasterCart) {
      const gymCartItem = {
        id: `gym_membership_${gender.toLowerCase()}_${selectedPlan.id}`,
        category: 'gym',
        name: `Gym Membership: ${selectedPlan.name} (${gender})`,
        price: finalPayableAmount,
        quantity: 1,
        details: {
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          gender: gender,
          includeRegistrationFee: includeRegistrationFee,
          fullName,
          mobileNumber,
          email,
          address,
          dob,
          age,
          emergencyContact,
          photoBase64,
          photoName
        }
      };
      addToMasterCart(gymCartItem);
      if (openCartDrawer) openCartDrawer();
    } else {
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = (booking: Booking) => {
    setShowPayment(false);
    setLastBookingInvoice(booking);
    onBookingSuccess(booking);
  };

  return (
    <div id="gym_section_container" className="py-2.5 space-y-12">
      {/* GYM SPECIFIC CAMPAIGN BANNERS */}
      {banners && banners.length > 0 && (
        <div className="relative w-full h-[180px] sm:h-[260px] border border-zinc-900 rounded-3xl overflow-hidden shadow-xl bg-zinc-950 animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none"></div>
          {banners.map((b, i) => {
            return (
              <div key={b.id || i} className="absolute inset-0 w-full h-full">
                <img 
                  src={b.imageUrl} 
                  alt={b.title} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-4 left-6 z-20 text-left max-w-xl">
                  {b.type && (
                    <span className="px-2 py-0.5 bg-amber-500 text-black text-[8px] font-mono font-bold rounded uppercase tracking-wider block w-fit mb-1 shadow">
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
            );
          })}
        </div>
      )}

      {/* Visual Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 animate-fade-in">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full mb-2">
          <Dumbbell className="w-6 h-6" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          THE ALPHA <span className="text-amber-400">GYM</span>
        </h2>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xxs font-mono tracking-wider uppercase font-bold">
          <span>📞 Gym Contact:</span>
          <a href="tel:7003008536" className="underline hover:text-white transition-colors">7003008536</a>
        </div>
        <p className="text-xs text-zinc-400 font-sans tracking-wide leading-relaxed">
          Unlock your extreme human physical limits at our state-of-the-art training colosseum. Heavy weights, veteran coaching panels, advanced biomechanics testing, and elite recovery.
        </p>
      </div>

      {!lastBookingInvoice ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* STEP 1: PLANS SELECTOR */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Gender Selection Panel */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">
                Step 1: Select Gender First
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="gym_gender_male_btn"
                  type="button"
                  onClick={() => {
                    setGender('Male');
                    // Retain index safely
                  }}
                  className={`py-3 px-4 rounded-xl text-center font-display font-medium text-xs tracking-wider uppercase border transition-all ${
                    gender === 'Male'
                      ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-md shadow-amber-950/20'
                      : 'bg-zinc-900/40 text-zinc-400 border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  Male
                </button>
                <button
                  id="gym_gender_female_btn"
                  type="button"
                  onClick={() => {
                    setGender('Female');
                  }}
                  className={`py-3 px-4 rounded-xl text-center font-display font-medium text-xs tracking-wider uppercase border transition-all ${
                    gender === 'Female'
                      ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-md shadow-amber-950/20'
                      : 'bg-zinc-900/40 text-zinc-400 border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Configured Membership Plans */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1 gap-2 flex-wrap">
                <h3 className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">
                  Step 2: Choose Membership Plan ({gender})
                </h3>
                <a href="tel:7003008536" className="text-[10px] font-mono text-zinc-500 hover:text-amber-400 font-semibold transition-colors">📞 Help: 7003008536</a>
              </div>

              <div className="space-y-3">
                {activePlans.map((plan, idx) => {
                  const isSelected = selectedPlanIndex === idx;
                  return (
                    <button
                      id={`gym_plan_btn_${plan.id}`}
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanIndex(idx)}
                      className={`w-full text-left p-4.5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between h-36 ${
                        isSelected 
                          ? 'bg-zinc-950 border-amber-500 shadow-lg shadow-yellow-950/20' 
                          : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute right-0 top-0 bg-gradient-to-l from-amber-500 to-yellow-600 text-black text-[9px] font-mono font-bold tracking-widest py-1 px-4 uppercase rounded-bl-xl">
                          Selected
                        </div>
                      )}
                      <div>
                        <p className="text-[9px] font-mono tracking-widest text-amber-500 uppercase mb-1">
                          {plan.duration} Subscription
                        </p>
                        <h4 className="font-display font-bold text-white text-sm.5 leading-snug">{plan.name}</h4>
                        <p className="text-xxs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">{plan.description}</p>
                      </div>
                      
                      <div className="flex items-baseline space-x-1.5 mt-auto">
                        <span className="text-lg font-mono font-bold text-white">₹{plan.price.toLocaleString()}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">/ final price</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OPTIONAL ADD-ON */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-3.5">
              <h4 className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">
                Step 3: Optional Add-on
              </h4>
              
              <label 
                id="gym_addon_reg_label"
                className="flex items-start gap-4 p-3 border border-zinc-900 rounded-xl bg-zinc-900/20 cursor-pointer select-none hover:border-zinc-800 transition-colors"
              >
                <input
                  id="gym_registration_fee_checkbox"
                  type="checkbox"
                  checked={includeRegistrationFee}
                  onChange={(e) => setIncludeRegistrationFee(e.target.checked)}
                  className="mt-1.5 h-4 w-4 rounded border-zinc-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-black bg-zinc-950 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-semibold text-white">
                    One-Time Registration Fee (+₹100)
                  </p>
                  <p className="text-xxs text-zinc-500 leading-normal mt-0.5">
                    Completely optional add-on that gets verified at registration. Default is unchecked.
                  </p>
                </div>
              </label>
            </div>

            {/* REAL-TIME CALCULATION PANEL */}
            <div className="p-5 border border-zinc-800 bg-zinc-950/60 rounded-3xl space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">
                Grand Total Summary
              </h4>

              <div className="space-y-2 text-xs font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span>{selectedPlan.name} ({gender})</span>
                  <span className="text-white">₹{basePlanPrice.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between border-b border-zinc-900 pb-2.5">
                  <span>Registration Add-on</span>
                  <span className={includeRegistrationFee ? "text-white" : "text-zinc-600"}>
                    {includeRegistrationFee ? "₹100" : "—"}
                  </span>
                </div>

                <div className="flex justify-between font-display text-sm font-semibold pt-1">
                  <span className="text-amber-500">Payable Amount</span>
                  <span className="text-amber-500 text-base font-mono">₹{finalPayableAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg text-center">
                <p className="text-[10px] font-mono text-zinc-500 leading-normal uppercase tracking-wider">
                  No GST, CGST, SGST, or additional taxes charged
                </p>
              </div>
            </div>

          </div>

          {/* STEP 2: REGISTRATION FORM */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <h3 className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">
                Step 4: Athlete Registry & Credentials
              </h3>
              <a href="tel:7003008536" className="text-[10px] font-mono text-zinc-500 hover:text-amber-450 font-bold transition-all">📞 Gym Contact: 7003008536</a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Form Input Columns */}
              <form id="gym_reg_form" onSubmit={handleCheckoutTrigger} className="md:col-span-7 bg-zinc-900/20 border border-zinc-900 p-6 sm:p-7 rounded-3xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Full Name */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block">Full Name</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-zinc-500"><User className="w-4 h-4" /></span>
                      <input
                        id="gym_fullname_input"
                        type="text"
                        required
                        placeholder="Enter Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none pl-9 pr-3 py-2.5 text-xs text-white rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1.5">
                    <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block">Mobile Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-zinc-500"><Phone className="w-4 h-4" /></span>
                      <input
                        id="gym_mobile_input"
                        type="tel"
                        required
                        placeholder="Enter Mobile Number"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none pl-9 pr-3 py-2.5 text-xs text-white rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block">Email Address</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-zinc-500"><Mail className="w-4 h-4" /></span>
                      <input
                        id="gym_email_input"
                        type="email"
                        required
                        placeholder="Enter Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none pl-9 pr-3 py-2.5 text-xs text-white rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  {/* Postal Address */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block">Postal Address</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-zinc-500"><MapPin className="w-4 h-4" /></span>
                      <input
                        id="gym_address_input"
                        type="text"
                        placeholder="Enter Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none pl-9 pr-3 py-2.5 text-xs text-white rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5 h-16">
                    <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block">Date of Birth</label>
                    <input
                      id="gym_dob_input"
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => {
                        setDob(e.target.value);
                        if (e.target.value) {
                          const birthYear = new Date(e.target.value).getFullYear();
                          const currentYear = new Date().getFullYear();
                          setAge((currentYear - birthYear).toString());
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none px-3 py-2 text-xs text-white rounded-xl transition-all font-mono"
                    />
                  </div>

                  {/* Age & Gender Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block">Age</label>
                      <input
                        id="gym_age_input"
                        type="number"
                        placeholder="26"
                        required
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none px-3 py-2 text-xs text-white rounded-xl transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block">Gender</label>
                      <select
                        id="gym_gender_select"
                        value={gender}
                        onChange={(e) => {
                          setGender(e.target.value);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none px-2 py-2 text-xs text-white rounded-xl transition-all focus:ring-1 focus:ring-amber-500"
                      >
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block">Emergency Contact Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-zinc-500"><HeartHandshake className="w-4 h-4" /></span>
                      <input
                        id="gym_emergency_input"
                        type="tel"
                        required
                        placeholder="Emergency contact mobile"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 focus:outline-none pl-9 pr-3 py-2.5 text-xs text-white rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  {/* Candidate Photo Upload */}
                  <div className="col-span-2 space-y-1.5 pt-1.5">
                    <label className="text-xxs font-mono text-zinc-400 uppercase tracking-wider block">Candidate Photo Upload</label>
                    <div className="border border-dashed border-zinc-800 rounded-xl p-4 bg-zinc-950/40 hover:border-zinc-700 transition-colors flex flex-col items-center justify-center text-center min-h-[96px] relative">
                      {photoBase64 ? (
                        <div className="space-y-2 flex flex-col items-center">
                          <img 
                            referrerPolicy="no-referrer"
                            src={photoBase64} 
                            alt="Athlete preview" 
                            className="w-12 h-12 rounded-full object-cover border border-amber-500/30"
                          />
                          <p className="text-[10px] text-emerald-400 font-mono">Athlete Photo secured.</p>
                          <button 
                            id="gym_photo_clear_btn"
                            type="button" 
                            onClick={() => { setPhotoName(''); setPhotoBase64(''); }} 
                            className="text-[9px] text-red-400 hover:underline cursor-pointer"
                          >
                            Remove and re-upload
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="w-5 h-5 text-zinc-500 mx-auto mb-1" />
                          <label className="cursor-pointer text-[11px] text-amber-500 hover:underline">
                            Click to browse photo file
                            <input 
                              id="gym_photo_file_input"
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handlePhotoUpload}
                            />
                          </label>
                          <p className="text-[9px] text-zinc-500">Supports JPEG, PNG up to 2MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="pt-4">
                  <button
                    id="gym_submit_booking"
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-black font-semibold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>{addToMasterCart ? "Add Gym Membership to Cart" : "Proceed to Secure Gateway"}</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </button>
                </div>
              </form>

              {/* CARD PREVIEW COLUMN */}
              <div className="md:col-span-5 space-y-6">
                <p className="text-xxs font-mono uppercase text-zinc-500 tracking-wider">Dynamic Membership Pass HUD</p>
                
                {/* Visual Golden Metal Card */}
                <div className="w-full min-h-[224px] bg-gradient-to-br from-zinc-900 via-stone-900 to-black border border-amber-500/30 p-5 rounded-2xl relative overflow-hidden shadow-xl flex flex-col justify-between max-w-sm mx-auto">
                  {/* Subtle Background pattern overlay */}
                  <div className="absolute inset-x-0 bottom-0 top-0 opacity-5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start z-10">
                    <div>
                      <p className="font-display font-bold text-white tracking-widest text-[9.5px] uppercase leading-none">THE ALPHA GYM</p>
                      <p className="text-[6px] font-mono text-amber-500 tracking-widest uppercase">Elite Athlete Signature Pass</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <QrCode className="w-7.5 h-7.5 text-amber-500/70 border border-amber-500/20 p-0.5 rounded" />
                      <p className="text-[5px] font-mono text-zinc-500 mt-1 uppercase">CODE: REG_NEW</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 z-10 my-1">
                    {/* Metal Chip Plate */}
                    <div className="w-7 h-5 bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-500 rounded-md ring-1 ring-amber-400/20 opacity-90 flex-shrink-0"></div>
                    
                    {/* Inline uploaded photo badge inside card for extreme details! */}
                    {photoBase64 && (
                      <div className="w-9 h-9 border border-amber-500/40 rounded-full overflow-hidden flex-shrink-0 bg-neutral-900 shadow">
                        <img referrerPolicy="no-referrer" src={photoBase64} alt="Pass thumbnail" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="z-10 mt-auto">
                    <p className="text-[7px] font-mono uppercase tracking-widest text-zinc-500">Athlete Registry</p>
                    <p className="text-xs.5 font-semibold tracking-wide text-white capitalize truncate max-w-[190px]">
                      {fullName || 'REGISTERING ATHLETE'}
                    </p>
                    
                    <div className="flex justify-between items-end mt-2 border-t border-zinc-900/80 pt-2 font-mono">
                      <div>
                        <p className="text-[6px] text-zinc-500 uppercase">Emergency Code</p>
                        <p className="text-[8px] text-zinc-300 font-bold tracking-tight">
                          {emergencyContact || 'PENDING'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[6px] text-zinc-500 uppercase font-mono">Plan Code</p>
                        <p className="text-[8px] text-amber-500 font-semibold uppercase font-mono">
                          {selectedPlan.name.split(' ')[0]} / {selectedPlan.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-zinc-900 bg-zinc-950/40 rounded-xl space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-semibold text-white">No-GST Premium Sports Registry</h5>
                      <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5 font-sans">
                        As an individual sports, fitness, and conditioning registration node, we do not charge local Taxes or any GST. Real-time printable membership invoice receipts will be made available in your dashboard instantly after secure payment verification.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      ) : (
        /* CONFIRMATION SECTION */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto border border-zinc-800 bg-zinc-950/70 rounded-3xl p-6 sm:p-10 space-y-6 text-center shadow-2xl"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-2xl font-bold text-white tracking-tight">MEMBERSHIP CONFIRMED</h3>
            <p className="text-xs text-zinc-400 uppercase font-mono tracking-widest text-amber-400">
              Invoice Node: {lastBookingInvoice.invoiceNumber}
            </p>
            <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed pt-2">
              Welcome to **THE ALPHA GYM**. An email invoice confirmation has been dispatched to **{lastBookingInvoice.userEmail}** with a 2D biometric pass QR Code.
            </p>
          </div>

          <div className="p-5 border border-zinc-900 bg-zinc-900/20 rounded-2xl grid grid-cols-2 gap-4 text-left font-mono text-xs text-zinc-400">
            <div>
              <p className="text-zinc-500 text-xxs">Customer Name</p>
              <p className="text-white font-sans font-medium">{lastBookingInvoice.userName}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xxs">Plan Selected</p>
              <p className="text-amber-400 font-sans font-semibold">{lastBookingInvoice.planName}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xxs">Start Date</p>
              <p className="text-white">{lastBookingInvoice.startDate}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xxs">Expiry Date</p>
              <p className="text-white">{lastBookingInvoice.endDate}</p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              id="gym_done_to_dashboard"
              onClick={onOpenDashboard}
              className="px-6 py-3 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Configure ID in Member Dashboard
            </button>
            <button
              id="gym_done_dismiss"
              onClick={() => setLastBookingInvoice(null)}
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Add Another Booking
            </button>
          </div>
        </motion.div>
      )}

      {/* SECURED PAYMENT GATEWAY TRIGGER */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={finalPayableAmount}
        itemName={`${selectedPlan.name} (${gender})${includeRegistrationFee ? ' + Registration Fee' : ''}`}
        category="gym"
        userName={fullName}
        userEmail={email}
        userMobile={mobileNumber}
        userId={currentUser?.id || 'usr_' + Math.random().toString(36).substring(2, 9)}
        categoryDetails={{
          gymDetails: {
            dob,
            emergencyContact,
            gender,
            photoBase64,
            includeAdmissionFee: includeRegistrationFee,
          }
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
