export interface User {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  address?: string;
  age?: number;
  gender?: string;
  collegeName?: string;
  idProofUrl?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export type MembershipCategory = 'gym' | 'library' | 'gaming' | 'cafe' | 'tournament';

export interface MembershipPlan {
  id: string;
  category: MembershipCategory;
  name: string;
  duration: string;
  price: number;
  description: string;
}

export interface Booking {
  id: string;
  invoiceNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  userMobile: string;
  category: MembershipCategory;
  planId: string;
  planName: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: 'razorpay' | 'upi' | 'card' | 'netbank';
  paymentDate: string;
  paymentStatus: 'success' | 'pending' | 'failed' | 'approved' | 'rejected';
  utrNumber?: string;
  payerName?: string;
  payerMobile?: string;
  screenshotUrl?: string;
  receiptNumber?: string;
  verifiedAt?: string;
  startDate: string;
  endDate: string;
  
  // Specific properties
  gymDetails?: {
    dob?: string;
    emergencyContact?: string;
    gender?: string;
    photoBase64?: string;
    includeAdmissionFee?: boolean;
  };
  libraryDetails?: {
    seatNumber?: string;
    collegeName?: string;
    idProofName?: string;
    fathersName?: string;
    address?: string;
    aadhaarNumber?: string;
    dob?: string;
    isPermanent?: boolean;
    lockerType?: string;
    startDate?: string;
    endDate?: string;
    photoBase64?: string;
    aadhaarBase64?: string;
    includeAdmissionFee?: boolean;
    registrationFee?: number;
  };
  gamingDetails?: {
    gameSelected?: string;
    tournamentName?: string;
    teamFormat?: 'solo' | 'duo' | 'squad' | 'team';
    teamName?: string;
    players?: string[]; // list of names
    screenSize?: '55' | '75' | string;
    playersCount?: number;
    isOfferApplied?: boolean;
    isMonthlyPass?: boolean;
    gameplayTime?: string;
    isCartBooking?: boolean;
    cartItems?: any[];
  };
  cafeDetails?: {
    items: Array<{ id: string; name: string; quantity: number; price: number }>;
    status?: 'pending' | 'preparing' | 'delivered' | 'cancelled';
  };
  tournamentDetails?: {
    tournamentId: string;
    tournamentName: string;
    fullName: string;
    mobileNumber: string;
    email: string;
    age?: number;
    dob?: string;
    city: string;
    gamingId?: string;
    entryFee: number;
    profileImageBase64?: string;
  };
}

export interface GamingPlan {
  id: string;
  screenSize: '55' | '75';
  players: number;
  type: 'hourly' | 'monthly';
  name: string;
  originalPrice: number;
  offerPrice: number;
  isOfferActive: boolean;
  isEnabled: boolean;
  gameplayTime?: string;
}

export interface Seat {
  id: string;
  number: string; // e.g. "A1", "B5"
  isBooked: boolean;
  bookedBy?: string; // userId or userName
}

export interface SystemStats {
  totalMembers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  activeMemberships: number;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  type: string; // 'homepage' | 'gaming' | 'cafe' | 'tournament' | 'offer' | 'gym' | 'library' | 'festival'
  targetPage: string; // 'homepage' | 'gaming' | 'cafe' | 'gym' | 'library'
  deviceType: 'all' | 'desktop' | 'mobile';
  scheduleStartDate?: string;
  scheduleEndDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  mobile: string;
  message: string;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  createdAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  game: string;
  entryFee: number;
  description: string;
  bannerUrl: string;
  isActive: boolean;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface GamingHighlightPhoto {
  id: string;
  album: string;
  imageUrl: string; // base64 or url
  title: string;
  isActive: boolean;
  createdAt: string;
}

export interface GamingHighlightVideo {
  id: string;
  videoUrl: string; // base64 or url
  title: string;
  isFeatured: boolean;
  loop: boolean;
  isActive: boolean;
  createdAt: string;
}


