export const MOCK_USER = {
  name: "Alex Thompson",
  accountNumber: "8829 4410 0021",
  totalBalance: 0,
  savings: 0,
  deposits: []
};

export const MOCK_MERCHANT = {
  merchantId: "m-7721",
  businessName: "Thompson Gadget Store",
  category: "Electronics",
  totalRevenue: 0,
  pendingSettlement: 0,
  apiKey: "ab_live_9921xks8821lao99",
  status: "active"
};

export const MOCK_INVOICES = [
  { invoiceId: "INV-001", customerName: "Budi Santoso", amountIdr: 1250000, cryptoCurrency: "USDT", amountCrypto: 79.11, status: "paid", createdAt: "2026-05-18T10:00:00Z" },
  { invoiceId: "INV-002", customerName: "Siti Aminah", amountIdr: 4500000, cryptoCurrency: "ETH", amountCrypto: 0.082, status: "paid", createdAt: "2026-05-17T14:30:00Z" },
  { invoiceId: "INV-003", customerName: "John Doe", amountIdr: 890000, cryptoCurrency: "USDT", amountCrypto: 56.32, status: "unpaid", createdAt: "2026-05-19T09:15:00Z" },
  { invoiceId: "INV-004", customerName: "Eka Putri", amountIdr: 2100000, cryptoCurrency: "USDT", amountCrypto: 132.91, status: "expired", createdAt: "2026-05-16T11:20:00Z" },
];

export const MOCK_TRANSACTIONS = [];

export const MOCK_WALLETS = [];

export const MOCK_BENEFICIARIES = [
  { id: "b-1", name: "Sarah Jenkins", bank: "AliBank", acc: "1234 5678" },
  { id: "b-2", name: "David Miller", bank: "Global Bank", acc: "9876 5432" },
  { id: "b-3", name: "Emma Wilson", bank: "AliBank", acc: "4455 6677" }
];
