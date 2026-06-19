import React, { useState } from 'react';
import { Prize, SpinHistory, Voucher } from '../types';
import { 
  Plus, Trash2, Edit2, Key, History, Gift, Check, Search, Download, 
  Upload, Sparkles, RefreshCcw, Eye, EyeOff, Save, BookOpen, Ticket, Shield
} from 'lucide-react';

interface OwnerPanelProps {
  prizes: Prize[];
  setPrizes: (prizes: Prize[]) => void;
  history: SpinHistory[];
  setHistory: (history: SpinHistory[]) => void;
  vouchers: Voucher[];
  setVouchers: (vouchers: Voucher[]) => void;
  requireVoucher: boolean;
  setRequireVoucher: (req: boolean) => void;
  ownerPin: string;
  setOwnerPin: (pin: string) => void;
  onClose: () => void;
}

export default function OwnerPanel({
  prizes,
  setPrizes,
  history,
  setHistory,
  vouchers,
  setVouchers,
  requireVoucher,
  setRequireVoucher,
  ownerPin,
  setOwnerPin,
  onClose,
}: OwnerPanelProps) {
  // Tabs: 'PRIZES' | 'VOUCHERS' | 'HISTORY' | 'SETTINGS'
  const [activeTab, setActiveTab] = useState<'PRIZES' | 'VOUCHERS' | 'HISTORY' | 'SETTINGS'>('PRIZES');

  // Prize Form state
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);
  const [prizeName, setPrizeName] = useState('');
  const [prizeColor, setPrizeColor] = useState('#3b82f6');
  const [prizeWeight, setPrizeWeight] = useState(1);
  const [prizeStock, setPrizeStock] = useState<number | ''>('');
  const [prizeCode, setPrizeCode] = useState('');
  const [prizeIcon, setPrizeIcon] = useState('🎁');

  // New Voucher State
  const [newVoucherName, setNewVoucherName] = useState('');
  const [voucherSearch, setVoucherSearch] = useState('');

  // History search/filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'PENDING' | 'CLAIMED'>('ALL');

  // PIN settings state
  const [showPinInput, setShowPinInput] = useState(false);
  const [tempPin, setTempPin] = useState(ownerPin);
  const [pinMessage, setPinMessage] = useState('');

  // Presets load helper
  const loadPresetPrizes = () => {
    const presets: Prize[] = [
      { id: 'p1', name: 'Zonk', color: '#ef4444', weight: 25, stock: null, code: 'ZONK-C0BALAGI', icon: '😢' },
      { id: 'p2', name: 'Gantungan Kunci', color: '#3b82f6', weight: 25, stock: 99, code: 'HADIAH-KEYCHAIN', icon: '🔑' },
      { id: 'p4', name: 'Zonk', color: '#f59e0b', weight: 25, stock: null, code: 'ZONK-SAYANGSEKALI', icon: '💥' },
      { id: 'p3', name: 'Free Drink', color: '#10b981', weight: 25, stock: 50, code: 'HADIAH-DRINK', icon: '🥤' },
    ];
    if (window.confirm('Muat ulang preset hadiah populer (Zonk, Gantungan Kunci, Zonk, Free Drink)? Ini akan menimpa daftar hadiah yang sekarang.')) {
      setPrizes(presets);
    }
  };

  // Add / Save prize handler
  const handleSavePrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prizeName.trim()) return;

    const parsedWeight = Math.max(1, Math.round(Number(prizeWeight)) || 1);
    const parsedStock = prizeStock === '' ? null : Math.max(0, Math.round(Number(prizeStock)) || 0);

    if (editingPrizeId) {
      // Modify existing
      const updated = prizes.map((p) =>
        p.id === editingPrizeId
          ? {
              ...p,
              name: prizeName,
              color: prizeColor,
              weight: parsedWeight,
              stock: parsedStock,
              code: prizeCode || p.id.toUpperCase(),
              icon: prizeIcon,
            }
          : p
      );
      setPrizes(updated);
      setEditingPrizeId(null);
    } else {
      // Add new
      const newPrize: Prize = {
        id: 'p-' + Date.now().toString().slice(-6),
        name: prizeName,
        color: prizeColor,
        weight: parsedWeight,
        stock: parsedStock,
        code: prizeCode || 'CLAIM-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        icon: prizeIcon,
      };
      setPrizes([...prizes, newPrize]);
    }

    // Reset Form
    setPrizeName('');
    setPrizeColor('#3b82f6');
    setPrizeWeight(1);
    setPrizeStock('');
    setPrizeCode('');
    setPrizeIcon('🎁');
  };

  // Start editing selector helper
  const handleStartEdit = (p: Prize) => {
    setEditingPrizeId(p.id);
    setPrizeName(p.name);
    setPrizeColor(p.color);
    setPrizeWeight(p.weight);
    setPrizeStock(p.stock !== null ? p.stock : '');
    setPrizeCode(p.code);
    setPrizeIcon(p.icon);
  };

  // Delete prize helper
  const handleDeletePrize = (id: string) => {
    if (window.confirm('Hapus hadiah ini dari daftar roda putar?')) {
      setPrizes(prizes.filter((p) => p.id !== id));
      if (editingPrizeId === id) {
        setEditingPrizeId(null);
      }
    }
  };

  // Voucher generation (Random 6-digit alphanumerics)
  const generateNewVoucher = () => {
    const code = 'G-' + Math.floor(1000 + Math.random() * 9000).toString();
    const newV: Voucher = {
      code,
      isUsed: false,
      usedAt: null,
      createdAt: new Date().toLocaleTimeString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID'),
      buyerName: newVoucherName.trim() || 'Pembeli Umum',
    };
    setVouchers([newV, ...vouchers]);
    setNewVoucherName('');
  };

  // Bulk generate voucher tickets
  const bulkGenerateVouchers = (count: number) => {
    const arr: Voucher[] = [];
    for (let i = 0; i < count; i++) {
      const code = 'G-' + Math.floor(1000 + Math.random() * 9000).toString();
      arr.push({
        code,
        isUsed: false,
        usedAt: null,
        createdAt: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID'),
        buyerName: `Voucher Tiket #${i + 1}`,
      });
    }
    setVouchers([...arr, ...vouchers]);
  };

  // Delete specific unused voucher helper
  const handleDeleteVoucher = (code: string) => {
    if (window.confirm(`Hapus voucher ${code}?`)) {
      setVouchers(vouchers.filter((v) => v.code !== code));
    }
  };

  // Mark log as claimed / unclaimed toggle
  const toggleHistoryClaimed = (id: string) => {
    setHistory(
      history.map((h) => (h.id === id ? { ...h, claimed: !h.claimed } : h))
    );
  };

  // Export JSON configs download
  const handleExportData = () => {
    const backup = {
      prizes,
      history,
      vouchers,
      requireVoucher,
      ownerPin,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mario-gacha-backup-${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON configs reader
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.prizes) setPrizes(parsed.prizes);
        if (parsed.history) setHistory(parsed.history);
        if (parsed.vouchers) setVouchers(parsed.vouchers);
        if (parsed.requireVoucher !== undefined) setRequireVoucher(parsed.requireVoucher);
        if (parsed.ownerPin !== undefined) setOwnerPin(parsed.ownerPin);
        alert('Data backup berhasil diimpor!');
      } catch (err) {
        alert('Gagal mengimpor file. Format data JSON salah.');
      }
    };
    reader.readAsText(file);
  };

  // Filtering data logic
  const filteredVouchers = vouchers.filter(
    (v) =>
      v.code.toLowerCase().includes(voucherSearch.toLowerCase()) ||
      v.buyerName.toLowerCase().includes(voucherSearch.toLowerCase())
  );

  const filteredHistory = history.filter((h) => {
    const matchesSearch =
      h.buyerName.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.prizeName.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.prizeCode.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.voucherCode.toLowerCase().includes(historySearch.toLowerCase());

    if (historyFilter === 'ALL') return matchesSearch;
    if (historyFilter === 'CLAIMED') return matchesSearch && h.claimed;
    return matchesSearch && !h.claimed;
  });

  return (
    <div className="w-full max-w-5xl mx-auto bg-stone-900 border-4 border-stone-800 rounded-2xl shadow-2xl flex flex-col min-h-[580px] text-white" id="owner-panel-container">
      {/* Panel Top Title Bar */}
      <div className="px-6 py-4 border-b border-stone-850 flex items-center justify-between bg-stone-950/60 rounded-t-xl" id="panel-titlebar">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500 text-stone-950 rounded-xl shadow-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-stone-100 flex items-center gap-1.5">
              <span>Dasbor Pemilik Toko</span>
              <span className="text-xs bg-red-500 text-white font-sans px-2 py-0.5 rounded-full uppercase">Host Panel</span>
            </h1>
            <p className="text-xs text-stone-400 font-mono mt-0.5">
              Kelola hadiah gacha, buat voucher tiket customer, & pantau rekap pemenang undian.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="bg-stone-820 hover:bg-stone-750 text-stone-300 font-mono text-xs px-4 py-2 rounded-lg border border-stone-700 transition"
          id="btn-close-dashboard"
        >
          Keluar Dasbor ◀
        </button>
      </div>

      {/* Main Panel grid */}
      <div className="flex flex-col md:flex-row flex-1" id="panel-inner-grid">
        {/* Horizontal/Vertical Left Sidebar Navigation Tabs */}
        <div className="w-full md:w-56 bg-stone-950/30 p-4 border-r border-stone-850 flex flex-row md:flex-col gap-1.5 overflow-x-auto min-w-[150px]" id="panel-sidebar-nav">
          <button
            onClick={() => setActiveTab('PRIZES')}
            className={`w-full text-left font-mono text-xs px-3.5 py-3 rounded-lg transition flex items-center gap-2.5 ${
              activeTab === 'PRIZES'
                ? 'bg-yellow-400 text-black font-bold shadow-md'
                : 'text-stone-300 hover:bg-stone-850'
            }`}
          >
            <Gift className="w-4.5 h-4.5" /> Hadiah Gacha (Spin)
          </button>

          <button
            onClick={() => setActiveTab('VOUCHERS')}
            className={`w-full text-left font-mono text-xs px-3.5 py-3 rounded-lg transition flex items-center gap-2.5 ${
              activeTab === 'VOUCHERS'
                ? 'bg-yellow-400 text-black font-bold shadow-md'
                : 'text-stone-300 hover:bg-stone-850'
            }`}
          >
            <Ticket className="w-4.5 h-4.5" /> Tiket Voucher
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`w-full text-left font-mono text-xs px-3.5 py-3 rounded-lg transition flex items-center gap-2.5 ${
              activeTab === 'HISTORY'
                ? 'bg-yellow-400 text-black font-bold shadow-md'
                : 'text-stone-300 hover:bg-stone-850'
            }`}
          >
            <History className="w-4.5 h-4.5" /> Rekap Pemenang ({history.length})
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`w-full text-left font-mono text-xs px-3.5 py-3 rounded-lg transition flex items-center gap-2.5 ${
              activeTab === 'SETTINGS'
                ? 'bg-yellow-400 text-black font-bold shadow-md'
                : 'text-stone-300 hover:bg-stone-850'
            }`}
          >
            <Key className="w-4.5 h-4.5" /> Pengaturan & PIN
          </button>
        </div>

        {/* Tab Detail Contents Viewport */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[580px]" id="tab-viewport">
          
          {/* TAB 1: PRIZES MANAGEMENT */}
          {activeTab === 'PRIZES' && (
            <div className="space-y-6 animate-fade-in" id="content-prizes">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h2 className="text-base font-bold font-mono tracking-wide text-yellow-400 flex items-center gap-2">
                  <Gift className="w-4.5 h-4.5" /> Kelola Segmen Roda Putar Hadiah
                </h2>
                
                <button
                  onClick={loadPresetPrizes}
                  className="text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 text-stone-100 flex items-center gap-1 px-3 py-1.5 rounded-lg transition border border-amber-500 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Bebankan Preset Bawaan
                </button>
              </div>

              {/* Prize add form cards */}
              <form onSubmit={handleSavePrize} className="bg-stone-950/40 border border-stone-800 p-5 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 shadow-inner">
                <div className="md:col-span-3 text-xs font-mono text-stone-400 font-bold tracking-wider pb-1">
                  {editingPrizeId ? '🔄 EDIT DETAIL SEGMEN HADIAH' : '➕ TAMBAH SEGMEN HADIAH BARU'}
                </div>

                {/* Prize name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-stone-400">Nama Hadiah / Diskon:</label>
                  <input
                    type="text"
                    required
                    value={prizeName}
                    onChange={(e) => setPrizeName(e.target.value)}
                    placeholder="Contoh: Diskon 10% / Mug Unik"
                    className="bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-xs focus:border-yellow-400 focus:outline-none font-mono"
                  />
                </div>

                {/* Promo check claims code */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-stone-400">Kode Klaim Promo / Voucher:</label>
                  <input
                    type="text"
                    value={prizeCode}
                    onChange={(e) => setPrizeCode(e.target.value)}
                    placeholder="Apabila menang, kode ini yang muncul"
                    className="bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-xs focus:border-yellow-400 focus:outline-none font-mono text-green-400 uppercase"
                  />
                </div>

                {/* Color and Icon row */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[10px] font-mono text-stone-400">Warna Roda:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={prizeColor}
                        onChange={(e) => setPrizeColor(e.target.value)}
                        className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={prizeColor}
                        onChange={(e) => setPrizeColor(e.target.value)}
                        className="bg-stone-900 border border-stone-700 rounded w-full px-2 py-1.5 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 w-16">
                    <label className="text-[10px] font-mono text-stone-400">Emoji:</label>
                    <input
                      type="text"
                      value={prizeIcon}
                      onChange={(e) => setPrizeIcon(e.target.value)}
                      placeholder="🎁"
                      maxLength={4}
                      className="bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-xs focus:border-yellow-400 focus:outline-none font-mono text-center text-lg"
                    />
                  </div>
                </div>

                {/* Probability Weight */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-stone-400 flex items-center justify-between">
                    <span>Bobot / Rarity (Weight):</span>
                    <span className="text-yellow-500 font-bold">(pemberat kesempatan)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={prizeWeight}
                    onChange={(e) => setPrizeWeight(Number(e.target.value))}
                    className="bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-xs focus:border-yellow-400 focus:outline-none font-mono"
                  />
                </div>

                {/* Stocks Count */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-stone-400">Stok (Kosongkan jika tak terbatas):</label>
                  <input
                    type="number"
                    min={0}
                    value={prizeStock}
                    onChange={(e) => setPrizeStock(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Tanpa Batas"
                    className="bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-xs focus:border-yellow-400 focus:outline-none font-mono"
                  />
                </div>

                {/* Action button trigger */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-mono font-bold text-xs h-9 px-4 rounded w-full flex items-center justify-center gap-1.5 shadow transition"
                    id="btn-save-prize"
                  >
                    <Plus className="w-4 h-4" />
                    {editingPrizeId ? 'Simpan Perubahan' : 'Tambahkan Hadiah'}
                  </button>
                </div>
              </form>

              {/* Grid representation table of active prizes */}
              <div className="border border-stone-800 rounded-xl overflow-hidden" id="prizes-table">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-stone-950/80 text-stone-400 text-[10px] border-b border-stone-800">
                    <tr>
                      <th className="p-3 pl-4">HADIAH</th>
                      <th className="p-3">WARNA SEKTOR</th>
                      <th className="p-3">BOBOT (WEIGHT)</th>
                      <th className="p-3">KODE PROMO / KLAIM</th>
                      <th className="p-3 text-center">STOK</th>
                      <th className="p-3 text-right pr-4">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-850">
                    {prizes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-stone-500">
                          Belum ada hadiah terkonfigurasi. Muat Preset Populer di atas untuk memulai cepat!
                        </td>
                      </tr>
                    ) : (
                      prizes.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-850/40 transition">
                          <td className="p-3 pl-4 flex items-center gap-2">
                            <span className="text-xl shrink-0">{p.icon}</span>
                            <span className="font-bold text-stone-200">{p.name}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span style={{ backgroundColor: p.color }} className="w-4 h-4 rounded border border-stone-600 block"></span>
                              <span className="text-stone-400 font-mono text-[11px]">{p.color}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-stone-300 font-bold">{p.weight}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-green-400 bg-black/40 px-2 py-0.5 rounded text-[11px] font-semibold border border-stone-800">
                              {p.code}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {p.stock !== null ? (
                              <span className={p.stock <= 0 ? 'text-rose-500 font-bold bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-900/30' : 'text-stone-300'}>
                                {p.stock} pcs
                              </span>
                            ) : (
                              <span className="text-stone-500">∞ Unlimited</span>
                            )}
                          </td>
                          <td className="p-3 text-right pr-4 space-x-1">
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="p-1.5 bg-stone-800 hover:bg-stone-700 rounded text-stone-300 transition"
                              title="Edit segmen"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePrize(p.id)}
                              className="p-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-900 rounded text-rose-400 transition"
                              title="Hapus segmen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: VOUCHER CODES TICKETING ENGINE */}
          {activeTab === 'VOUCHERS' && (
            <div className="space-y-6 animate-fade-in" id="content-vouchers">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-3">
                <h2 className="text-base font-bold font-mono tracking-wide text-yellow-400 flex items-center gap-2">
                  <Ticket className="w-4.5 h-4.5" /> Gacha Ticket & Voucher Generator
                </h2>

                <div className="flex items-center gap-2" id="require-voucher-toggle">
                  <span className="text-xs font-mono text-stone-400">Verifikasi Voucher Main wajib?</span>
                  <button
                    onClick={() => setRequireVoucher(!requireVoucher)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      requireVoucher ? 'bg-yellow-400' : 'bg-stone-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-stone-900 shadow ring-0 transition duration-200 ease-in-out ${
                        requireVoucher ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Informative tutorial alert */}
              <div className="bg-stone-950/60 border-l-4 border-yellow-500 p-4 rounded-r-xl space-y-1 font-mono text-xs text-stone-400" id="voucher-engine-intro">
                💡 <b className="text-yellow-400">Cara Kerja Voucher Tiket:</b> Kemungkinan customer kamu iseng putar berkali-kali tanpa ijin bisa dibatasi. Berikan 1 kode voucher acak (seperti <b>G-5832</b>) kepada pembeli setiap selesai berbelanja senilai nominal tertentu. Mereka lalu login/input kode tersebut di awal game, bermain game, melakukan 1 kali spin, & tiket tersebut otomatis hangus!
              </div>

              {/* Generation tools box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="vouchers-actions-box">
                {/* Generate 1 ticket */}
                <div className="bg-stone-950/30 border border-stone-800 p-5 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold font-mono text-stone-300">🎟️ BUAT SATU VOUCHER KUSTOM</h3>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVoucherName}
                      onChange={(e) => setNewVoucherName(e.target.value)}
                      placeholder="Nama Customer (Misal: Doni L.)"
                      className="bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-xs focus:border-yellow-400 focus:outline-none font-mono flex-1 text-white"
                    />
                    <button
                      onClick={generateNewVoucher}
                      className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold font-mono text-xs px-4 py-1.5 rounded transition shadow"
                    >
                      Buat Tiket
                    </button>
                  </div>
                </div>

                {/* Bulk generate tickets */}
                <div className="bg-stone-950/30 border border-stone-800 p-5 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold font-mono text-stone-300">⚡ GENERATE TIKET BULK (KILAT)</h3>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => bulkGenerateVouchers(5)}
                      className="bg-stone-800 hover:bg-stone-750 text-stone-100 font-mono text-xs px-4 py-2 border border-stone-700 rounded transition"
                    >
                      +5 Tiket Acak
                    </button>
                    <button
                      onClick={() => bulkGenerateVouchers(10)}
                      className="bg-stone-800 hover:bg-stone-750 text-stone-100 font-mono text-xs px-4 py-2 border border-stone-700 rounded transition"
                    >
                      +10 Tiket Acak
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Bersihkan semua tiket voucher?')) {
                          setVouchers([]);
                        }
                      }}
                      className="bg-rose-950/60 hover:bg-rose-900 text-rose-400 text-xs font-mono px-4 py-2 rounded border border-rose-900 transition"
                    >
                      Hapus Semua Tiket
                    </button>
                  </div>
                </div>
              </div>

              {/* Vouchers lists */}
              <div className="space-y-3" id="vouchers-records-list">
                <div className="flex items-center gap-2 bg-stone-950/40 px-3 py-1.5 rounded-lg border border-stone-800 max-w-sm">
                  <Search className="w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    value={voucherSearch}
                    onChange={(e) => setVoucherSearch(e.target.value)}
                    placeholder="Cari kode atau nama pembeli..."
                    className="bg-transparent border-0 focus:outline-none text-xs font-mono w-full text-white placeholder-stone-600"
                  />
                </div>

                <div className="border border-stone-800 rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-stone-950/70 text-stone-400 text-[10px] border-b border-stone-800">
                      <tr>
                        <th className="p-3 pl-4">KODE VOUCHER</th>
                        <th className="p-3">NAMA BUYER</th>
                        <th className="p-3">TANGGAL DIBUAT</th>
                        <th className="p-3 text-center">STATUS AKTIF</th>
                        <th className="p-3 text-right pr-4">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {filteredVouchers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-stone-500">
                            Tidak ada voucher ditemukan sesuai query.
                          </td>
                        </tr>
                      ) : (
                        filteredVouchers.map((v) => (
                          <tr key={v.code} className="hover:bg-stone-850/30 transition">
                            <td className="p-3 pl-4">
                              <span className="font-bold text-yellow-400 text-sm tracking-widest bg-stone-950 px-2.5 py-1 rounded border border-stone-800">
                                {v.code}
                              </span>
                            </td>
                            <td className="p-3 text-stone-250 font-medium">
                              {v.buyerName}
                            </td>
                            <td className="p-3 text-stone-400 text-[11px]">
                              {v.createdAt}
                            </td>
                            <td className="p-3 text-center">
                              {v.isUsed ? (
                                <span className="text-stone-500 bg-stone-950 px-2 py-0.5 rounded text-[10px] border border-stone-850">
                                  Sudah Dipakai ({v.usedAt})
                                </span>
                              ) : (
                                <span className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-900/30 animate-pulse">
                                  Belum Dipakai (Aktif)
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right pr-4">
                              <button
                                onClick={() => handleDeleteVoucher(v.code)}
                                disabled={v.isUsed}
                                className={`p-1.5 rounded transition ${
                                  v.isUsed 
                                    ? 'text-stone-600 bg-stone-850/20 cursor-not-allowed'
                                    : 'text-rose-400 bg-rose-950 hover:bg-rose-900'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPINS WINNERS HISTORY LEDGER */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-6 animate-fade-in" id="content-history">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-3">
                <h2 className="text-base font-bold font-mono tracking-wide text-yellow-400 flex items-center gap-2">
                  <History className="w-4.5 h-4.5" /> Rekap Pemenang Gacha Roda Putar
                </h2>

                <button
                  onClick={() => {
                    if (window.confirm('Ingin menghapus selamanya riwayat klaim ini?')) {
                      setHistory([]);
                    }
                  }}
                  className="bg-rose-950/45 hover:bg-rose-900 text-rose-400 border border-rose-900 text-xs font-mono px-3 py-1.5 rounded transition"
                >
                  Reset Riwayat
                </button>
              </div>

              {/* Filtering settings toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-950/30 p-3 rounded-lg border border-stone-800" id="history-toolbar">
                {/* Search bar */}
                <div className="flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded border border-stone-750 max-w-xs flex-1">
                  <Search className="w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Cari pemenang, hadiah, kode..."
                    className="bg-transparent border-0 focus:outline-none text-xs font-mono w-full text-white placeholder-stone-600"
                  />
                </div>

                {/* Status select filter */}
                <div className="flex items-center gap-1.5 text-xs font-mono" id="history-pills-filter">
                  <span className="text-stone-400 text-[10px]">Filter status:</span>
                  {(['ALL', 'PENDING', 'CLAIMED'] as const).map((filterOpt) => (
                    <button
                      key={filterOpt}
                      onClick={() => setHistoryFilter(filterOpt)}
                      className={`px-3 py-1 rounded text-xs select-none transition ${
                        historyFilter === filterOpt
                          ? 'bg-yellow-400 text-black font-bold'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
                      }`}
                    >
                      {filterOpt === 'ALL' ? 'Semua' : filterOpt === 'PENDING' ? 'Belum Diambil' : 'Sudah Diambil'}
                    </button>
                  ))}
                </div>
              </div>

              {/* History logs registry */}
              <div className="border border-stone-800 rounded-xl overflow-hidden shadow-inner" id="history-table">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-stone-950/70 text-stone-400 text-[10px] border-b border-stone-800">
                    <tr>
                      <th className="p-3 pl-4">PEMENANG (CUSTOMER)</th>
                      <th className="p-3">VOUCHER TIKET</th>
                      <th className="p-3">HADIAH DIDAPAT</th>
                      <th className="p-3">KODE KLAIM KASIR</th>
                      <th className="p-3 text-center">WAKTU SPIN</th>
                      <th className="p-3 text-right pr-4">STATUS REBUSAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-850">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-stone-500">
                          Tidak ada riwayat putaran roda yang terekam.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((h) => (
                        <tr key={h.id} className="hover:bg-stone-850/30 transition">
                          <td className="p-3 pl-4">
                            <span className="font-bold text-stone-200">{h.buyerName}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-stone-400 font-mono text-[11px]">
                              {h.voucherCode || <i className="text-stone-600">Bebas Main</i>}
                            </span>
                          </td>
                          <td className="p-3 text-yellow-400 font-bold">
                            {h.prizeName}
                          </td>
                          <td className="p-3">
                            <span className="text-emerald-400 bg-stone-950 border border-stone-850 px-2 py-0.5 rounded text-[11px] font-bold">
                              {h.prizeCode}
                            </span>
                          </td>
                          <td className="p-3 text-center text-stone-500 text-[11px]">
                            {h.timestamp}
                          </td>
                          <td className="p-3 text-right pr-4">
                            <button
                              onClick={() => toggleHistoryClaimed(h.id)}
                              className={`text-[10px] font-bold font-mono px-3 py-1 rounded-lg border transition ${
                                h.claimed
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40 hover:bg-emerald-900/20'
                                  : 'bg-yellow-900/30 text-yellow-500 border-yellow-900/40 hover:bg-yellow-900/20'
                              }`}
                            >
                              {h.claimed ? '✓ Sudah Diserahkan' : '⏳ Serahkan Hadiah'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: GENERAL SETTINGS, SECURITY & PIN ACCESS CONFIG */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 animate-fade-in" id="content-settings">
              <div className="border-b border-stone-800 pb-3">
                <h2 className="text-base font-bold font-mono tracking-wide text-yellow-400 flex items-center gap-2">
                  <Key className="w-4.5 h-4.5" /> Pengaturan Dasbor & Backup
                </h2>
              </div>

              {/* PIN configuration guard options */}
              <div className="bg-stone-950/40 border border-stone-800 p-5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold font-mono text-stone-300 flex items-center gap-2">
                  <Shield className="w-4.5 h-4.5 text-yellow-500" />
                  GANTI PIN LOGIN PEMILIK TOKO
                </h3>
                
                <p className="text-xs text-stone-400 font-mono leading-relaxed">
                  Agar customer/pembeli tidak sengaja membuka dasbor dan melihat daftar kode rahasia atau mengubah segmen hadiah. PIN default adalah <b className="text-yellow-400 font-bold">1234</b>.
                </p>

                <div className="flex flex-col gap-3 max-w-sm">
                  <div className="flex items-center gap-2">
                    <input
                      type={showPinInput ? 'text' : 'password'}
                      value={tempPin}
                      onChange={(e) => {
                        setTempPin(e.target.value);
                        setPinMessage('');
                      }}
                      placeholder="PIN Baru"
                      className="bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-xs focus:border-yellow-400 focus:outline-none font-mono text-white flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinInput(!showPinInput)}
                      className="p-2 bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-white rounded border border-stone-700 transition"
                    >
                      {showPinInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (tempPin.trim().length === 0) {
                        setPinMessage('PIN tidak boleh kosong!');
                        return;
                      }
                      setOwnerPin(tempPin);
                      setPinMessage('PIN berhasil disimpan!');
                    }}
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold font-mono text-xs py-2 rounded flex items-center justify-center gap-1 transition"
                  >
                    <Save className="w-4 h-4" /> Update PIN Pemilik
                  </button>

                  {pinMessage && (
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {pinMessage}
                    </span>
                  )}
                </div>
              </div>

              {/* Database backups operations JSON */}
              <div className="bg-stone-950/40 border border-stone-800 p-5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold font-mono text-stone-300">💾 CADANGKAN & PULIHKAN DATA (.JSON)</h3>
                <p className="text-xs text-stone-400 font-mono leading-relaxed">
                  Menyimpan perubahan hadiah dan riwayat spin undian ke dalam file di komputer/HP agar aman dari pembersihan riwayat cache browser secara berkala.
                </p>

                <div className="flex flex-wrap gap-3">
                  {/* Export Trigger */}
                  <button
                    onClick={handleExportData}
                    className="bg-stone-800 hover:bg-stone-750 text-stone-100 border border-stone-700 font-mono text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" /> Ekspor Data Cadangan (.json)
                  </button>

                  {/* Import Trigger */}
                  <div className="relative">
                    <input
                      type="file"
                      id="importFile"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                    <label
                      htmlFor="importFile"
                      className="bg-stone-800 hover:bg-stone-750 text-stone-100 border border-stone-700 font-mono text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition select-none inline-flex"
                    >
                      <Upload className="w-4 h-4" /> Impor Data Cadangan (.json)
                    </label>
                  </div>
                </div>
              </div>

              {/* Developer credentials details */}
              <div className="bg-stone-950/20 border border-stone-850 p-4 rounded-lg font-mono text-[10px] text-stone-500 leading-relaxed space-y-1">
                <div>📌 GACHA RETRO RUNNER v1.0.0</div>
                <div>Created with stateful client-side synchronization & local storage durability.</div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
