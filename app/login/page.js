"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                            process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy-project-id")

    if (isDummySupabase) {
      setTimeout(() => {
        if (email === "arif.setiawan2209@gmail.com" && password === "palamana") {
          document.cookie = "wifi_admin_logged_in=true; path=/; max-age=86400"
          router.push("/admin")
          router.refresh()
        } else {
          setErrorMsg("Email atau password salah.")
          setLoading(false)
        }
      }, 500)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message || "Email atau password salah.")
      } else {
        router.push("/admin")
        router.refresh()
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan sistem. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center p-4 min-h-screen bg-slate-50">
      <div className="bg-white w-full max-w-md p-8 sm:p-10 rounded-3xl shadow-xl border border-amber-100/60 animate-scale-up">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-primary to-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-md mx-auto mb-4">
            W
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">WiFi-ID Admin</h2>
          <p className="text-slate-500 text-sm mt-1">Silakan masuk untuk mengelola pembayaran WiFi pelanggan</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-2xl p-4 mb-6 text-sm font-semibold flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold">!</span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Admin</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@wifi-id.net"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition duration-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary focus:bg-white transition duration-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-sm font-bold text-white bg-brand-primary hover:bg-brand-hover disabled:bg-slate-300 disabled:cursor-not-allowed rounded-2xl shadow-md transition duration-300 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Masuk ke Panel Admin"
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-400 font-semibold">Hubungi pengembang jika lupa kata sandi.</p>
        </div>
      </div>
    </div>
  )
}
