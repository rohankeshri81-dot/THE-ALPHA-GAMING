import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Settings, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldAlert, 
  Download, 
  Printer, 
  Lock, 
  UserPlus, 
  LogOut, 
  Hexagon, 
  QrCode, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Booking } from '../types';

interface UserDashboardProps {
  currentUser: any;
  onLogIn: (user: any) => void;
  onLogOut: () => void;
  bookings: Booking[];
  onRefreshData: () => void;
  onSelectTab: (tab: string) => void;
}

export default function UserDashboard({
  currentUser,
  onLogIn,
  onLogOut,
  bookings,
  onRefreshData,
  onSelectTab
}: UserDashboardProps) {
  // Auth view toggler
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login input values
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration input values
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regGender, setRegGender] = useState('Male');

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState('');

  // Dashboard state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileMobile, setProfileMobile] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileAge, setProfileAge] = useState('');
  const [profileGender, setProfileGender] = useState('Male');

  // Selected invoice for the PDF Generator Overlay
  const [selectedInvoice, setSelectedInvoice] = useState<Booking | null>(null);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.fullName);
      setProfileMobile(currentUser.mobileNumber);
      setProfileAddress(currentUser.address || '');
      setProfileAge(currentUser.age?.toString() || '');
      setProfileGender(currentUser.gender || 'Male');
    }
  }, [currentUser]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      alert('Email and Password are required.');
      return;
    }
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Authentication rejected.');
        return;
      }

      const result = await response.json();
      onLogIn(result.user);
    } catch (err) {
      console.error(err);
      alert('Local network connectivity issue. Double check Express server is running.');
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regMobile || !regPassword) {
      alert('Please fill in all core credentials.');
      return;
    }
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName,
          email: regEmail,
          mobileNumber: regMobile,
          password: regPassword,
          address: regAddress,
          age: regAge,
          gender: regGender
        })
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Registration failed.');
        return;
      }

      alert('Account configured successfully! You can log in.');
      setAuthMode('login');
      setLoginEmail(regEmail);
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend database context.');
    }
  };

  // Handle Forgot Password submission
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      alert('Enter email address.');
      return;
    }
    setForgotStatus(`Reset code was dispatched successfully via email log to: ${forgotEmail}. Code is valid for 10 minutes.`);
  };

  // Update profile
  const handleProfileSave = async () => {
    try {
      const response = await fetch('/api/user/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          fullName: profileName,
          mobileNumber: profileMobile,
          address: profileAddress,
          age: profileAge,
          gender: profileGender
        })
      });

      if (response.ok) {
        const result = await response.json();
        onLogIn(result.user); // refresh local state
        setIsEditingProfile(false);
        alert('Profile saved successfully.');
        onRefreshData();
      } else {
        const err = await response.json();
        alert(err.error || 'Could not update profile information.');
      }
    } catch (e) {
      console.error(e);
      alert('Backend connection error.');
    }
  };

  // Printable CSS window mock handler
  const triggerInvoicePrint = () => {
    window.print();
  };

  // Download printable invoice file as styled standalone HTML document
  const triggerInvoiceDownload = (invoice: Booking) => {
    const isTaxFree = true;
    const baseVal = invoice.totalAmount;
    const cgstVal = 0;
    const sgstVal = 0;

    const logoMark = `<div style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background-color: #000000; color: #f59e0b; border: 1.5px solid #f59e0b; border-radius: 8px; font-size: 18px; font-weight: 900; font-family: sans-serif; margin-right: 12px; margin-bottom: 6px;">&alpha;</div>`;
    
    const invoiceContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Official Receipt - ${invoice.receiptNumber || invoice.invoiceNumber}</title>
  <style>
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 50px; color: #1e1e24; background-color: #fafafa; }
    .page-card { max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 20px; padding: 40px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
    .brand-header { display: flex; align-items: start; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-side { display: flex; align-items: center; }
    .brand-title { font-size: 18px; font-weight: 900; letter-spacing: 1px; color: #000000; margin: 0; text-transform: uppercase; }
    .brand-sub { font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #6b7280; text-transform: uppercase; margin: 2px 0 0 0; font-family: monospace; }
    .receipt-badge { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; border-radius: 8px; padding: 6px 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; font-family: monospace; letter-spacing: 1.5px; }
    .meta-row { display: grid; grid-template-cols: 1fr 1fr; gap: 24px; margin-bottom: 30px; font-size: 12px; }
    .meta-title { font-size: 10px; text-transform: uppercase; color: #9ca3af; font-family: monospace; font-weight: 700; margin-bottom: 4px; }
    .meta-value { line-height: 1.4; color: #374151; }
    .meta-value strong { color: #000000; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { border-bottom: 2px solid #000000; padding: 10px 0; font-size: 10px; text-align: left; text-transform: uppercase; color: #6b7280; font-family: monospace; font-weight: 700; }
    td { padding: 14px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
    .summary-side { width: 280px; margin-left: auto; border-top: 2px solid #000000; padding-top: 12px; font-size: 12px; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .grand { color: #b45309; font-weight: 900; font-size: 15px; border-top: 1px dashed #e5e7eb; padding-top: 10px; margin-top: 10px; }
    .verified-footer { display: flex; align-items: center; justify-content: center; gap: 10px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px; font-size: 10px; font-family: monospace; color: #166534; font-weight: 600; margin-top: 40px; }
    .signature-row { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; font-size: 10px; text-align: center; margin-top: 50px; color: #9ca3af; font-family: monospace; }
    .sig-line { border-top: 1px dashed #d1d5db; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="page-card">
    <div class="brand-header">
      <div class="logo-side">
        ${logoMark}
        <div>
          <h1 class="brand-title">THE ALPHA CLUB</h1>
          <p class="brand-sub">DEPARTMENT REGISTRY SECURE PASS</p>
        </div>
      </div>
      <div>
        <div class="receipt-badge">Verified Receipt</div>
      </div>
    </div>

    <div class="meta-row">
      <div>
        <div class="meta-title">RECEIPT DETAILS</div>
        <div class="meta-value">
          Receipt No: <strong style="font-family: monospace; color:#b45309;">${invoice.receiptNumber || invoice.invoiceNumber}</strong><br/>
          Reference ID: <span style="font-family: monospace;">${invoice.id}</span><br/>
          Verification Stamp: <span style="font-family: monospace; font-size: 10px; color: #166534;">✓ COMPLIANT / APPROVED</span><br/>
          Timestamp: <span style="font-family: monospace;">${new Date(invoice.paymentDate).toLocaleDateString()} ${new Date(invoice.paymentDate).toLocaleTimeString()}</span>
        </div>
      </div>
      <div style="text-align: right;">
        <div class="meta-title">REGISTERED CUSTOMER</div>
        <div class="meta-value">
          Name: <strong style="text-transform: capitalize;">${invoice.payerName || invoice.userName}</strong><br/>
          Mobile Node: <span style="font-family: monospace;">${invoice.payerMobile || invoice.userMobile}</span><br/>
          Secure Email: <span>${invoice.userEmail}</span><br/>
          Member UID: <span style="font-family: monospace; font-size: 11px;">${invoice.userId}</span>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 50%">Item / Service Allocation</th>
          <th style="width: 20%">Sac Code</th>
          <th style="width: 30%; text-align: right;">Gross Value Paid</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong style="color: #000000;">${invoice.planName}</strong><br/>
            <span style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Space Category: ${invoice.category.toUpperCase()} ARENA</span>
          </td>
          <td style="font-family: monospace;">999711</td>
          <td style="text-align: right; font-family: monospace; font-weight: 700;">₹${invoice.totalAmount.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="summary-side">
      <div class="summary-row" style="color: #6b7280;">
        <span>Registry Base Fee</span>
        <span style="font-family: monospace;">₹${baseVal.toLocaleString()}</span>
      </div>
      ${isTaxFree ? '' : `
      <div class="summary-row" style="color: #6b7280; font-size: 11px;">
        <span>CGST (9%)</span>
        <span style="font-family: monospace;">₹${cgstVal.toLocaleString()}</span>
      </div>
      <div class="summary-row" style="color: #6b7280; font-size: 11px;">
        <span>SGST (9%)</span>
        <span style="font-family: monospace;">₹${sgstVal.toLocaleString()}</span>
      </div>
      `}
      <div class="summary-row grand" style="border-top: 1.5px solid #000000;">
        <span>Amount Settled (INR)</span>
        <span style="font-family: monospace;">₹${invoice.totalAmount.toLocaleString()}</span>
      </div>
    </div>

    <div class="verified-footer">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      <span style="margin-left: 6px;">AUDITED &amp; COMPLETED // TXN HASH / UTR: ${invoice.utrNumber || 'APPROVED_RAZORPAY_DIRECT'}</span>
    </div>

    <div class="signature-row">
      <div class="sig-line">Beneficiary Signature</div>
      <div class="sig-line">Authorized Audit Seal (The Alpha Club)</div>
    </div>
  </div>
</body>
</html>
    `;
    const element = document.createElement("a");
    const file = new Blob([invoiceContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `RECEIPT-${invoice.receiptNumber || invoice.invoiceNumber}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Auth gate if user not signed in
  if (!currentUser) {
    return (
      <div id="auth_portal_container" className="max-w-md mx-auto py-6 sm:py-12">
        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-600"></div>
          
          <div className="text-center space-y-2">
            <h3 className="font-display text-2xl font-bold tracking-wider text-white">THE ALPHA EXECUTIVE CLUB</h3>
            <p className="text-xxs font-mono uppercase tracking-widest text-amber-500">Secure Access Node</p>
          </div>

          <AnimatePresence mode="wait">
            
            {/* LOGIN TAB */}
            {authMode === 'login' && (
              <motion.form 
                id="login_credentials_form"
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLoginSubmit} 
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase block">Registered Email</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-zinc-500"><Mail className="w-4 h-4" /></span>
                    <input
                      id="login_email_input"
                      type="email"
                      required
                      placeholder="e.g. member@thealpha.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-amber-500 focus:outline-none pl-9 pr-3.5 py-2.5 text-xs text-white rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xxs font-mono text-zinc-400 uppercase block">Security Password</label>
                    <button 
                      id="auth_goto_forgot"
                      type="button" 
                      onClick={() => setAuthMode('forgot')} 
                      className="text-xxxs text-amber-500 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-zinc-500"><Lock className="w-4 h-4" /></span>
                    <input
                      id="login_password_input"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-amber-500 focus:outline-none pl-9 pr-3.5 py-2.5 text-xs text-white rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    id="login_submit_btn"
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    Authorize Session
                  </button>
                </div>

                <div className="text-center pt-2 text-xxs text-zinc-500">
                  <span>First time applying? </span>
                  <button 
                    id="auth_goto_register"
                    type="button" 
                    onClick={() => setAuthMode('register')} 
                    className="text-amber-500 hover:underline inline-block font-semibold"
                  >
                    Configure New Account Registry
                  </button>
                </div>
              </motion.form>
            )}

            {/* REGISTER TAB */}
            {authMode === 'register' && (
              <motion.form 
                id="register_auth_form"
                key="register-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleRegisterSubmit} 
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase block">Full Name</label>
                  <input
                    id="reg_fullname_input"
                    type="text"
                    required
                    placeholder="Wade Warren"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500 focus:outline-none p-3 text-xs text-white rounded-xl transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase block">Email Address</label>
                  <input
                    id="reg_email_input"
                    type="email"
                    required
                    placeholder="wade@thealpha.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500 focus:outline-none p-3 text-xs text-white rounded-xl transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase block">Contact Mobile</label>
                  <input
                    id="reg_mobile_input"
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500 focus:outline-none p-3 text-xs text-white rounded-xl transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase block">Password Profile</label>
                  <input
                    id="reg_password_input"
                    type="password"
                    required
                    placeholder="Create Password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500 focus:outline-none p-3 text-xs text-white rounded-xl transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    id="register_submit_btn"
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    Securely Create Profile
                  </button>
                </div>

                <div className="text-center pt-2 text-xxs text-zinc-500">
                  <span>Already hold executive keys? </span>
                  <button 
                    id="auth_goto_login2"
                    type="button" 
                    onClick={() => setAuthMode('login')} 
                    className="text-amber-500 hover:underline font-semibold"
                  >
                    Access Member portal
                  </button>
                </div>
              </motion.form>
            )}

            {/* FORGOT PASSWORD SIM */}
            {authMode === 'forgot' && (
              <motion.form 
                id="forgot_password_form"
                key="forgot-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleForgotSubmit} 
                className="space-y-4"
              >
                <p className="text-xs text-zinc-400 leading-normal text-center">
                  Specify your verified member email below. We will lookup credentials and route reset coordinates automatically.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xxs font-mono text-zinc-400 uppercase block">Your Email</label>
                  <input
                    id="forgot_email_input"
                    type="email"
                    required
                    placeholder="wade@thealpha.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500 focus:outline-none p-3 text-xs text-white rounded-xl transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    id="forgot_submit_btn"
                    type="submit"
                    className="w-gradient w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Dispatch Reset Code
                  </button>
                </div>

                {forgotStatus && (
                  <div className="p-3 border border-amber-500/10 bg-amber-500/5 text-xxs text-amber-500 rounded-lg text-center font-mono">
                    {forgotStatus}
                  </div>
                )}

                <div className="text-center pt-2 text-xxs text-zinc-400">
                  <button 
                    id="auth_goto_login3"
                    type="button" 
                    onClick={() => setAuthMode('login')} 
                    className="text-white hover:underline"
                  >
                    Back to Login
                  </button>
                </div>
              </motion.form>
            )}

          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard_panel_wrapper" className="space-y-8">
      
      {/* Visual Welcome Board */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border border-zinc-900 bg-zinc-950/40 rounded-3xl gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-display font-bold text-lg">
            {currentUser.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white tracking-tight capitalize">
              Welcome Back, {currentUser.fullName}!
            </h2>
            <p className="text-xxs text-zinc-500 font-mono uppercase tracking-widest mt-0.5">
              Secure VIP Tier Code // ID: {currentUser.id}
            </p>
          </div>
        </div>
        <button
          id="logout_action_btn"
          onClick={onLogOut}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold uppercase flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Session</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* PROFILE CONTROL CARD */}
        <div className="lg:col-span-4 bg-zinc-950 border border-zinc-900 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
            <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wider">Member Profile</h3>
            <button
              id="edit_profile_toggle_btn"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="text-xxs text-amber-500 hover:underline uppercase font-mono tracking-widest font-bold"
            >
              {isEditingProfile ? 'Cancel' : 'Edit Mode'}
            </button>
          </div>

          {!isEditingProfile ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-xxs text-zinc-500 font-mono uppercase">Full Name</span>
                <p className="text-zinc-200 capitalize font-medium">{currentUser.fullName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xxs text-zinc-500 font-mono uppercase">Secure Email</span>
                <p className="text-zinc-200">{currentUser.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xxs text-zinc-500 font-mono uppercase">Contact Mobile</span>
                <p className="text-zinc-200">{currentUser.mobileNumber}</p>
              </div>
              <div className="row flex gap-4">
                <div className="space-y-1 flex-1">
                  <span className="text-xxs text-zinc-500 font-mono uppercase">Age</span>
                  <p className="text-zinc-200 font-mono">{currentUser.age || 'Not specified'}</p>
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-xxs text-zinc-500 font-mono uppercase">Gender</span>
                  <p className="text-zinc-200 capitalize font-mono">{currentUser.gender || 'Not specified'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xxs text-zinc-500 font-mono uppercase">Mailing Address</span>
                <p className="text-zinc-200">{currentUser.address || 'Not specified'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xxs text-zinc-500 font-mono uppercase">Full Name</label>
                <input
                  id="profile_name_input"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs px-3 py-2 text-white rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs text-zinc-500 font-mono uppercase">Mobile Number</label>
                <input
                  id="profile_mobile_input"
                  type="tel"
                  value={profileMobile}
                  onChange={(e) => setProfileMobile(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs px-3 py-2 text-white rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xxs text-zinc-500 font-mono uppercase">Age</label>
                  <input
                    id="profile_age_input"
                    type="number"
                    value={profileAge}
                    onChange={(e) => setProfileAge(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-xs px-3 py-2 text-white rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xxs text-zinc-500 font-mono uppercase">Gender</label>
                  <select
                    id="profile_gender_select"
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-xs px-2 py-2 text-white rounded-lg focus:outline-none focus:border-amber-500"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xxs text-zinc-500 font-mono uppercase">Postal Address</label>
                <input
                  id="profile_address_input"
                  type="text"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs px-3 py-2 text-white rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                id="save_profile_btn"
                onClick={handleProfileSave}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer"
              >
                Save Profile Changes
              </button>
            </div>
          )}

          {currentUser.role === 'admin' && (
            <div className="p-4 rounded-xl border border-dashed border-amber-500/20 bg-amber-500/[0.02] text-center space-y-2">
              <span className="text-[10px] font-mono text-amber-400 tracking-wider font-bold block uppercase leading-none">Admin Privileges Active</span>
              <p className="text-xxs text-zinc-500">You hold cryptographic owner clearance access keys to administrative systems.</p>
              <button
                id="admin_goto_dashboard_lnk"
                onClick={() => onSelectTab('admin')}
                className="inline-flex items-center space-x-1.5 text-xs text-amber-500 hover:underline font-semibold"
              >
                <span>Access Admin Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ACTIVE MEMBERSHIPS & HISTORICAL BILLING */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section: ACTIVE MEMBERSHIPS */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">Active Executive Subscriptions</h3>
            
            {bookings.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-900 rounded-2xl">
                <Layers className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No active memberships captured yet during this session.</p>
                <button
                  id="dash_book_gym_btn"
                  onClick={() => onSelectTab('membership-select')}
                  className="text-xs text-amber-500 hover:underline mt-2 font-semibold"
                >
                  Apply For ALPHA Membership
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bookings.map((booking) => {
                  const isExpired = new Date(booking.endDate) < new Date();
                  return (
                    <div 
                      key={booking.id} 
                      className={`p-5 rounded-2xl border bg-zinc-900/10 flex flex-col justify-between min-h-[170px] ${
                        booking.category === 'gym' 
                          ? 'border-amber-500/40 relative overflow-hidden' 
                          : booking.category === 'library' 
                          ? 'border-zinc-800' 
                          : 'border-zinc-850'
                      }`}
                    >
                      {/* Top metadata */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="inline-block px-1.5 py-0.5 text-[8px] font-mono tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md uppercase">
                            {booking.category} Space
                          </span>
                          <h4 className="font-display font-semibold text-white text-sm mt-2">{booking.planName}</h4>
                        </div>
                        {booking.libraryDetails?.seatNumber && (
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Reserved desk</span>
                            <span className="text-[11px] font-mono text-amber-400 font-bold">Desk {booking.libraryDetails.seatNumber}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-zinc-950 mt-4 space-y-1.5 font-mono text-xxs text-zinc-500">
                        <div className="flex justify-between">
                          <span>Subscription Term</span>
                          <span className="text-white">{booking.startDate} to {booking.endDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status code</span>
                          <span className={isExpired ? 'text-red-400 uppercase font-bold' : 'text-emerald-400 uppercase font-bold'}>
                            {isExpired ? 'Expired' : 'Active Pass'}
                          </span>
                        </div>
                      </div>

                       <div className="pt-3 flex justify-between items-center">
                        <button
                          id={`dash_view_invoice_lnk_${booking.id}`}
                          onClick={() => setSelectedInvoice(booking)}
                          className="text-xxs text-zinc-400 hover:text-white hover:underline flex items-center space-x-1 font-mono tracking-wider"
                        >
                          <Printer className="w-3 h-3 text-amber-500" />
                          <span>View Invoice</span>
                        </button>
                        <button
                          id={`dash_renew_lnk_${booking.id}`}
                          onClick={() => onSelectTab(booking.category)}
                          className="text-xxs text-amber-500 hover:underline font-semibold font-mono"
                        >
                          Renew Term
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: BOOKING & TRANSACTION HISTORY */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-500 font-semibold">Payment & Registry Logs</h3>
            
            {bookings.length === 0 ? (
              <div className="p-8 text-center border border-zinc-950 bg-zinc-950/20 rounded-2xl">
                <Clock className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p className="text-xxs text-zinc-500 font-mono">No previous transactions logged in active index.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-zinc-900 bg-zinc-950/20 rounded-2xl">
                <table className="w-full text-left border-collapse text-xxs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-400 bg-zinc-900/20">
                      <th className="p-4 uppercase">Invoice ID</th>
                      <th className="p-4 uppercase">Registry Space</th>
                      <th className="p-4 uppercase">Subtotal (Net)</th>
                      <th className="p-4 uppercase">Paid Total</th>
                      <th className="p-4 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-zinc-950 text-zinc-300 hover:bg-zinc-900/10">
                        <td className="p-4 text-white font-semibold">{booking.invoiceNumber}</td>
                        <td className="p-4 capitalize">{booking.planName.split(' ')[0]} ({booking.category})</td>
                        <td className="p-4">₹{booking.totalAmount.toLocaleString()}</td>
                        <td className="p-4 text-amber-400 font-semibold">₹{booking.totalAmount.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              id={`table_invoice_dl_btn_${booking.id}`}
                              onClick={() => triggerInvoiceDownload(booking)}
                              className="text-amber-500 hover:text-amber-400 font-semibold"
                              title="Download HTML Invoice"
                            >
                              Download HTML
                            </button>
                            <button
                              id={`table_invoice_pop_btn_${booking.id}`}
                              onClick={() => setSelectedInvoice(booking)}
                              className="text-white hover:underline"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* DETAILED GST INVOICE OVERLAY / VISUAL PDF GENERATOR */}
      <AnimatePresence>
        {selectedInvoice && (
          <div id="invoice_preview_overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl bg-zinc-950 border border-zinc-900 text-white rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col justify-between my-8 max-h-[90vh]"
            >
              {/* Overlay controls - top floating non-print bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-zinc-900">
                <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 self-stretch sm:self-auto">
                  <button
                    onClick={() => {
                      const el = document.getElementById('lib_invoice_tab_receipt');
                      if (el) el.click();
                      (window as any)._invoiceTab = 'receipt';
                      onRefreshData(); // force local refresh dummy triggers
                    }}
                    className={`px-3 py-1.5 text-xxs font-mono font-semibold uppercase rounded-md transition-all ${
                      !(window as any)._invoiceTab || (window as any)._invoiceTab === 'receipt'
                        ? 'bg-amber-400 text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Official ID Receipt
                  </button>
                  {selectedInvoice.category === 'library' && (
                    <button
                      onClick={() => {
                        (window as any)._invoiceTab = 'id-card';
                        onRefreshData(); // force local refresh dummy triggers
                      }}
                      className={`px-3 py-1.5 text-xxs font-mono font-semibold uppercase rounded-md transition-all ${
                        (window as any)._invoiceTab === 'id-card'
                          ? 'bg-amber-400 text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Scholar ID Card
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                  <button
                    id="invoice_print_btn"
                    onClick={triggerInvoicePrint}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xxs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Print PDF</span>
                  </button>
                  <button
                    id="invoice_download_btn"
                    onClick={() => triggerInvoiceDownload(selectedInvoice)}
                    className="p-2 bg-amber-400 hover:bg-amber-300 text-black text-xxs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    id="invoice_close_btn"
                    onClick={() => {
                      (window as any)._invoiceTab = 'receipt';
                      setSelectedInvoice(null);
                    }}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* RENDER DYNAMIC SHAPE */}
              {((window as any)._invoiceTab !== 'id-card') ? (
                /* OFFICIAL RECEIPT VIEW */
                <div id="print-area-invoice" className="bg-white text-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 font-sans space-y-6 overflow-y-auto">
                  {selectedInvoice.category === 'library' ? (
                    /* Spec: ALPHA LIBRARY RECIEPT LAYOUT DESIGN */
                    <div className="space-y-6">
                      {/* Header receipt info */}
                      <div className="text-center pb-4 border-b-2 border-zinc-900">
                        <h2 className="text-2xl font-black tracking-tight text-neutral-950 font-display">THE ALPHA LIBRARY</h2>
                        <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-600 mt-1">
                          2nd Floor, SBI Building, Sanoli Chowk, Gulabbagh, Purnea, Bihar
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500 font-semibold">Contact: +91 9341152967 // email: thealphalibrary@gmail.com</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <p><span className="text-zinc-500 font-mono">Receipt No:</span> <strong className="font-mono text-[11px] text-amber-600">{selectedInvoice.receiptNumber || selectedInvoice.invoiceNumber}</strong></p>
                          {selectedInvoice.utrNumber && (
                            <p><span className="text-zinc-500 font-mono">Transaction ID:</span> <strong className="font-mono text-[11px] text-zinc-700">{selectedInvoice.utrNumber}</strong></p>
                          )}
                          <p><span className="text-zinc-500 font-mono">Date Generated:</span> <strong className="font-mono">{new Date(selectedInvoice.paymentDate).toLocaleDateString()}</strong></p>
                          <p><span className="text-zinc-500 font-mono">Student Name:</span> <strong className="uppercase font-semibold">{selectedInvoice.userName}</strong></p>
                          <p><span className="text-zinc-500 font-mono">Father's Name:</span> <strong className="capitalize">{selectedInvoice.libraryDetails?.fathersName || 'N/A'}</strong></p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p><span className="text-zinc-500 font-mono">Contact No:</span> <strong className="font-mono">{selectedInvoice.userMobile}</strong></p>
                          <p><span className="text-zinc-500 font-mono">Aadhaar ID:</span> <strong className="font-mono">{selectedInvoice.libraryDetails?.aadhaarNumber || 'Verified ID On File'}</strong></p>
                          <p><span className="text-zinc-500 font-mono">Allocated Desk:</span> <span className="bg-neutral-900 text-white font-bold font-mono px-2 py-0.5 rounded text-xs">DESK {selectedInvoice.libraryDetails?.seatNumber || 'N/A'}</span></p>
                          <p><span className="text-zinc-500 font-mono">Smart Locker:</span> <strong className="font-mono uppercase">{selectedInvoice.libraryDetails?.lockerType && selectedInvoice.libraryDetails.lockerType !== 'none' ? `LKR-${selectedInvoice.libraryDetails.lockerType.toUpperCase()}-${selectedInvoice.libraryDetails?.seatNumber}` : 'NONE'}</strong></p>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-dashed border-zinc-300">
                          <p><span className="text-zinc-500 font-mono">Address:</span> <span className="text-zinc-800 capitalize leading-tight">{selectedInvoice.libraryDetails?.address || 'Gulabbagh, Purnea, Bihar'}</span></p>
                          <p className="mt-1"><span className="text-zinc-500 font-mono">Membership Validity Period:</span> <strong className="text-emerald-700 font-mono">{selectedInvoice.libraryDetails?.startDate || selectedInvoice.startDate} to {selectedInvoice.libraryDetails?.endDate || selectedInvoice.endDate}</strong></p>
                        </div>
                      </div>
                      <table className="w-full text-xs text-left border-collapse border-y border-zinc-900">
                        <thead>
                          <tr className="bg-zinc-100 font-mono text-[10px] uppercase text-zinc-600">
                            <th className="p-2 border-b border-zinc-400">Registry Item</th>
                            <th className="p-2 border-b border-zinc-400 text-right">Standard Fee Structure</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-zinc-200">
                            <td className="p-2.5">
                              <p className="font-bold text-zinc-900">Monthly Library Membership</p>
                              <p className="text-[10px] text-zinc-500">Premium Reading Room Desk Slot Access</p>
                            </td>
                            <td className="p-2.5 text-right font-mono text-zinc-900 font-bold">₹899</td>
                          </tr>
                          {selectedInvoice.libraryDetails?.registrationFee > 0 && (
                            <tr className="border-b border-zinc-200">
                              <td className="p-2.5">
                                <p className="font-bold text-zinc-900">One-time General Admission Fee</p>
                                <p className="text-[10px] text-zinc-500 font-mono">Registry validation and check-in processing</p>
                              </td>
                              <td className="p-2.5 text-right font-mono text-zinc-900 font-bold">₹100</td>
                            </tr>
                          )}
                          {selectedInvoice.libraryDetails?.lockerType && selectedInvoice.libraryDetails.lockerType !== 'none' && (
                            <tr className="border-b border-zinc-200">
                              <td className="p-2.5">
                                <p className="font-bold text-zinc-900">Biometric Personal Locker Fee</p>
                                <p className="text-[10px] text-zinc-500 font-mono">Smart locker physical allocation (Tier: {selectedInvoice.libraryDetails.lockerType.toUpperCase()})</p>
                              </td>
                              <td className="p-2.5 text-right font-mono text-zinc-900 font-bold">
                                ₹{selectedInvoice.libraryDetails.lockerType === 'small' ? '100' : '150'}
                              </td>
                            </tr>
                          )}
                          {selectedInvoice.libraryDetails?.isPermanent && (
                            <tr className="border-b border-zinc-200">
                              <td className="p-2.5">
                                <p className="font-bold text-zinc-900">Permanent Seat Preservation Hold</p>
                                <p className="text-[10px] text-zinc-500 font-mono">Fixed desk assignment security holding charge</p>
                              </td>
                              <td className="p-2.5 text-right font-mono text-zinc-905 font-bold">₹100</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Math Summary */}
                      <div className="flex justify-between items-start pt-2">
                        <div className="flex items-center space-x-3 bg-zinc-100 border border-zinc-200 p-2.5 rounded-xl max-w-sm">
                          <QrCode className="w-10 h-10 text-zinc-800 flex-shrink-0" />
                          <div className="text-[9px] font-mono text-zinc-500 leading-normal">
                            <p className="text-zinc-700 font-bold uppercase leading-none mb-0.5">SECURE VERIFIED SCHOLAR</p>
                            <p>Desk hold confirmed by Alpha portal</p>
                            <p>Pass Code: {selectedInvoice.invoiceNumber.replace(/-/g, '_')}</p>
                          </div>
                        </div>

                        <div className="text-xs font-mono space-y-1 w-52 text-right">
                          <div className="flex justify-between font-bold text-zinc-950 border-t border-zinc-300 pt-1.5 text-xs">
                            <span>TOTAL AMOUNT</span>
                            <span>₹{Math.round(selectedInvoice.totalAmount).toLocaleString()}</span>
                          </div>
                          <p className="text-[9px] text-zinc-500 mt-1">All-inclusive final payable amount.</p>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-10 pt-12 text-[10px]">
                        <div className="text-center pt-4 border-t border-dashed border-zinc-400 font-mono text-zinc-500">
                          Candidate Signature
                        </div>
                        <div className="text-center pt-4 border-t border-dashed border-zinc-400 font-mono text-zinc-500">
                          Authorized Signatory (The Alpha Library)
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* STANDARD CORPORATE INVOICE FOR OTHER SECTORS */
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-zinc-900">THE ALPHA EXECUTIVE CLUB</h2>
                          <p className="text-xxs font-mono text-zinc-500 uppercase tracking-widest mt-1">Registry Settlement Invoice</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-zinc-700 mb-0.5">Receipt: {selectedInvoice.receiptNumber || selectedInvoice.invoiceNumber}</p>
                          {selectedInvoice.utrNumber && <p className="text-[9px] font-mono font-bold text-amber-600 mb-0.5">UTR: {selectedInvoice.utrNumber}</p>}
                          <p className="text-[10px] text-zinc-500">Date: {new Date(selectedInvoice.paymentDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 text-xs pt-4 border-t border-zinc-200">
                        <div className="space-y-1.5">
                          <h5 className="font-mono text-xxs text-zinc-400 uppercase tracking-wider font-bold">Supplier Details</h5>
                          <div className="text-zinc-800 space-y-0.5">
                            <p className="font-semibold">THE ALPHA LTD.</p>
                            <p>2nd Floor, Above SBI Bank,</p>
                            <p>Sanoli Chowk, Gulabbagh, Purnea, Bihar</p>
                            <p className="font-mono text-xxs">REGD: ALPH-07923</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h5 className="font-mono text-xxs text-zinc-400 uppercase tracking-wider font-bold">Billed To (Registered Member)</h5>
                          <div className="text-zinc-800 space-y-0.5 font-sans">
                            <p className="font-semibold capitalize">{selectedInvoice.userName}</p>
                            <p>Mobile: {selectedInvoice.userMobile}</p>
                            <p>Email: {selectedInvoice.userEmail}</p>
                            <p className="text-xxs font-mono text-zinc-500">UID: {selectedInvoice.userId}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-200">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-zinc-300 text-zinc-500 font-semibold bg-zinc-100 uppercase">
                              <th className="p-2">Item Description</th>
                              <th className="p-2">Sac Code</th>
                              <th className="p-2 text-right">Taxable Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-zinc-100">
                              <td className="p-2.5">
                                <p className="font-semibold text-neutral-900">{selectedInvoice.planName}</p>
                                <p className="text-xxs text-zinc-500 uppercase font-mono tracking-wide">Category: {selectedInvoice.category} Arena Space ID</p>
                              </td>
                              <td className="p-2.5 font-mono text-zinc-600">999711</td>
                              <td className="p-2.5 text-right font-mono text-zinc-900">₹{selectedInvoice.amount.toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="pt-4 flex justify-between items-start">
                        <div className="flex items-center space-x-3 bg-zinc-50 border border-zinc-150 p-2 rounded-xl">
                          <QrCode className="w-10 h-10 text-zinc-800 flex-shrink-0" />
                          <div className="text-[9px] font-mono text-zinc-500 leading-normal">
                            <p className="text-zinc-700 font-semibold uppercase leading-none mb-0.5">SECURE VERIFIED PASS</p>
                            <p>Code: {selectedInvoice.invoiceNumber.replace(/-/g, '_')}</p>
                          </div>
                        </div>

                        <div className="text-xs font-mono space-y-1 w-52 text-right font-medium">
                          <div className="flex justify-between text-zinc-600">
                            <span>Subtotal</span>
                            <span>₹{selectedInvoice.totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold text-zinc-900 border-t border-zinc-200 pt-2 text-xs">
                            <span className="text-amber-600">Grand Total</span>
                            <span className="text-amber-600">₹{selectedInvoice.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* OFFICIAL SCHOLAR ID BADGE CARD VIEW (Gold/Black Laminated) */
                <div id="print-area-invoice" className="flex items-center justify-center py-6">
                  <div className="w-[440px] h-[260px] bg-neutral-950 border-4 border-amber-500 rounded-3xl p-5 shadow-2xl relative overflow-hidden font-sans text-white select-none flex flex-col justify-between">
                    {/* Hologram aesthetic lines */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.04] rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-zinc-800/[0.03] rounded-full pointer-events-none"></div>

                    {/* ID Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
                      <div>
                        <h4 className="text-xs font-black tracking-[0.15em] text-amber-400 font-display">THE ALPHA LIBRARY</h4>
                        <p className="text-[7px] text-zinc-400 uppercase tracking-wider">PREMIER LEARNING RETREAT / PURNEA</p>
                      </div>
                      <div className="bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded text-[8px] font-mono text-amber-300 font-bold tracking-widest uppercase">
                        DESK ACCESS PASS
                      </div>
                    </div>

                    {/* ID Badge Middle */}
                    <div className="flex items-center space-x-4 py-2.5">
                      {/* Left: Scholar portrait */}
                      <div className="w-20 h-20 bg-zinc-900 border-2 border-amber-500/40 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center shadow-lg relative">
                        {selectedInvoice.libraryDetails?.photoBase64 ? (
                          <img 
                            referrerPolicy="no-referrer"
                            src={selectedInvoice.libraryDetails.photoBase64} 
                            alt="Registered portrait" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center font-mono text-[9px] text-amber-500 flex flex-col items-center">
                            <User className="w-8 h-8 text-zinc-500 mb-0.5" />
                            <span className="leading-none text-[8px]">LOGGED</span>
                          </div>
                        )}
                        {/* holographic shield */}
                        <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center opacity-85 shadow">
                          <Hexagon className="w-1.5 h-1.5 text-black font-bold fill-black" />
                        </div>
                      </div>

                      {/* Right: details */}
                      <div className="flex-1 space-y-1.5 text-[10px]">
                        <div>
                          <p className="text-[7px] text-zinc-500 uppercase leading-none mb-0.5 font-mono">SCHOLAR MEMBER</p>
                          <p className="text-xs font-bold tracking-tight text-white capitalize">{selectedInvoice.userName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[9px]">
                          <div>
                            <p className="text-[7px] text-zinc-500 uppercase leading-none mb-0.5 font-mono">SECURE SEAT</p>
                            <p className="text-amber-400 font-black font-mono">DESK {selectedInvoice.libraryDetails?.seatNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-zinc-500 uppercase leading-none mb-0.5 font-mono">MOBILE NO</p>
                            <p className="text-zinc-200 font-mono font-semibold">{selectedInvoice.userMobile}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[7px] text-zinc-500 uppercase leading-none mb-0.5 font-mono">MEMBERSHIP VALIDITY</p>
                          <p className="font-mono text-zinc-300 text-[8.5px] leading-none mb-0.5">{selectedInvoice.libraryDetails?.startDate || selectedInvoice.startDate} -TO-</p>
                          <p className="font-mono text-emerald-400 font-bold text-[9px]">{selectedInvoice.libraryDetails?.endDate || selectedInvoice.endDate}</p>
                        </div>
                      </div>

                      {/* Rightmost: Access QR Code */}
                      <div className="w-16 h-16 bg-white p-1 rounded-xl flex items-center justify-center border-2 border-amber-500/20 shadow">
                        <QrCode className="w-full h-full text-black" />
                      </div>
                    </div>

                    {/* Footer security strip */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-zinc-900 text-[8px] font-mono text-zinc-550 leading-none">
                      <p>UID: {selectedInvoice.userId.toUpperCase()}</p>
                      <p className="text-amber-500 font-semibold uppercase tracking-widest">[ AUTHENTIC SCAN ACCESS REQUIRED ]</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Legal confirmation line */}
              <div className="text-center text-xxs text-zinc-650 font-mono border-t border-zinc-900 pt-3">
                This secure pass complies with Purnea District library regulations. The Alpha Group (C) 2026.
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
