
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MOCK_USER } from "@/app/lib/mock-data";
import { PiggyBank, TrendingUp, Calendar, ChevronRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

const depositProducts = [
  { 
    name: "Elite Fixed Deposit", 
    rate: "4.85%", 
    term: "12-24 Bulan", 
    min: "Rp 10.000.000", 
    tag: "Terpopuler",
    color: "bg-primary/10 text-primary"
  },
  { 
    name: "Flexi Saver", 
    rate: "3.20%", 
    term: "Tanpa Kunci", 
    min: "Rp 1.000.000", 
    tag: "Likuiditas Tinggi",
    color: "bg-green-100 text-green-700"
  },
  { 
    name: "Growth Certificate", 
    rate: "5.10%", 
    term: "36+ Bulan", 
    min: "Rp 25.000.000", 
    tag: "Imbal Hasil Terbaik",
    color: "bg-blue-100 text-blue-700"
  }
];

export default function DepositsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-accent">Manajemen Deposito</h1>
            <p className="text-muted-foreground">Kembangkan kekayaan Anda dengan produk deposito premium</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Current Deposits */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-xl font-bold text-accent">Deposito Aktif Anda</h2>
            <div className="space-y-4">
              {MOCK_USER.deposits.map((dep) => (
                <div key={dep.id} className="liquid-glass p-6 rounded-3xl border-primary/10 card-hover-effect">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-accent">{dep.type}</p>
                      <p className="text-xs text-muted-foreground">Tenor: 12 Bulan</p>
                    </div>
                    <Badge className="bg-primary text-white">{dep.rate}</Badge>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-accent">
                        Rp {mounted ? dep.amount.toLocaleString('id-ID') : "..."}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Jumlah Pokok</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-primary p-0 h-auto hover:bg-transparent">
                      Detail <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 rounded-3xl gold-gradient text-white">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6" />
                <h3 className="font-bold">Total Bunga Diperoleh</h3>
              </div>
              <p className="text-3xl font-bold">
                Rp {mounted ? (1240420).toLocaleString('id-ID') : "..."}
              </p>
              <p className="text-xs text-white/70 mt-1">Akumulasi sejak Jan 2024</p>
            </div>
          </div>

          {/* Explore Products */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-xl font-bold text-accent">Jelajahi Produk Baru</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {depositProducts.map((product) => (
                <Card key={product.name} className="liquid-glass border-none shadow-sm card-hover-effect">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <Badge className={product.color}>{product.tag}</Badge>
                      <span className="text-xl font-bold text-primary">{product.rate} p.a.</span>
                    </div>
                    <CardTitle className="text-lg font-bold text-accent mt-2">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> Tenor
                        </span>
                        <span className="font-bold text-accent">{product.term}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Zap className="w-4 h-4" /> Setoran Min.
                        </span>
                        <span className="font-bold text-accent">{product.min}</span>
                      </div>
                    </div>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl">
                      Buka Produk
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="liquid-glass p-8 rounded-3xl border-primary/20 flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-accent mb-1">Perlindungan Finansial</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Semua deposito Anda dijamin hingga Rp 2 miliar per akun melalui Lembaga Penjamin Simpanan (LPS). Berinvestasi dengan tenang.
                </p>
              </div>
              <Button variant="outline" className="shrink-0 border-primary/20 text-primary rounded-xl">
                Lihat Cakupan
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
