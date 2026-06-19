import React, { useEffect, useRef, useState } from 'react';
import { Prize } from '../types';
import { audio } from '../utils/audio';
import { Disc, Play, Award, Copy, Check, Info, Coins, AlertCircle } from 'lucide-react';

interface SpinWheelProps {
  prizes: Prize[];
  onSpinComplete: (prize: Prize) => void;
  coinsCount: number;
}

export default function SpinWheel({ prizes, onSpinComplete, coinsCount }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Spin States
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Rotation properties tracked in useRef to keep simulation smooth inside requestAnimationFrame
  const wheelState = useRef({
    angle: 0,
    angularVelocity: 0,
    isSpinning: false,
    selectedPrizeIndex: -1,
    friction: 0.985, // rate of slowdown
  });

  // Render the static/dynamic wheel at start
  useEffect(() => {
    drawWheel();
  }, [prizes]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 25;

    ctx.clearRect(0, 0, width, height);

    if (prizes.length === 0) {
      // Draw empty placeholder
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tidak ada hadiah terkonfigurasi', cx, cy);
      return;
    }

    const arcSize = (2 * Math.PI) / prizes.length;
    const currentAngle = wheelState.current.angle;

    // 1. Draw outer rim decoration
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.fillStyle = '#1e1b4b'; // Deep dark violet rim
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Gilded border line
    ctx.strokeStyle = '#fbbf24'; // beautiful amber gold trim
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
    ctx.stroke();

    // Small glowing lights on the wheel rim
    const lightCount = 20;
    for (let i = 0; i < lightCount; i++) {
      const lightAngle = (i * (2 * Math.PI)) / lightCount + (currentAngle * 0.2); // rotates slowly
      const lx = cx + (radius + 6) * Math.cos(lightAngle);
      const ly = cy + (radius + 6) * Math.sin(lightAngle);
      
      // alternate yellow and red light bulby dots
      ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#ef4444';
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw colorful pie sectors
    prizes.forEach((prize, i) => {
      const startAngle = i * arcSize + currentAngle;
      const endAngle = startAngle + arcSize;

      // Draw slice background colored
      ctx.fillStyle = prize.color || '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      // Draw slice line separator
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(startAngle), cy + radius * Math.sin(startAngle));
      ctx.stroke();

      // 3. Draw text and labels nicely oriented down the slice spine
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arcSize / 2);

      // Label background white box for higher contrast text readability
      // We write text in the middle of standard sector radius
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      
      ctx.beginPath();
      // small pill capsule backdrop
      ctx.roundRect(radius * 0.35, -12, radius * 0.55, 24, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Sector label string
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Trim label if too long
      let label = prize.name;
      if (label.length > 14) label = label.substring(0, 12) + '..';
      ctx.fillText(label, radius * 0.62, 0);

      // Icon/Emoji slightly preceding details
      if (prize.icon) {
        ctx.font = '12px sans-serif';
        ctx.fillText(prize.icon, radius * 0.44, 0);
      }

      ctx.restore();
    });

    // 4. Central Hub cap
    ctx.fillStyle = '#fbbf24'; // Golden spinner cap
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e1b4b'; // center inner core
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    // 5. Draw static triangular indicator pin (Pointer) at the right edge
    // Usually standard pointer points from the top, let's keep it at 3 * Math.PI / 2 (direct UP)
    ctx.save();
    ctx.translate(cx, cy - radius - 15);
    ctx.fillStyle = '#ef4444'; // Red pointer
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 20); // Tip pointing down at the wheel
    ctx.lineTo(-14, -8);
    ctx.lineTo(14, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // peg screw circle
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Launch spin rotation simulation
  const startSpinning = () => {
    if (isSpinning || prizes.length === 0) return;

    setErrorMessage('');
    setSelectedPrize(null);
    setCopied(false);

    // Compute prize win outcomes based on weighted probability
    const totalWeight = prizes.reduce((s, p) => s + p.weight, 0);
    if (totalWeight <= 0) {
      setErrorMessage('Bobot total hadiah harus lebih besar dari 0!');
      return;
    }

    let rolledNum = Math.random() * totalWeight;
    let selectedIdx = 0;

    for (let i = 0; i < prizes.length; i++) {
      rolledNum -= prizes[i].weight;
      if (rolledNum <= 0) {
        selectedIdx = i;
        break;
      }
    }

    // Record prize indices
    wheelState.current.selectedPrizeIndex = selectedIdx;
    wheelState.current.isSpinning = true;
    setIsSpinning(true);

    // Target stopping angle calculation
    const arcSize = (2 * Math.PI) / prizes.length;

    // Segment start/middle boundary: we want the center of the segment to land at -Math.PI / 2 (UP pointer)
    const spinRotations = 7 + Math.floor(Math.random() * 5); // 7 to 11 full rounds
    const currentAngleOffset = ((wheelState.current.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    
    const finalStopAngle = (3 * Math.PI / 2) - (selectedIdx + 0.5) * arcSize;
    let angleDiff = finalStopAngle - currentAngleOffset;
    while (angleDiff < 0) {
      angleDiff += 2 * Math.PI;
    }
    const targetAngle = wheelState.current.angle + (spinRotations * 2 * Math.PI) + angleDiff;

    const startAngle = wheelState.current.angle;
    const startTime = performance.now();
    const duration = 6000; // 6 seconds is perfect for dramatic anticipation

    // Cubic ease-out calculation
    const easeOutCubic = (x: number): number => {
      return 1 - Math.pow(1 - x, 3);
    };

    // Track click ticking indices
    const tickStep = (2 * Math.PI) / prizes.length;
    let lastTickValue = Math.floor(startAngle / tickStep);

    const animateWheel = (now: number) => {
      const state = wheelState.current;
      if (!state.isSpinning) return;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = easeOutCubic(progress);
      const currentAngle = startAngle + (targetAngle - startAngle) * easedProgress;
      state.angle = currentAngle;

      // Play tick sound when crossing a sector boundary
      const currentTickValue = Math.floor(currentAngle / tickStep);
      if (currentTickValue !== lastTickValue) {
        audio.playTick();
        lastTickValue = currentTickValue;
      }

      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        // Precise snapping
        state.angle = targetAngle;
        drawWheel();
        state.isSpinning = false;
        
        const wonItem = prizes[state.selectedPrizeIndex];
        setSelectedPrize(wonItem);
        setIsSpinning(false);
        audio.playWinFanfare();
        onSpinComplete(wonItem);
      }
    };

    // Run animation
    requestAnimationFrame(animateWheel);
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-10 py-4 max-w-5xl mx-auto" id="spin-wheel-frame">
      {/* Visual Rotating Canvas wheel */}
      <div className="flex flex-col items-center justify-center relative bg-stone-900 border-4 border-stone-800 p-8 rounded-3xl shadow-2xl relative" id="wheel-card">
        {/* Retro arcade header tag */}
        <div className="bg-amber-500 text-black font-mono font-black px-4 py-1.5 rounded-full text-xs tracking-widest absolute -top-4 shadow-lg flex items-center gap-1 border-2 border-stone-900">
          <Disc className="w-4.5 h-4.5 animate-spin" /> RODA KEBERUNTUNGAN
        </div>

        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          className="max-w-full w-[380px] h-[380px] rounded-full drop-shadow-2xl relative z-10"
        />

        {/* Action Spin Launch Button */}
        <button
          onClick={startSpinning}
          disabled={isSpinning || prizes.length === 0}
          className={`mt-8 px-12 py-4 rounded-xl text-black font-black text-lg font-mono tracking-widest transition shadow-2xl active:translate-y-1 active:border-b-0 border-b-4 flex items-center gap-2 select-none uppercase ${
            isSpinning || prizes.length === 0
              ? 'bg-stone-700 text-stone-500 border-stone-800 cursor-not-allowed'
              : 'bg-yellow-400 hover:bg-yellow-300 border-yellow-700'
          }`}
          id="btn-spin-wheel"
        >
          <Play className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
          {isSpinning ? 'MEMUTAR...' : 'PUTAR RODA!'}
        </button>

        {/* Small coins count verification details */}
        {coinsCount > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-stone-400 text-xs font-mono" id="bonus-coins-info">
            <Coins className="w-3.5 h-3.5 text-yellow-500" />
            Sebagai bonus, kamu mengantongi <b>{coinsCount} koin</b> dari game!
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 text-rose-400 text-xs font-mono bg-rose-950/40 p-2 rounded border border-rose-900 flex items-center gap-1.5" id="wheel-error-notice">
            <AlertCircle className="w-4 h-4" /> {errorMessage}
          </div>
        )}
      </div>

      {/* Prize display detail panel */}
      <div className="flex-1 w-full max-w-md bg-stone-900 border-4 border-stone-800 p-8 rounded-3xl shadow-xl flex flex-col justify-start relative text-white" id="prizes-log-card">
        {selectedPrize ? (
          <div className="w-full flex flex-col animate-fade-in" id="win-display">
            {/* Won item badge */}
            <div className="text-stone-400 font-mono text-xs uppercase tracking-widest mb-1 font-semibold">
              🎁 HADIAH DIDAPATKAN:
            </div>
            
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 flex flex-col items-center mt-2 shadow-inner text-center">
              <div className="text-4xl mb-3" id="won-icon">
                {selectedPrize.icon || '🏆'}
              </div>
              <h2 className="text-2xl font-black text-yellow-400 font-serif" id="won-name">
                {selectedPrize.name}
              </h2>
              <div className="text-stone-500 font-mono text-[10px] mt-1.5">
                Id: {selectedPrize.id}
              </div>

              {/* Reveal secret promo code */}
              {selectedPrize.code ? (
                <div className="mt-6 w-full flex flex-col items-center bg-zinc-900 border border-yellow-500/30 p-4 rounded-xl relative overflow-hidden" id="code-reveal-subcard">
                  <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
                  <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase font-semibold">
                    KODE VOUCHER / PROMO:
                  </span>
                  
                  <div className="flex items-center gap-2 mt-2 w-full justify-center">
                    <span className="text-xl font-bold font-mono tracking-widest text-emerald-400 bg-black/60 px-4 py-1.5 rounded select-all border border-stone-850">
                      {selectedPrize.code}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedPrize.code)}
                      className="p-2 bg-stone-850 border border-stone-700 rounded-lg hover:bg-stone-800 active:scale-95 transition text-emerald-400"
                      title="Salin Kode"
                      id="btn-copy-code"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-stone-500 text-center mt-3 font-mono leading-relaxed">
                    Tunjukkan kode voucher ini ke Kasir / Penjual untuk mengklaim hadiah gacha tokomu!
                  </p>
                </div>
              ) : (
                <div className="mt-4 text-stone-400 text-xs font-mono text-center">
                  Silakan koordinasikan dengan penjual untuk pemberian hadiah ini.
                </div>
              )}
            </div>

            {/* Next steps info */}
            <div className="mt-6 text-stone-400 font-mono text-xs leading-relaxed flex gap-2" id="win-instructions">
              <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                Roda undian sekarang selesai! Kamu sudah bisa menutup jendela, atau tunjukkan layar ini langsung ke Penjual sebelum ditutup untuk pencatatan di histori pembeli.
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col justify-center items-center py-12 text-stone-500 text-center font-mono" id="no-prize-yet">
            <Award className="w-16 h-16 text-stone-700 mb-4 animate-pulse" />
            <h3 className="text-stone-300 font-bold mb-1 text-sm uppercase tracking-wider">
              Menunggu Putaran Roda
            </h3>
            <p className="text-xs max-w-xs text-stone-500 leading-relaxed balance">
              Selesaikan tantangan game Super Mario Bros terlebih dahulu, atau langsung putar roda di sebelah kiri untuk melihat hadiah gacha keberuntunganmu sekarang!
            </p>
          </div>
        )}

        {/* Prizes list legends on details widget */}
        <div className="border-t border-stone-800/80 mt-8 pt-6" id="prizes-grid">
          <h4 className="text-xs font-mono text-stone-400 font-bold uppercase tracking-wider mb-3">
            Daftar Hadiah Tersedia ({prizes.length})
          </h4>
          <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1" id="prize-rows">
            {prizes.map((p) => {
              const totalWeight = prizes.reduce((s, x) => s + x.weight, 0);
              const percentage = totalWeight > 0 ? ((p.weight / totalWeight) * 100).toFixed(1) : '0';
              return (
                <div key={p.id} className="flex items-center justify-between text-xs font-mono bg-black/20 px-3 py-1.5 rounded border border-stone-850 hover:bg-black/35 transition" id={`prow-${p.id}`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span style={{ color: p.color }} className="text-base shrink-0">
                      ●
                    </span>
                    <span className="text-stone-300 font-medium truncate" title={p.name}>
                      {p.icon} {p.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-500 shrink-0">
                    <span>Stok: <b className="text-stone-400">{p.stock !== null ? p.stock : '∞'}</b></span>
                    <span>•</span>
                    <span className="text-yellow-600 font-bold">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
