import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckCircle, 
  ShieldCheck, 
  Check, 
  Download,
  AlertCircle,
  Clock,
  ChevronRight,
  Plus,
  Minus,
  Receipt,
  Printer,
  CreditCard,
  Loader2,
  XCircle,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Booking, MembershipCategory } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  itemName: string;
  category: MembershipCategory;
  userName: string;
  userEmail: string;
  userMobile: string;
  userId: string;
  categoryDetails: {
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
      teamFormat?: string; 
      teamName?: string; 
      players?: string[];
      screenSize?: '55' | '75';
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
  };
  onPaymentSuccess: (booking: Booking) => void;
}

type PaymentStep = 'service_select' | 'checkout_confirm' | 'processing' | 'success' | 'failed' | 'cancelled';

interface CafeCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  itemName,
  category,
  userName,
  userEmail,
  userMobile,
  userId,
  categoryDetails,
  onPaymentSuccess
}: PaymentModalProps) {
  // Selection States
  const [selectedService, setSelectedService] = useState<string>('Gym Membership');
  const [payableAmount, setPayableAmount] = useState<number>(amount);
  
  // Service configuration sub-states
  const [gymPlan, setGymPlan] = useState<'monthly' | '3_month' | '6_month' | '12_month'>('monthly');
  const [gymGender, setGymGender] = useState<'male' | 'female'>('male');
  const [gymIncludeAdmission, setGymIncludeAdmission] = useState<boolean>(false);

  const [libraryIncludeAdmission, setLibraryIncludeAdmission] = useState<boolean>(false);

  const [gamingPlayMode, setGamingPlayMode] = useState<'hourly' | 'monthly_pass'>('hourly');
  const [gamingScreenSize, setGamingScreenSize] = useState<'55' | '75'>('55');
  const [gamingPlayersCount, setGamingPlayersCount] = useState<number>(1);

  const [cafeCart, setCafeCart] = useState<CafeCartItem[]>([]);

  // Payer input details
  const [payerName, setPayerName] = useState<string>(userName || '');
  const [payerMobile, setPayerMobile] = useState<string>(userMobile || '');
  
  // Flow management
  const [currentStep, setCurrentStep] = useState<PaymentStep>('service_select');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [didInit, setDidInit] = useState<boolean>(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState<boolean>(false);

  // Success receipts states
  const [receiptResult, setReceiptResult] = useState<any>(null);
  const [finalizedBooking, setFinalizedBooking] = useState<any | null>(null);

  // Cancel confirmation prompt and button click handlers
  const [showCancelPrompt, setShowCancelPrompt] = useState<boolean>(false);

  const handlePressBack = () => {
    if (currentStep === 'success') {
      if (finalizedBooking) {
        onPaymentSuccess(finalizedBooking);
      }
      onClose();
    } else {
      setShowCancelPrompt(true);
    }
  };

  const handlePressClose = () => {
    if (currentStep === 'success') {
      if (finalizedBooking) {
        onPaymentSuccess(finalizedBooking);
      }
      onClose();
    } else {
      setShowCancelPrompt(true);
    }
  };

  const [hasAutoOpened, setHasAutoOpened] = useState<boolean>(false);

  // Populate initially on mount / opening
  useEffect(() => {
    if (isOpen) {
      setPayerName(userName || '');
      setPayerMobile(userMobile || '');
      setErrorMessage('');
      setReceiptResult(null);
      setFinalizedBooking(null);
      setIsRazorpayLoading(false);
      setHasAutoOpened(false);
      
      let initService = 'Gym Membership';
      if (category === 'gym') {
        initService = 'Gym Membership';
        if (categoryDetails.gymDetails?.gender) {
          setGymGender(categoryDetails.gymDetails.gender.toLowerCase() === 'female' ? 'female' : 'male');
        }
        if (categoryDetails.gymDetails?.includeAdmissionFee !== undefined) {
          setGymIncludeAdmission(!!categoryDetails.gymDetails.includeAdmissionFee);
        }
        if (itemName.includes('3 Month') || itemName.includes('3_month')) setGymPlan('3_month');
        else if (itemName.includes('6 Month') || itemName.includes('6_month')) setGymPlan('6_month');
        else if (itemName.includes('12 Month') || itemName.includes('12_month')) setGymPlan('12_month');
        else setGymPlan('monthly');
      } else if (category === 'library') {
        initService = 'Library Membership';
        if (categoryDetails.libraryDetails?.includeAdmissionFee !== undefined) {
          setLibraryIncludeAdmission(!!categoryDetails.libraryDetails.includeAdmissionFee);
        }
      } else if (category === 'gaming') {
        if (categoryDetails.gamingDetails?.isMonthlyPass) {
          initService = 'Monthly Pass';
          setGamingPlayMode('monthly_pass');
        } else {
          initService = 'Gaming Booking';
          setGamingPlayMode('hourly');
        }
        if (categoryDetails.gamingDetails?.screenSize) {
          setGamingScreenSize(categoryDetails.gamingDetails.screenSize);
        }
        if (categoryDetails.gamingDetails?.playersCount) {
          setGamingPlayersCount(categoryDetails.gamingDetails.playersCount);
        }
      } else if (category === 'cafe') {
        initService = 'Cafe Order';
        if (categoryDetails.cafeDetails?.items && categoryDetails.cafeDetails.items.length > 0) {
          setCafeCart(categoryDetails.cafeDetails.items.map(it => ({
            id: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity
          })));
        } else {
          setCafeCart([
            { id: 'cafe_hot_coffee', name: 'Hot Coffee', price: 60, quantity: 1 },
            { id: 'cafe_french_fries', name: 'French Fries', price: 90, quantity: 1 },
            { id: 'cafe_mojito', name: 'Virgin Mojito', price: 120, quantity: 0 },
            { id: 'cafe_cheese_burger', name: 'Cheese Burger', price: 100, quantity: 0 }
          ]);
        }
      } else if (category === 'tournament') {
        initService = 'Tournament Registration';
      }

      setSelectedService(initService);
      setDidInit(true);
      setCurrentStep('checkout_confirm');
    } else {
      setDidInit(false);
    }
  }, [isOpen, amount, itemName, category, userName, userMobile, categoryDetails]);

  // Dynamic Dues Calculator
  const computedAmount = useMemo(() => {
    if (!didInit) return amount;
    
    if (selectedService === 'Gym Membership') {
      let base = 1500;
      if (gymPlan === 'monthly') base = gymGender === 'male' ? 1500 : 1250;
      else if (gymPlan === '3_month') base = gymGender === 'male' ? 4000 : 3500;
      else if (gymPlan === '6_month') base = gymGender === 'male' ? 7200 : 6500;
      else if (gymPlan === '12_month') base = gymGender === 'male' ? 13000 : 12000;

      const reg = gymIncludeAdmission ? 100 : 0;
      return base + reg;
    }
    
    if (selectedService === 'Library Membership') {
      const base = 899;
      const reg = libraryIncludeAdmission ? 100 : 0;
      return base + reg;
    }
    
    if (selectedService === 'Gaming Booking' || selectedService === 'Monthly Pass') {
      if (gamingPlayMode === 'monthly_pass' || selectedService === 'Monthly Pass') {
        return gamingScreenSize === '55' ? 999 : 1199;
      } else {
        if (gamingScreenSize === '55') {
          if (gamingPlayersCount === 1) return 79;
          if (gamingPlayersCount === 2) return 129;
          if (gamingPlayersCount === 3) return 179;
          return 229;
        } else {
          if (gamingScreenSize === '75') {
            if (gamingPlayersCount === 1) return 89;
            if (gamingPlayersCount === 2) return 149;
            if (gamingPlayersCount === 3) return 209;
            return 269;
          }
        }
      }
    }
    
    if (selectedService === 'Cafe Order') {
      return cafeCart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    }
    
    if (selectedService === 'Tournament Registration') {
      return categoryDetails.tournamentDetails?.entryFee || amount || 200;
    }
    
    return amount;
  }, [
    selectedService,
    gymPlan,
    gymGender,
    gymIncludeAdmission,
    libraryIncludeAdmission,
    gamingPlayMode,
    gamingScreenSize,
    gamingPlayersCount,
    cafeCart,
    didInit,
    amount,
    categoryDetails
  ]);

  useEffect(() => {
    if (isOpen && didInit && !hasAutoOpened && currentStep === 'checkout_confirm') {
      const pName = payerName.trim() || userName.trim();
      const pMobile = payerMobile.trim() || userMobile.trim();
      const finalAmt = computedAmount > 0 ? computedAmount : amount;
      const isDirectBooking = !!categoryDetails?.gamingDetails?.isCartBooking || category === 'tournament' || !!categoryDetails?.tournamentDetails;
      if (pName && pMobile && pMobile.length >= 10 && finalAmt > 0) {
        setHasAutoOpened(true);
        if (isDirectBooking) {
          handleRazorpayCheckout(pName, pMobile, finalAmt);
        } else {
          const timer = setTimeout(() => {
            handleRazorpayCheckout(pName, pMobile, finalAmt);
          }, 350);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [isOpen, didInit, hasAutoOpened, currentStep, payerName, payerMobile, computedAmount, amount, categoryDetails, category]);

  useEffect(() => {
    if (didInit) {
      setPayableAmount(computedAmount);
    }
  }, [computedAmount, didInit]);

  const handleServiceChange = (serviceName: string) => {
    setSelectedService(serviceName);
    
    if (serviceName === 'Monthly Pass') {
      setGamingPlayMode('monthly_pass');
    } else if (serviceName === 'Gaming Booking') {
      setGamingPlayMode('hourly');
    }
    
    if (serviceName === 'Cafe Order' && cafeCart.length === 0) {
      setCafeCart([
        { id: 'cafe_hot_coffee', name: 'Hot Coffee', price: 60, quantity: 1 },
        { id: 'cafe_french_fries', name: 'French Fries', price: 90, quantity: 1 },
        { id: 'cafe_mojito', name: 'Virgin Mojito', price: 120, quantity: 0 },
        { id: 'cafe_cheese_burger', name: 'Cheese Burger', price: 100, quantity: 0 }
      ]);
    }
  };

  const adjustCafeQuantity = (id: string, delta: number) => {
    setCafeCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const nextQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: nextQty };
        }
        return item;
      });
    });
  };

  const generateReceiptId = () => {
    const year = new Date().getFullYear();
    const sequence = Math.floor(1000 + Math.random() * 9000);
    return `ALPHA-${year}-${sequence}`;
  };

  // High quality receipt downloading using jsPDF
  const downloadReceiptPDF = (receiptToDownload?: any) => {
    const targetReceipt = receiptToDownload || receiptResult;
    if (!targetReceipt) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Elegant dark header
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, w, 32, 'F');

    // Accent keyline (gold)
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(1.5);
    doc.line(0, 32, w, 32);

    // Header Title
    doc.setTextColor(197, 160, 89);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('THE ALPHA GAMING & CAFE', w / 2, 11, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL SECURE BOOKING PASS & INVOICE', w / 2, 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text('Phone: 9472835855  |  Gulabbagh, Bihar  |  Status: SUCCESS', w / 2, 24, { align: 'center' });

    let y = 42;
    const writeSectionHeader = (title: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(197, 160, 89);
      doc.text(title, 12, y);
      doc.setDrawColor(220, 220, 225);
      doc.setLineWidth(0.2);
      doc.line(12, y + 2, w - 12, y + 2);
      y += 8;
    };

    const drawRow = (label: string, value: string) => {
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 115);
      doc.text(label.padEnd(28, '.') + ':', 12, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 35);
      const safeVal = value || 'N/A';
      doc.text(safeVal, w - 12, y, { align: 'right' });
      y += 6;
    };

    // Section 1: Customer & Document Details
    writeSectionHeader('CUSTOMER REGISTRY PASSAGE');
    drawRow('Receipt Number', targetReceipt.receiptId);
    drawRow('Date & Time', targetReceipt.dateTime);
    drawRow('Customer Name', targetReceipt.name);
    drawRow('Mobile Number', targetReceipt.mobile);
    y += 4;

    // Section 2: Product & Payment details
    writeSectionHeader('TRANSACTION SERVICE INVOICE');
    
    // Product details compilation
    let productDetails = targetReceipt.service;
    if (targetReceipt.planName && targetReceipt.planName !== targetReceipt.service) {
      productDetails += ` - ${targetReceipt.planName}`;
    }
    drawRow('Product Details', productDetails);
    
    if (targetReceipt.cartItems && targetReceipt.cartItems.length > 0) {
      targetReceipt.cartItems.forEach((item: any, idx: number) => {
        const itemLabel = item.name || `${item.screenSize}" Screen - ${item.playersCount} Players`;
        const itemVal = `${item.quantity} x Rs ${item.unitPrice || item.rate} = Rs ${item.totalPrice || (item.quantity * (item.unitPrice || item.rate))}`;
        drawRow(`Item ${idx + 1}: ${itemLabel}`, itemVal);
      });
    } else {
      if (targetReceipt.screenSize && targetReceipt.screenSize !== 'N/A') {
        drawRow('Gamer Screen Size', `${targetReceipt.screenSize} Inches`);
      }
      if (targetReceipt.playersCount) {
        drawRow('Roster / Players Count', `${targetReceipt.playersCount} Players`);
      }
    }
    
    drawRow('Quantity', `${targetReceipt.quantity || 1}`);
    drawRow('Total Amount Paid', `INR ${targetReceipt.amount.toLocaleString()}`);
    drawRow('Payment Status', 'SUCCESS');
    y += 4;

    // Section 3: Transaction Gateway Identifiers
    writeSectionHeader('GATEWAY DEPOSIT DATA');
    drawRow('Payment ID', targetReceipt.paymentId);
    drawRow('Razorpay Order ID', targetReceipt.orderId);
    drawRow('Razorpay Payment ID', targetReceipt.paymentId);
    drawRow('UTR / Transaction Reference Number', targetReceipt.utr);
    y += 6;

    // Guaranteed Verified Seal Badge
    doc.setFillColor(236, 253, 245); // emerald 50 bg
    doc.setDrawColor(5, 150, 105);   // emerald 600 line
    doc.setLineWidth(0.3);
    doc.rect(12, y, w - 24, 10, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105);
    doc.text('✓ STATUS: AUDITED & SECURELY REGISTERED', w / 2, y + 6.5, { align: 'center' });

    // Footer
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 115);
    doc.text('This is an auto-generated high-fidelity digital pass validation receipt.', w / 2, h - 14, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('THE ALPHA CLUB • POWER • INTELLECT • RETRO', w / 2, h - 9, { align: 'center' });

    doc.save(`THE-ALPHA-INVOICE-${targetReceipt.receiptId}.pdf`);
  };

  // Printing the receipt via an isolated popup
  const printReceipt = () => {
    if (!receiptResult) return;
    const printWindow = window.open('', '_blank', 'width=600,height=850');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>THE ALPHA - RECEIPT ${receiptResult.receiptId}</title>
            <style>
              body { font-family: monospace; padding: 30px; color: #111; background: #fff; }
              .receipt-container { border: 2px solid #000; padding: 25px; max-width: 480px; margin: 0 auto; box-shadow: 4px 4px 0px rgba(0,0,0,1); }
              .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #000; padding-bottom: 15px; }
              .header h1 { margin: 0 0 5px 0; font-size: 22px; letter-spacing: 2px; font-weight: 900; }
              .header p { margin: 0; font-size: 11px; color: #444; font-weight: bold; text-transform: uppercase; }
              
              .section-title { font-weight: bold; text-transform: uppercase; font-size: 11px; margin: 20px 0 8px 0; border-bottom: 1px solid #111; padding-bottom: 3px; color: #c5a059; letter-spacing: 1px; }

              .row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dotted #ccc; padding-bottom: 3px; font-size: 12px; }
              .row span:first-child { color: #555; text-transform: uppercase; font-size: 10px; }
              .row span:last-child { font-weight: bold; }
              
              .total-row { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 10px; border-top: 2px dashed #000; font-size: 16px; font-weight: bold; }
              .total-row span:last-child { color: #10b981; }
              
              .footer { text-align: center; margin-top: 35px; font-size: 10px; color: #444; line-height: 1.5; border-top: 2px solid #000; padding-top: 15px; }
              .badge { text-align: center; margin: 20px 0; padding: 10px; border: 2px solid #059669; background: #ecfdf5; color: #059669; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <div class="header">
                <h1>THE ALPHA GAMING & CAFE</h1>
                <p>Official Secured Pass Token</p>
                <div style="font-size: 10px; color: #666; margin-top: 4px;">Phone: 9472835855 | Gulabbagh, Bihar</div>
              </div>
              
              <div class="section-title">Customer Registry Access</div>
              <div class="row"><span>Receipt / ID</span><span>${receiptResult.receiptId}</span></div>
              <div class="row"><span>Full Name</span><span>${receiptResult.name}</span></div>
              <div class="row"><span>Mobile No</span><span>${receiptResult.mobile}</span></div>
              <div class="row"><span>Email ID</span><span>${receiptResult.email}</span></div>
              <div class="row"><span>Member ID</span><span>${receiptResult.memberId}</span></div>
              
              <div class="section-title">Purchase & Booking Details</div>
              ${receiptResult.cartItems && receiptResult.cartItems.length > 0 ? 
                receiptResult.cartItems.map((item: any) => `
                  <div class="row" style="margin-bottom: 2px;">
                    <span style="font-weight: bold;">${item.name || `${item.screenSize}" Screen - ${item.playersCount} Players`}</span>
                    <span>₹${(item.totalPrice || (item.quantity * (item.unitPrice || item.rate))).toLocaleString()}</span>
                  </div>
                  <div class="row" style="font-size: 9px; color: #666; margin-top: -3px; margin-bottom: 6px;">
                    <span>Qty: ${item.quantity} &times; ₹${item.unitPrice || item.rate}</span>
                    <span></span>
                  </div>
                `).join('')
              : `
                <div class="row"><span>Service category</span><span>${receiptResult.service}</span></div>
                <div class="row"><span>Plan details</span><span>${receiptResult.planName}</span></div>
                ${receiptResult.screenSize && receiptResult.screenSize !== 'N/A' ? `
                  <div class="row"><span>Screen size</span><span>${receiptResult.screenSize} Inches</span></div>
                ` : ''}
                ${receiptResult.playersCount ? `
                  <div class="row"><span>Players count</span><span>${receiptResult.playersCount} Players</span></div>
                ` : ''}
                <div class="row"><span>Quantity</span><span>${receiptResult.quantity || 1}</span></div>
                <div class="row"><span>Base Amount</span><span>₹${(receiptResult.baseAmount || receiptResult.amount).toLocaleString()}</span></div>
                <div class="row"><span>Discount code applied</span><span>₹${receiptResult.discount || 0}</span></div>
              `}
              
              <div class="section-title">Secure Gateway Metadata</div>
              <div class="row"><span>Razorpay Order ID</span><span>${receiptResult.orderId}</span></div>
              <div class="row"><span>Razorpay Pay ID</span><span>${receiptResult.paymentId}</span></div>
              <div class="row"><span>Bank Ref / UTR</span><span>${receiptResult.utr}</span></div>
              <div class="row"><span>Payment mechanism</span><span>${receiptResult.paymentMethod}</span></div>
              <div class="row"><span>Payment Status</span><span>${receiptResult.status}</span></div>
              <div class="row"><span>Captured datetime</span><span>${receiptResult.dateTime}</span></div>

              <div class="total-row"><span>Total Net Paid Amount</span><span>₹${receiptResult.amount.toLocaleString()}</span></div>
              
              <div class="badge">✓ STATUS: INSTANTLY VERIFIED SUCCESSFUL</div>
              
              <div class="footer">
                Thank you for selecting <strong>THE ALPHA</strong>.<br/>
                Your payment was safely processed through Razorpay Secure Passage.<br/>
                Have a great experience inside the space!<br/>
                <strong>THE ALPHA CLUB &bull; POWER &bull; INTELLECT &bull; RETRO</strong>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleRazorpayCheckout = async (directName?: string, directMobile?: string, directAmount?: number) => {
    try {
      const finalName = (directName || payerName || userName || "").trim();
      const finalMobile = (directMobile || payerMobile || userMobile || "").trim();
      const finalAmount = directAmount !== undefined ? directAmount : (payableAmount > 0 ? payableAmount : (computedAmount > 0 ? computedAmount : amount));

      if (!finalName) {
        setErrorMessage("Customer name is required before starting checkout.");
        return;
      }
      if (!finalMobile || finalMobile.length < 10) {
        setErrorMessage("A valid 10-digit mobile number is required before starting checkout.");
        return;
      }
      if (finalAmount <= 0) {
        setErrorMessage("Please select a service with a valid amount.");
        return;
      }

      setErrorMessage("");
      setIsRazorpayLoading(true);
      setCurrentStep('processing');

      // 1. Create order on the backend
      const amountInPaise = Math.round(finalAmount * 100);
      const receiptId = generateReceiptId();

      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: receiptId,
        }),
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json();
        throw new Error(errData.error || 'Failed to initialize payment gateway.');
      }

      const orderData = await orderResponse.json();
      const { order_id } = orderData;

      // 2. Open Razorpay Checkout Modal
      const razorpayKey = (import.meta as any).env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SzsVGsGjYS9ejd';
      
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'THE ALPHA',
        description: `Booking Fee for ${selectedService}`,
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=120&auto=format&fit=crop',
        order_id: order_id,
        prefill: {
          name: finalName,
          email: userEmail || 'guest@thealpha.com',
          contact: finalMobile,
        },
        theme: {
          color: '#c5a059',
        },
        handler: async (response: any) => {
          try {
            setCurrentStep('processing');

            // 3. Verify Payment Signature
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              const errData = await verifyResponse.json();
              throw new Error(errData.error || 'Razorpay payment signature mismatch.');
            }

            // 4. Create actual booking record with "success" status
            let currentCategory: MembershipCategory = 'library';
            if (selectedService === 'Gym Membership') currentCategory = 'gym';
            else if (selectedService === 'Library Membership') currentCategory = 'library';
            else if (selectedService === 'Gaming Booking' || selectedService === 'Monthly Pass') currentCategory = 'gaming';
            else if (selectedService === 'Cafe Order') currentCategory = 'cafe';
            else if (selectedService === 'Tournament Registration') currentCategory = 'tournament';

            const bookingPayload = {
              userId,
              userEmail,
              userName: finalName,
              userMobile: finalMobile,
              category: currentCategory,
              planId: selectedService.toLowerCase().replace(/\s+/g, '_'),
              planName: selectedService,
              amount: finalAmount,
              paymentMethod: 'razorpay',
              paymentStatus: 'success', // Instantly marked as success
              utrNumber: response.razorpay_payment_id,
              payerName: finalName,
              payerMobile: finalMobile,
              screenshotUrl: '',
              receiptNumber: receiptId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              gymDetails: currentCategory === 'gym' ? {
                gender: gymGender,
                includeAdmissionFee: gymIncludeAdmission
              } : undefined,
              libraryDetails: currentCategory === 'library' ? {
                ...categoryDetails.libraryDetails,
                includeAdmissionFee: libraryIncludeAdmission
              } : undefined,
              gamingDetails: currentCategory === 'gaming' 
                ? (categoryDetails?.gamingDetails?.isCartBooking 
                    ? categoryDetails.gamingDetails 
                    : {
                        screenSize: gamingScreenSize,
                        playersCount: gamingPlayersCount,
                        isMonthlyPass: selectedService === 'Monthly Pass' || gamingPlayMode === 'monthly_pass'
                      })
                : undefined,
              cafeDetails: currentCategory === 'cafe' ? {
                items: cafeCart.filter(it => it.quantity > 0)
              } : undefined,
              tournamentDetails: currentCategory === 'tournament' ? categoryDetails.tournamentDetails : undefined
            };

            const bookResponse = await fetch('/api/bookings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(bookingPayload),
            });

            if (!bookResponse.ok) {
              const errData = await bookResponse.json();
              throw new Error(errData.error || 'Failed to register the booking.');
            }

            const result = await bookResponse.json();

            const receiptData = {
              receiptId: receiptId,
              name: finalName,
              mobile: finalMobile,
              email: userEmail || 'guest@thealpha.com',
              memberId: userId || 'N/A',
              service: selectedService,
              planName: itemName || selectedService,
              screenSize: currentCategory === 'gaming' ? (gamingScreenSize || 'N/A') : undefined,
              playersCount: currentCategory === 'gaming' ? (gamingPlayersCount || 1) : undefined,
              cartItems: currentCategory === 'gaming' && categoryDetails?.gamingDetails?.isCartBooking
                ? categoryDetails.gamingDetails.cartItems
                : undefined,
              quantity: 1,
              discount: 0,
              baseAmount: finalAmount,
              amount: finalAmount,
              orderId: response.razorpay_order_id || 'N/A',
              paymentId: response.razorpay_payment_id,
              utr: response.razorpay_payment_id,
              paymentMethod: 'UPI/Card/Netbanking/Wallet',
              status: 'SUCCESS',
              dateTime: new Date().toLocaleString(),
              isVerified: true
            };

            const bookingDataForCallback = result.booking || {
              ...bookingPayload,
              id: result.bookingId || 'bk_' + Math.random().toString(36).substring(2, 9),
              totalAmount: finalAmount,
              paymentDate: new Date().toISOString()
            };

            setFinalizedBooking(bookingDataForCallback);
            setReceiptResult(receiptData);
            setCurrentStep('success');

            // Auto-trigger document receipt download!
            downloadReceiptPDF(receiptData);
            
            // Immediately dispatch navigate home event and close
            onPaymentSuccess(bookingDataForCallback);
            onClose();
            window.dispatchEvent(new CustomEvent('navigate-home'));

          } catch (verifyErr: any) {
            console.error("Verification/Booking creation error:", verifyErr);
            setErrorMessage(verifyErr.message || 'Payment verified but failed to register the database entry.');
            setCurrentStep('failed');
          } finally {
            setIsRazorpayLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal dismissed by user.');
            setIsRazorpayLoading(false);
            setCurrentStep('cancelled');
            const isDirectBooking = !!categoryDetails?.gamingDetails?.isCartBooking || category === 'tournament' || !!categoryDetails?.tournamentDetails;
            if (isDirectBooking) {
              alert("Payment Cancelled: The transaction was cancelled or dismissed.");
              onClose();
            }
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', (resp: any) => {
        console.error('Razorpay payment failed callback:', resp.error);
        const errMsg = resp.error?.description || 'Razorpay Gateway payment transaction failed.';
        setErrorMessage(errMsg);
        setIsRazorpayLoading(false);
        setCurrentStep('failed');
        const isDirectBooking = !!categoryDetails?.gamingDetails?.isCartBooking || category === 'tournament' || !!categoryDetails?.tournamentDetails;
        if (isDirectBooking) {
          alert("Payment Failed: " + errMsg);
          onClose();
        }
      });

      rzp.open();

    } catch (err: any) {
      console.error("Razorpay Checkout Error:", err);
      setErrorMessage(err.message || 'Unable to open Razorpay gateway.');
      setCurrentStep('failed');
      setIsRazorpayLoading(false);
    }
  };

  const isProceedDisabled = !selectedService || payableAmount <= 0;
  const isDirectBooking = !!categoryDetails?.gamingDetails?.isCartBooking || category === 'tournament' || !!categoryDetails?.tournamentDetails;

  if (!isOpen) return null;

  if (isDirectBooking && (currentStep === 'checkout_confirm' || currentStep === 'processing')) {
    return null;
  }

  return (
    <div id="payment_modal_overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl overflow-hidden border border-zinc-850 bg-zinc-950 rounded-3xl shadow-2xl text-left relative"
      >
        {/* UPPER NAVIGATION BAR WITH BACK & CLOSE */}
        <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-900/40 px-6 py-4">
          {currentStep !== 'checkout_confirm' && currentStep !== 'processing' && currentStep !== 'success' ? (
            <button
              type="button"
              id="btn_payment_nav_back"
              onClick={handlePressBack}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all font-mono text-[11px] cursor-pointer select-none"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span className="font-bold">← Back</span>
            </button>
          ) : (
            <div className="w-[74px]" />
          )}

          <div className="hidden sm:flex flex-col items-center text-center">
            <h3 className="font-display text-[10px] font-bold tracking-widest text-[#c5a059] uppercase flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
              THE ALPHA PLATFORM
            </h3>
            <p className="text-[7.5px] font-mono tracking-wider text-zinc-500 uppercase">SECURED GATEWAY</p>
          </div>

          <button
            type="button"
            id="btn_payment_nav_close"
            onClick={handlePressClose}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-zinc-805 bg-zinc-900/50 text-zinc-450 hover:text-white hover:border-zinc-700 transition-all font-mono text-[11px] cursor-pointer select-none"
          >
            <span className="font-bold">✖ Close</span>
          </button>
        </div>

        {/* CANCEL REQUIREMENT POPUP */}
        {showCancelPrompt && (
          <div id="payment_cancel_confirm_overlay" className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-md rounded-3xl text-center">
            <div className="max-w-xs space-y-6">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 animate-bounce">
                  <AlertTriangle className="h-7 w-7" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-display font-black text-sm uppercase tracking-wider">Are you sure you want to leave the payment page?</h3>
                <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                  Your active checkout parameters and gateway states will not be finalized.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 font-mono text-[10px] w-full">
                <button
                  type="button"
                  id="btn_confirm_continue_payment"
                  onClick={() => setShowCancelPrompt(false)}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-bold rounded-xl uppercase tracking-wider transition cursor-pointer hover:from-amber-300 hover:to-yellow-500"
                >
                  Continue Payment
                </button>
                <button
                  type="button"
                  id="btn_confirm_leave_payment"
                  onClick={() => {
                    setShowCancelPrompt(false);
                    onClose();
                  }}
                  className="w-full py-3 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl uppercase tracking-wider transition cursor-pointer"
                >
                  Leave Payment Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BODY WORKFLOW */}
        <div className="p-6 md:p-8 overflow-y-auto max-h-[82vh]">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: SERVICE & VARIABLE CALCULATION FORM */}
            {currentStep === 'service_select' && (
              <motion.div 
                key="step-service"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <h4 className="text-white font-display font-semibold text-base uppercase tracking-wider">Step 1: Choose Service & Params</h4>
                  <p className="text-xxs text-zinc-450 font-mono">Deductions evaluate automatically according to selections</p>
                </div>

                {/* Grid categories select */}
                {categoryDetails?.gamingDetails?.isCartBooking ? (
                  <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between text-left font-mono">
                    <div>
                      <span className="text-[#c5a059] text-[8px] uppercase tracking-wider block font-bold">Secured Transaction Department</span>
                      <strong className="text-white font-sans text-xs font-extrabold uppercase tracking-wide">The Alpha Gaming & Cafe Cart Checkout</strong>
                    </div>
                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] px-3 py-1 rounded-lg font-bold uppercase tracking-wider">Locked</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      'Gym Membership',
                      'Library Membership',
                      'Gaming Booking',
                      'Monthly Pass',
                      'Tournament Registration',
                      'Cafe Order'
                    ].map((service) => (
                      <button
                        key={service}
                        type="button"
                        id={`service_choice_${service.toLowerCase().replace(/\s+/g, '_')}`}
                        onClick={() => handleServiceChange(service)}
                        className={`px-3 py-3 rounded-xl text-left border font-mono text-[10px] transition-all flex flex-col justify-between h-18 cursor-pointer ${
                          selectedService === service 
                            ? 'border-amber-500 bg-amber-500/[0.03] text-white shadow-md shadow-amber-500/5' 
                            : 'border-zinc-900 bg-zinc-950 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-[10px] font-semibold tracking-wide leading-tight">{service}</span>
                        <div className="flex items-center justify-between w-full pt-1.5">
                          <span className="text-[9px] text-[#c5a059]">Active</span>
                          <div className={`h-2 w-2 rounded-full ${selectedService === service ? 'bg-amber-500 animate-pulse' : 'bg-zinc-850'}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* DYNAMIC VARIABLE CALCULATOR INTERFACING */}
                <div className="p-5 border border-zinc-900 bg-zinc-900/30 rounded-2xl space-y-4">
                  <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest block border-b border-zinc-900 pb-2">DEPARTMENT PRICING PARAMETERS</span>
                  
                  {/* TYPE A: GYM PARAMETERS */}
                  {selectedService === 'Gym Membership' && (
                    <div className="space-y-4 font-mono text-xxs text-zinc-300">
                      <div className="space-y-1.5">
                        <label className="block text-zinc-500 uppercase font-bold">Gym Plan Duration</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: 'monthly', label: '1 Month' },
                            { value: '3_month', label: '3 Months' },
                            { value: '6_month', label: '6 Months' },
                            { value: '12_month', label: '1 Year' }
                          ].map(plan => (
                             <button
                               key={plan.value}
                               type="button"
                               onClick={() => setGymPlan(plan.value as any)}
                               className={`py-2 px-1 text-center rounded border transition cursor-pointer ${
                                 gymPlan === plan.value 
                                   ? 'border-amber-500 text-amber-400 bg-amber-500/5 font-bold' 
                                   : 'border-zinc-850 text-zinc-450 hover:border-zinc-700'
                               }`}
                             >
                               {plan.label}
                             </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-zinc-500 uppercase font-bold">Gender Segment</label>
                          <div className="flex gap-2">
                            {['male', 'female'].map(gender => (
                              <button
                                key={gender}
                                type="button"
                                onClick={() => setGymGender(gender as any)}
                                className={`flex-1 py-1.5 capitalize rounded border text-center transition cursor-pointer ${
                                  gymGender === gender 
                                    ? 'border-amber-500 text-amber-400 bg-amber-500/5 font-bold' 
                                    : 'border-zinc-850 text-zinc-450'
                                }`}
                              >
                                {gender}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-zinc-500 uppercase font-bold">Registry Options</label>
                          <label className="flex items-center space-x-2 p-2 bg-zinc-900 rounded border border-zinc-850 cursor-pointer hover:border-zinc-750 transition h-8">
                            <input
                              type="checkbox"
                              checked={gymIncludeAdmission}
                              onChange={(e) => setGymIncludeAdmission(e.target.checked)}
                              className="accent-amber-500 w-3.5 h-3.5"
                            />
                            <span className="text-[10px] text-zinc-350">Add Admission (₹100)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TYPE B: LIBRARY PARAMETERS */}
                  {selectedService === 'Library Membership' && (
                    <div className="space-y-3 font-mono text-xxs text-zinc-300">
                      <div className="p-2.5 border border-zinc-850 bg-zinc-950 rounded-lg flex justify-between items-center text-[10px]">
                        <span className="text-zinc-500">Fixed library reading room pass:</span>
                        <strong className="text-amber-400">₹899 / Month</strong>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-zinc-500 uppercase font-bold">Registration Option</label>
                        <label className="flex items-center space-x-2.5 p-3 bg-zinc-950 rounded border border-zinc-850 cursor-pointer hover:border-zinc-750 transition">
                          <input
                            type="checkbox"
                            checked={libraryIncludeAdmission}
                            onChange={(e) => setLibraryIncludeAdmission(e.target.checked)}
                            className="accent-amber-500 w-3.5 h-3.5 opacity-100"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-zinc-250 block">Include Admission Fee (+₹100)</span>
                            <span className="text-[9px] text-[#c5a059]">One-time mandatory new enrollment stamp</span>
                          </div>
                        </label>
                      </div>
                                     {/* TYPE C: GAMING PARAMETERS */}
                  {(selectedService === 'Gaming Booking' || selectedService === 'Monthly Pass') && (
                    categoryDetails?.gamingDetails?.isCartBooking ? (
                      <div className="space-y-3 font-mono text-xxs text-zinc-300">
                        <span className="block text-zinc-500 uppercase font-bold">ITEMS RESERVED IN YOUR CART:</span>
                        <div className="space-y-2 border border-zinc-900 bg-zinc-950/60 p-3.5 rounded-xl max-h-[160px] overflow-y-auto">
                          {categoryDetails.gamingDetails.cartItems && categoryDetails.gamingDetails.cartItems.length > 0 ? (
                            categoryDetails.gamingDetails.cartItems.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-900 last:border-0 last:pb-0">
                                <div>
                                  <span className="text-white font-bold block">{item.name}</span>
                                  <span className="text-zinc-500 block text-[9px] mt-0.5">Rate: ₹{item.unitPrice} &bull; Qty: {item.quantity}</span>
                                </div>
                                <span className="text-amber-500 font-bold">₹{item.totalPrice}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-zinc-550 block italic py-1">Empty Cart Items</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 font-mono text-xxs text-zinc-300">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-zinc-500 uppercase font-bold">Display Layout</label>
                            <div className="flex gap-2">
                              {['55', '75'].map(size => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => setGamingScreenSize(size as any)}
                                  className={`flex-1 py-1.5 rounded border transition cursor-pointer ${
                                    gamingScreenSize === size 
                                      ? 'border-amber-500 text-amber-400 bg-amber-500/5 font-bold' 
                                      : 'border-zinc-850 text-zinc-450'
                                  }`}
                                >
                                  {size}" OLED HDR
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-zinc-500 uppercase font-bold">Billing Classification</label>
                            <div className="flex gap-2">
                              {[
                                { value: 'hourly', label: 'Hourly Session' },
                                { value: 'monthly_pass', label: '15h Monthly Pass' }
                              ].map(mode => (
                                <button
                                  key={mode.value}
                                  type="button"
                                  onClick={() => {
                                    setGamingPlayMode(mode.value as any);
                                    setSelectedService(mode.value === 'monthly_pass' ? 'Monthly Pass' : 'Gaming Booking');
                                  }}
                                  className={`flex-1 py-1.5 rounded border transition text-[9px] cursor-pointer ${
                                    gamingPlayMode === mode.value 
                                      ? 'border-amber-500 text-amber-400 bg-amber-500/5 font-bold' 
                                      : 'border-zinc-850 text-zinc-450'
                                  }`}
                                >
                                  {mode.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {gamingPlayMode === 'hourly' && (
                          <div className="space-y-1.5">
                            <label className="block text-zinc-550 uppercase font-bold">Splitscreen Co-Op Players</label>
                            <div className="grid grid-cols-4 gap-2">
                              {[1, 2, 3, 4].map(pCount => (
                                <button
                                  key={pCount}
                                  type="button"
                                  onClick={() => setGamingPlayersCount(pCount)}
                                  className={`py-1.5 rounded border transition cursor-pointer ${
                                    gamingPlayersCount === pCount 
                                      ? 'border-amber-500 text-amber-400 bg-amber-500/5 font-bold' 
                                      : 'border-zinc-850 text-zinc-450'
                                  }`}
                                >
                                  {pCount} Player{pCount > 1 ? 's' : ''}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}   </div>
                  )}

                  {/* TYPE D: CAFE PARAMETERS */}
                  {selectedService === 'Cafe Order' && (
                    <div className="space-y-3 font-mono text-xxs">
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {cafeCart.map((item) => (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between p-2 rounded border border-zinc-850 bg-zinc-950/60 transition hover:border-zinc-800"
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-zinc-200 block text-[10px]">{item.name}</span>
                              <span className="text-[9px] text-[#c5a059]">₹{item.price} each</span>
                            </div>
                            <div className="flex items-center space-x-2 px-1">
                              <button
                                type="button"
                                onClick={() => adjustCafeQuantity(item.id, -1)}
                                className="h-5 w-5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-850 text-zinc-250 cursor-pointer"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-xs text-white font-bold">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => adjustCafeQuantity(item.id, 1)}
                                className="h-5 w-5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-850 text-zinc-250 cursor-pointer"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[8px] text-zinc-550 italic uppercase font-bold">Unselected food items evaluate as zero dues and automatically drop during dispatching.</p>
                    </div>
                  )}

                  {/* TYPE E: TOURNAMENT DEFAULTS */}
                  {selectedService === 'Tournament Registration' && (
                    <div className="font-mono text-xxs text-zinc-300 py-1 flex items-center justify-between">
                      <span className="text-zinc-550">Official Secure Esport Entry Pass Dues:</span>
                      <strong className="text-amber-400 text-[11px] font-bold">₹{payableAmount.toLocaleString()}</strong>
                    </div>
                  )}

                  {/* TOTAL RENDER OUTPUT BOX */}
                  <div className="pt-2 border-t border-zinc-850 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-550 block uppercase font-bold">Calculated Net Due Sum:</span>
                      <strong id="payable_amount_indicator" className="text-white font-display text-lg tracking-wider">₹{payableAmount.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">ALL INCLUSIVE AT GST 0%</span>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start space-x-2 text-red-400 font-mono text-xxs my-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* BOTTOM REGULATION */}
                <button
                  id="btn_proceed_to_options"
                  type="button"
                  onClick={handleRazorpayCheckout}
                  disabled={isProceedDisabled}
                  className={`w-full py-4 text-black font-semibold rounded-2xl text-xs font-mono tracking-widest uppercase transition-all shadow-lg flex items-center justify-center space-x-2 ${
                    isProceedDisabled 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none border border-zinc-900' 
                      : 'bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 cursor-pointer'
                  }`}
                >
                  {isRazorpayLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-black" />
                  )}
                  <span>{isRazorpayLoading ? 'CONNECTING GATEWAY...' : 'PROCEED TO SECURE PAYMENT'}</span>
                </button>
              </motion.div>
            )}

            {/* STEP 2: CUSTOMER CLIENT DETAILS CHECKOUT SCREEN */}
            {currentStep === 'checkout_confirm' && (
              <motion.div 
                key="step-checkout-confirm"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <span className="text-amber-500 font-mono text-[8px] uppercase tracking-wider block">CONTACT & CHECKOUT PASSAGE</span>
                  <h4 className="text-white font-display font-semibold text-base uppercase">Secure Express Verification</h4>
                  <p className="text-xxs text-zinc-400 font-mono">Verify your contact details and proceed to secure checkout</p>
                </div>

                {/* Secure Gateway highlights */}
                <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/40 space-y-3 font-sans">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-zinc-500 text-xxs font-mono uppercase font-black">Booking Selection</span>
                    <span className="text-white text-xs font-bold uppercase">{selectedService}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#c5a059] font-semibold">Payable Total:</span>
                    <strong className="text-emerald-400 font-bold font-mono">₹{payableAmount.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="p-5 border border-zinc-900 bg-zinc-900/20 rounded-2xl space-y-4">
                  <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest block font-bold border-b border-zinc-900 pb-2">CUSTOMER METADATA REQUIRED</span>

                  {errorMessage && (
                    <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start space-x-2 text-red-400 font-mono text-xxs">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xxs font-mono text-zinc-400">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="block text-zinc-500 uppercase font-bold">Customer Full Name</label>
                      <input
                        id="payer_name_checkout"
                        type="text"
                        required
                        placeholder="e.g. Robert Drake"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-900 focus:border-amber-500 rounded-xl text-xs text-white outline-none transition font-sans"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="block text-zinc-500 uppercase font-bold">WhatsApp / Mobile Number</label>
                      <input
                        id="payer_mobile_checkout"
                        type="text"
                        required
                        maxLength={10}
                        placeholder="e.g. 9472835855"
                        value={payerMobile}
                        onChange={(e) => setPayerMobile(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-900 focus:border-amber-500 rounded-xl text-xs text-white outline-none transition font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Gateway channels note */}
                <div className="p-4 border border-zinc-900 bg-zinc-900/10 rounded-2xl flex items-start space-x-3 text-zinc-400 leading-normal text-xxs">
                  <CreditCard className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white block font-bold text-xxs uppercase mb-0.5">Option: Express Gate (Instant Auto-Verify)</span>
                    <p className="text-[10px] leading-relaxed">
                      Pay securely with **Cards, Net Banking, UPI (GPay, PhonePe, Paytm, BHIM)** or wallets on the secure Razorpay screen. Instantly creates active booking records and auto-downloads the digital pass.
                    </p>
                  </div>
                </div>

                {/* Bottom navigation and submit */}
                <div className="pt-3 border-t border-zinc-900">
                  <button
                    id="btn_submit_razorpay_gateway"
                    type="button"
                    disabled={isRazorpayLoading || !payerName.trim() || payerMobile.trim().length < 10}
                    onClick={handleRazorpayCheckout}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-black text-xxs font-mono tracking-widest uppercase font-extrabold transition-all shadow-md active:scale-98 flex items-center justify-center space-x-1 sm:space-x-2 cursor-pointer"
                  >
                    {isRazorpayLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-black" />
                    )}
                    <span>{isRazorpayLoading ? 'CONNECTING GATEWAY...' : `PAY ₹${payableAmount.toLocaleString()} SECURELY`}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SUBMITTING / PROCESSING SCREEN */}
            {currentStep === 'processing' && (
              <motion.div 
                key="step-processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl animate-pulse"></div>
                  <Clock className="w-14 h-14 text-amber-500 animate-spin relative" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-display text-base font-medium text-white tracking-wider">CREATING SECURE BOOKING REGISTRY</h4>
                  <p className="text-[10px] font-mono text-[#c5a059] animate-pulse">Communicating securely with Razorpay checkout and databases...</p>
                </div>
                <p className="text-[9px] font-mono text-zinc-500 max-w-sm leading-relaxed uppercase">
                  Verifying instant transaction variables, updating registries, and constructing high-fidelity invoices. Do not close this window.
                </p>
              </motion.div>
            )}

            {/* STEP 4: VERIFIED SUCCESS (HIDDEN) */}
            {currentStep === 'success' && receiptResult && (
              <div className="hidden">
                 {/* Success state is handled via immediate redirect */}
              </div>
            )}

            {/* STEP 5: PAYMENT FAILED SCREEN */}
            {currentStep === 'failed' && (
              <motion.div 
                key="step-failed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 text-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl animate-pulse"></div>
                  <XCircle className="w-16 h-16 text-red-500 relative" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-display text-lg font-bold text-white tracking-wider">PAYMENT TRANSACTION FAILED</h4>
                  <p className="text-xxs font-mono text-zinc-400">The gateway reported a payment processing issue</p>
                </div>
                
                {errorMessage && (
                  <div className="max-w-md p-3.5 bg-red-500/5 border border-red-500/15 text-red-400 text-xxs font-mono leading-relaxed rounded-xl text-center">
                    {errorMessage}
                  </div>
                )}

                <div className="flex gap-3 w-full max-w-xs pt-4 font-mono text-xxs">
                  <button
                    id="btn_failed_back"
                    type="button"
                    onClick={() => setCurrentStep('checkout_confirm')}
                    className="flex-1 py-3 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white font-bold uppercase rounded-xl transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    id="btn_failed_retry"
                    type="button"
                    onClick={handleRazorpayCheckout}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-black font-extrabold uppercase rounded-xl transition cursor-pointer"
                  >
                    Retry Payment
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 6: PAYMENT CANCELLED SCREEN */}
            {currentStep === 'cancelled' && (
              <motion.div 
                key="step-cancelled"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 text-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-yellow-500/10 blur-xl"></div>
                  <AlertTriangle className="w-16 h-16 text-yellow-500 relative" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-display text-lg font-bold text-white tracking-wider">PAYMENT CANCELLED</h4>
                  <p className="text-xxs font-mono text-zinc-400">The transaction was cancelled or dismissed</p>
                </div>

                <div className="flex gap-3 w-full max-w-xs pt-4 font-mono text-xxs">
                  <button
                    id="btn_cancelled_back"
                    type="button"
                    onClick={() => setCurrentStep('checkout_confirm')}
                    className="flex-1 py-3 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white font-bold uppercase rounded-xl transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    id="btn_cancelled_retry"
                    type="button"
                    onClick={handleRazorpayCheckout}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase rounded-xl transition cursor-pointer"
                  >
                    Retry Payment
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
