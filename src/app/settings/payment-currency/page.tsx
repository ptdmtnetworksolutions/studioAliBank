
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Search, 
  Sparkles,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const currencies = [
  { code: "AED", name: "Dirham Uni Emirat Arab", color: "bg-emerald-500", symbol: "د.إ" },
  { code: "AFN", name: "Afgani Afganistan", color: "bg-rose-500", symbol: "؋" },
  { code: "ALL", name: "Lek Albania", color: "bg-pink-600", symbol: "Lek" },
  { code: "AMD", name: "Dram Armenia", color: "bg-blue-500", symbol: "֏" },
  { code: "AOA", name: "Kwanza Angola", color: "bg-red-500", symbol: "Kz" },
  { code: "ARS", name: "Peso Argentina", color: "bg-blue-300", symbol: "$" },
  { code: "AUD", name: "Dolar Australia", color: "bg-blue-700", symbol: "$" },
  { code: "AZN", name: "Manat Azerbaijan", color: "bg-indigo-400", symbol: "₼" },
  { code: "BAM", name: "Mark Konvertibel Bosnia-Herzegovina", color: "bg-blue-600", symbol: "KM" },
  { code: "BDT", name: "Taka Bangladesh", color: "bg-teal-500", symbol: "৳" },
  { code: "BGN", name: "Lev Bulgaria", color: "bg-slate-400", symbol: "лв" },
  { code: "BHD", name: "Dinar Bahrain", color: "bg-red-600", symbol: ".د.ب" },
  { code: "BIF", name: "Franc Burundi", color: "bg-green-600", symbol: "FBu" },
  { code: "BND", name: "Dolar Brunei", color: "bg-yellow-500", symbol: "$" },
  { code: "BOB", name: "Boliviano Bolivia", color: "bg-green-700", symbol: "Bs." },
  { code: "BRL", name: "Real Brasil", color: "bg-green-600", symbol: "R$" },
  { code: "BWP", name: "Pula Botswana", color: "bg-blue-400", symbol: "P" },
  { code: "BYN", name: "Ruble Belarusia", color: "bg-red-400", symbol: "Br" },
  { code: "CAD", name: "Dolar Kanada", color: "bg-red-600", symbol: "$" },
  { code: "CHF", name: "Franc Swiss", color: "bg-slate-500", symbol: "CHF" },
  { code: "CLP", name: "Peso Chili", color: "bg-red-500", symbol: "$" },
  { code: "CNY", name: "Yuan Tiongkok", color: "bg-red-600", symbol: "¥" },
  { code: "COP", name: "Peso Kolombia", color: "bg-yellow-600", symbol: "$" },
  { code: "CZK", name: "Koruna Ceko", color: "bg-blue-500", symbol: "Kč" },
  { code: "DKK", name: "Krone Denmark", color: "bg-red-500", symbol: "kr" },
  { code: "DOP", name: "Peso Dominika", color: "bg-blue-400", symbol: "RD$" },
  { code: "DZD", name: "Dinar Aljazair", color: "bg-green-500", symbol: "د.ج" },
  { code: "EGP", name: "Pound Mesir", color: "bg-slate-900", symbol: "E£" },
  { code: "EUR", name: "Euro", color: "bg-blue-800", symbol: "€" },
  { code: "GBP", name: "Pound Sterling Inggris", color: "bg-indigo-900", symbol: "£" },
  { code: "GEL", name: "Lari Georgia", color: "bg-red-500", symbol: "₾" },
  { code: "GHS", name: "Cedi Ghana", color: "bg-yellow-500", symbol: "GH₵" },
  { code: "HKD", name: "Dolar Hong Kong", color: "bg-red-600", symbol: "HK$" },
  { code: "HUF", name: "Forint Hungaria", color: "bg-green-500", symbol: "Ft" },
  { code: "IDR", name: "Rupiah Indonesia", color: "bg-rose-600", symbol: "Rp" },
  { code: "ILS", name: "Shekel Baru Israel", color: "bg-blue-500", symbol: "₪" },
  { code: "INR", name: "Rupee India", color: "bg-orange-500", symbol: "₹" },
  { code: "IQD", name: "Dinar Irak", color: "bg-red-600", symbol: "ع.د" },
  { code: "IRR", name: "Rial Iran", color: "bg-green-600", symbol: "﷼" },
  { code: "ISK", name: "Krona Islandia", color: "bg-blue-400", symbol: "kr" },
  { code: "JMD", name: "Dolar Jamaika", color: "bg-yellow-500", symbol: "J$" },
  { code: "JOD", name: "Dinar Yordania", color: "bg-red-500", symbol: "د.ا" },
  { code: "JPY", name: "Yen Jepang", color: "bg-slate-800", symbol: "¥" },
  { code: "KES", name: "Shilling Kenya", color: "bg-red-600", symbol: "KSh" },
  { code: "KGS", name: "Som Kirgizstan", color: "bg-red-500", symbol: "с" },
  { code: "KHR", name: "Riel Kamboja", color: "bg-blue-600", symbol: "៛" },
  { code: "KRW", name: "Won Korea Selatan", color: "bg-indigo-600", symbol: "₩" },
  { code: "KWD", name: "Dinar Kuwait", color: "bg-blue-400", symbol: "د.ك" },
  { code: "KZT", name: "Tenge Kazakhstan", color: "bg-blue-300", symbol: "₸" },
  { code: "LBP", name: "Pound Lebanon", color: "bg-red-600", symbol: "ل.ل" },
  { code: "LKR", name: "Rupee Sri Lanka", color: "bg-orange-400", symbol: "Rs" },
  { code: "MAD", name: "Dirham Maroko", color: "bg-red-500", symbol: "د.م." },
  { code: "MMK", name: "Kyat Myanmar", color: "bg-yellow-500", symbol: "K" },
  { code: "MNT", name: "Tugrik Mongolia", color: "bg-red-600", symbol: "₮" },
  { code: "MOP", name: "Pataca Makau", color: "bg-green-500", symbol: "P" },
  { code: "MUR", name: "Rupee Mauritius", color: "bg-red-500", symbol: "₨" },
  { code: "MXN", name: "Peso Meksiko", color: "bg-green-700", symbol: "$" },
  { code: "MYR", name: "Ringgit Malaysia", color: "bg-yellow-400", symbol: "RM" },
  { code: "NGN", name: "Naira Nigeria", color: "bg-green-600", symbol: "₦" },
  { code: "NOK", name: "Krone Norwegia", color: "bg-red-600", symbol: "kr" },
  { code: "NPR", name: "Rupee Nepal", color: "bg-red-500", symbol: "₨" },
  { code: "NZD", name: "Dolar Selandia Baru", color: "bg-blue-600", symbol: "$" },
  { code: "OMR", name: "Rial Oman", color: "bg-red-500", symbol: "ر.ع." },
  { code: "PEN", name: "Sol Peru", color: "bg-red-600", symbol: "S/." },
  { code: "PHP", name: "Peso Filipina", color: "bg-blue-500", symbol: "₱" },
  { code: "PKR", name: "Rupee Pakistan", color: "bg-green-600", symbol: "₨" },
  { code: "PLN", name: "Zloty Polandia", color: "bg-red-500", symbol: "zł" },
  { code: "PYG", name: "Guarani Paraguay", color: "bg-red-600", symbol: "Gs" },
  { code: "QAR", name: "Rial Qatar", color: "bg-red-800", symbol: "ر.ق" },
  { code: "RON", name: "Leu Rumania", color: "bg-blue-400", symbol: "lei" },
  { code: "RUB", name: "Ruble Rusia", color: "bg-red-600", symbol: "₽" },
  { code: "SAR", name: "Riyal Arab Saudi", color: "bg-green-700", symbol: "ر.س" },
  { code: "SEK", name: "Krona Swedia", color: "bg-blue-500", symbol: "kr" },
  { code: "SGD", name: "Dolar Singapura", color: "bg-red-500", symbol: "$" },
  { code: "THB", name: "Baht Thailand", color: "bg-blue-400", symbol: "฿" },
  { code: "TRY", name: "Lira Turki", color: "bg-red-600", symbol: "₺" },
  { code: "TWD", name: "Dolar Baru Taiwan", color: "bg-blue-600", symbol: "NT$" },
  { code: "UAH", name: "Hryvnia Ukraina", color: "bg-blue-400", symbol: "₴" },
  { code: "UGX", name: "Shilling Uganda", color: "bg-yellow-600", symbol: "USh" },
  { code: "USD", name: "Dolar AS", color: "bg-emerald-600", symbol: "$" },
  { code: "UYU", name: "Peso Uruguay", color: "bg-blue-400", symbol: "$U" },
  { code: "UZS", name: "Som Uzbekistan", color: "bg-blue-500", symbol: "лв" },
  { code: "VEF", name: "Bolivar Venezuela", color: "bg-yellow-600", symbol: "Bs" },
  { code: "VND", name: "Dong Vietnam", color: "bg-red-600", symbol: "₫" },
  { code: "ZAR", name: "Rand Afrika Selatan", color: "bg-green-600", symbol: "R" },
].sort((a, b) => a.code.localeCompare(b.code));

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function PaymentCurrencyPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filteredCurrencies = currencies.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-10 relative flex flex-col font-body">
      {/* Header */}
      <header className="px-4 h-14 flex items-center sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 px-6 pt-4 relative">
        <div className="space-y-1 mb-8">
          <h1 className="text-3xl font-black tracking-tight">Mata uang pembayaran</h1>
          <p className="text-sm font-medium text-slate-400">
            Mengatur mata uang fiat default untuk pembayaran fiat
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <Input 
            placeholder="Cari"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 bg-slate-50 border-none rounded-xl text-base font-medium placeholder:text-slate-300 focus-visible:ring-1 focus-visible:ring-slate-200 shadow-none"
          />
        </div>

        {/* Currency List */}
        <div className="space-y-6 pr-8 pb-20">
          {filteredCurrencies.map((c) => (
            <div 
              key={c.code} 
              className="flex items-center gap-4 cursor-pointer group active:opacity-70 transition-opacity"
              onClick={() => router.back()}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0",
                c.color
              )}>
                {c.symbol.length > 2 ? c.code[0] : c.symbol}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-lg font-black leading-none">{c.code}</h3>
                <p className="text-xs font-bold text-slate-400">{c.name}</p>
              </div>
            </div>
          ))}
          
          {filteredCurrencies.length === 0 && (
            <div className="py-20 text-center space-y-2">
              <p className="text-slate-400 font-bold">Mata uang tidak ditemukan</p>
              <p className="text-xs text-slate-300">Coba gunakan kata kunci lain</p>
            </div>
          )}
        </div>

        {/* Alphabet Index */}
        <div className="fixed right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-40">
          {alphabet.map((letter) => (
            <button 
              key={letter} 
              className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors w-4 h-4 flex items-center justify-center"
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Floating Help Icon */}
        <div className="fixed bottom-10 right-6 z-50">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-center text-blue-500 border border-slate-50 active:scale-95 transition-transform cursor-pointer">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </main>
    </div>
  );
}
