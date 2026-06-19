export interface Prize {
  id: string;
  name: string;
  color: string;
  weight: number; // probability weighting (higher = more likely)
  stock: number | null; // null means unlimited stock
  code: string; // voucher promo code that is revealed upon winning
  icon: string; // emoji or lucide icon name
}

export interface SpinHistory {
  id: string;
  buyerName: string;
  voucherCode: string;
  prizeId: string;
  prizeName: string;
  prizeCode: string;
  timestamp: string;
  claimed: boolean;
}

export interface Voucher {
  code: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
  buyerName: string;
}

export type AppView = 'VOUCHER_ENTRY' | 'GAME_STAGE' | 'SPIN_STAGE' | 'OWNER_DASHBOARD';
