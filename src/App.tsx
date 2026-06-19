import React, { useState, useEffect } from 'react';
import { Prize, SpinHistory, Voucher, AppView } from './types';
import VoucherInput from './components/VoucherInput';
import MarioGame from './components/MarioGame';
import SpinWheel from './components/SpinWheel';
import OwnerPanel from './components/OwnerPanel';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Coins, Gamepad2, Ticket, History, HelpCircle } from 'lucide-react';
import { audio } from './utils/audio';

// Default presets seeds to bootstrap the local database gracefully
const INITIAL_PRIZES: Prize[] = [
  { id: 'p1', name: 'Zonk', color: '#ef4444', weight: 25, stock: null, code: 'ZONK-C0BALAGI', icon: '😢' },
  { id: 'p2', name: 'Gantungan Kunci', color: '#3b82f6', weight: 25, stock: 99, code: 'HADIAH-KEYCHAIN', icon: '🔑' },
  { id: 'p4', name: 'Zonk', color: '#f59e0b', weight: 25, stock: null, code: 'ZONK-SAYANGSEKALI', icon: '💥' },
  { id: 'p3', name: 'Free Drink', color: '#10b981', weight: 25, stock: 50, code: 'HADIAH-DRINK', icon: '🥤' },
];

const INITIAL_VOUCHERS: Voucher[] = [
  { code: 'G-1111', isUsed: false, usedAt: null, createdAt: '19/06/2026', buyerName: 'Tes Pembeli 1' },
  { code: 'G-2222', isUsed: false, usedAt: null, createdAt: '19/06/2026', buyerName: 'Tes Pembeli 2' },
  { code: 'G-3333', isUsed: false, usedAt: null, createdAt: '19/06/2026', buyerName: 'Tes Pembeli 3' },
];

