import { useState } from "react";
import { login, setToken } from "../api";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await login(username, password);
      localStorage.setItem("cc-helper-token", data.token);
      setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError("Username / password salah atau server tidak merespon");
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-900 via-blue-800 to-sky-500">
      {/* Left brand panel */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#ffffff_0,_transparent_55%),radial-gradient(circle_at_bottom,_#0ea5e9_0,_transparent_55%)]" />
        <div className="relative z-10 px-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="font-bold text-lg tracking-widest">bjb</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm uppercase tracking-[0.25em] text-sky-200">
                Contact Center
              </span>
              <span className="text-lg font-semibold">Helper Dashboard</span>
            </div>
          </div>
          <h1 className="text-3xl font-semibold mb-3">
            Satu pintu informasi produk & script agent.
          </h1>
          <p className="text-sm text-sky-100 max-w-md">
            Bantu agent menjawab nasabah lebih cepat dengan akses terstruktur ke
            seluruh produk dan script resmi bank bjb – cukup lewat satu layar.
          </p>
        </div>
      </div>

      {/* Right login card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-6">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6 md:p-8">
            <div className="mb-6 text-center md:text-left">
              <h2 className="text-xl font-semibold text-slate-900">
                Masuk ke CC Helper
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan akun admin / agent yang sudah terdaftar.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-2 mb-4 rounded border border-red-200">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Username
                </label>
                <input
                  className="border border-slate-300 rounded-lg w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="misal: admin"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="border border-slate-300 rounded-lg w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-lg text-sm font-medium shadow-sm transition"
              >
                Masuk
              </button>
            </form>

            <div className="mt-6 text-[10px] text-slate-400 text-center">
              © {new Date().getFullYear()} bank bjb – Contact Center Helper
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
