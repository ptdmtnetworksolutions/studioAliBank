
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Box, 
  PackagePlus, 
  ShoppingBag, 
  Layers, 
  Trash2, 
  Edit2, 
  Loader2 
} from "lucide-react";
import { 
  addDoc, 
  collection, 
  serverTimestamp, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export function InventoryView({ marketplaceProducts }: any) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Kartu Hadiah");

  const handleAdd = async () => {
    if (!db || !name || !price) return;
    setIsAdding(true);
    try {
      await addDoc(collection(db, "marketplace"), {
        name,
        priceIdr: parseFloat(price),
        priceUsd: parseFloat(price) / 17690,
        category,
        createdAt: serverTimestamp(),
        id: `MKT-${Date.now()}`
      });
      toast({ title: "Produk Ditambahkan" });
      setName(""); setPrice("");
    } catch (e) {} finally { setIsAdding(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus produk?")) return;
    await deleteDoc(doc(db!, "marketplace", id));
    toast({ title: "Produk Dihapus" });
  };

  return (
    <div className="animate-in slide-in-from-right-10 duration-700 space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Pusat Inventaris</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Manajemen Katalog Produk Marketplace</p>
        </div>
        <Button className="rounded-xl gold-gradient text-white font-black h-12 px-6 italic uppercase shadow-lg"><PackagePlus className="w-4 h-4 mr-2" /> Katalog Baru</Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-4 border-none bg-card rounded-[2.5rem] p-8 space-y-6 shadow-sm h-fit">
          <h4 className="text-sm font-black italic uppercase">Tambah Produk</h4>
          <div className="space-y-4">
            <Input placeholder="Nama Produk" value={name} onChange={(e) => setName(e.target.value)} className="h-12 bg-muted border-none rounded-xl text-xs font-bold" />
            <Input type="number" placeholder="Harga (IDR)" value={price} onChange={(e) => setPrice(e.target.value)} className="h-12 bg-muted border-none rounded-xl text-xs font-bold" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-12 bg-muted border-none rounded-xl text-xs font-bold px-4 outline-none">
              <option>Kartu Hadiah</option>
              <option>Game</option>
              <option>Infrastructure</option>
              <option>Layanan Seluler</option>
            </select>
            <Button onClick={handleAdd} disabled={isAdding} className="w-full h-12 gold-gradient text-white rounded-xl font-black uppercase italic text-xs shadow-md">
              {isAdding ? <Loader2 className="animate-spin" /> : "Deploy ke Pasar"}
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-8 space-y-4">
          <h4 className="text-sm font-black italic uppercase ml-2">Listing Pasar</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketplaceProducts?.map((p: any) => (
              <Card key={p.id} className="p-6 rounded-[2rem] bg-card border border-border shadow-sm group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary border border-border">
                    {p.category === 'Infrastructure' ? <Layers className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary"><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-100 text-rose-600" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div>
                  <Badge className="bg-muted text-muted-foreground border-none text-[7px] font-black h-4 px-1.5 uppercase mb-2">{p.category}</Badge>
                  <h5 className="text-sm font-black uppercase italic leading-none">{p.name}</h5>
                  <p className="text-[11px] font-black italic text-primary mt-2">Rp {p.priceIdr?.toLocaleString()}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
