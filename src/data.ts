export const GYM_PLANS = [
  { id: 'gym_monthly', name: 'Monthly Standard', duration: 'Monthly', price: 1500, description: 'Full Gym Access + Cardio section + Locker rooms' },
  { id: 'gym_quarterly', name: 'Quarterly Elite', duration: 'Quarterly', price: 4000, description: 'Full Gym Access + Personal Coach support (3 sessions) + Steam room' },
  { id: 'gym_half_yearly', name: 'Half-Yearly pro', duration: 'Half-Yearly', price: 7500, description: 'All-inclusive Elite access + Custom diet charts + Free supplement shaker' },
  { id: 'gym_yearly', name: 'Yearly Ultimate Alpha', duration: 'Yearly', price: 13000, description: 'VIP locker + Unlimited coaching + Gym merch kit + 2 guest passes every month' }
];

export const LIBRARY_PLANS = [
  { id: 'lib_monthly', name: 'Monthly Standard', duration: '1 Month', price: 899, description: 'Single-month access. Full study hours.' }
];

export const TOURNAMENTS = [
  {
    id: "asphalt_2026",
    name: "THE ALPHA ASPHALT LEGENDS CHAMPIONSHIP",
    game: "Asphalt Legends",
    entryFee: 200,
    description: "Gear up for high-octane racing at the elite level! Show off your nitro management, perfect drifts, and aggressive overtakes. Fight through heats and reach the podium to claim glory and cash rewards in Purnea's premium gaming colosseum.",
    bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200", 
    isActive: true,
    status: "open",
    createdAt: "2026-06-06T16:22:15Z"
  }
];

export const DEFAULT_SEATS = Array.from({ length: 183 }, (_, idx) => {
  const num = idx + 1;
  // Pre-book around 25 seats for a realistic interface visual
  const prebooked = [12, 23, 31, 45, 52, 60, 71, 85, 99, 104, 115, 122, 137, 141, 155, 169, 180].includes(num);
  return {
    id: `seat_${num}`,
    number: `${num}`,
    isBooked: prebooked,
    bookedBy: prebooked ? `Scholar #${num}` : undefined,
    isPermanent: [45, 122, 155].includes(num),
    lockerNumber: prebooked && [23, 45, 99, 155].includes(num) ? `L-${num + 10}` : undefined,
    lockerType: prebooked && [23, 45, 99, 155].includes(num) ? 'small' : 'none'
  };
});
