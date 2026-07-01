import "./globals.css";

export const metadata = {
  title: "WiFi-ID - Sistem Pembayaran & Tagihan WiFi",
  description: "Aplikasi pencatatan pembayaran WiFi pelanggan serba praktis.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
