"use client";

import React, { useEffect, useState } from "react";

type Siswa = {
  _id?: string;
  nama: string;
  kelas: string;
  nisn: string;
  password?: string;
  createdAt?: string;
};

export default function SiswaPage() {
  const [list, setList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Siswa>>({ nama: "", kelas: "", nisn: "", password: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/siswa");
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setError("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchList();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = { ...form } as Record<string, unknown>;

      if (editingId && payload.password === "") {
        delete payload.password;
      }

      if (editingId) {
        const res = await fetch(`/api/siswa/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Gagal update");
      } else {
        const res = await fetch(`/api/siswa`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const payload = await res.json();
          throw new Error(payload?.message || "Gagal membuat siswa");
        }
      }

      setForm({ nama: "", kelas: "", nisn: "", password: "" });
      setEditingId(null);
      fetchList();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error");
      }
    }
  };

  const handleEdit = (s: Siswa) => {
    setEditingId(s._id || null);
    setForm({ nama: s.nama, kelas: s.kelas, nisn: s.nisn });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Hapus siswa ini?")) return;

    await fetch(`/api/siswa/${id}`, { method: "DELETE" });
    fetchList();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manajemen Siswa</h1>

      <div className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-2 max-w-md">
          <div>
            <label className="block text-sm font-medium">Nama</label>
            <input className="border p-2 w-full" value={form.nama || ""} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Kelas</label>
            <input className="border p-2 w-full" value={form.kelas || ""} onChange={(e) => setForm({ ...form, kelas: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">NISN</label>
            <input className="border p-2 w-full" value={form.nisn || ""} onChange={(e) => setForm({ ...form, nisn: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input type="password" className="border p-2 w-full" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          {error && <div className="text-red-600">{error}</div>}

          <div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{editingId ? "Update" : "Buat"}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ nama: "", kelas: "", nisn: "", password: "" }); }} className="ml-2 px-4 py-2">Batal</button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Daftar Siswa</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Nama</th>
                <th className="border px-2 py-1">Kelas</th>
                <th className="border px-2 py-1">NISN</th>
                <th className="border px-2 py-1">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s._id}>
                  <td className="border px-2 py-1">{s.nama}</td>
                  <td className="border px-2 py-1">{s.kelas}</td>
                  <td className="border px-2 py-1">{s.nisn}</td>
                  <td className="border px-2 py-1">
                    <button className="mr-2 text-blue-600" onClick={() => handleEdit(s)}>Edit</button>
                    <button className="text-red-600" onClick={() => handleDelete(s._id)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
