import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { fetchMe, setToken } from "./api";

import LoginPage from "./pages/LoginPage";
import ListPage from "./pages/ListPage";
import DetailPage from "./pages/DetailPage";
import SearchPage from "./pages/SearchPage";
import AdminEditor from "./pages/AdminEditor";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminBreakingNewsPage from "./pages/AdminBreakingNewsPage";
import BreakingNewsTicker from "./components/BreakingNewsTicker";

// ✅ S2PASS
import S2PassPage from "./pages/S2PassPage";
import AdminS2PassPage from "./pages/AdminS2PassPage"; // ✅ TAMBAHAN

function App() {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cc-helper-token");
    if (saved) {
      setToken(saved);
      fetchMe()
        .then(setUser)
        .catch(() => {})
        .finally(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, []);

  if (!loaded) return null;
  if (!user) return <LoginPage onLogin={setUser} />;

  return <MainLayout user={user} setUser={setUser} />;
}

function MainLayout({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (location.pathname === "/search") {
      const params = new URLSearchParams(location.search);
      setSearch(params.get("q") || "");
    } else {
      setSearch("");
    }
  }, [location]);

  function handleLogout() {
    localStorage.removeItem("cc-helper-token");
    setUser(null);
    window.location.reload();
  }

  function onSearchSubmit(e) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* ================= HEADER ================= */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-500 text-white shadow">
        <div className="h-14 flex items-center px-4">
          <div className="flex items-center gap-2 mr-6">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="font-bold text-sm tracking-widest">bjb</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs uppercase tracking-[0.2em] text-sky-200">
                CC Helper
              </span>
              <span className="text-xs">Agent Knowledge Portal</span>
            </div>
          </div>

          <form
            onSubmit={onSearchSubmit}
            className="flex-1 max-w-xl flex gap-2 items-center"
          >
            <div className="flex-1 bg-white/10 rounded-full px-3 py-1 flex items-center">
              <input
                className="flex-1 bg-transparent text-xs placeholder:text-sky-100 focus:outline-none"
                placeholder="Cari produk / script…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="text-xs bg-white/10 hover:bg-white/20 rounded-full px-3 py-1"
            >
              Search
            </button>
          </form>

          <div className="ml-auto flex items-center gap-3 text-[11px]">
            <div className="text-right leading-tight">
              <div className="font-semibold">{user.name}</div>
              <div className="uppercase tracking-wide text-[10px] text-sky-200">
                {user.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs bg-white/10 hover:bg-white/20 rounded-full px-3 py-1"
            >
              Logout
            </button>
          </div>
        </div>

        <BreakingNewsTicker />
      </header>

      {/* ================= BODY ================= */}
      <div className="flex flex-1 overflow-hidden">
        {/* ========== SIDEBAR ========== */}
        <nav className="w-56 bg-blue-900/90 text-sky-100 border-r border-blue-900/60 flex flex-col py-4 px-3">
          <NavSection title="Navigasi" />

          <SideLink to="/s2pass" icon="▶️" label="S2PASS Call Guide" />
          <SideLink to="/products" icon="📦" label="List Produk" />
          <SideLink to="/scripts" icon="🗒️" label="List Script" />
          <SideLink to="/search?q=" icon="🔍" label="Search Cepat" />

          {user.role === "admin" && (
            <>
              <div className="mt-4 mb-1 h-px bg-blue-700/70" />
              <NavSection title="Admin" />

              <SideLink
                to="/admin/editor"
                icon="⚙️"
                label="Create Produk / Script"
              />
              <SideLink
                to="/admin/categories"
                icon="📚"
                label="Master Kategori"
              />
              <SideLink
                to="/admin/breaking-news"
                icon="🚨"
                label="Breaking News"
              />

              {/* ✅ MENU ADMIN S2PASS */}
              <SideLink
                to="/admin/s2pass"
                icon="🧭"
                label="S2PASS Navigator"
              />
            </>
          )}
        </nav>

        {/* ========== MAIN CONTENT ========== */}
        <main className="flex-1 p-4 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-4 min-h-[400px]">
              <Routes>
                {/* ✅ S2PASS */}
                <Route path="/s2pass" element={<S2PassPage user={user}/>} />

                {/* ✅ ADMIN S2PASS */}
                <Route
                  path="/admin/s2pass"
                  element={<AdminS2PassPage />}
                />

                <Route
                  path="/products"
                  element={<ListPage kind="product" />}
                />
                <Route
                  path="/scripts"
                  element={<ListPage kind="script" />}
                />

                <Route
                  path="/product/:slug"
                  element={<DetailPage kind="product" />}
                />
                <Route
                  path="/script/:slug"
                  element={<DetailPage kind="script" />}
                />

                <Route path="/search" element={<SearchPage />} />

                <Route
                  path="/admin/editor"
                  element={<AdminEditor user={user} />}
                />
                <Route
                  path="/admin/categories"
                  element={<AdminCategoriesPage />}
                />
                <Route
                  path="/admin/breaking-news"
                  element={<AdminBreakingNewsPage />}
                />

                {/* ✅ DEFAULT */}
                <Route path="*" element={<S2PassPage />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavSection({ title }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.18em] text-sky-300 px-1 mb-1">
      {title}
    </div>
  );
}

function SideLink({ to, icon, label }) {
  const location = useLocation();

  const active =
    location.pathname === to ||
    (to.startsWith("/search") && location.pathname === "/search") ||
    location.pathname.startsWith(to + "/");

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs mb-1 ${
        active
          ? "bg-sky-500 text-white shadow-sm"
          : "hover:bg-blue-800 text-sky-100"
      }`}
    >
      <span className="w-5 text-center">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default App;
