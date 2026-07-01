"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { isLocalMode, getLocalCustomers, getLocalPayments } from "@/utils/supabase/localDb"
import { Printer, Calendar, CheckCircle2, AlertTriangle, XCircle, Phone } from "lucide-react"

export default function CustomerBillPage({ params }) {
  const unwrappedParams = React.use(params)
  const customerId = unwrappedParams.id

  const [customer, setCustomer] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")
  const supabase = createClient()

  // Constants
  const ADMIN_PHONE = "6289632321244"
  const MONTH_NAMES = {
    "01": "Januari", "02": "Februari", "03": "Maret", "04": "April",
    "05": "Mei", "06": "Juni", "07": "Juli", "08": "Agustus",
    "09": "September", "10": "Oktober", "11": "November", "12": "Desember"
  }

  // We set June 2026 as the current selected period matching admin dashboard
  const CURRENT_YEAR = 2026
  const CURRENT_MONTH = "06" // Juni

  useEffect(() => {
    async function fetchBillData() {
      try {
        if (isLocalMode()) {
          const localCusts = getLocalCustomers()
          const cust = localCusts.find(c => c.id === customerId)
          if (!cust) {
            setErrorMsg("Data pelanggan tidak ditemukan atau link tidak valid.")
            setLoading(false)
            return
          }
          setCustomer(cust)

          const localPays = getLocalPayments()
          const pays = localPays.filter(p => p.customer_id === customerId)
          setPayments(pays || [])
          setLoading(false)
          return
        }

        // Fetch customer details from Supabase
        const { data: custData, error: custErr } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customerId)
          .single()

        if (custErr || !custData) {
          setErrorMsg("Data pelanggan tidak ditemukan atau link tidak valid.")
          setLoading(false)
          return
        }
        setCustomer(custData)

        // Fetch payment history from Supabase
        const { data: payData, error: payErr } = await supabase
          .from("payments")
          .select("*")
          .eq("customer_id", customerId)

        if (payErr) {
          setErrorMsg("Gagal memuat histori pembayaran.")
        } else {
          setPayments(payData || [])
        }
      } catch (err) {
        setErrorMsg("Terjadi kesalahan sistem.")
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchBillData()
    }
  }, [customerId, supabase])

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(number)
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-8 min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-semibold">Memuat invoice tagihan...</p>
        </div>
      </div>
    )
  }

  if (errorMsg || !customer) {
    return (
      <div className="flex-grow flex items-center justify-center p-4 min-h-screen bg-slate-50">
        <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-red-100 text-center animate-scale-up">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">Tagihan Tidak Ditemukan</h2>
          <p className="text-slate-500 text-sm mb-6">{errorMsg || "Maaf, link tagihan tidak valid."}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-2xl shadow-md hover:bg-brand-hover transition duration-200"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  // Calculate unpaid details up to current month (Juni 2026)
  const unpaidDetails = []
  let totalOutstanding = 0
  const monthsKeys = Object.keys(MONTH_NAMES)
  const currentMonthIdx = monthsKeys.indexOf(CURRENT_MONTH)

  for (let i = 0; i <= currentMonthIdx; i++) {
    const mKey = monthsKeys[i]
    const period = `${CURRENT_YEAR}-${mKey}`
    
    // Find payment record
    const record = payments.find(p => p.period === period)
    const status = record ? record.status : "N/A"

    if (status === "BELUM_BAYAR") {
      unpaidDetails.push({
        month: `${MONTH_NAMES[mKey]} ${CURRENT_YEAR}`,
        amount: customer.monthly_fee,
        status: "Belum Bayar"
      })
      totalOutstanding += parseFloat(customer.monthly_fee)
    } else if (status === "KURANG") {
      const paid = record.amount_paid ? parseFloat(record.amount_paid) : 0
      const remaining = parseFloat(customer.monthly_fee) - paid
      unpaidDetails.push({
        month: `${MONTH_NAMES[mKey]} ${CURRENT_YEAR}`,
        amount: remaining,
        status: "Kurang Bayar (Sisa)"
      })
      totalOutstanding += remaining
    }
  }

  // Formulate WhatsApp message text
  const outstandingText = unpaidDetails.map(d => `${d.month} (${formatRupiah(d.amount)})`).join(", ") || "Tagihan bulan berjalan"
  const waMessage = `Halo Admin WiFi-ID, saya ingin mengonfirmasi pembayaran WiFi:\n\n👤 *Pelanggan:* ${customer.name}\n📍 *Alamat:* ${customer.address}\n📅 *Periode:* ${outstandingText}\n💰 *Total Tagihan:* ${formatRupiah(totalOutstanding)}\n\nSaya telah melakukan pembayaran, mohon dikonfirmasi. Terima kasih!`
  const waUrl = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(waMessage)}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 min-h-screen bg-slate-50 print:bg-white print:p-0">
      
      {/* Invoice Card */}
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-amber-100/60 p-6 sm:p-10 print:shadow-none print:border-none print:p-0 animate-fade-in print-card">
        
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-primary to-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-md print:shadow-none">
              W
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">WiFi-ID Billing</h2>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Faktur Tagihan Resmi</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border inline-block ${
              totalOutstanding === 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {totalOutstanding === 0 ? "Lunas" : "Ada Tunggakan"}
            </span>
            <p className="text-xs text-slate-400 font-medium mt-1.5 flex items-center gap-1 sm:justify-end">
              <Calendar className="w-3.5 h-3.5" />
              Per Tanggal: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Customer & Billing Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-slate-100 pb-8">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ditujukan Kepada:</h3>
            <p className="font-extrabold text-slate-800 text-lg">{customer.name}</p>
            <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">{customer.address}</p>
            <p className="text-slate-500 text-xs font-semibold mt-2">No. HP: {customer.phone}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informasi Langganan:</h3>
            <div className="space-y-2 text-sm leading-tight">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tarif Bulanan:</span>
                <span className="font-bold text-slate-800">{formatRupiah(customer.monthly_fee)}/bln</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tanggal Gabung:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(customer.join_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Status Layanan:</span>
                <span className="font-bold text-emerald-600 text-xs uppercase tracking-wider">Aktif</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items (Outstanding List) */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Rincian Tagihan Terutang:</h3>
          {unpaidDetails.length > 0 ? (
            <div className="overflow-hidden border border-slate-100 rounded-2xl">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Periode Tagihan</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Jumlah Sisa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {unpaidDetails.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-55/20 transition">
                      <td className="py-4 px-6 font-bold text-slate-800">{item.month}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-slate-800">{formatRupiah(item.amount)}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-amber-50/30 font-bold text-slate-800">
                    <td colSpan="2" className="py-4 px-6 text-right uppercase tracking-wider text-xs">Total Pembayaran</td>
                    <td className="py-4 px-6 text-right font-black text-brand-primary text-base sm:text-lg">{formatRupiah(totalOutstanding)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-center text-emerald-800 font-bold flex flex-col items-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              <div>
                <p className="text-sm">Selamat! Tagihan Anda Lunas</p>
                <p className="text-xs text-emerald-600 font-normal mt-0.5">Tidak ada tunggakan pembayaran WiFi saat ini.</p>
              </div>
            </div>
          )}
        </div>

        {/* Bank Transfer Details */}
        {totalOutstanding > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-8">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3.5">Informasi Cara Pembayaran:</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Silakan lakukan transfer ke salah satu rekening bank di bawah ini sebesar nominal tagihan di atas. Konfirmasikan pembayaran Anda setelah transfer berhasil.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">BANK MANDIRI</span>
                  <p className="font-extrabold text-slate-800 text-base mt-1">142-00-145678-9</p>
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-2.5">a.n. Ibu Murtinem</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">BANK BCA</span>
                  <p className="font-extrabold text-slate-800 text-base mt-1">675-0123-456</p>
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-2.5">a.n. Ibu Murtinem</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100 no-print">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition duration-200 flex items-center justify-center gap-2 border border-slate-200"
          >
            <Printer className="w-4.5 h-4.5" />
            Cetak Invoice Tagihan
          </button>

          {totalOutstanding > 0 && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-md transition duration-200 flex items-center justify-center gap-2"
            >
              <Phone className="w-4.5 h-4.5 fill-current" />
              Konfirmasi WhatsApp
            </a>
          )}
        </div>

        {/* Print Only Footer (Hidden in web preview) */}
        <div className="hidden print:block text-center text-[10px] text-slate-400 pt-8 border-t border-slate-100 mt-10">
          <p className="font-bold">Terima kasih atas kepercayaan Anda menggunakan layanan internet WiFi-ID.</p>
          <p className="mt-1">Pencatatan Tagihan Sistem Manajemen WiFi-ID</p>
        </div>

      </div>
    </div>
  )
}
