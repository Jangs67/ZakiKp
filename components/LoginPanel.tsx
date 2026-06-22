"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

export default function LoginPanel() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: form.get("role"),
          username: form.get("username"),
          password: form.get("password"),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login gagal. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      if (data.role === "student") {
        router.push("/dashboard");
      } else if (data.role === "operator") {
        router.push("/dashboard/operator");
      } else {
        setError("Role pengguna tidak dikenali.");
        setLoading(false);
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-[28px] border border-white/60 bg-white/90 px-8 py-9 text-center shadow-2xl backdrop-blur-md">
      <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-white to-green-50 shadow-lg">
        <img
          src="/logo.jpeg"
          alt="Logo Madrasah"
          className="h-20 w-20 object-contain"
        />
      </div>

      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-green-700">
          Sistem Informasi Siswa
        </p>

        <h1 className="text-2xl font-extrabold leading-tight text-gray-800">
          Madrasah Ibtidaiyah Masyarikul Anwar
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          Silakan masuk menggunakan akun yang telah diberikan.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 text-left">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Login sebagai
          </label>

          <select
            name="role"
            className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
          >
            <option value="student">Siswa</option>
            <option value="operator">Operator</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Username / NISN
          </label>

          <input
            name="username"
            placeholder="Masukkan username atau NISN"
            autoComplete="username"
            className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Password
          </label>

          <input
            name="password"
            type="password"
            placeholder="Masukkan password"
            autoComplete="current-password"
            className="h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-4 focus:ring-green-100"
          />
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-2xl bg-gradient-to-r from-green-700 to-green-600 font-bold text-white shadow-lg shadow-green-700/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-700/40 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="mt-6 text-xs text-gray-400">
        © Madrasah Masyarikul Anwar
      </p>
    </div>
  );
}