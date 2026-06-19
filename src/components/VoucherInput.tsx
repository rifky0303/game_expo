import React, { useState } from 'react';
import { Voucher } from '../types';
import { Shield, Sparkles, Key, Ticket, Play, User, Coins, AlertCircle } from 'lucide-react';
import { audio } from '../utils/audio';

interface VoucherInputProps {
  onValidated: (buyerName: string, voucherCode: string) => void;
  vouchers: Voucher[];
  requireVoucher: boolean;
  ownerPin: string;
  onAdminAccess: () => void;
}

export default function VoucherInput({
  onValidated,
  vouchers,
  requireVoucher,
  ownerPin,
  onAdminAccess,
}: VoucherInputProps) {
  const [buyerName, setBuyerName] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Handle launch play verification
  const handleStartPlay = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = buyerName.trim() || 'Pemain 1';

    // Directly start play, bypassing validation as requested!
    audio.playPowerup();
    onValidated(trimmedName, 'BEBAS-MAIN');
  };

  // Admin access validation PIN
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (inputPin === ownerPin) {
      audio.playCastleTrumpet();
      onAdminAccess();
      setShowAdminLogin(false);
      setInputPin('');
    } else {
      setAdminError('PIN salah! Coba input kembali PIN pemilik.');
      audio.playLose();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative text-white" id="welcome-arcade-cabinet">
      {/* Visual Glowing Neon Frame behind the arcade cabinet */}
      <div className="absolute -inset-1.5 bg-linear-to-r from-red-600 via-yellow-500 to-emerald-500 rounded-[2.5rem] blur opacity-60 animate-pulse"></div>
      
      {/* Real Arcade Cabinet Enclosure */}
      <div className="relative bg-stone-950 border-8 border-stone-800 p-8 rounded-[2.2rem] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Cabinet Marquee neon light banner */}
        <div className="bg-red-600 border-b-4 border-red-900 mx-[-2rem] mt-[-2rem] mb-6 py-6 px-4 flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden" id="cabinet-marquee">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.3)_0%,transparent_70%)] animate-pulse"></div>
          
          {/* Glowing pixel marquee */}
          <div className="flex items-center gap-1 bg-yellow-400 text-black px-3 py-1 rounded-sm text-[10px] font-black tracking-widest font-mono animate-bounce mb-2 uppercase border border-white">
            ★ INSERT COIN TO PLAY ★
          </div>
          
          <h1 className="text-3xl font-black font-serif tracking-widest text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.6)] flex items-center gap-2 justify-center">
            GACHA <span className="text-yellow-300">SPIN</span>
          </h1>
          <p className="text-red-100 text-[11px] font-mono tracking-tight mt-1 px-4 drop-shadow">
            MAIN GAME RETRO, MENANGKAN HADIAH MENARIK SEKARANG!
          </p>
        </div>

        {/* Vintage Coin Acceptor LED blinking slots */}
        <div className="flex items-center justify-center gap-6 mb-5 py-1 bg-neutral-900 border border-stone-850 rounded-xl" id="coin-slots-visual">
          <div className="flex items-center gap-2 text-stone-500 font-mono text-[9px]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>SLOT 1 COIN ENTRY</span>
          </div>
          <div className="text-yellow-500 text-center text-xs font-mono font-bold px-2 py-0.5 bg-black rounded border border-yellow-500/20">
            FREE SPIN ACTIVE
          </div>
          <div className="flex items-center gap-2 text-stone-500 font-mono text-[9px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SLOT 2 COIN OK</span>
          </div>
        </div>

        {/* Main interactive form */}
        {!showAdminLogin ? (
          <form onSubmit={handleStartPlay} className="space-y-6" id="form-play-arcade">
            
            {/* Player details container */}
            <div className="space-y-4 bg-stone-900/60 p-5 rounded-2xl border border-stone-850 shadow-inner">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400 flex items-center gap-1.5 font-bold">
                  <User className="w-4 h-4 text-yellow-400" /> NAMA KAMU:
                </span>
                <span className="text-yellow-500 font-bold tracking-widest animate-pulse">SIAP MAIN!</span>
              </div>
              
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="CONTOH: DONI / MARIA"
                className="bg-black/90 border-2 border-stone-700 rounded-xl px-4 py-3 text-sm font-black font-mono tracking-wide text-center text-white focus:border-yellow-400 focus:outline-none placeholder-stone-800 w-full uppercase shadow-md p-3"
              />
              
              <p className="text-[10px] text-stone-500 text-center font-mono">
                Silakan ketik nama kamu di atas sebelum meraih gagang joystick game!
              </p>
            </div>

            {/* Huge Retro Arcade Start Button */}
            <button
              type="submit"
              className="w-full h-16 rounded-2xl bg-linear-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-black font-serif tracking-widest text-base flex flex-col items-center justify-center shadow-[0_6px_0_#9a3412,0_10px_20px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-[0_2px_0_#9a3412,0_10px_10px_rgba(0,0,0,0.4)] transition-all cursor-pointer border-2 border-white select-none uppercase hover:scale-[1.02]"
              id="btn-spin-mario-start"
            >
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 fill-black animate-ping" />
                <span>MULAI MAIN GAME!</span>
              </div>
              <span className="text-[9px] font-mono tracking-tight font-extrabold text-amber-950 mt-0.5 opacity-80">
                ★ 1 COIN = 1 SPIN CHANCE ★
              </span>
            </button>

            {/* Instruction block */}
            <div className="bg-stone-900/30 border border-stone-850 p-4 rounded-xl flex items-start gap-2.5 text-stone-400 text-[11px] font-mono leading-relaxed" id="instructions-callout">
              <span className="text-yellow-400 font-bold shrink-0">💡 CARA MAIN:</span>
              <span>Lompatlewati musuh dan rintangan untuk mencapai bendera kastil Mario. Kumpulkan koin sebanyak-banyaknya untuk mempercepat putaran roda hadiah gachamu setelah game berhasil tamat!</span>
            </div>

            {/* Footer controls for Seller Panel Entry */}
            <div className="pt-4 border-t border-stone-850 flex items-center justify-between" id="splash-footer">
              <span className="text-[9px] font-mono text-stone-600">ARCADE CABINET SYSTEM v2.0</span>
              <button
                type="button"
                onClick={() => {
                  audio.playTick();
                  setShowAdminLogin(true);
                }}
                className="text-[10px] font-mono font-bold text-stone-500 hover:text-yellow-400 flex items-center gap-1 transition"
                id="goto-admin-btn"
              >
                <Shield className="w-3.5 h-3.5" /> Konfigurasi Toko
              </button>
            </div>
          </form>
        ) : (
          /* Admin Login Sub-Panel Forms */
          <form onSubmit={handleAdminAuth} className="space-y-5 animate-fade-in" id="form-admin-login">
            <div className="flex items-center gap-2 text-stone-300 font-mono text-xs font-bold border-b border-stone-800 pb-2">
              <Key className="w-4 h-4 text-yellow-400" /> MASUK KE PANEL AKUN PEMILIK
            </div>

            <p className="text-stone-400 text-xs font-mono leading-relaxed">
              Silakan masukkan PIN Pemilik Toko untuk mengonfigurasi hadiah, merekap pemenang, atau mengatur rasio spin.
            </p>

            <div className="flex flex-col gap-1.5 focus-within:text-yellow-400">
              <label className="text-xs font-mono font-medium text-stone-300">PIN Pemilik Toko:</label>
              <input
                type="password"
                required
                autoFocus
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                placeholder="PIN"
                className="bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-lg font-black font-mono tracking-widest text-center text-white focus:border-yellow-400 focus:outline-none placeholder-stone-800 w-full"
              />
            </div>

            {adminError && (
              <div className="text-rose-400 text-xs font-mono bg-rose-950/40 p-3 rounded-lg border border-rose-900 text-center" id="admin-error-box">
                {adminError}
              </div>
            )}

            <div className="text-[10px] font-mono text-stone-500 text-center bg-black/20 p-2 rounded">
              💡 PIN Bawaan Toko: <b>1234</b>
            </div>

            {/* Auth submit buttons row */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin(false);
                  setInputPin('');
                  setAdminError('');
                }}
                className="flex-1 h-10 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 font-mono text-xs font-bold transition"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="flex-1 h-10 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-mono text-xs font-bold transition shadow-md"
              >
                Masuk ✓
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
