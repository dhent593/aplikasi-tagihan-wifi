const DEFAULT_CUSTOMERS = [
  { id: "cust-1", name: "Adit", address: "Rungkut Kidul No. 12", phone: "6281234567890", monthly_fee: 100000, join_date: "2026-01-10", status: "AKTIF" },
  { id: "cust-2", name: "Aqila", address: "Medokan Ayu III A/4", phone: "6282345678901", monthly_fee: 100000, join_date: "2026-02-15", status: "AKTIF" },
  { id: "cust-3", name: "Ari", address: "Kedung Baruk No. 45", phone: "6283456789012", monthly_fee: 100000, join_date: "2026-01-20", status: "AKTIF" },
  { id: "cust-4", name: "Bp. Wahyu", address: "Penjaringan Sari Blok C/10", phone: "6284567890123", monthly_fee: 100000, join_date: "2026-03-01", status: "AKTIF" },
  { id: "cust-5", name: "Gunawan", address: "Gunung Anyar Emas No. 8", phone: "6285678901234", monthly_fee: 100000, join_date: "2026-01-05", status: "AKTIF" },
  { id: "cust-6", name: "Intan", address: "Rungkut Madya No. 88", phone: "6286789012345", monthly_fee: 100000, join_date: "2026-04-12", status: "AKTIF" },
  { id: "cust-7", name: "Risna", address: "Wonorejo Indah No. 34", phone: "6287890123456", monthly_fee: 100000, join_date: "2026-01-15", status: "AKTIF" },
  { id: "cust-8", name: "Sri Wahyuti", address: "Kedung Asem No. 17", phone: "6288901234567", monthly_fee: 80000, join_date: "2026-05-10", status: "AKTIF" },
  { id: "cust-9", name: "Sutar Jiyanto", address: "Kali Rungkut No. 56", phone: "6289012345678", monthly_fee: 100000, join_date: "2026-02-01", status: "AKTIF" }
]

