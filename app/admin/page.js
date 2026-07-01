"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { isLocalMode, getLocalCustomers, setLocalCustomers, getLocalPayments, setLocalPayments } from "@/utils/supabase/localDb"
import { 
  Users, DollarSign, AlertCircle, Search, Plus, 
  Share2, Edit2, Trash2, RotateCcw, Check, 
  X, LogOut, Loader2, Sparkles, Calendar, FileText
} from "lucide-react"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [customers, setCustomers] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })

  const router = useRouter()
  const supabase = createClient()

  // Period management
  const [selectedMonth, setSelectedMonth] = useState("06") // Default Juni
  const [selectedYear, setSelectedYear] = useState(2026) // Default 2026

  // Form search query
  const [searchQuery, setSearchQuery] = useState("")

  // Modal customer states
  const [isCustModalOpen, setIsCustModalOpen] = useState(false)
  const [custModalTitle, setCustModalTitle] = useState("Tambah Pelanggan Baru")
  const [editingCustId, setEditingCustId] = useState(null)
  const [custForm, setCustForm] = useState({
    name: "", address: "", phone: "", monthly_fee: "", join_date: "", status: "AKTIF"
  })

  // Modal payment transaction states
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [payModalData, setPayModalData] = useState({
    customerId: "", customerName: "", period: "", tariff: 0,
    amountPaid: "", method: "Transfer Bank", date: "", memo: ""
  })

  // Constants
  const MONTH_NAMES = {
    "01": "Januari", "02": "Februari", "03": "Maret", "04": "April",
    "05": "Mei", "06": "Juni", "07": "Juli", "08": "Agustus",
    "09": "September", "10": "Oktober", "11": "November", "12": "Desember"
  }

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" })
    }, 3000)
  }

  const fetchData = async () => {
    try {
      if (isLocalMode()) {
        const custData = getLocalCustomers()
        const payData = getLocalPayments()
        setCustomers(custData || [])
        setPayments(payData || [])
        setLoading(false)
        return
      }

      // Get all customers from Supabase
      const { data: custData, error: custErr } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true })

      if (custErr) throw custErr
      setCustomers(custData || [])

      // Get all payments from Supabase
      const { data: payData, error: payErr } = await supabase
        .from("payments")
        .select("*")

      if (payErr) throw payErr
      setPayments(payData || [])
    } catch (err) {
      showToast("Gagal mengambil data dari Supabase.", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogout = async () => {
    if (isLocalMode()) {
      document.cookie = "wifi_admin_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
    } else {
      await supabase.auth.signOut()
    }
    router.push("/login")
    router.refresh()
  }

  // --- STATS COMPUTATION ---
  const activeCustomers = customers.filter(c => c.status === "AKTIF")
  const totalCustomersCount = activeCustomers.length

  const getPaymentStatus = (customerId, period) => {
    const record = payments.find(p => p.customer_id === customerId && p.period === period)
    return record ? record.status : "N/A"
  }

  const getPaymentRecord = (customerId, period) => {
    return payments.find(p => p.customer_id === customerId && p.period === period) || {}
  }

  // Calculate current month's revenue (sum of amount_paid in current period for active customers)
  const currentPeriod = `${selectedYear}-${selectedMonth}`
  const revenueThisMonth = payments
    .filter(p => p.period === currentPeriod && activeCustomers.some(c => c.id === p.customer_id))
    .reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0)

  // Calculate total accumulated outstanding balance for all active customers up to current selected month
  let totalOutstanding = 0
  const monthsKeys = Object.keys(MONTH_NAMES)
  const currentMonthIdx = monthsKeys.indexOf(selectedMonth)

  activeCustomers.forEach(customer => {
    for (let i = 0; i <= currentMonthIdx; i++) {
      const period = `${selectedYear}-${monthsKeys[i]}`
      const status = getPaymentStatus(customer.id, period)
      
      if (status === "BELUM_BAYAR") {
        totalOutstanding += parseFloat(customer.monthly_fee)
      } else if (status === "KURANG") {
        const record = getPaymentRecord(customer.id, period)
        const remaining = parseFloat(customer.monthly_fee) - parseFloat(record.amount_paid || 0)
        totalOutstanding += remaining
      }
    }
  })

  // List of active customers with outstanding balance for dashboard quick action
  const unpaidCustomersList = []
  activeCustomers.forEach(customer => {
    let customerUnpaidTotal = 0
    let unpaidMonths = []

    for (let i = 0; i <= currentMonthIdx; i++) {
      const mKey = monthsKeys[i]
      const period = `${selectedYear}-${mKey}`
      const status = getPaymentStatus(customer.id, period)

      if (status === "BELUM_BAYAR") {
        customerUnpaidTotal += parseFloat(customer.monthly_fee)
        unpaidMonths.push(MONTH_NAMES[mKey])
      } else if (status === "KURANG") {
        const record = getPaymentRecord(customer.id, period)
        const remaining = parseFloat(customer.monthly_fee) - parseFloat(record.amount_paid || 0)
        customerUnpaidTotal += remaining
        unpaidMonths.push(`${MONTH_NAMES[mKey]} (Kurang)`)
      }
    }

    if (customerUnpaidTotal > 0) {
      unpaidCustomersList.push({
        ...customer,
        unpaidMonths,
        totalUnpaid: customerUnpaidTotal
      })
    }
  })

  // --- CRUD: CUSTOMER ---
  const openAddCustModal = () => {
    setEditingCustId(null)
    setCustModalTitle("Tambah Pelanggan Baru")
    setCustForm({
      name: "", address: "", phone: "", monthly_fee: "", join_date: new Date().toISOString().split("T")[0], status: "AKTIF"
    })
    setIsCustModalOpen(true)
  }

  const openEditCustModal = (customer) => {
    setEditingCustId(customer.id)
    setCustModalTitle("Edit Data Pelanggan")
    setCustForm({
      name: customer.name,
      address: customer.address,
      phone: customer.phone,
      monthly_fee: customer.monthly_fee,
      join_date: customer.join_date,
      status: customer.status
    })
    setIsCustModalOpen(true)
  }

  const saveCustomer = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isLocalMode()) {
        const localCustomers = getLocalCustomers()
        if (editingCustId) {
          const updated = localCustomers.map(c => c.id === editingCustId ? {
            ...c,
            name: custForm.name,
            address: custForm.address,
            phone: custForm.phone,
            monthly_fee: parseFloat(custForm.monthly_fee),
            join_date: custForm.join_date,
            status: custForm.status
          } : c)
          setLocalCustomers(updated)
          showToast("Data pelanggan berhasil diperbarui.")
        } else {
          const newCust = {
            id: "cust-" + Date.now(),
            name: custForm.name,
            address: custForm.address,
            phone: custForm.phone,
            monthly_fee: parseFloat(custForm.monthly_fee),
            join_date: custForm.join_date,
            status: "AKTIF"
          }
          setLocalCustomers([...localCustomers, newCust])
          showToast("Pelanggan baru berhasil ditambahkan.")
        }
        setIsCustModalOpen(false)
        fetchData()
        return
      }

      if (editingCustId) {
        // Update customer
        const { error } = await supabase
          .from("customers")
          .update({
            name: custForm.name,
            address: custForm.address,
            phone: custForm.phone,
            monthly_fee: parseFloat(custForm.monthly_fee),
            join_date: custForm.join_date,
            status: custForm.status
          })
          .eq("id", editingCustId)

        if (error) throw error
        showToast("Data pelanggan berhasil diperbarui.")
      } else {
        // Add new customer
        const { error } = await supabase
          .from("customers")
          .insert([{
            name: custForm.name,
            address: custForm.address,
            phone: custForm.phone,
            monthly_fee: parseFloat(custForm.monthly_fee),
            join_date: custForm.join_date,
            status: "AKTIF"
          }])

        if (error) throw error
        showToast("Pelanggan baru berhasil ditambahkan.")
      }
      
      setIsCustModalOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || "Gagal menyimpan data pelanggan.", "error")
      setLoading(false)
    }
  }

  const deleteCustomer = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pelanggan ini beserta seluruh histori pembayarannya?")) return
    setLoading(true)
    try {
      if (isLocalMode()) {
        const localCustomers = getLocalCustomers()
        const localPayments = getLocalPayments()
        setLocalCustomers(localCustomers.filter(c => c.id !== id))
        setLocalPayments(localPayments.filter(p => p.customer_id !== id))
        showToast("Pelanggan berhasil dihapus.")
        fetchData()
        return
      }

      const { error } = await supabase.from("customers").delete().eq("id", id)
      if (error) throw error
      showToast("Pelanggan berhasil dihapus.")
      fetchData()
    } catch (err) {
      showToast("Gagal menghapus pelanggan.", "error")
      setLoading(false)
    }
  }

  const resetCustomerHistory = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus semua catatan riwayat pembayaran pelanggan ini?")) return
    setLoading(true)
    try {
      if (isLocalMode()) {
        const localPayments = getLocalPayments()
        setLocalPayments(localPayments.filter(p => p.customer_id !== id))
        showToast("Histori pembayaran berhasil di-reset.")
        fetchData()
        return
      }

      const { error } = await supabase.from("payments").delete().eq("customer_id", id)
      if (error) throw error
      showToast("Histori pembayaran berhasil di-reset.")
      fetchData()
    } catch (err) {
      showToast("Gagal me-reset histori pembayaran.", "error")
      setLoading(false)
    }
  }

  // --- CRUD: PAYMENTS ---
  const openPayModal = (customerId, period, customerName) => {
    const customer = customers.find(c => c.id === customerId)
    const tariff = customer ? customer.monthly_fee : 0
    const record = getPaymentRecord(customerId, period)

    let dateVal = record.transaction_date
    if (!dateVal) {
      const today = new Date()
      dateVal = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0")
    }

    setPayModalData({
      customerId,
      customerName,
      period,
      tariff,
      amountPaid: record.amount_paid !== undefined ? record.amount_paid : "",
      method: record.method || "Transfer Bank",
      date: dateVal,
      memo: record.memo || ""
    })
    setIsPayModalOpen(true)
  }

  const fillFullPaymentAmount = () => {
    setPayModalData(prev => ({ ...prev, amountPaid: prev.tariff }))
  }

  const setPaymentStatusNA = async () => {
    const { customerId, period } = payModalData
    setLoading(true)
    try {
      if (isLocalMode()) {
        const localPayments = getLocalPayments()
        const index = localPayments.findIndex(p => p.customer_id === customerId && p.period === period)
        if (index > -1) {
          localPayments[index] = {
            customer_id: customerId, period, status: "N/A", amount_paid: 0, method: "Transfer Bank", transaction_date: null, memo: null
          }
        } else {
          localPayments.push({
            customer_id: customerId, period, status: "N/A", amount_paid: 0, method: "Transfer Bank", transaction_date: null, memo: null
          })
        }
        setLocalPayments(localPayments)
        setIsPayModalOpen(false)
        showToast("Status pembayaran di-reset ke N/A.")
        fetchData()
        return
      }

      const { error } = await supabase
        .from("payments")
        .upsert({
          customer_id: customerId,
          period: period,
          status: "N/A",
          amount_paid: 0,
          method: "Transfer Bank",
          transaction_date: null,
          memo: null
        }, { onConflict: "customer_id,period" })

      if (error) throw error
      setIsPayModalOpen(false)
      showToast("Status pembayaran di-reset ke N/A.")
      fetchData()
    } catch (err) {
      showToast("Gagal memperbarui status pembayaran.", "error")
      setLoading(false)
    }
  }

  const savePaymentTransaction = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { customerId, period, amountPaid, method, date, memo, tariff } = payModalData
    const numericPaid = amountPaid ? parseFloat(amountPaid) : 0

    let status = "N/A"
    if (numericPaid === 0) {
      status = "BELUM_BAYAR"
    } else if (numericPaid > 0 && numericPaid < tariff) {
      status = "KURANG"
    } else if (numericPaid >= tariff) {
      status = "LUNAS"
    }

    try {
      if (isLocalMode()) {
        const localPayments = getLocalPayments()
        const index = localPayments.findIndex(p => p.customer_id === customerId && p.period === period)
        const updatedRecord = {
          customer_id: customerId,
          period: period,
          status,
          amount_paid: numericPaid,
          method,
          transaction_date: date || null,
          memo: memo || null
        }
        
        if (index > -1) {
          localPayments[index] = updatedRecord
        } else {
          localPayments.push(updatedRecord)
        }
        
        setLocalPayments(localPayments)
        setIsPayModalOpen(false)
        showToast(`Transaksi disimpan! Status: ${status}`)
        fetchData()
        return
      }

      const { error } = await supabase
        .from("payments")
        .upsert({
          customer_id: customerId,
          period: period,
          status,
          amount_paid: numericPaid,
          method,
          transaction_date: date || null,
          memo: memo || null
        }, { onConflict: "customer_id,period" })

      if (error) throw error
      setIsPayModalOpen(false)
      showToast(`Transaksi disimpan! Status: ${status}`)
      fetchData()
    } catch (err) {
      showToast("Gagal menyimpan transaksi pembayaran.", "error")
      setLoading(false)
    }
  }

  // Quick Action "Bayar" outstanding directly from dashboard
  const payOutstanding = (customerId) => {
    for (let i = 0; i <= currentMonthIdx; i++) {
      const period = `${selectedYear}-${monthsKeys[i]}`
      const status = getPaymentStatus(customerId, period)
      if (status === "BELUM_BAYAR" || status === "KURANG") {
        const customer = customers.find(c => c.id === customerId)
        openPayModal(customerId, period, customer ? customer.name : "")
        return
      }
    }
  }

  // Sharing customer billing link
  const copyBillLink = (customer) => {
    const shareableUrl = `${window.location.origin}/bill/${customer.id}`
    navigator.clipboard.writeText(shareableUrl).then(() => {
      showToast("Link tagihan pelanggan disalin ke clipboard!")
    }).catch(() => {
      showToast("Gagal menyalin link.", "error")
    })
  }

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(number)
  }

  const formatDateString = (isoString) => {
    const date = new Date(isoString)
    if (isNaN(date)) return isoString
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-55 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold animate-fade-in flex items-center gap-2 ${
          toast.type === "success" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
            {toast.type === "success" ? "✓" : "!"}
          </span>
          {toast.message}
        </div>
      )}

      {/* Header / Responsive Navbar */}
      <div className="w-full flex justify-center py-4 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl">
          <nav class="bg-white/80 backdrop-blur-md shadow-lg border border-amber-100/60 rounded-3xl sm:rounded-full py-3 px-4 sm:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              {/* Logo & Status/Logout on Mobile */}
              <div className="flex justify-between items-center w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                    W
                  </div>
                  <div>
                    <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-800">WiFi-ID</span>
                    <span className="text-[10px] bg-amber-100 text-brand-primary px-2 py-0.5 rounded-full font-bold ml-1 border border-amber-200">ADMIN</span>
                  </div>
                </div>
                
                {/* Mobile logout button */}
                <button onclick={handleLogout} className="md:hidden p-2.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 transition">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex bg-amber-50/50 p-1 rounded-full border border-amber-100/50 overflow-x-auto max-w-full">
                <button 
                  onClick={() => setActiveTab("dashboard")} 
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition duration-300 whitespace-nowrap ${activeTab === "dashboard" ? "bg-brand-primary text-white shadow" : "text-slate-600 hover:text-brand-primary"}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab("pelanggan")} 
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition duration-300 whitespace-nowrap ${activeTab === "pelanggan" ? "bg-brand-primary text-white shadow" : "text-slate-600 hover:text-brand-primary"}`}
                >
                  Pelanggan
                </button>
                <button 
                  onClick={() => setActiveTab("pembayaran")} 
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition duration-300 whitespace-nowrap ${activeTab === "pembayaran" ? "bg-brand-primary text-white shadow" : "text-slate-600 hover:text-brand-primary"}`}
                >
                  Pembayaran
                </button>
              </div>

              {/* Desktop Info & Logout */}
              <div className="hidden md:flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
                <button onClick={handleLogout} className="px-4 py-2 rounded-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold transition duration-300 border border-slate-200 flex items-center gap-1.5">
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow">
        
        {loading && (
          <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="bg-white px-5 py-4 rounded-2xl flex items-center gap-3 shadow-lg border border-slate-100">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
              <span className="text-sm font-bold text-slate-700">Memproses transaksi...</span>
            </div>
          </div>
        )}

        {/* --- TAB: DASHBOARD --- */}
        {activeTab === "dashboard" && (
          <div className="animate-fade-in space-y-6">
            
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
                <Calendar className="w-80 h-80" />
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold mb-1 flex items-center gap-2">
                    Halo Admin! <Sparkles className="w-6 h-6 text-amber-200" />
                  </h2>
                  <p className="text-amber-100 text-sm sm:text-base">Berikut ringkasan status pembayaran WiFi-ID untuk periode aktif.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-250" />
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-white border-0 font-bold focus:ring-0 focus:outline-none cursor-pointer text-sm"
                  >
                    {Object.entries(MONTH_NAMES).map(([key, value]) => (
                      <option key={key} value={key} className="text-slate-800">{value} {selectedYear}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-amber-100/50 flex items-center gap-4 sm:gap-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 text-brand-primary flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Total Pelanggan</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{totalCustomersCount}</h3>
                  <p className="text-[10px] sm:text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Pelanggan Aktif
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-amber-100/50 flex items-center gap-4 sm:gap-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Pendapatan Bulan Ini</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{formatRupiah(revenueThisMonth)}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Periode {MONTH_NAMES[selectedMonth]}</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-amber-100/50 flex items-center gap-4 sm:gap-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-50 text-red-650 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Total Tunggakan</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{formatRupiah(totalOutstanding)}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-550 text-red-600 mt-0.5">Akumulatif s/d bulan ini</p>
                </div>
              </div>
            </div>

            {/* Unpaid List Dashboard Card */}
            <div className="bg-white rounded-3xl shadow-md border border-amber-100/50 p-6 sm:p-8">
              <h3 className="text-lg font-extrabold text-slate-850 mb-5 flex items-center gap-2">
                Daftar Belum Lunas
                <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 font-bold border border-red-150">{unpaidCustomersList.length}</span>
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pr-4">Pelanggan</th>
                      <th className="pb-3 px-4">WhatsApp</th>
                      <th className="pb-3 px-4 text-right">Tunggakan</th>
                      <th className="pb-3 pl-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {unpaidCustomersList.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 pr-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 text-brand-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{customer.name}</p>
                            <p className="text-xs text-slate-400 max-w-xs truncate">{customer.address}</p>
                            <p className="text-[10px] text-red-500 font-bold mt-0.5">Bulan: {customer.unpaidMonths.join(", ")}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-semibold">{customer.phone}</td>
                        <td className="py-4 px-4 text-right font-extrabold text-red-650 text-red-600">{formatRupiah(customer.totalUnpaid)}</td>
                        <td className="py-4 pl-4 text-center">
                          <button 
                            onClick={() => payOutstanding(customer.id)} 
                            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                          >
                            Bayar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {unpaidCustomersList.length === 0 && (
                  <div className="py-8 text-center text-slate-400 font-medium">
                    Semua pelanggan aktif telah lunas membayar untuk periode terpilih.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* --- TAB: PELANGGAN --- */}
        {activeTab === "pelanggan" && (
          <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800">Manajemen Pelanggan</h2>
                <p className="text-slate-500 text-sm">Kelola daftar pelanggan, tarif bulanan, dan bagikan link tagihan mereka.</p>
              </div>
              <button 
                onClick={openAddCustModal}
                className="px-5 py-3 bg-brand-primary hover:bg-brand-hover text-white text-sm font-bold rounded-2xl shadow-md flex items-center gap-2 transition duration-300"
              >
                <Plus className="w-5 h-5" />
                Tambah Pelanggan
              </button>
            </div>

            {/* Filter Search */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-amber-100/50 flex items-center gap-3">
              <div className="relative w-full sm:max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Search className="w-5 h-5 text-slate-450 text-slate-400" />
                </span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau alamat pelanggan..." 
                  className="pl-10 pr-4 py-2.5 w-full bg-slate-50 text-slate-800 text-sm rounded-2xl border border-slate-200 focus:outline-none focus:border-brand-primary focus:bg-white transition duration-300"
                />
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-3xl shadow-md border border-amber-100/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-amber-50/50 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-6">Nama / Alamat</th>
                      <th className="py-4 px-6">Nomor Kontak</th>
                      <th className="py-4 px-6">Tarif Bulanan</th>
                      <th className="py-4 px-6">Tanggal Gabung</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-center">Aksi & Sharing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {customers
                      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.address.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((customer) => (
                        <tr key={customer.id} className="hover:bg-slate-50 transition duration-150">
                          <td className="py-4 px-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 text-brand-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p class="font-bold text-slate-850 text-slate-800">{customer.name}</p>
                              <p className="text-xs text-slate-400 max-w-sm truncate">{customer.address}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-semibold">{customer.phone}</td>
                          <td className="py-4 px-6 text-slate-800 font-bold">{formatRupiah(customer.monthly_fee)}<span className="text-xs text-slate-400 font-normal">/bulan</span></td>
                          <td className="py-4 px-6 text-slate-655 text-slate-500">{formatDateString(customer.join_date)}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              customer.status === "AKTIF" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}>{customer.status}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => copyBillLink(customer)} 
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition shadow-sm flex items-center gap-1"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                Salin Link
                              </button>
                              <button onClick={() => openEditCustModal(customer)} className="p-1.5 rounded-full hover:bg-amber-100 text-amber-600 transition" title="Edit Data">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => resetCustomerHistory(customer.id)} className="p-1.5 rounded-full hover:bg-yellow-100 text-yellow-600 transition" title="Reset Riwayat Pembayaran">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteCustomer(customer.id)} className="p-1.5 rounded-full hover:bg-red-100 text-red-650 transition text-red-500" title="Hapus Pelanggan">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards List View */}
            <div className="block md:hidden space-y-4">
              {customers
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.address.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((customer) => (
                  <div key={customer.id} className="bg-white rounded-3xl p-5 shadow-md border border-amber-100/50 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 text-brand-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{customer.name}</h4>
                          <p className="text-[10px] text-slate-405 text-slate-400 max-w-[180px] truncate">{customer.address}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        customer.status === "AKTIF" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>{customer.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-xs leading-tight">
                      <div>
                        <p className="text-slate-400 font-semibold mb-0.5">Tarif Bulanan</p>
                        <p className="font-bold text-slate-800">{formatRupiah(customer.monthly_fee)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-semibold mb-0.5">Tanggal Gabung</p>
                        <p className="font-medium text-slate-600">{formatDateString(customer.join_date)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400 font-semibold mb-0.5">Nomor WhatsApp</p>
                        <p className="font-semibold text-slate-700">{customer.phone}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button 
                        onClick={() => copyBillLink(customer)} 
                        className="flex-grow px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Salin Link Tagihan
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditCustModal(customer)} className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => resetCustomerHistory(customer.id)} className="p-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-xl transition">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteCustomer(customer.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

          </div>
        )}

        {/* --- TAB: PEMBAYARAN (MATRIX) --- */}
        {activeTab === "pembayaran" && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 font-bold">Pencatatan Pembayaran</h2>
              <p className="text-slate-500 text-sm">Kelola status dan input pembayaran bulanan seluruh pelanggan.</p>
            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-3xl shadow-md border border-amber-100/50 p-4 sm:p-6 overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-left text-slate-655 font-bold uppercase text-[10px] border-r border-slate-100 bg-slate-50/50 rounded-tl-2xl">Nama Pelanggan</th>
                    {monthsKeys.map((mKey) => (
                      <th key={mKey} className="py-3 px-1 text-center font-bold uppercase text-[9px] sm:text-[10px] text-slate-500 border-r border-slate-100 last:border-r-0">
                        {MONTH_NAMES[mKey].slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {customers
                    .filter(c => c.status === "AKTIF")
                    .map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50/30 transition">
                        <td className="py-3.5 px-4 border-r border-slate-100 text-slate-800">
                          <p className="font-extrabold text-sm leading-tight text-slate-800">{customer.name}</p>
                          <span className="text-[10px] text-slate-400">{formatRupiah(customer.monthly_fee)}/bln</span>
                        </td>
                        
                        {monthsKeys.map((mKey) => {
                          const period = `${selectedYear}-${mKey}`
                          const status = getPaymentStatus(customer.id, period)
                          
                          let cellStyle = "text-slate-400 hover:bg-slate-100"
                          let icon = <span className="text-slate-300">-</span>

                          if (status === "LUNAS") {
                            cellStyle = "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 font-bold"
                            icon = <Check className="w-4 h-4 mx-auto stroke-[3]" />
                          } else if (status === "KURANG") {
                            cellStyle = "bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 font-bold"
                            icon = <span className="text-xs">!</span>
                          } else if (status === "BELUM_BAYAR") {
                            cellStyle = "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 font-bold"
                            icon = <X className="w-4 h-4 mx-auto stroke-[3]" />
                          }

                          return (
                            <td 
                              key={mKey}
                              onClick={() => openPayModal(customer.id, period, customer.name)}
                              className={`py-3 px-1 text-center cursor-pointer border-r border-slate-100 ${cellStyle} last:border-r-0 transition`}
                            >
                              {icon}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Legend Box */}
            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-550 text-slate-500 bg-white rounded-3xl p-4 shadow-sm border border-slate-100 justify-center">
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Lunas</div>
              <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-amber-100 border border-amber-250 flex items-center justify-center text-amber-700 text-[10px] font-bold">!</span> Kurang Lunas</div>
              <div className="flex items-center gap-1.5"><X className="w-4 h-4 text-red-500" /> Belum Bayar</div>
              <div className="flex items-center gap-1.5"><span className="text-slate-300 font-bold">-</span> N/A (Belum ditagih)</div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: CUSTOMER ADD/EDIT */}
      {isCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCustModalOpen(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-amber-100/60 p-6 sm:p-8 relative z-10 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-slate-800">{custModalTitle}</h3>
              <button onClick={() => setIsCustModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-105 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={custForm.name}
                  onChange={(e) => setCustForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Contoh: Budi Susanto" 
                  className="w-full bg-slate-55 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Alamat Rumah</label>
                <textarea 
                  value={custForm.address}
                  onChange={(e) => setCustForm(prev => ({ ...prev, address: e.target.value }))}
                  required
                  placeholder="Contoh: Rungkut Madya No. 45" 
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor WhatsApp</label>
                  <input 
                    type="tel" 
                    value={custForm.phone}
                    onChange={(e) => setCustForm(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    placeholder="Contoh: 628963232..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tarif Bulanan (Rp)</label>
                  <input 
                    type="number" 
                    value={custForm.monthly_fee}
                    onChange={(e) => setCustForm(prev => ({ ...prev, monthly_fee: e.target.value }))}
                    required
                    placeholder="Contoh: 100000" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal Gabung</label>
                  <input 
                    type="date" 
                    value={custForm.join_date}
                    onChange={(e) => setCustForm(prev => ({ ...prev, join_date: e.target.value }))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition"
                  />
                </div>
                {editingCustId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status Langganan</label>
                    <select 
                      value={custForm.status}
                      onChange={(e) => setCustForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition cursor-pointer"
                    >
                      <option value="AKTIF">AKTIF</option>
                      <option value="NONAKTIF">NONAKTIF</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCustModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-2xl shadow-md transition"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAYMENT STATUS LOG TRANSACTION */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsPayModalOpen(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-amber-100/60 p-6 sm:p-8 relative z-10 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-slate-800">Catat Pembayaran WiFi</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header info */}
            <div className="bg-[#1E293B] text-white rounded-2xl p-4 grid grid-cols-3 gap-2 mb-6 text-center shadow-sm">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pelanggan</p>
                <p className="font-bold text-sm truncate text-slate-100">{payModalData.customerName}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Periode</p>
                <p className="font-bold text-sm text-amber-300">
                  {payModalData.period ? MONTH_NAMES[payModalData.period.split("-")[1]] : ""} {payModalData.period ? payModalData.period.split("-")[0] : ""}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tarif Tagihan</p>
                <p className="font-bold text-sm text-emerald-400">{formatRupiah(payModalData.tariff)}</p>
              </div>
            </div>

            <form onSubmit={savePaymentTransaction}>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Jumlah Bayar (Rp)</label>
                    <input 
                      type="number" 
                      value={payModalData.amountPaid}
                      onChange={(e) => setPayModalData(prev => ({ ...prev, amountPaid: e.target.value }))}
                      min="0"
                      placeholder="Contoh: 100000" 
                      className="w-full bg-slate-55 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition"
                    />
                    <div className="flex gap-3 mt-1.5">
                      <button type="button" onClick={fillFullPaymentAmount} className="text-xs text-brand-primary hover:text-brand-hover font-bold underline">Bayar Lunas</button>
                      <button type="button" onClick={setPaymentStatusNA} className="text-xs text-slate-400 hover:text-slate-600 font-bold underline">Set N/A</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Metode Pembayaran</label>
                    <select 
                      value={payModalData.method}
                      onChange={(e) => setPayModalData(prev => ({ ...prev, method: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition cursor-pointer"
                    >
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="Tunai / Cash">Tunai / Cash</option>
                      <option value="E-Wallet">E-Wallet</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal Transaksi</label>
                  <input 
                    type="date" 
                    value={payModalData.date}
                    onChange={(e) => setPayModalData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Keterangan / Memo</label>
                  <textarea 
                    value={payModalData.memo}
                    onChange={(e) => setPayModalData(prev => ({ ...prev, memo: e.target.value }))}
                    placeholder="Contoh: Transfer ke Mandiri Admin, atau Bayar setengah dulu" 
                    rows="3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 bg-slate-105 bg-slate-100 hover:bg-slate-200 rounded-2xl transition"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-2xl shadow-md transition flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/50 bg-white text-center text-xs text-slate-400 font-semibold">
        <p>&copy; {new Date().getFullYear()} WiFi-ID. Dikembangkan untuk administrasi Wifi.</p>
      </footer>

    </div>
  )
}
