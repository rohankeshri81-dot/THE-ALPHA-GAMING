import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Receipt, 
  ArrowRight, 
  Sparkles, 
  Award, 
  UtensilsCrossed, 
  Printer, 
  Clock, 
  Bike 
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import { Booking } from '../types';

interface CafeMenuSectionProps {
  currentUser: any;
  onBookingSuccess: (booking: Booking) => void;
  onOpenDashboard: () => void;
  masterCart?: any[];
  addToMasterCart?: (item: any) => void;
  removeFromMasterCart?: (itemId: string) => void;
  openCartDrawer?: () => void;
  updateMasterCartQty?: (itemId: string, increment: number) => void;
}

export default function CafeMenuSection({ 
  currentUser, 
  onBookingSuccess, 
  onOpenDashboard,
  masterCart,
  addToMasterCart,
  removeFromMasterCart,
  openCartDrawer,
  updateMasterCartQty
}: CafeMenuSectionProps) {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Cart Management
  const [cart, setCart] = useState<Array<{ item: any; quantity: number }>>([]);
  
  // Checkout Form
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');

  // Payment State
  const [showPayment, setShowPayment] = useState(false);
  const [lastCafeInvoice, setLastCafeInvoice] = useState<Booking | null>(null);

  // Dynamic Banners
  const [banners, setBanners] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchCafeMenuAndBanners = async () => {
    try {
      setLoading(true);
      // Fetch Cafe Items
      const menuRes = await fetch('/api/cafe/menu');
      if (menuRes.ok) {
        const data = await menuRes.json();
        setMenuItems(data || []);
      }

      // Fetch Cafe / Host Banners
      const bannersRes = await fetch('/api/banners');
      if (bannersRes.ok) {
        const bannersData = await bannersRes.json();
        const activeBanners = (bannersData || []).filter(
          (b: any) => b.isActive && (
            b.targetPage === 'cafe' || 
            b.targetPage === 'gaming' || 
            b.targetPage === 'offer' || 
            b.type === 'cafe' || 
            b.type === 'gaming' || 
            b.type === 'offer'
          )
        );
        setBanners(activeBanners);
      }
    } catch (e) {
      console.error("Failed to load cafe data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCafeMenuAndBanners();
  }, []);

  // Autoplay slider for Cafe Banners
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [banners]);

  // Synchronize cart state from masterCart if provided
  useEffect(() => {
    if (masterCart && menuItems.length > 0) {
      const cItems: Array<{ item: any; quantity: number }> = [];
      masterCart.forEach(mItem => {
        if (mItem.category === 'cafe') {
          const menuId = mItem.details?.productId || mItem.id.replace('cafe_', '');
          const matched = menuItems.find(itm => itm.id === menuId || itm.id === mItem.id);
          cItems.push({
            item: matched || { id: mItem.id, name: mItem.name, price: mItem.price },
            quantity: mItem.quantity
          });
        }
      });
      setCart(cItems);
    }
  }, [masterCart, menuItems]);

  // Cart operations
  const addToCart = (item: any) => {
    if (addToMasterCart && updateMasterCartQty) {
      const existing = masterCart?.find(i => i.id === `cafe_${item.id}`);
      if (existing) {
        updateMasterCartQty(existing.id, 1);
      } else {
        addToMasterCart({
          id: `cafe_${item.id}`,
          category: 'cafe',
          name: item.name,
          price: item.price,
          quantity: 1,
          details: {
            productId: item.id,
            name: item.name,
            category: 'cafe'
          }
        });
      }
    } else {
      setCart(prev => {
        const existing = prev.find(i => i.item.id === item.id);
        if (existing) {
          return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, { item, quantity: 1 }];
      });
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    if (addToMasterCart && updateMasterCartQty) {
      const existing = masterCart?.find(i => i.id === `cafe_${itemId}`);
      if (existing) {
        if (existing.quantity + delta <= 0) {
          removeFromMasterCart?.(existing.id);
        } else {
          updateMasterCartQty(existing.id, delta);
        }
      } else if (delta > 0) {
        const itm = menuItems.find(m => m.id === itemId);
        if (itm) {
          addToCart(itm);
        }
      }
    } else {
      setCart(prev => {
        const existing = prev.find(i => i.item.id === itemId);
        if (!existing) {
          if (delta > 0) {
            const itm = menuItems.find(m => m.id === itemId);
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
    }
  };

  const removeFromCart = (itemId: string) => {
    if (removeFromMasterCart) {
      removeFromMasterCart(`cafe_${itemId}`);
    } else {
      setCart(prev => prev.filter(i => i.item.id !== itemId));
    }
  };

  const cartSubtotal = cart.reduce((acc, current) => acc + (current.item.price * current.quantity), 0);

  const handleCheckoutTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Please add at least one item to your cart before checking out.");
      return;
    }
    if (!fullName || !mobileNumber) {
      alert("Please fill in your name and contact number for the cafe order logs.");
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
    setCart([]);
    setLastCafeInvoice(booking);
    onBookingSuccess(booking);
  };

  const triggerWindowPrint = () => {
    window.print();
  };

  // Filter Catalog
  const categories = ['All', 'Hot Beverages', 'Sandwiches', 'Quick Bites', 'Cold Drinks', 'Falooda Specials', 'Mocktails'];
  
  const filteredMenuItems = menuItems.filter(itm => {
    if (!itm.isEnabled) return false;
    const matchesCategory = activeCategory === 'All' || itm.category === activeCategory;
    const matchesSearch = itm.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="cafe_section_container" className="py-2.5 space-y-12 block">
      {/* BRAND BANNER HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-3 animate-fade-in">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full mb-2">
          <UtensilsCrossed className="w-5 h-5 animate-spin" />
        </div>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-white uppercase sm:text-4xl">
          THE ALPHA <span className="text-amber-400">DELUXE CAFE</span>
        </h2>
        <p className="text-xs text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Sip on freshly brewed hot coffees, cold custom mocktails, cheese-loaded sandwiches, and crisp fries. Cooked and delivered straight to your gaming desk or library cabinet.
        </p>
      </div>

      {/* DYNAMIC POSTERS CAROUSEL */}
      {banners.length > 0 && (
        <div className="max-w-4xl mx-auto overflow-hidden relative rounded-3xl border border-zinc-900 bg-zinc-950/20 group select-none">
          <div className="h-44 sm:h-64 w-full relative">
            {banners.map((b, idx) => (
              <div
                key={b.id}
                className={`absolute inset-0 transition-opacity duration-700 flex items-center justify-center ${
                  idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent flex flex-col justify-end p-6">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-amber-400 bg-black/75 px-2.5 py-1 rounded w-fit border border-zinc-900 mb-2 uppercase">
                    CAFE SPECIAL PROMOTION
                  </span>
                  <h3 className="font-display text-lg sm:text-2xl font-bold text-white tracking-tight leading-none uppercase">
                    {b.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!lastCafeInvoice ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* MENU SECTION */}
          <div className="lg:col-span-8 space-y-6">
            {/* Filter controls */}
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-3xl flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search input to parse item */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-zinc-550 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="cafe_search_input"
                  type="text"
                  placeholder="Query menu item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-900/60 border border-zinc-800 text-white rounded-xl text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Scrollable list of categories */}
              <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                {categories.map(cat => (
                  <button
                    id={`cafe_cat_filter_${cat.toLowerCase().replace(/\s+/g, "_")}`}
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-zinc-900/50 text-zinc-400 hover:text-white border border-zinc-900'
                    }`}
                  >
                    {cat === 'All' ? 'All Items' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            {loading ? (
              <p className="text-xs font-mono text-zinc-500 animate-pulse">Loading cafe refreshments menu...</p>
            ) : filteredMenuItems.length === 0 ? (
              <div className="p-10 border border-dashed border-zinc-900 rounded-3xl text-center text-xs text-zinc-550">
                No active kitchen items found matching filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMenuItems.map(itm => {
                  const qtyInCart = cart.find(c => c.item.id === itm.id)?.quantity || 0;
                  return (
                    <motion.div
                      id={`cafe_item_card_${itm.id}`}
                      key={itm.id}
                      layout
                      className="p-4 border border-zinc-900 bg-zinc-950/40 rounded-2xl flex justify-between items-center group transition-colors hover:border-zinc-800"
                    >
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono bg-zinc-900 px-2 py-0.5 rounded text-amber-500 border border-zinc-900 uppercase">
                          {itm.category}
                        </span>
                        <h4 className="text-sm font-semibold text-white pt-1">{itm.name}</h4>
                        <p className="text-xs font-bold font-mono text-amber-400 font-bold">₹{itm.price}</p>
                      </div>                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-850 p-1.5 rounded-xl">
                          <button
                            id={`cafe_item_dec_${itm.id}`}
                            onClick={() => updateQuantity(itm.id, -1)}
                            disabled={qtyInCart <= 0}
                            className={`p-1.5 rounded transition-colors ${qtyInCart > 0 ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-white w-5 text-center font-mono">{qtyInCart}</span>
                          <button
                            id={`cafe_item_inc_${itm.id}`}
                            onClick={() => addToCart(itm)}
                            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CART DRAWER & CUSTOMER DETAILS SECTION */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 border border-zinc-900 bg-zinc-950/45 rounded-3xl space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-amber-500" />
                  <span>My Bistro Basket</span>
                </h4>
                <span className="text-[10px] font-mono text-zinc-400 font-bold bg-zinc-900 px-2.5 py-1 rounded">
                  {cart.length} ITEMS
                </span>
              </div>

              {/* Cart List */}
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-550 leading-relaxed font-sans">
                  Your basket is empty.<br />Increase quantities on the left to add items!
                </div>
              ) : (
                <div className="space-y-4 max-h-72 overflow-y-auto divide-y divide-zinc-900/60 pr-1 select-none">
                  {cart.map(c => (
                    <div key={c.item.id} className="pt-3.5 first:pt-0 flex flex-col gap-1.5 text-xs font-sans">
                      <div className="flex justify-between items-start">
                        <span className="text-white font-semibold text-[13px]">{c.item.name}</span>
                        <button
                          id={`cafe_cart_remove_${c.item.id}`}
                          onClick={() => removeFromCart(c.item.id)}
                          className="text-zinc-600 hover:text-red-400 cursor-pointer p-0.5 transition-colors"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 text-[10.5px] text-zinc-400 font-mono mt-0.5 bg-zinc-950/40 p-2 rounded-lg border border-zinc-900/50">
                        <div>
                          <span className="text-zinc-500 text-[8.5px] uppercase block tracking-wider">Quantity</span>
                          <span className="text-white font-bold">{c.quantity}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 text-[8.5px] uppercase block tracking-wider">Unit Price</span>
                          <span>₹{c.item.price}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-500 text-[8.5px] uppercase block tracking-wider">Total Price</span>
                          <span className="text-amber-400 font-bold">₹{c.item.price * c.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Grand Total Display */}
              <div className="pt-4 border-t border-zinc-900 flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-mono text-[11px] uppercase tracking-widest font-black">Grand Total</span>
                <span className="text-xl font-black font-mono text-amber-400">
                  ₹{cartSubtotal}
                </span>
              </div>

              {/* Secure Customer Log Form */}
              <form onSubmit={handleCheckoutTrigger} className="space-y-4 pt-2 font-sans text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono text-[10px] uppercase block">Guest / Member Name</label>
                  <input
                    id="cafe_checkout_name"
                    type="text"
                    placeholder="ENTER FULL NAME"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-850 focus:border-amber-500 focus:outline-none text-white rounded-xl text-xs transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-mono text-[10px] uppercase block">Contact Number</label>
                  <input
                    id="cafe_checkout_mobile"
                    type="tel"
                    placeholder="10-DIGIT MOBILE"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-850 focus:border-amber-500 focus:outline-none text-white rounded-xl text-xs font-mono transition-colors"
                    required
                  />
                </div>

                <button
                  id="cafe_checkout_submit"
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-650 hover:from-amber-350 hover:to-yellow-500 disabled:from-zinc-900 disabled:to-zinc-900 disabled:text-zinc-500 text-black font-semibold rounded-xl text-xxs font-mono tracking-wider uppercase transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{addToMasterCart ? "View Shopping Cart & Checkout" : "Propose Order Checkout"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* DISCHARGE BILL GENERATION WINDOW */
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="max-w-xl mx-auto p-6 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-6 animate-fade-in print:bg-white print:text-black print:border-none uppercase"
        >
          {/* GST RECEIPT TEMPLATE */}
          <div id="print_bill_template" className="space-y-6 font-mono text-xs text-zinc-300 print:text-black">
            <div className="text-center space-y-1 shadow-sm pb-4 border-b border-dashed border-zinc-800">
              <span className="text-amber-500 font-bold tracking-widest text-[13px] block">THE ALPHA CAFE</span>
              <p className="text-[10px] text-zinc-500">Sanoli Chowk, Gulabbagh, Purnea</p>
              <p className="text-[9px] text-zinc-500">Receipt ID: {lastCafeInvoice.invoiceNumber}</p>
            </div>

            <div className="space-y-1 bg-zinc-900/10 p-3 rounded-lg border border-zinc-900 text-xxs leading-relaxed">
              <div className="flex justify-between">
                <span>Customer Name:</span>
                <span className="text-white capitalize print:text-black">{lastCafeInvoice.userName}</span>
              </div>
              <div className="flex justify-between">
                <span>Contact Node:</span>
                <span className="text-white print:text-black">{lastCafeInvoice.userMobile}</span>
              </div>
              <div className="flex justify-between">
                <span>Date stamp:</span>
                <span className="text-white print:text-black">{new Date(lastCafeInvoice.paymentDate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Status node:</span>
                <span className="text-emerald-400 font-bold font-mono">SETTLED TRANSACTION</span>
              </div>
            </div>

            {/* Item Table */}
            <div className="space-y-1.5 pt-2">
              <div className="font-semibold text-white border-b border-zinc-900 pb-1.5 flex justify-between text-[11px] print:text-black">
                <span>Item Name</span>
                <div className="space-x-8">
                  <span>Qty</span>
                  <span>Total</span>
                </div>
              </div>
              <div className="divide-y divide-zinc-950/40">
                {lastCafeInvoice.cafeDetails?.items.map((line, ix) => (
                  <div key={ix} className="py-2 flex justify-between text-xxs font-mono">
                    <span className="text-zinc-400 print:text-black font-sans">{line.name}</span>
                    <div className="space-x-12 flex">
                      <span className="text-zinc-550 w-4 text-right pr-1">{line.quantity}</span>
                      <span className="text-white print:text-black font-bold w-12 text-right">₹{line.price * line.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Box */}
            <div className="pt-4 border-t border-dashed border-zinc-800 space-y-1.5 text-xxs">
              <div className="flex justify-between">
                <span>Taxable Total:</span>
                <span>₹{lastCafeInvoice.totalAmount}</span>
              </div>
              <div className="flex justify-between text-zinc-550">
                <span>GST (0% Exempt - Food):</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between text-base font-bold text-amber-400 pt-2 border-t border-zinc-900 print:text-black">
                <span>Grand Total:</span>
                <span>₹{lastCafeInvoice.totalAmount}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-zinc-650 leading-relaxed pt-3 border-t border-zinc-900/40 font-mono">
              Thank you for ordering at THE ALPHA!<br />Visit us again soon. Comfort is our priority.
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              id="print_bill_btn"
              onClick={triggerWindowPrint}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice Receipt</span>
            </button>
            <button
              id="done_cafe_invoice_btn"
              onClick={() => setLastCafeInvoice(null)}
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 font-medium rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Order More Refreshments
            </button>
          </div>
        </motion.div>
      )}

      {/* RENDER DIME PAYMENT MODAL FLOW */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={cartSubtotal}
        itemName="Cafe Food and Beverage Package"
        category="cafe"
        userName={fullName}
        userEmail={email || `${fullName.replace(/\s+/g, '')}@gmail.com`}
        userMobile={mobileNumber}
        userId={currentUser?.id || 'usr_' + Math.random().toString(36).substring(2, 9)}
        categoryDetails={{
          cafeDetails: {
            items: cart.map(c => ({
              id: c.item.id,
              name: c.item.name,
              quantity: c.quantity,
              price: c.item.price
            }))
          }
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