const DEFAULT_PAYMENTS = [
  // Adit: Jan-Jun Lunas
  { customer_id: "cust-1", period: "2026-01", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-01-25", memo: "" },
  { customer_id: "cust-1", period: "2026-02", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-02-25", memo: "" },
  { customer_id: "cust-1", period: "2026-03", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-03-25", memo: "" },
  { customer_id: "cust-1", period: "2026-04", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-04-25", memo: "" },
  { customer_id: "cust-1", period: "2026-05", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-05-25", memo: "" },
  { customer_id: "cust-1", period: "2026-06", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-06-25", memo: "" },

  // Aqila: Feb-Jun Lunas
  { customer_id: "cust-2", period: "2026-02", status: "LUNAS", amount_paid: 100000, method: "Tunai / Cash", transaction_date: "2026-02-28", memo: "" },
  { customer_id: "cust-2", period: "2026-03", status: "LUNAS", amount_paid: 100000, method: "Tunai / Cash", transaction_date: "2026-03-28", memo: "" },
  { customer_id: "cust-2", period: "2026-04", status: "LUNAS", amount_paid: 100000, method: "Tunai / Cash", transaction_date: "2026-04-28", memo: "" },
  { customer_id: "cust-2", period: "2026-05", status: "LUNAS", amount_paid: 100000, method: "Tunai / Cash", transaction_date: "2026-05-28", memo: "" },
  { customer_id: "cust-2", period: "2026-06", status: "LUNAS", amount_paid: 100000, method: "Tunai / Cash", transaction_date: "2026-06-28", memo: "" },

  // Ari: Jan-Jun Lunas
  { customer_id: "cust-3", period: "2026-01", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-01-26", memo: "" },
  { customer_id: "cust-3", period: "2026-02", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-02-26", memo: "" },
  { customer_id: "cust-3", period: "2026-03", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-03-26", memo: "" },
  { customer_id: "cust-3", period: "2026-04", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-04-26", memo: "" },
  { customer_id: "cust-3", period: "2026-05", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-05-26", memo: "" },
  { customer_id: "cust-3", period: "2026-06", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-06-26", memo: "" },

  // Bp. Wahyu: Mar-Jun Lunas
  { customer_id: "cust-4", period: "2026-03", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-03-27", memo: "" },
  { customer_id: "cust-4", period: "2026-04", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-04-27", memo: "" },
  { customer_id: "cust-4", period: "2026-05", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-05-27", memo: "" },
  { customer_id: "cust-4", period: "2026-06", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-06-27", memo: "" },

  // Gunawan: Jan-Jun Lunas
  { customer_id: "cust-5", period: "2026-01", status: "LUNAS", amount_paid: 100000, method: "E-Wallet", transaction_date: "2026-01-25", memo: "" },
  { customer_id: "cust-5", period: "2026-02", status: "LUNAS", amount_paid: 100000, method: "E-Wallet", transaction_date: "2026-02-25", memo: "" },
  { customer_id: "cust-5", period: "2026-03", status: "LUNAS", amount_paid: 100000, method: "E-Wallet", transaction_date: "2026-03-25", memo: "" },
  { customer_id: "cust-5", period: "2026-04", status: "LUNAS", amount_paid: 100000, method: "E-Wallet", transaction_date: "2026-04-25", memo: "" },
  { customer_id: "cust-5", period: "2026-05", status: "LUNAS", amount_paid: 100000, method: "E-Wallet", transaction_date: "2026-05-25", memo: "" },
  { customer_id: "cust-5", period: "2026-06", status: "LUNAS", amount_paid: 100000, method: "E-Wallet", transaction_date: "2026-06-25", memo: "" },

  // Intan: Apr-May Lunas, Jun BELUM_BAYAR
  { customer_id: "cust-6", period: "2026-04", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-04-29", memo: "" },
  { customer_id: "cust-6", period: "2026-05", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-05-29", memo: "" },
  { customer_id: "cust-6", period: "2026-06", status: "BELUM_BAYAR", amount_paid: 0, method: "Transfer Bank", transaction_date: null, memo: "" },

  // Risna: Jan-Jun Lunas
  { customer_id: "cust-7", period: "2026-01", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-01-25", memo: "" },
  { customer_id: "cust-7", period: "2026-02", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-02-25", memo: "" },
  { customer_id: "cust-7", period: "2026-03", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-03-25", memo: "" },
  { customer_id: "cust-7", period: "2026-04", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-04-25", memo: "" },
  { customer_id: "cust-7", period: "2026-05", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-05-25", memo: "" },
  { customer_id: "cust-7", period: "2026-06", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-06-25", memo: "" },

  // Sri Wahyuti: May Lunas, Jun Lunas
  { customer_id: "cust-8", period: "2026-05", status: "LUNAS", amount_paid: 80000, method: "Tunai / Cash", transaction_date: "2026-05-15", memo: "" },
  { customer_id: "cust-8", period: "2026-06", status: "LUNAS", amount_paid: 80000, method: "Tunai / Cash", transaction_date: "2026-06-15", memo: "" },

  // Sutar Jiyanto: Feb-Apr Lunas, May BELUM_BAYAR, Jun BELUM_BAYAR
  { customer_id: "cust-9", period: "2026-02", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-02-28", memo: "" },
  { customer_id: "cust-9", period: "2026-03", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-03-28", memo: "" },
  { customer_id: "cust-9", period: "2026-04", status: "LUNAS", amount_paid: 100000, method: "Transfer Bank", transaction_date: "2026-04-28", memo: "" },
  { customer_id: "cust-9", period: "2026-05", status: "BELUM_BAYAR", amount_paid: 0, method: "Transfer Bank", transaction_date: null, memo: "" },
  { customer_id: "cust-9", period: "2026-06", status: "BELUM_BAYAR", amount_paid: 0, method: "Transfer Bank", transaction_date: null, memo: "" }
]

export function isLocalMode() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || 
         process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy-project-id")
}

export function getLocalCustomers() {
  if (typeof window === "undefined") return DEFAULT_CUSTOMERS
  const val = localStorage.getItem("wifi_customers")
  if (!val) {
    localStorage.setItem("wifi_customers", JSON.stringify(DEFAULT_CUSTOMERS))
    return DEFAULT_CUSTOMERS
  }
  return JSON.parse(val)
}

export function setLocalCustomers(data) {
  if (typeof window === "undefined") return
  localStorage.setItem("wifi_customers", JSON.stringify(data))
}

export function getLocalPayments() {
  if (typeof window === "undefined") return DEFAULT_PAYMENTS
  const val = localStorage.getItem("wifi_payments")
  if (!val) {
    localStorage.setItem("wifi_payments", JSON.stringify(DEFAULT_PAYMENTS))
    return DEFAULT_PAYMENTS
  }
  return JSON.parse(val)
}

export function setLocalPayments(data) {
  if (typeof window === "undefined") return
  localStorage.setItem("wifi_payments", JSON.stringify(data))
}
