
export const MOCK_USER = {
  name: "Alex Thompson",
  accountNumber: "8829 4410 0021",
  totalBalance: 12450.75,
  savings: 8200.00,
  deposits: [
    { id: "dep-1", type: "Fixed Deposit", amount: 5000, rate: "4.5%", maturity: "2025-12-01" },
    { id: "dep-2", type: "Gold Savings", amount: 2500, rate: "3.8%", maturity: "2024-08-15" }
  ]
};

export const MOCK_TRANSACTIONS = [
  { date: "2024-05-15", description: "Amazon.com Purchase", category: "Shopping", amount: 124.50, type: "expense" },
  { date: "2024-05-14", description: "Monthly Salary Deposit", category: "Salary", amount: 4500.00, type: "income" },
  { date: "2024-05-12", description: "Starbucks Coffee", category: "Dining Out", amount: 12.75, type: "expense" },
  { date: "2024-05-10", description: "Utility Bill Payment", category: "Utilities", amount: 245.00, type: "expense" },
  { date: "2024-05-08", description: "Transfer to Savings", category: "Transfer", amount: 500.00, type: "expense" },
  { date: "2024-05-05", description: "Grocery Store", category: "Groceries", amount: 89.20, type: "expense" },
  { date: "2024-05-03", description: "Subscription Service", category: "Entertainment", amount: 15.99, type: "expense" },
  { date: "2024-05-01", description: "Rent Payment", category: "Housing", amount: 1500.00, type: "expense" }
];

export const MOCK_WALLETS = [
  { id: "w-1", name: "FinPay", balance: 450.25, icon: "Wallet" },
  { id: "w-2", name: "CryptoConnect", balance: 1200.50, icon: "Bitcoin" },
  { id: "w-3", name: "EasyGift", balance: 75.00, icon: "Gift" }
];

export const MOCK_BENEFICIARIES = [
  { id: "b-1", name: "Sarah Jenkins", bank: "FinWave", acc: "1234 5678" },
  { id: "b-2", name: "David Miller", bank: "Global Bank", acc: "9876 5432" },
  { id: "b-3", name: "Emma Wilson", bank: "FinWave", acc: "4455 6677" }
];
