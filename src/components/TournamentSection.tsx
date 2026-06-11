import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  QrCode, 
  BookOpen, 
  Printer, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Clock,
  Briefcase,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import { Booking } from '../types';

interface TournamentSectionProps {
  currentUser: any;
  onBookingSuccess: (booking: Booking) => void;
  onOpenDashboard: () => void;
}

export default function TournamentSection({
  currentUser,
  onBookingSuccess,
  onOpenDashboard
}: TournamentSectionProps) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('');
  const [gamingId, setGamingId] = useState('');
  const [profileBase64, setProfileBase64] = useState('');
  const [isRegDragOver, setIsRegDragOver] = useState(false);

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRegDragOver(true);
  };

  const handleRegDragLeave = () => {
    setIsRegDragOver(false);
  };

  const handleRegDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRegDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Payment states
  const [showPayment, setShowPayment] = useState(false);
  const [lastTicket, setLastTicket] = useState<Booking | null>(null);

  // Fetch dynamic tournaments list
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tournaments');
      if (res.ok) {
        const data = await res.json();
        const asphaltOnly = (data || []).filter((t: any) => t.game === 'Asphalt Legends');
        setTournaments(asphaltOnly);
        const asphalt = asphaltOnly.find((t: any) => t.id === 'asphalt_2026') || asphaltOnly[0];
        if (asphalt) {
          setSelectedTournament(asphalt);
        }
      }
    } catch (e) {
      console.error("Failed to load tournaments list.", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleRegisterTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    if (selectedTournament.status === 'closed') {
      alert("Registration is currently closed for this tournament.");
      return;
    }
    if (!fullName || !mobileNumber || !dob || !city) {
      alert("Please fill in all mandatory fields.");
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = (booking: Booking) => {
    setShowPayment(false);
    setLastTicket(booking);
    onBookingSuccess(booking);
  };

  const handlePrint = () => {
    window.print();
  };

  // Pre-compiled list of official Terms & Conditions from reference poster
  const termsAndConditions = [
    { num: '01', text: 'Registration Fee: ₹200 per participant.' },
    { num: '02', text: 'Registration is mandatory for participation.' },
    { num: '03', text: 'Registration will commence on 10-06-2026.' },
    { num: '04', text: 'Registration will close on 30-06-2026 or once all available seats are filled, whichever is earlier.' },
    { num: '05', text: 'Only registered participants will be allowed to compete.' },
    { num: '06', text: 'Participants must report as per the schedule communicated by the organizers.' },
    { num: '07', text: 'Registration fee is non-refundable.' },
    { num: '08', text: 'Participants must physically participate in the tournament to avail any participant benefits or special offers.' },
    { num: '09', text: 'Participant benefits and offers are non-transferable.' },
    { num: '10', text: 'Two offers cannot be clubbed.' },
    { num: '11', text: 'Any misconduct, cheating, use of unfair means, or unsportsmanlike behavior may lead to immediate disqualification.' },
    { num: '12', text: 'The organizers reserve the right to amend the tournament format, schedule, or rules if required.' },
    { num: '13', text: 'The decision of the organizers shall be final and binding in all matters relating to the tournament.' }
  ];

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <Trophy className="w-12 h-12 text-amber-500 animate-bounce mx-auto" />
        <p className="font-mono text-zinc-500 text-xs">COMMUNICATION CORES ACQUIRING TOURNAMENT INTENSITY...</p>
      </div>
    );
  }

  return (
    <div id="tournament_page_container" className="py-2.5 max-w-7xl mx-auto space-y-12 block">
      
      {/* OTHER TOURNAMENTS SELECT TAB */}
      {tournaments.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto justify-center pb-2 border-b border-zinc-900 scrollbar-none select-none">
          {tournaments.map(t => (
            <button
              key={t.id}
              onClick={() => { setSelectedTournament(t); setLastTicket(null); }}
              className={`px-4 py-2 rounded-xl text-xxs font-mono uppercase tracking-widest transition-all cursor-pointer border ${
                selectedTournament?.id === t.id
                  ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md shadow-amber-500/10'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
              }`}
            >
              🏁 {t.game}
            </button>
          ))}
        </div>
      )}

      {selectedTournament && !lastTicket && (
        <div className="space-y-10">
          
          {/* TOURNAMENT BANNER DISPLAY AT TOP */}
          <div className="relative rounded-3xl overflow-hidden border border-zinc-900 bg-zinc-950/40 shadow-2xl">
            <div className="h-64 sm:h-96 w-full relative">
              <img
                src={selectedTournament.bannerUrl}
                alt={selectedTournament.name}
                className="w-full h-full object-cover filter brightness-75"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-left">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-[#000000] bg-amber-400 px-3 py-1 rounded-full uppercase border border-amber-300">
                    {selectedTournament.game} PS5 TOURNAMENT
                  </span>
                  <span className="text-[9px] font-mono font-semibold tracking-widest bg-zinc-950/85 text-zinc-350 px-2.5 py-1 rounded-full border border-zinc-900 uppercase flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedTournament.status === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                    REGISTRATION {selectedTournament.status === 'open' ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <h1 className="font-display text-2xl sm:text-4xl font-black text-[#fafafa] tracking-tight uppercase leading-tight max-w-4xl">
                  {selectedTournament.name}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl mt-2 font-light leading-relaxed">
                  {selectedTournament.description}
                </p>
                <div className="flex items-center gap-6 mt-6 pt-6 border-t border-zinc-900/60 font-mono text-xxs tracking-wider uppercase text-zinc-400">
                  <div>
                    <span className="text-zinc-650 block text-[9px]">REGISTRATION FEE</span>
                    <span className="text-sm rounded text-amber-400 font-extrabold font-mono">₹{selectedTournament.entryFee} ONLY</span>
                  </div>
                  <div>
                    <span className="text-zinc-650 block text-[9px]">CO-ORDINATOR</span>
                    <span className="text-white">THE ALPHA GAMING & CAFE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
            
            {/* REGISTRATION FORM (span 7) */}
            <div className="lg:col-span-7 bg-zinc-950/40 border border-zinc-900 p-6 sm:p-8 rounded-3xl space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
                <div>
                  <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest block">SECURE REGISTRATION VAULT</span>
                  <p className="font-display text-lg font-bold text-white uppercase mt-1">PARTICIPANT PROFILE DETAILED SHEET</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-zinc-500">PAYABLE NOW</span>
                  <p className="font-mono text-lg font-black text-amber-400 leading-none">₹{selectedTournament.entryFee}</p>
                </div>
              </div>

              {selectedTournament.status === 'closed' ? (
                <div className="p-8 border border-red-950 bg-red-950/10 rounded-2xl text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                  <h4 className="font-display font-bold text-red-400 uppercase text-sm tracking-wider">REGISTRATION CLOSED</h4>
                  <p className="text-xs text-zinc-400 font-light max-w-md mx-auto">
                    The registration threshold for this event has been fulfilled, or the timer has expired. Keep check on future tournaments in the panel!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegisterTrigger} className="space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input
                          id="tournament_reg_name"
                          type="text"
                          required
                          placeholder="ENTER FULL LEGAL NAME"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-black border border-zinc-900 hover:border-zinc-800 focus:border-amber-500 focus:outline-none text-white rounded-xl text-xs transition-colors uppercase font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">Mobile Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input
                          id="tournament_reg_mobile"
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="10-DIGIT MOBILE NUMBER"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full pl-11 pr-4 py-3 bg-black border border-zinc-900 hover:border-zinc-800 focus:border-amber-500 focus:outline-none text-white rounded-xl text-xs font-mono transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">Date of Birth *</label>
                      <input
                        id="tournament_reg_dob"
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-4 py-3 bg-black border border-zinc-900 hover:border-zinc-800 focus:border-amber-500 focus:outline-none text-white rounded-xl text-xs font-mono transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">City *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input
                          id="tournament_reg_city"
                          type="text"
                          required
                          placeholder="E.G. PURNEA"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-black border border-zinc-900 hover:border-zinc-800 focus:border-amber-500 focus:outline-none text-white rounded-xl text-xs transition-colors uppercase font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Participant/Gamer Image Upload Zone */}
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">Gamer Profile Photo / ID Document (Optional)</label>
                    <div
                      onDragOver={handleRegDragOver}
                      onDragLeave={handleRegDragLeave}
                      onDrop={handleRegDrop}
                      className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                        isRegDragOver 
                          ? 'border-amber-500 bg-amber-500/5' 
                          : profileBase64
                            ? 'border-zinc-805 bg-zinc-900/10'
                            : 'border-zinc-900 bg-black hover:border-zinc-850'
                      }`}
                    >
                      <input
                        id="tournament_reg_photo"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleProfileFileChange}
                        className="hidden"
                      />
                      <label htmlFor="tournament_reg_photo" className="cursor-pointer space-y-1.5 block">
                        {profileBase64 ? (
                          <div className="flex items-center justify-center gap-4">
                            <img
                              src={profileBase64}
                              alt="Avatar Preview"
                              className="w-12 h-12 object-cover rounded-lg border border-zinc-800"
                              referrerPolicy="no-referrer"
                            />
                            <div className="text-left font-mono">
                              <p className="text-amber-500 font-bold text-[10px] tracking-wider uppercase">PROFILE PHOTO ATTACHED</p>
                              <p className="text-[9px] text-zinc-550 uppercase">Drag-and-Drop or click to change</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 font-mono">
                            <p className="text-[10px] text-zinc-350">DRAG & DROP ATHLETE PHOTO HERE</p>
                            <p className="text-[9px] text-zinc-550 uppercase">or Click to upload avatar / gamer logo (JPG, PNG, WEBP)</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      id="submit_tournament_reg_btn"
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-black font-extrabold uppercase rounded-xl tracking-widest text-xs font-mono transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer shadow-amber-500/5 hover:scale-[1.01]"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Proceed and Pay Securely ₹{selectedTournament.entryFee}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* TOURNEY TERMS & CONDITIONS (span 5) */}
            <div className="lg:col-span-5 bg-zinc-950/20 border border-zinc-900 p-6 sm:p-8 rounded-3xl space-y-6">
              <div className="border-b border-zinc-900 pb-4">
                <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest">OFFICIAL PLAYBOOK</span>
                <h4 className="font-display text-lg font-bold text-white uppercase mt-1">TOURNAMENT TERMS & CONDITIONS</h4>
              </div>
              
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 select-none">
                {termsAndConditions.map((term, i) => (
                  <div key={i} className="flex gap-4 text-xs font-sans group">
                    <span className="font-mono text-xs font-extrabold text-amber-500 bg-amber-500/5 border border-amber-500/10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                      {term.num}
                    </span>
                    <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed pt-0.5 font-light">
                      {term.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* GENERATED ENTRY PASS CONFIRMATION WINDOW */}
      {selectedTournament && lastTicket && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white pt-2">
              Registration Successful!
            </h2>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto">
              Your alpha entry credentials has been catalogued securely in the tournament grid database. Show this pass on operations desk.
            </p>
          </div>

          {/* DYNAMIC TICKET GRAPHICS */}
          <div 
            id="tournament_pass_ticket"
            className="border border-dashed border-zinc-800 bg-zinc-950 rounded-3xl overflow-hidden relative shadow-2xl uppercase print:bg-white print:text-black print:border-none uppercase"
          >
            {/* Top Bar styled after photo */}
            <div className="bg-gradient-to-r from-amber-400 to-yellow-600 px-6 py-4 flex justify-between items-center print:bg-amber-500">
              <div>
                <span className="text-[10px] font-mono text-black font-black uppercase tracking-[0.3em]">THE ALPHA CHAMPIONSHIP</span>
                <h3 className="font-display font-black text-black tracking-tight text-sm uppercase leading-none mt-1">
                  OFFICIAL ACCESS PASS
                </h3>
              </div>
              <div className="bg-black/95 text-amber-400 font-mono text-xs font-black px-3.5 py-1.5 rounded-lg border border-zinc-850 print:border-none">
                PASS: ACTIVE
              </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center font-mono">
              
              {/* Credentials sheet */}
              <div className={`${lastTicket.tournamentDetails?.profileImageBase64 ? 'md:col-span-6' : 'md:col-span-8'} text-left space-y-5 text-zinc-300 print:text-black`}>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-550 block">EVENT NAME</span>
                  <p className="text-white print:text-black text-[13px] font-bold tracking-tight">
                    {lastTicket.planName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xxs">
                  <div>
                    <span className="text-zinc-550 block text-[8px]">PARTICIPANT NAME</span>
                    <span className="text-white print:text-black font-bold font-sans capitalize text-[11px]">
                      {lastTicket.tournamentDetails?.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-550 block text-[8px]">CONTACT PHONE</span>
                    <span className="text-white print:text-black font-bold">
                      {lastTicket.tournamentDetails?.mobileNumber}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xxs">
                  <div>
                    <span className="text-zinc-550 block text-[8px]">DATE OF BIRTH</span>
                    <span className="text-white print:text-black font-bold uppercase">
                      {lastTicket.tournamentDetails?.dob}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-550 block text-[8px]">CITY</span>
                    <span className="text-white print:text-black font-bold uppercase">
                      {lastTicket.tournamentDetails?.city}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xxs pt-2 border-t border-zinc-900/60 print:border-zinc-300">
                  <div>
                    <span className="text-zinc-550 block text-[8px]">REGISTRATION TRANSACTION</span>
                    <span className="text-white print:text-black font-bold text-[9px]">
                      {lastTicket.invoiceNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile image column if uploaded */}
              {lastTicket.tournamentDetails?.profileImageBase64 && (
                <div className="md:col-span-2 flex flex-col items-center justify-center shrink-0">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/40 p-1 shadow-inner print:border-zinc-400">
                    <img
                      src={lastTicket.tournamentDetails.profileImageBase64}
                      alt="Player Avatar"
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[7px] text-zinc-550 mt-1.5 uppercase tracking-widest text-center block">PLAYER PHOTO</span>
                </div>
              )}

              {/* QR Code and verification box (span 4) */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border border-zinc-900 rounded-2xl bg-zinc-950/60 print:border-none print:bg-white">
                <div className="bg-white p-3 rounded-xl border border-zinc-800/10 inline-block shadow-lg">
                  <div className="w-28 h-28 flex items-center justify-center relative bg-white">
                    {/* SVG generated QR Code placeholder */}
                    <svg className="w-full h-full text-black" viewBox="0 0 100 100">
                      <rect width="10" height="10" x="5" y="5" fill="black"/>
                      <rect width="4" height="4" x="8" y="8" fill="white"/>
                      <rect width="10" height="10" x="85" y="5" fill="black"/>
                      <rect width="4" height="4" x="88" y="8" fill="white"/>
                      <rect width="10" height="10" x="5" y="85" fill="black"/>
                      <rect width="4" height="4" x="8" y="88" fill="white"/>
                      {/* Random scannable pattern blocks */}
                      <rect width="6" height="6" x="25" y="15" fill="black"/>
                      <rect width="8" height="4" x="45" y="25" fill="black"/>
                      <rect width="4" height="10" x="70" y="45" fill="black"/>
                      <rect width="6" height="6" x="25" y="65" fill="black"/>
                      <rect width="10" height="4" x="40" y="80" fill="black"/>
                      <rect width="4" height="4" x="65" y="70" fill="black"/>
                      <rect width="12" height="12" x="45" y="45" fill="black"/>
                      <rect width="4" height="4" x="49" y="49" fill="white"/>
                    </svg>
                  </div>
                </div>
                <span className="text-[8.5px] font-mono text-zinc-550 mt-3 text-center uppercase tracking-widest block">
                  SHOW TO VERIFY NODE
                </span>
              </div>

            </div>

            {/* Bottom watermark / terms summary */}
            <div className="bg-[#050505] p-5 border-t border-zinc-905 flex justify-between items-center text-[10px] text-zinc-600 print:bg-zinc-100 print:text-black">
              <span>ALPHA GAMING HUB ● ESTD 2026</span>
              <span className="font-bold text-zinc-500">PAID ₹{lastTicket.totalAmount} ONLY</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              id="print_tournament_ticket_btn"
              onClick={handlePrint}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print/PDF Official Ticket</span>
            </button>
            <button
              id="close_pass_trigger_btn"
              onClick={() => setLastTicket(null)}
              className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 font-medium rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Back to Gaming & Cafe
            </button>
          </div>

        </motion.div>
      )}

      {/* RENDER PAYMENT DIALOG */}
      {selectedTournament && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={selectedTournament.entryFee}
          itemName={selectedTournament.name}
          category="tournament"
          userName={fullName}
          userEmail={currentUser?.email || email || 'guest@thealpha.com'}
          userMobile={mobileNumber}
          userId={currentUser?.id || 'usr_' + Math.random().toString(36).substring(2, 9)}
          categoryDetails={{
            tournamentDetails: {
              tournamentId: selectedTournament.id,
              tournamentName: selectedTournament.name,
              fullName,
              mobileNumber,
              email: currentUser?.email || email || 'guest@thealpha.com',
              dob,
              city,
              entryFee: selectedTournament.entryFee,
              profileImageBase64: profileBase64 || undefined
            }
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

    </div>
  );
}
