"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const inputUsername = username.trim();
    const inputPassword = password.trim();

    if (!inputUsername || !inputPassword) {
      setError("NISN atau kata sandi tidak boleh kosong.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: inputUsername, password: inputPassword }),
      });

      const payload = await res.json();

      if (!res.ok) {
        setError(payload?.message || "NISN atau kata sandi salah.");
        setLoading(false);
        return;
      }

      const userData = payload.user || {
        username: inputUsername,
        role: payload.role,
      };

      localStorage.setItem("user", JSON.stringify(userData));

      if (payload.role === "operator") {
        router.push("/operator");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat login.");
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <header className="navbar">
        <div className="brand-wrap">
          <img src="/logo.jpeg" alt="Logo Madrasah" className="brand-logo" />
          <div className="brand-text">
            Madrasah Ibtidaiah Masyarikul Anwar
          </div>
        </div>

        <nav className="nav-menu">
          <a href="#home" className="active">
            Home
          </a>
          <a href="#tentang-sekolah">Tentang</a>
        </nav>

        <div className="nav-icons">
          <button aria-label="Cari">
            <SearchIcon />
          </button>
          <button aria-label="Bantuan">
            <HelpIcon />
          </button>
        </div>
      </header>

      <section id="home" className="hero">
        <div className="hero-bg" />

        <div className="hero-content">
          <div className="hero-text">
            <div className="badge">
              <GearIcon />
              <span>Sistem Pembayaran Resmi Madrasah</span>
            </div>

            <h1>Pembayaran UKT Lebih Mudah & Transparan</h1>

            <p>
              Kelola kewajiban administrasi akademik Anda dalam satu platform
              terpadu. Aman, cepat, dan terintegrasi langsung dengan sistem
              informasi madrasah.
            </p>

            <div className="features">
              <div className="feature">
                <div className="feature-icon">
                  <WalletIcon />
                </div>
                <div>
                  <strong>Multi-Metode</strong>
                  <span>VA, Bank Transfer, & Retail</span>
                </div>
              </div>

              <div className="feature">
                <div className="feature-icon">
                  <ShieldIcon />
                </div>
                <div>
                  <strong>Terverifikasi</strong>
                  <span>Enkripsi End-to-End</span>
                </div>
              </div>
            </div>
          </div>

          <div className="login-card">
            <div className="card-line" />

            <h2>Selamat Datang</h2>
            <p className="login-subtitle">
              Masuk dengan NISN dan kata sandi akun akademik Anda
            </p>

            <form onSubmit={handleLogin}>
              <label>
                <span>Nomor Induk Siswa Nasional (NISN)</span>
                <div className="input-box">
                  <UserIcon />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: 20210801001"
                    autoComplete="username"
                  />
                </div>
              </label>

              <label>
                <span>Kata Sandi</span>
                <div className="input-box">
                  <LockIcon />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Tampilkan password"
                  >
                    <EyeIcon />
                  </button>
                </div>
              </label>

              <button type="button" className="forgot-button">
                Lupa Kata Sandi?
              </button>

              {error && <div className="error-box">{error}</div>}

              <button type="submit" className="login-button" disabled={loading}>
                <span>{loading ? "Memproses..." : "Masuk"}</span>
                <LoginIcon />
              </button>
            </form>
          </div>
        </div>
      </section>

      <section id="tentang-sekolah" className="about-section">
        <div className="about-container">
          <div className="about-text">
            <span className="about-badge">Tentang Sekolah</span>

            <h2>Madrasah Ibtidaiah Masyarikul Anwar</h2>

            <p>
              Madrasah Ibtidaiah Masyarikul Anwar merupakan lembaga pendidikan
              yang berkomitmen dalam membentuk peserta didik yang berakhlak
              mulia, cerdas, disiplin, dan memiliki semangat belajar yang
              tinggi.
            </p>

            <p>
              Melalui sistem akademik ini, sekolah berupaya memberikan layanan
              yang lebih mudah, cepat, dan transparan bagi siswa, wali murid,
              serta pihak madrasah.
            </p>
          </div>

          <div className="about-images">
            <img src="/kelas.jpeg" alt="Ruang Kelas" />
            <img src="/lorong.jpeg" alt="Lingkungan Sekolah" />
          </div>
        </div>
      </section>

      <footer className="footer">
        <div>
          <strong>Madrasah Masyarikul Anwar</strong>
          <p>© 2024 Portal Pembayaran Pendidikan. All rights reserved.</p>
        </div>

        <div className="footer-links">
          <a>Kontak</a>
          <a>Kebijakan Privasi</a>
          <a>Syarat & Ketentuan</a>
          <a>FAQ</a>
        </div>

        <div className="footer-icons">
          <button>
            <GlobeIcon />
          </button>
          <button>
            <ShareIcon />
          </button>
        </div>
      </footer>

      <style jsx>{`
        :global(html) {
          scroll-behavior: smooth;
        }

        .page {
          min-height: 100vh;
          background: #eef3fb;
          color: #101828;
          font-family: Arial, Helvetica, sans-serif;
        }

        .navbar {
          height: 72px;
          padding: 0 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.92);
          border-bottom: 1px solid #d4d9e2;
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(12px);
          gap: 20px;
        }

        .brand-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 330px;
        }

        .brand-logo {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid #d6e1dc;
        }

        .brand-text {
          font-size: 18px;
          font-weight: 800;
          color: #052e1c;
          line-height: 1.2;
        }

        .nav-menu {
          display: flex;
          gap: 28px;
          font-size: 14px;
        }

        .nav-menu a {
          color: #2e3338;
          text-decoration: none;
          cursor: pointer;
          padding: 24px 0 20px;
        }

        .nav-menu .active {
          color: #0f172a;
          font-weight: 800;
          border-bottom: 2px solid #111827;
        }

        .nav-icons {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .nav-icons button,
        .footer-icons button {
          border: none;
          background: transparent;
          cursor: pointer;
          color: #111827;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .hero {
          min-height: 760px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            90deg,
            #f9fbff 0%,
            #f5f8fd 54%,
            #dfe7ec 100%
          );
        }

        .hero-bg {
          position: absolute;
          inset: 40px 48px 72px 48px;
          border-radius: 0 32px 32px 0;
          background-image: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.95) 0%,
              rgba(255, 255, 255, 0.88) 45%,
              rgba(255, 255, 255, 0.62) 100%
            ),
            url("/bg.jpeg");
          background-size: cover;
          background-position: center;
          filter: saturate(0.85);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 1180px;
          margin: 0 auto;
          padding: 72px 32px 90px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
        }

        .hero-text {
          padding-top: 20px;
        }

        .badge {
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 999px;
          background: #69f0ae;
          color: #047043;
          font-size: 13px;
          margin-bottom: 28px;
        }

        .hero-text h1 {
          margin: 0;
          max-width: 580px;
          font-size: 38px;
          line-height: 1.2;
          letter-spacing: -0.03em;
          color: #004329;
          font-weight: 800;
        }

        .hero-text p {
          max-width: 520px;
          margin: 24px 0 0;
          color: #2f3439;
          font-size: 16px;
          line-height: 1.7;
        }

        .features {
          display: flex;
          gap: 32px;
          margin-top: 38px;
          flex-wrap: wrap;
        }

        .feature {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid #c9d4cf;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #002e1e;
        }

        .feature strong {
          display: block;
          color: #161b22;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .feature span {
          display: block;
          color: #42484f;
          font-size: 12px;
        }

        .login-card {
          position: relative;
          width: 100%;
          max-width: 430px;
          margin-left: auto;
          background: rgba(255, 255, 255, 0.97);
          border: 1px solid #c9d3d0;
          border-radius: 12px;
          padding: 30px 28px 30px;
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.18);
          overflow: hidden;
        }

        .card-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: #00452b;
        }

        .login-card h2 {
          margin: 0 0 8px;
          font-size: 21px;
          font-weight: 800;
          color: #0f172a;
        }

        .login-subtitle {
          margin: 0 0 24px;
          font-size: 13px;
          color: #2f3439;
          line-height: 1.5;
        }

        form {
          display: flex;
          flex-direction: column;
        }

        label {
          display: block;
          margin-bottom: 18px;
        }

        label span {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #20252b;
        }

        .input-box {
          height: 48px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 14px;
          background: #eef3ff;
          border: 1px solid #b8c2cc;
          border-radius: 9px;
          color: #1c2b24;
          transition: 0.2s ease;
        }

        .input-box:focus-within {
          border-color: #00452b;
          box-shadow: 0 0 0 4px rgba(0, 69, 43, 0.1);
          background: #ffffff;
        }

        .input-box input {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 15px;
          color: #111827;
        }

        .input-box input::placeholder {
          color: #697386;
        }

        .eye-button {
          border: none;
          background: transparent;
          color: #1c2b24;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .forgot-button {
          width: fit-content;
          align-self: flex-end;
          border: none;
          background: transparent;
          color: #006b42;
          font-weight: 700;
          font-size: 13px;
          margin: -8px 0 18px;
          cursor: pointer;
        }

        .error-box {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 16px;
        }

        .login-button {
          height: 52px;
          border: none;
          border-radius: 8px;
          background: #00452b;
          color: white;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 5px 10px rgba(0, 0, 0, 0.25);
          transition: 0.2s ease;
        }

        .login-button:hover {
          transform: translateY(-2px);
          background: #00603b;
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .about-section {
          padding: 86px 48px;
          background: #ffffff;
          border-top: 1px solid #d8e0e8;
        }

        .about-container {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 0.9fr;
          gap: 54px;
          align-items: center;
        }

        .about-badge {
          display: inline-flex;
          margin-bottom: 18px;
          padding: 8px 16px;
          border-radius: 999px;
          background: #dcfce7;
          color: #047043;
          font-size: 13px;
          font-weight: 800;
        }

        .about-text h2 {
          margin: 0;
          font-size: 36px;
          line-height: 1.2;
          color: #004329;
          font-weight: 900;
        }

        .about-text p {
          margin: 18px 0 0;
          font-size: 16px;
          line-height: 1.8;
          color: #374151;
        }

        .about-images {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .about-images img {
          width: 100%;
          height: 280px;
          object-fit: cover;
          border-radius: 24px;
          border: 1px solid #d1d5db;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12);
        }

        .about-images img:nth-child(2) {
          margin-top: 42px;
        }

        .footer {
          min-height: 110px;
          padding: 28px 48px;
          background: #dfe8f8;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 24px;
        }

        .footer strong {
          display: block;
          color: #052e1c;
          font-size: 18px;
          margin-bottom: 8px;
        }

        .footer p {
          margin: 0;
          font-size: 13px;
          color: #3d4651;
        }

        .footer-links {
          display: flex;
          gap: 20px;
          font-size: 13px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-links a {
          color: #2c333a;
          text-decoration: underline;
          cursor: pointer;
        }

        .footer-icons {
          justify-self: end;
          display: flex;
          gap: 12px;
        }

        .footer-icons button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #bdc7d3;
          background: transparent;
        }

        :global(.icon) {
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          max-width: 18px !important;
          min-height: 18px !important;
          max-height: 18px !important;
          flex-shrink: 0;
          display: block;
        }

        :global(.login-icon) {
          width: 19px !important;
          height: 19px !important;
          min-width: 19px !important;
          max-width: 19px !important;
          min-height: 19px !important;
          max-height: 19px !important;
        }

        @media (max-width: 1024px) {
          .navbar {
            padding: 0 24px;
          }

          .hero-content {
            grid-template-columns: 1fr;
            gap: 36px;
            padding-top: 56px;
          }

          .login-card {
            margin: 0;
            max-width: 520px;
          }

          .about-container {
            grid-template-columns: 1fr;
          }

          .about-images img:nth-child(2) {
            margin-top: 0;
          }

          .footer {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .footer-icons {
            justify-self: center;
          }

          .brand-wrap {
            min-width: unset;
          }
        }

        @media (max-width: 640px) {
          .navbar {
            height: auto;
            padding: 16px 18px;
            flex-wrap: wrap;
            gap: 14px;
          }

          .brand-wrap {
            width: 100%;
          }

          .brand-logo {
            width: 38px;
            height: 38px;
          }

          .brand-text {
            font-size: 15px;
          }

          .nav-menu {
            order: 3;
            width: 100%;
            justify-content: center;
            gap: 22px;
            font-size: 13px;
          }

          .hero {
            min-height: auto;
          }

          .hero-bg {
            inset: 20px 14px 40px 14px;
            border-radius: 20px;
          }

          .hero-content {
            padding: 40px 18px 60px;
          }

          .hero-text h1 {
            font-size: 30px;
          }

          .hero-text p {
            font-size: 14px;
          }

          .features {
            gap: 22px;
          }

          .login-card {
            padding: 24px 18px 24px;
          }

          .about-section {
            padding: 56px 18px;
          }

          .about-text h2 {
            font-size: 28px;
          }

          .about-text p {
            font-size: 14px;
          }

          .about-images {
            grid-template-columns: 1fr;
          }

          .about-images img {
            height: 220px;
          }

          .footer {
            padding: 24px 18px;
          }
        }
      `}</style>
    </main>
  );
}

function SearchIcon() {
  return (
    <svg
      className="icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      className="icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.2 2.2 0 1 1 3.4 1.85c-.9.56-1.2.95-1.2 2.15" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      className="icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      <path d="M3 12h2M19 12h2M12 3v2M12 19v2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      className="icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M16 10h5v5h-5a2.5 2.5 0 0 1 0-5Z" />
      <path d="M7 8V5h10v3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3 19 6v5c0 5-3.4 8.5-7 10-3.6-1.5-7-5-7-10V6l7-3Z" />
      <path d="M12 8v8" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      className="icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 14.5-4 16 0" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      className="icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg
      className="icon login-icon"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      className="icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.7 2.5 15.3 0 18" />
      <path d="M12 3c-2.5 2.7-2.5 15.3 0 18" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      className="icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.8 10.8 15.2 6.2" />
      <path d="M8.8 13.2 15.2 17.8" />
    </svg>
  );
}