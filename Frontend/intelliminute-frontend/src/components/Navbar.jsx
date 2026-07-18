import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { AuthModal } from "./AuthModal";

export default function Navbar() {
  const { user, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /* ── Nav Link ───────────────── */
  const NavLink = ({ href, children, onClick }) => (
    <a
      href={href}
      onClick={onClick}
      className="relative text-sm text-[#666] no-underline hover:text-[#1a1a1a] transition-colors duration-200 pb-0.5 group"
    >
      {children}
      <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-[#c8a97e] rounded-full transition-all duration-300 group-hover:w-full" />
    </a>
  );

  const NavButton = ({ children, onClick }) => (
    <button
      onClick={onClick}
      className="relative text-sm text-[#666] bg-transparent border-none cursor-pointer pb-0.5 group hover:text-[#1a1a1a] transition-colors duration-200"
    >
      {children}
      <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-[#c8a97e] rounded-full transition-all duration-300 group-hover:w-full" />
    </button>
  );

  const handleDashboard = () => {
    setMenuOpen(false);
    navigate(user?.role === "admin" ? "/admindashboard" : "/dashboard");
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap');

        .font-serif-display { font-family: 'DM Serif Display', serif; }
        .font-dm-sans { font-family: 'DM Sans', sans-serif; }

        @keyframes navSlideDown {
          from { opacity:0; transform:translateY(-10px); }
          to { opacity:1; transform:translateY(0); }
        }

        @keyframes logoPulse {
          0%,100%{transform:scale(1);}
          50%{transform:scale(1.35);}
        }

        @keyframes mobileIn {
          from{opacity:0;transform:translateY(-6px);}
          to{opacity:1;transform:translateY(0);}
        }

        @keyframes overlayIn {
          from{opacity:0;}
          to{opacity:1;}
        }

        .anim-nav-slide { animation: navSlideDown 0.4s ease both; }
        .anim-logo-pulse { animation: logoPulse 3s infinite; }
        .anim-mobile-in { animation: mobileIn 0.2s ease both; }
        .anim-overlay-in { animation: overlayIn 0.2s ease both; }
      `}</style>

      <nav
        className={`
        anim-nav-slide font-dm-sans sticky top-0 z-50
        flex items-center justify-between px-8 md:px-12 py-4
        transition-all duration-300
        ${
          scrolled
            ? "bg-[#faf8f4]/90 backdrop-blur-md border-b border-black/[0.08] shadow"
            : "bg-[#faf8f4] border-b border-black/[0.06]"
        }
      `}
      >
        {/* Logo (UNCHANGED) */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer"
        >
          <span className="anim-logo-pulse w-[9px] h-[9px] rounded-full bg-[#c8a97e]" />
          <span className="font-serif-display text-[19px] text-[#1a1a1a]">
            IntelliMinute
          </span>
        </button>

        {/* Desktop (UNCHANGED structure) */}
        <div className="hidden md:flex items-center gap-7">
          {isHome ? (
            <>
              <NavLink href="/demo">Try it</NavLink>
              <NavLink href="/blog">Blog</NavLink>
            </>
          ) : (
            <NavButton onClick={() => navigate("/")}>Home</NavButton>
          )}

          <span className="w-px h-4 bg-black/10" />

          {!user ? (
            <>
              <button
                onClick={() => setAuthOpen(true)}
                className="text-sm border px-5 py-2 rounded"
              >
                Log in
              </button>
              <button
                onClick={() => setAuthOpen(true)}
                className="bg-black text-white px-5 py-2 rounded"
              >
                Sign up
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {/* Avatar (UNCHANGED) */}
              <div className="w-8 h-8 rounded-full bg-[#c8a97e] flex items-center justify-center text-white text-sm font-semibold">
                {user.name?.charAt(0).toUpperCase()}
              </div>

              {/* Name (UNCHANGED) */}
              <span className="text-sm font-medium">{user.name}</span>

              {/* NEW: Dashboard button with grid icon */}
              <button
                onClick={handleDashboard}
                className="flex items-center gap-1.5 text-sm font-medium text-[#1a1a1a] bg-transparent border border-black/10 px-3 py-1.5 rounded cursor-pointer hover:bg-black/5 transition-colors duration-200"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="1"
                    y="1"
                    width="5.5"
                    height="5.5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <rect
                    x="8.5"
                    y="1"
                    width="5.5"
                    height="5.5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <rect
                    x="1"
                    y="8.5"
                    width="5.5"
                    height="5.5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <rect
                    x="8.5"
                    y="8.5"
                    width="5.5"
                    height="5.5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                </svg>
                {user.role === "admin" ? "Admin panel" : "My dashboard"}
              </button>

              {/* Logout (UNCHANGED style) */}
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:underline"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile: animated hamburger → × (replaces plain ☰) */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] bg-transparent border-none cursor-pointer p-0"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-[1.5px] bg-[#1a1a1a] rounded-full transition-all duration-300 origin-center
            ${menuOpen ? "w-5 rotate-45 translate-y-[6.5px]" : "w-5"}`}
          />
          <span
            className={`block h-[1.5px] bg-[#1a1a1a] rounded-full transition-all duration-300
            ${menuOpen ? "w-0 opacity-0" : "w-4 opacity-100"}`}
          />
          <span
            className={`block h-[1.5px] bg-[#1a1a1a] rounded-full transition-all duration-300 origin-center
            ${menuOpen ? "w-5 -rotate-45 -translate-y-[6.5px]" : "w-5"}`}
          />
        </button>
      </nav>

      {/* Dim overlay behind mobile drawer */}
      {menuOpen && (
        <div
          className="anim-overlay-in md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile drawer — same bg/font/color tokens as original */}
      {menuOpen && (
        <div className="anim-mobile-in md:hidden fixed top-[61px] left-0 right-0 z-50 bg-[#faf8f4] border-b border-black/[0.06] shadow-md">
          <div className="font-dm-sans flex flex-col px-8 py-5 gap-1">
            {/* Mirror desktop nav links */}
            {isHome ? (
              <>
                <a
                  href="#features"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-[#444] py-3 border-b border-black/[0.05] no-underline"
                >
                  Features
                </a>
                <a
                  href="/demo"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-[#444] py-3 border-b border-black/[0.05] no-underline"
                >
                  Try it
                </a>
                <a
                  href="/blog"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-[#444] py-3 border-b border-black/[0.05] no-underline"
                >
                  Blog
                </a>
              </>
            ) : (
              <button
                onClick={() => {
                  navigate("/");
                  setMenuOpen(false);
                }}
                className="text-sm text-[#444] py-3 border-b border-black/[0.05] text-left bg-transparent border-x-0 border-t-0 cursor-pointer"
              >
                Home
              </button>
            )}

            {/* Auth section */}
            {!user ? (
              <div className="pt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setAuthOpen(true);
                    setMenuOpen(false);
                  }}
                  className="bg-black text-white text-sm py-2.5 rounded w-full border-none cursor-pointer"
                >
                  Sign up
                </button>
                <button
                  onClick={() => {
                    setAuthOpen(true);
                    setMenuOpen(false);
                  }}
                  className="text-sm border border-black/10 py-2.5 rounded w-full bg-transparent cursor-pointer"
                >
                  Log in
                </button>
              </div>
            ) : (
              <div className="pt-4 flex flex-col gap-3">
                {/* User info row: avatar + name + email + Pro badge */}
                <div className="flex items-center gap-3 pb-1">
                  <div className="w-9 h-9 rounded-full bg-[#c8a97e] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a] m-0 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-[#999] m-0 truncate">
                      {user.email}
                    </p>
                  </div>
                  {user.subscribed && (
                    <span className="text-[10px] font-bold bg-[#f0ede6] text-[#c8a97e] px-2 py-0.5 rounded-full flex-shrink-0">
                      PRO
                    </span>
                  )}
                </div>

                {/* Full-width Dashboard CTA */}
                <button
                  onClick={handleDashboard}
                  className="flex items-center justify-center gap-2 bg-black text-white text-sm py-2.5 rounded w-full border-none cursor-pointer"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="1"
                      y="1"
                      width="5.5"
                      height="5.5"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <rect
                      x="8.5"
                      y="1"
                      width="5.5"
                      height="5.5"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <rect
                      x="1"
                      y="8.5"
                      width="5.5"
                      height="5.5"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <rect
                      x="8.5"
                      y="8.5"
                      width="5.5"
                      height="5.5"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                  {user.role === "admin" ? "Admin panel" : "My dashboard"}
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-500 py-2.5 rounded w-full bg-transparent border border-black/10 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal (UNCHANGED) */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
