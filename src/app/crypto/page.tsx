
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Bitcoin, 
  Wallet, 
  ArrowUpRight, 
  ShieldCheck, 
  Zap, 
  Link as LinkIcon,
  RefreshCw,
  Info,
  ArrowDownRight,
  ChevronRight,
  Cpu,
  Settings,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { BrowserProvider, formatEther, parseEther, Contract } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CONTRACT_ABI = [
  "function deposit() public payable",
  "function withdraw(uint256 _amount) public",
  "function balances(address) public view returns (uint256)",
  "function getContractBalance() public view returns (uint256)"
];

const DEFAULT_CONTRACT = "0x8BAFCa0a5a5F288DCcaaf6d951d3D3D59E0d1dd";

export default function CryptoPage() {
  const { toast } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [vaultBalance, setVaultBalance] = useState<string>("0");
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT);
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [isContractValid, setIsContractValid] = useState<boolean | null>(null);
  const [inputAmount, setInputAmount] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("alibank_contract_address");
    if (saved) setContractAddress(saved);
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        variant: "destructive",
        title: "Web3 Support Needed",
        description: "Please use MetaMask browser or extension.",
      });
      return;
    }

    setLoading(true);
    setIsContractValid(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) { 
        toast({
          variant: "destructive",
          title: "Wrong Network",
          description: "Please switch your MetaMask to Sepolia Network.",
        });
        setIsContractValid(false);
        setLoading(false);
        return;
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      const userAddress = accounts[0];
      const ethBalance = await provider.getBalance(userAddress);
      
      setAddress(userAddress);
      setBalance(formatEther(ethBalance));
      
      if (contractAddress && contractAddress.length === 42) {
        try {
          const code = await provider.getCode(contractAddress);
          if (code === "0x" || code === "0x0") {
            setIsContractValid(false);
            setVaultBalance("0");
          } else {
            setIsContractValid(true);
            const contract = new Contract(contractAddress, CONTRACT_ABI, provider);
            const vault = await contract.balances(userAddress);
            setVaultBalance(formatEther(vault));
          }
        } catch (e) {
          console.error("Vault read error:", e);
          setIsContractValid(false);
        }
      }

      toast({
        title: "Wallet Connected",
        description: `Connected to ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to connect to your wallet.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSmartContractAction = async (action: 'deposit' | 'withdraw', amountVal: string) => {
    if (!address || !amountVal) return;
    
    setTxLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, CONTRACT_ABI, signer);
      
      let tx;
      if (action === 'deposit') {
        tx = await contract.deposit({ value: parseEther(amountVal) });
      } else {
        tx = await contract.withdraw(parseEther(amountVal));
      }

      toast({
        title: "Transaction Sent",
        description: "Waiting for blockchain confirmation...",
      });

      await tx.wait();
      
      toast({
        title: "Success",
        description: `Successfully ${action === 'deposit' ? 'deposited' : 'withdrawn'} ${amountVal} ETH.`,
      });
      
      connectWallet();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: err.reason || "Ensure you have enough balance and gas.",
      });
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-5xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-lg">
                <Cpu className="text-white w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter dark:text-primary">Crypto Bridge</h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium">Digital banking gateway to the smart contract ecosystem.</p>
          </div>
          
          <div className="flex gap-2">
            {isContractValid === true && (
              <Badge className="bg-green-100 text-green-700 border-green-200 flex gap-2 items-center px-4 py-2 rounded-full">
                <CheckCircle2 className="w-4 h-4" /> Smart Contract Verified
              </Badge>
            )}
            <Badge variant="outline" className="border-primary/20 text-primary px-4 py-2 rounded-full uppercase text-[10px] font-bold tracking-widest">
              Network: Sepolia
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase text-[9px] font-black tracking-widest px-3 py-1">
                      On-Chain Banking
                    </Badge>
                    <h3 className="text-xl font-bold text-accent dark:text-primary mt-2">AliBank Digital Vault</h3>
                  </div>
                  <Bitcoin className="w-8 h-8 text-primary/40" />
                </div>

                {address ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Wallet Balance</p>
                        <p className="text-3xl font-black italic tracking-tighter text-accent dark:text-primary">
                          {parseFloat(balance).toFixed(4)} <span className="text-xs">ETH</span>
                        </p>
                      </div>
                      <div className="bg-accent/5 p-6 rounded-2xl border border-accent/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Vault Balance</p>
                        <p className="text-3xl font-black italic tracking-tighter text-accent dark:text-primary">
                          {parseFloat(vaultBalance).toFixed(4)} <span className="text-xs">ETH</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/30">ETH</span>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          value={inputAmount}
                          onChange={(e) => setInputAmount(e.target.value)}
                          className="h-16 pl-16 rounded-2xl liquid-glass border-none text-xl font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          onClick={() => handleSmartContractAction('deposit', inputAmount)}
                          disabled={txLoading || !inputAmount || isContractValid !== true}
                          className="h-14 gold-gradient text-white font-black italic rounded-2xl flex gap-2 active:scale-95 transition-all shadow-xl shadow-primary/20"
                        >
                          {txLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowDownRight className="w-5 h-5" />}
                          DEPOSIT TO VAULT
                        </Button>
                        <Button 
                          onClick={() => handleSmartContractAction('withdraw', inputAmount)}
                          disabled={txLoading || !inputAmount || isContractValid !== true}
                          variant="outline"
                          className="h-14 border-primary/20 text-primary font-black italic rounded-2xl flex gap-2 active:scale-95 transition-all"
                        >
                          {txLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
                          WITHDRAW FROM VAULT
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-6 border-2 border-dashed border-primary/10 rounded-[2rem]">
                    <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
                      <LinkIcon className="w-10 h-10 text-primary/30" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-accent uppercase tracking-tight dark:text-primary">Web3 Bridge Inactive</p>
                      <p className="text-xs text-muted-foreground px-10">Connect your MetaMask wallet to interact with the AliBank Digital Vault.</p>
                    </div>
                    <Button 
                      onClick={connectWallet}
                      disabled={loading}
                      className="gold-gradient text-white font-black italic uppercase tracking-tighter px-12 h-16 rounded-2xl shadow-2xl active:scale-95 transition-all"
                    >
                      {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : "ACTIVATE CRYPTO BRIDGE"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass border-none rounded-[2rem] p-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-accent dark:text-primary mb-6 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Contract Configuration
              </h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground ml-1 uppercase">Active Contract Address</Label>
                  <div className="relative">
                    <Input 
                      value={contractAddress}
                      onChange={(e) => {
                        setContractAddress(e.target.value);
                        localStorage.setItem("alibank_contract_address", e.target.value);
                        setIsContractValid(null);
                      }}
                      className="h-12 rounded-xl border-primary/10 bg-white/50 dark:bg-black/50 font-mono text-[10px] pr-10 truncate"
                    />
                    {isContractValid === true && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    All vault operations are decentralized and secured by the Ethereum blockchain. Withdrawal is only permitted to the original depositing address.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass-dark rounded-[2rem] p-6 text-white border-none shadow-xl">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-black italic uppercase tracking-tighter">Security Protocol</h4>
                <p className="text-[10px] text-white/70 leading-relaxed uppercase tracking-widest font-bold">
                  Transactions require double-layer verification. Ensure gas fees are sufficient on Sepolia.
                </p>
                <Button variant="link" className="text-primary p-0 h-auto text-[10px] font-black uppercase tracking-widest">
                  View Audit Report <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
