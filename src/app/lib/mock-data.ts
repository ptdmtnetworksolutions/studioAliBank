export const MOCK_USER = {
  name: "Alex Thompson",
  accountNumber: "8829 4410 0021",
  totalBalance: 12450000.75,
  savings: 8200000.00,
  deposits: [
    { id: "dep-1", type: "Deposito Berjangka", amount: 5000000, rate: "4.5%", maturity: "2027-12-01" },
    { id: "dep-2", type: "Tabungan Emas", amount: 2500000, rate: "3.8%", maturity: "2026-08-15" }
  ]
};

export const MOCK_MERCHANT = {
  merchantId: "m-7721",
  businessName: "Thompson Gadget Store",
  category: "Electronics",
  totalRevenue: 85240000,
  pendingSettlement: 12450000,
  apiKey: "ab_live_9921xks8821lao99",
  status: "active"
};

export const MOCK_INVOICES = [
  { invoiceId: "INV-001", customerName: "Budi Santoso", amountIdr: 1250000, cryptoCurrency: "USDT", amountCrypto: 79.11, status: "paid", createdAt: "2026-05-18T10:00:00Z" },
  { invoiceId: "INV-002", customerName: "Siti Aminah", amountIdr: 4500000, cryptoCurrency: "ETH", amountCrypto: 0.082, status: "paid", createdAt: "2026-05-17T14:30:00Z" },
  { invoiceId: "INV-003", customerName: "John Doe", amountIdr: 890000, cryptoCurrency: "USDT", amountCrypto: 56.32, status: "unpaid", createdAt: "2026-05-19T09:15:00Z" },
  { invoiceId: "INV-004", customerName: "Eka Putri", amountIdr: 2100000, cryptoCurrency: "USDT", amountCrypto: 132.91, status: "expired", createdAt: "2026-05-16T11:20:00Z" },
];

export const MOCK_TRANSACTIONS = [
  { date: "2026-05-15", description: "Pembelian Amazon.com", category: "Belanja", amount: 124500.50, type: "expense" },
  { date: "2026-05-14", description: "Gaji Bulanan", category: "Gaji", amount: 4500000.00, type: "income" },
  { date: "2026-05-12", description: "Kopi Starbucks", category: "Kuliner", amount: 62000.75, type: "expense" },
  { date: "2026-05-10", description: "Pembayaran Listrik", category: "Utilitas", amount: 245000.00, type: "expense" },
  { date: "2026-05-08", description: "Transfer ke Tabungan", category: "Transfer", amount: 500000.00, type: "expense" },
  { date: "2026-05-05", description: "Toko Kelontong", category: "Kebutuhan Pokok", amount: 89200.20, type: "expense" },
  { date: "2026-05-03", description: "Layanan Langganan", category: "Hiburan", amount: 159000.99, type: "expense" },
  { date: "2026-05-01", description: "Pembayaran Sewa", category: "Tempat Tinggal", amount: 1500000.00, type: "expense" }
];

export const MOCK_WALLETS = [
  { id: "w-1", name: "FinPay", balance: 450000.25, icon: "Wallet" },
  { id: "w-2", name: "CryptoConnect", balance: 1200000.50, icon: "Bitcoin" },
  { id: "w-3", name: "EasyGift", balance: 75000.00, icon: "Gift" }
];

export const MOCK_BENEFICIARIES = [
  { id: "b-1", name: "Sarah Jenkins", bank: "AliBank", acc: "1234 5678" },
  { id: "b-2", name: "David Miller", bank: "Global Bank", acc: "9876 5432" },
  { id: "b-3", name: "Emma Wilson", bank: "AliBank", acc: "4455 6677" }
];