
'use client';

/**
 * @fileOverview Modal deposit on-chain ke Smart Contract AliBankVault.
 * Memandu user melalui: Koneksi MetaMask → Input Jumlah → Konfirmasi → Sukses.
 */

import { useState, useEffect, useCallback } from 'react';
import { useVaultDeposit } from '@/hooks/useVaultDeposit';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Zap,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Lock,
  Globe,
  Cpu,
  Copy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VaultDepositModalProps {
  open: boolean;
  onClose: () => void;
}

const VAULT_CONTRACT = '0x56268032A3B3E64CFeF1916d591087CF8dF40945';

export function VaultDepositModal({ open, onClose }: VaultDepositModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [hasConnected, setHasConnected] = useState(false);

  const {
    step,
    walletAddress,
    txHash,
    error,
    gasEstimate,
    onChainBalance,
    isWalletAvailable,
    connectWallet,
    estimateGas,
    executeDeposit,
    reset,
  } = useVaultDeposit(user?.uid);

  // Auto-estimate gas saat amount berubah
  useEffect(() => {
    if (walletAddress && amount && parseFloat(amount) > 0) {
      estimateGas(amount);
    }
  }, [amount, walletAddress, estimateGas]);

  const handleClose = useCallback(() => {
    reset();
    setAmount('');
    setHasConnected(false);
    onClose();
  }, [reset, onClose]);

  const handleConnect = async () => {
    const addr = await connectWallet();
    if (addr) setHasConnected(true);
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ variant: 'destructive', title: 'Input Tidak Valid', description: 'Masukkan jumlah ETH yang ingin di-deposit.' });
      return;
    }
    await executeDeposit(amount);
  };

  const copyTxHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      toast({ title: 'Disalin!', description: 'Hash transaksi telah disalin.' });
    }
  };

  const presetAmounts = ['0.001', '0.005', '0.01', '0.05'];

  const isLoading = step === 'connecting' || step === 'switching_network' || step === 'depositing' || step === 'confirming';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md bg-[#0d0f10] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        
        {/* Header Gradient Bar */}
        <div className="h-1 w-full gold-gradient" />

        <div className="p-8 space-y-6">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-xl">
                <Cpu className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black italic uppercase tracking-tight text-white">
                  Deposit ke Vault
                </DialogTitle>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                  AliBankVault · Ethereum Mainnet
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Info Kontrak */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Kontrak Vault</p>
              <p className="text-[10px] font-mono font-bold text-white/60 mt-0.5">{VAULT_CONTRACT.slice(0, 16)}...{VAULT_CONTRACT.slice(-8)}</p>
            </div>
            <a
              href={`https://etherscan.io/address/${VAULT_CONTRACT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* === STATE: ERROR === */}
          {step === 'error' && error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex gap-3 animate-in slide-in-from-top-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-rose-300 uppercase leading-relaxed">{error}</p>
            </div>
          )}

          {/* === STATE: SUCCESS === */}
          {step === 'success' && txHash ? (
            <div className="space-y-6 animate-in zoom-in duration-500">
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic text-white uppercase">BERHASIL!</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase mt-1">
                    {amount} ETH berhasil masuk ke AliBankVault
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-white/30 uppercase">Saldo Anda di Kontrak</p>
                  <p className="text-sm font-black italic text-green-400">{parseFloat(onChainBalance || '0').toFixed(8)} ETH</p>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-[9px] font-black text-white/30 uppercase mb-2">Hash Transaksi</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-mono text-white/50 break-all flex-1">{txHash}</p>
                    <button onClick={copyTxHash} className="text-white/30 hover:text-white transition-colors shrink-0">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full h-12 bg-white/10 text-white hover:bg-white/20 border-none rounded-2xl font-black uppercase text-[10px] tracking-widest">
                    <ExternalLink className="w-4 h-4 mr-2" /> Lihat di Etherscan
                  </Button>
                </a>
                <Button
                  onClick={handleClose}
                  className="flex-1 h-12 gold-gradient text-white border-none rounded-2xl font-black uppercase text-[10px] tracking-widest"
                >
                  Selesai
                </Button>
              </div>
            </div>
          ) : step === 'depositing' || step === 'confirming' ? (
            /* === STATE: LOADING / CONFIRMING === */
            <div className="flex flex-col items-center text-center py-8 space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full gold-gradient flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black italic text-white uppercase">
                  {step === 'depositing' ? 'Menunggu Konfirmasi MetaMask...' : 'Memproses di Blockchain...'}
                </p>
                <p className="text-[10px] font-bold text-white/40 uppercase leading-relaxed">
                  {step === 'depositing'
                    ? 'Cek popup MetaMask Anda dan klik "Confirm"'
                    : txHash ? `Menunggu konfirmasi blok... TxHash: ${txHash.slice(0, 10)}...` : 'Memproses transaksi...'
                  }
                </p>
              </div>
              {txHash && (
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-[10px] font-black uppercase flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Pantau di Etherscan
                </a>
              )}
            </div>
          ) : !walletAddress || !hasConnected ? (
            /* === STATE: CONNECT WALLET === */
            <div className="space-y-6">
              {!isWalletAvailable && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-amber-300 uppercase">MetaMask Tidak Ditemukan</p>
                    <p className="text-[9px] font-bold text-white/40 uppercase mt-1 leading-relaxed">
                      Install ekstensi MetaMask di Chrome/Firefox, lalu refresh halaman ini.
                    </p>
                    <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-amber-400 text-[9px] font-black uppercase flex items-center gap-1 mt-2 hover:underline">
                      Download MetaMask <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {[
                  { icon: Lock, text: 'Deposit langsung from wallet Anda ke smart contract' },
                  { icon: ShieldCheck, text: 'Tidak ada pihak ketiga — sepenuhnya on-chain' },
                  { icon: Globe, text: 'Transparansi penuh — verifikasi di Etherscan kapan saja' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-[10px] font-bold text-white/60 uppercase">{text}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleConnect}
                disabled={!isWalletAvailable || step === 'connecting' || step === 'switching_network'}
                className="w-full h-14 gold-gradient text-white border-none rounded-2xl font-black italic uppercase tracking-widest shadow-xl hover:scale-[1.01] transition-all"
              >
                {step === 'connecting' ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Menghubungkan...</>
                ) : step === 'switching_network' ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Ganti ke Mainnet...</>
                ) : (
                  <><Wallet className="w-5 h-5 mr-2" /> Hubungkan MetaMask</>
                )}
              </Button>
            </div>
          ) : (
            /* === STATE: INPUT AMOUNT (Wallet Connected) === */
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Info wallet terhubung */}
              <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-green-400 uppercase">Wallet Terhubung</p>
                    <p className="text-[9px] font-mono text-white/50 mt-0.5">{walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}</p>
                  </div>
                </div>
                {onChainBalance && (
                  <div className="text-right">
                    <p className="text-[8px] font-black text-white/30 uppercase">Saldo di Vault</p>
                    <p className="text-[10px] font-black text-white/70">{parseFloat(onChainBalance).toFixed(8)} ETH</p>
                  </div>
                )}
              </div>

              {/* Preset amount buttons */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Pilih Cepat</label>
                <div className="grid grid-cols-4 gap-2">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className={cn(
                        'py-2 rounded-xl text-[10px] font-black uppercase transition-all border',
                        amount === preset
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                          : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input jumlah */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Jumlah Deposit (ETH)</label>
                <div className="relative">
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.001"
                    min="0"
                    className="h-16 pl-12 pr-16 bg-white/5 border-white/10 rounded-2xl font-black italic text-xl text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/30 uppercase">ETH</span>
                </div>
                {gasEstimate && (
                  <p className="text-[9px] font-bold text-white/30 uppercase ml-1">
                    Estimasi Gas: <span className="text-white/50">{gasEstimate}</span>
                  </p>
                )}
              </div>

              {/* Warning */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold text-amber-300/80 uppercase leading-relaxed">
                  Pastikan wallet Anda memiliki ETH lebih untuk biaya gas (~0.002 ETH). Transaksi on-chain tidak bisa dibatalkan setelah dikonfirmasi.
                </p>
              </div>

              {/* Tombol deposit */}
              <Button
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                className="w-full h-14 gold-gradient text-white border-none rounded-2xl font-black italic uppercase tracking-widest shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:scale-100"
              >
                <span className="flex items-center gap-3">
                  DEPOSIT KE VAULT <ArrowRight className="w-5 h-5" />
                </span>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