export default function App() {
  // Navigation / View state
  const [view, setView] = useState<AppView>('VOUCHER_ENTRY');

  // Core Persistent States
  const [prizes, setPrizes] = useState<Prize[]>(() => {
    const saved = localStorage.getItem('mario_gacha_prizes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Prize[];
        // Smart Migration: If the user had the older 5-item list, or old adjacent Zonk 4-item list, auto-reset to the beautifully balanced alternated list
        if (parsed.length !== 4 || (parsed[2] && parsed[2].id === 'p3')) {
          localStorage.setItem('mario_gacha_prizes', JSON.stringify(INITIAL_PRIZES));
          return INITIAL_PRIZES;
        }
        return parsed;
      } catch (err) {
        return INITIAL_PRIZES;
      }
    }
    return INITIAL_PRIZES;
  });

  const [history, setHistory] = useState<SpinHistory[]>(() => {
    const saved = localStorage.getItem('mario_gacha_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    const saved = localStorage.getItem('mario_gacha_vouchers');
    return saved ? JSON.parse(saved) : INITIAL_VOUCHERS;
  });

  const [requireVoucher, setRequireVoucher] = useState<boolean>(() => {
    const saved = localStorage.getItem('mario_gacha_require_voucher');
    // Default to false as requested by user ("jangan pake kode vocer")
    return saved ? saved === 'true' : false;
  });

  const [ownerPin, setOwnerPin] = useState<string>(() => {
    const saved = localStorage.getItem('mario_gacha_owner_pin');
    return saved ? saved : '1234'; // Default PIN
  });

  // Current session/play values
  const [currentBuyerName, setCurrentBuyerName] = useState('Pelanggan');
  const [currentVoucherCode, setCurrentVoucherCode] = useState('');
  const [sessionBonusCoins, setSessionBonusCoins] = useState(0);

  // Time state for macOS simulated desktop menu bar
  const [timeStr, setTimeStr] = useState('02:00');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      setTimeStr(`${hrs}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Sync to localStorage on modifications
  useEffect(() => {
    localStorage.setItem('mario_gacha_prizes', JSON.stringify(prizes));
  }, [prizes]);

  useEffect(() => {
    localStorage.setItem('mario_gacha_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('mario_gacha_vouchers', JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem('mario_gacha_require_voucher', requireVoucher ? 'true' : 'false');
  }, [requireVoucher]);

  useEffect(() => {
    localStorage.setItem('mario_gacha_owner_pin', ownerPin);
  }, [ownerPin]);

  // Validation callback - transitions from start to actual level stage
  const handleVoucherValidated = (buyer: string, code: string) => {
    setCurrentBuyerName(buyer);
    setCurrentVoucherCode(code);
    setSessionBonusCoins(0);
    setView('GAME_STAGE');
  };

  // Game complete callback - transitions to the spin target Stage
  const handleGameStageComplete = (earnedCoins: number) => {
    setSessionBonusCoins(earnedCoins);
    setView('SPIN_STAGE');
  };

  // Turn completed reward spin trigger - deducts stock, uses voucher, registers winner
  const handleSpinComplete = (wonPrize: Prize) => {
    // 1. Consume the current ticket voucher (if it was a real voucher)
    if (currentVoucherCode && currentVoucherCode !== 'BEBAS-MAIN') {
      setVouchers((prevVouchers) =>
        prevVouchers.map((v) =>
          v.code.toUpperCase() === currentVoucherCode.toUpperCase()
            ? { ...v, isUsed: true, usedAt: new Date().toLocaleTimeString('id-ID') }
            : v
        )
      );
    }

    // 2. Decrement prize stock if they won a finite slot
    if (wonPrize.stock !== null) {
      setPrizes((prevPrizes) =>
        prevPrizes.map((p) =>
          p.id === wonPrize.id ? { ...p, stock: Math.max(0, p.stock! - 1) } : p
        )
      );
    }

    // 3. Register winner log record
    const newLog: SpinHistory = {
      id: 'h-' + Date.now().toString().slice(-6),
      buyerName: currentBuyerName,
      voucherCode: currentVoucherCode || 'Bebas Main',
      prizeId: wonPrize.id,
      prizeName: wonPrize.name,
      prizeCode: wonPrize.code,
      timestamp: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID'),
      claimed: false, // pending hand-out
    };

    setHistory((prevHistory) => [newLog, ...prevHistory]);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-stone-900 via-stone-950 to-neutral-950 text-stone-100 flex flex-col relative overflow-hidden" id="app-root-container">
      {/* Absolute Backdrop Grid Deco */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.04)_0%,transparent_60%)] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

      {/* 1. Translucent macOS simulated Menu Bar */}
      <div className="w-full bg-black/60 backdrop-blur-md text-stone-200 text-xs px-5 py-2 flex items-center justify-between border-b border-white/5 font-sans select-none z-20 relative" id="mac-menubar">
        <div className="flex items-center gap-4">
          <span className="font-extrabold text-white text-[13px] hover:scale-105 transition duration-150 cursor-pointer"></span>
          <span className="font-black text-white cursor-pointer tracking-wide text-xs">GachaMario</span>
          <span className="hover:text-white cursor-pointer hidden sm:inline text-stone-400 font-medium">Bantuan</span>
          <span className="hover:text-white cursor-pointer hidden md:inline text-stone-400 font-medium">Lihat</span>
          <span className="hover:text-white cursor-pointer hidden md:inline text-stone-400 font-medium">Pengaturan</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] bg-red-600/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
            ● PREMIUM RETRO CONSOLE
          </span>
          <span className="text-stone-300 font-mono tracking-widest text-[11px] font-extrabold">{timeStr}</span>
        </div>
      </div>

      {/* 2. Main Desktop Workstation Space */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-10 flex flex-col justify-center items-center relative z-10" id="desktop-workstation">
        
        {/* Apple macOS style Browser Wrapper */}
        <div className="w-full bg-[#181615] border-[6px] border-stone-800 rounded-[2rem] shadow-[0_30px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden relative" id="macbook-safari-chassis">
          
          {/* Safari Browser Chrome Titlebar */}
          <header className="w-full bg-[#242120] border-b border-stone-850 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative z-10" id="safari-titlebar">
            
            {/* Standard Mac window traffic lights */}
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition flex items-center justify-center cursor-pointer group" onClick={() => setView('VOUCHER_ENTRY')}>
                  <span className="w-1 h-1 rounded-full bg-red-950 opacity-0 group-hover:opacity-100 transition"></span>
                </div>
                <div className="w-3 h-3 rounded-full bg-yellow-500 transition flex items-center justify-center cursor-pointer"></div>
                <div className="w-3 h-3 rounded-full bg-green-500 transition flex items-center justify-center cursor-pointer"></div>
              </div>

              {/* Brand identifier label for mobile layout */}
              <div className="sm:hidden font-mono text-xs font-black tracking-wider text-yellow-400">
                GACHA MARIO
              </div>
            </div>

            {/* Simulated SSL Secure Address Bar */}
            <div className="flex-1 max-w-lg mx-auto w-full" id="safari-address-bar">
              <div className="bg-stone-950 border border-stone-850 rounded-xl px-4 py-1.5 flex items-center justify-between gap-2 text-[11px] font-mono select-none text-stone-400 shadow-inner">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-emerald-500 text-[10px]" title="Sertifikat Aman SSL">🔒</span>
                  <span className="truncate tracking-wide text-stone-300">https://gachamario.com/{view.toLowerCase().replace('_', '-')}</span>
                </div>
                <span className="text-stone-600 shrink-0 text-[10px]">Refresh</span>
              </div>
            </div>

            {/* Quick action info badge */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono shrink-0" id="safari-action-badge">
              {view === 'GAME_STAGE' && (
                <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-900/40 text-red-500 px-3 py-1 rounded-full animate-pulse font-extrabold text-[10px]">
                  <Gamepad2 className="w-3 h-3" /> <span>PLAYING</span>
                </div>
              )}
              {view === 'SPIN_STAGE' && (
                <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 px-3 py-1 rounded-full animate-pulse font-extrabold text-[10px]">
                  <Sparkles className="w-3 h-3" /> <span>SPINning</span>
                </div>
              )}
              {view === 'OWNER_DASHBOARD' && (
                <div className="bg-stone-800 border border-stone-700 text-stone-300 px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold">
                  <Shield className="w-3 h-3" /> <span>DASHBOARD</span>
                </div>
              )}
              {view === 'VOUCHER_ENTRY' && (
                <span className="text-[10px] text-stone-500 font-bold bg-neutral-900 border border-stone-800 px-2 py-1 rounded uppercase tracking-wider">
                   DESKTOP MODE
                </span>
              )}
            </div>

          </header>

          {/* Browser Navigation header for actual game actions */}
          <div className="w-full bg-[#1c1a19] border-b border-stone-850 px-6 py-3.5 flex items-center justify-between relative z-10" id="gacha-viewport-header">
            <a 
              href="/" 
              className="flex items-center gap-2 select-none"
              onClick={(e) => {
                e.preventDefault();
                audio.playPowerup();
                setView('VOUCHER_ENTRY');
              }}
            >
              <div className="w-7 h-7 rounded-lg bg-red-600 border border-red-500 shadow-md flex items-center justify-center font-bold font-serif text-white text-sm">
                M
              </div>
              <span className="font-mono text-xs font-black tracking-wider text-white">
                GACHA <span className="text-yellow-400">MARIO SPIN</span>
              </span>
            </a>

            {/* Quick test voucher sheet info */}
            {view === 'VOUCHER_ENTRY' && requireVoucher && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400 bg-stone-950 px-2.5 py-1 rounded border border-stone-850" id="cheat-sheet-info">
                <Ticket className="w-3 h-3 text-yellow-500" />
                <span>Kode: <span className="text-yellow-400 font-bold">G-1111</span></span>
              </div>
            )}
          </div>

          {/* Main Simulated Browser Webpage Area */}
          <div className="flex-1 w-full p-4 sm:p-6 md:p-8 flex items-center justify-center relative min-h-[480px] bg-stone-950" id="safari-viewport-body">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="w-full flex justify-center"
              >
                {view === 'VOUCHER_ENTRY' && (
                  <VoucherInput
                    onValidated={handleVoucherValidated}
                    vouchers={vouchers}
                    requireVoucher={requireVoucher}
                    ownerPin={ownerPin}
                    onAdminAccess={() => setView('OWNER_DASHBOARD')}
                  />
                )}

                {view === 'GAME_STAGE' && (
                  <MarioGame
                    buyerName={currentBuyerName}
                    onFinish={handleGameStageComplete}
                    onBack={() => {
                      audio.playLose();
                      setView('VOUCHER_ENTRY');
                    }}
                  />
                )}

                {view === 'SPIN_STAGE' && (
                  <SpinWheel
                    prizes={prizes}
                    coinsCount={sessionBonusCoins}
                    onSpinComplete={handleSpinComplete}
                  />
                )}

                {view === 'OWNER_DASHBOARD' && (
                  <OwnerPanel
                    prizes={prizes}
                    setPrizes={setPrizes}
                    history={history}
                    setHistory={setHistory}
                    vouchers={vouchers}
                    setVouchers={setVouchers}
                    requireVoucher={requireVoucher}
                    setRequireVoucher={setRequireVoucher}
                    ownerPin={ownerPin}
                    setOwnerPin={setOwnerPin}
                    onClose={() => {
                      audio.playPowerup();
                      setView('VOUCHER_ENTRY');
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* Static layout page footer */}
      <footer className="w-full py-4 text-center border-t border-stone-850/60 bg-stone-900/10 font-mono text-[10px] text-stone-500 relative z-10 mt-auto" id="global-footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div>
            &copy; 2026 Gacha Spin Platformer. Apple macOS Workstation Simulator Template.
          </div>
          <div className="flex items-center gap-3">
            <span>Uji Coba Gacha Kilat</span>
            <span>•</span>
            <button
              onClick={() => {
                audio.playCastleTrumpet();
                setView('OWNER_DASHBOARD');
              }}
              className="text-stone-400 hover:text-yellow-400 font-bold transition flex items-center gap-1 bg-stone-900/60 hover:bg-stone-850 px-2.5 py-1 rounded"
              id="footer-secret-admin"
            >
              <Shield className="w-3.5 h-3.5" /> Konfigurasi Hadiah
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
