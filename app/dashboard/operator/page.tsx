"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { siswa as siswaData } from "@/data/siswa";

type Student = {
  nama?: string;
  kelas?: string;
  nisn?: string | number;
  password?: string | number;
  ttl?: string;
  jk?: string;
  [key: string]: any;
};

type Payment = {
  nama?: string;
  kelas?: string;
  nisn?: string | number;
  bulan?: string;
  status?: string;
  nominal?: number;
  proof?: string;
  proofName?: string;
  createdAt?: string;
};

const STORAGE_STUDENTS = "operator_students";
const STORAGE_SPP_PRICE = "operator_spp_price";
const DEMO_PAYMENTS_KEY = "demo_payments";
const DEFAULT_SPP_PRICE = 200000;

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeStatus(status?: string) {
  if (status === "paid" || status === "Sudah Bayar") return "paid";
  if (status === "pending" || status === "Menunggu Verifikasi") return "pending";
  return "unpaid";
}

export default function OperatorPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [sppPrice, setSppPrice] = useState(DEFAULT_SPP_PRICE);
  const [sppInput, setSppInput] = useState(String(DEFAULT_SPP_PRICE));

  const [proofModal, setProofModal] = useState<Payment | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("user");

    if (!data) {
      router.replace("/login");
      return;
    }

    const user = JSON.parse(data);

    if (user.role !== "operator" && user.username !== "admin") {
      router.replace("/login");
      return;
    }

    const savedStudents = localStorage.getItem(STORAGE_STUDENTS);
    const savedPrice = localStorage.getItem(STORAGE_SPP_PRICE);

    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    } else {
      setStudents(siswaData as Student[]);
      localStorage.setItem(STORAGE_STUDENTS, JSON.stringify(siswaData));
    }

    if (savedPrice) {
      setSppPrice(Number(savedPrice));
      setSppInput(savedPrice);
    } else {
      localStorage.setItem(STORAGE_SPP_PRICE, String(DEFAULT_SPP_PRICE));
    }

    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;

    const loadPayments = () => {
      const savedPayments = localStorage.getItem(DEMO_PAYMENTS_KEY);
      const rawPayments = savedPayments ? JSON.parse(savedPayments) : [];

      const validPayments = Array.isArray(rawPayments)
        ? rawPayments.filter((p: Payment) => p.nama && p.kelas && p.nisn)
        : [];

      const fixedPayments: Payment[] = [];

      for (const payment of validPayments) {
        const matchedStudent = students.find(
          (student) =>
            student.nisn?.toString() === payment.nisn?.toString() ||
            student.nama?.toLowerCase() === payment.nama?.toLowerCase()
        );

        if (!matchedStudent) {
          continue;
        }

        fixedPayments.push({
          ...payment,
          nama: matchedStudent.nama,
          kelas: matchedStudent.kelas,
          nisn: matchedStudent.nisn,
          status: payment.status || "pending",
          nominal: payment.nominal || sppPrice,
        });
      }

      localStorage.setItem(DEMO_PAYMENTS_KEY, JSON.stringify(fixedPayments));
      setPayments(fixedPayments);
      setLoadingPayments(false);
    };

    loadPayments();

    window.addEventListener("focus", loadPayments);
    window.addEventListener("storage", loadPayments);

    return () => {
      window.removeEventListener("focus", loadPayments);
      window.removeEventListener("storage", loadPayments);
    };
  }, [authorized, students, sppPrice]);

  const saveStudents = (nextStudents: Student[]) => {
    setStudents(nextStudents);
    localStorage.setItem(STORAGE_STUDENTS, JSON.stringify(nextStudents));
  };

  const savePayments = (nextPayments: Payment[]) => {
    setPayments(nextPayments);
    localStorage.setItem(DEMO_PAYMENTS_KEY, JSON.stringify(nextPayments));
  };

  const getPaymentByStudent = (student: Student) => {
    return payments.find(
      (payment) =>
        payment.nisn?.toString() === student.nisn?.toString() ||
        payment.nama?.toLowerCase() === student.nama?.toLowerCase()
    );
  };

  const getStatus = (student: Student) => {
    const payment = getPaymentByStudent(student);
    if (!payment) return "unpaid";
    return normalizeStatus(payment.status);
  };

  const paidCount = students.filter((s) => getStatus(s) === "paid").length;
  const pendingCount = students.filter((s) => getStatus(s) === "pending").length;
  const unpaidCount = students.filter((s) => getStatus(s) === "unpaid").length;

  const totalTagihan = students.length * sppPrice;
  const totalTerbayar = paidCount * sppPrice;
  const totalBelumTerbayar = (pendingCount + unpaidCount) * sppPrice;

  const filteredStudents = students.filter((student) => {
    const keyword = search.toLowerCase();

    return (
      student.nama?.toLowerCase().includes(keyword) ||
      student.kelas?.toLowerCase().includes(keyword) ||
      student.nisn?.toString().toLowerCase().includes(keyword)
    );
  });

  const filteredPayments = payments.filter((payment) => {
    const keyword = search.toLowerCase();

    return (
      payment.nama?.toLowerCase().includes(keyword) ||
      payment.kelas?.toLowerCase().includes(keyword) ||
      payment.nisn?.toString().toLowerCase().includes(keyword) ||
      payment.bulan?.toLowerCase().includes(keyword)
    );
  });

  const editingStudent =
    editingIndex !== null && editingIndex >= 0
      ? students[editingIndex]
      : undefined;

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleAdd = () => {
    setSearch("");
    setEditingIndex(null);
    setShowForm(true);
    setActiveMenu("siswa");
  };

  const handleEdit = (student: Student) => {
    const index = students.findIndex(
      (s) => s.nisn?.toString() === student.nisn?.toString()
    );

    if (index === -1) {
      alert("Data siswa tidak ditemukan untuk diedit.");
      return;
    }

    setEditingIndex(index);
    setShowForm(true);
    setActiveMenu("siswa");
  };

  const handleDelete = (student: Student) => {
    const yakin = confirm(`Hapus data siswa ${student.nama}?`);
    if (!yakin) return;

    const nextStudents = students.filter(
      (s) => s.nisn?.toString() !== student.nisn?.toString()
    );

    const nextPayments = payments.filter(
      (payment) =>
        payment.nisn?.toString() !== student.nisn?.toString()
    );

    saveStudents(nextStudents);
    savePayments(nextPayments);
  };

  const handleSaveStudent = (e: any) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);

    const student: Student = {
      nama: form.get("nama")?.toString().trim() || "",
      kelas: form.get("kelas")?.toString().trim() || "",
      nisn: form.get("nisn")?.toString().trim() || "",
      password: form.get("password")?.toString().trim() || "",
      ttl: form.get("ttl")?.toString().trim() || "",
      jk: form.get("jk")?.toString().trim() || "",
    };

    if (!student.nama || !student.kelas || !student.nisn || !student.password) {
      alert("Nama, kelas, NISN, dan password wajib diisi.");
      return;
    }

    const nisnSudahAda = students.some((s, index) => {
      if (editingIndex !== null && index === editingIndex) return false;
      return s.nisn?.toString() === student.nisn?.toString();
    });

    if (nisnSudahAda) {
      alert("NISN sudah terdaftar. Gunakan NISN lain.");
      return;
    }

    const nextStudents = [...students];
    const editingIndexValue = editingIndex !== null && editingIndex >= 0 ? editingIndex : -1;
    const originalStudent = editingIndexValue >= 0 ? students[editingIndexValue] : undefined;

    if (editingIndexValue >= 0) {
      nextStudents[editingIndexValue] = student;
    } else {
      nextStudents.push(student);
    }

    saveStudents(nextStudents);

    if (originalStudent) {
      const nextPayments = payments.map((payment) => {
        const isSameStudent =
          payment.nisn?.toString() === originalStudent.nisn?.toString() ||
          payment.nama?.toLowerCase() === originalStudent.nama?.toLowerCase();

        if (!isSameStudent) return payment;

        return {
          ...payment,
          nama: student.nama,
          kelas: student.kelas,
          nisn: student.nisn,
        };
      });

      savePayments(nextPayments);
    }

    setShowForm(false);
    setEditingIndex(null);
    setSearch("");
    setActiveMenu("siswa");

    alert(
      editingIndexValue >= 0
        ? "Data siswa berhasil diperbarui."
        : "Siswa baru berhasil ditambahkan."
    );
  };

  const handleSaveSppPrice = (e: any) => {
    e.preventDefault();

    const cleanValue = sppInput.replace(/\D/g, "");
    const newPrice = Number(cleanValue);

    if (!newPrice || newPrice < 1) {
      alert("Harga SPP tidak valid.");
      return;
    }

    setSppPrice(newPrice);
    setSppInput(String(newPrice));
    localStorage.setItem(STORAGE_SPP_PRICE, String(newPrice));

    alert("Harga SPP berhasil diperbarui.");
  };

  const handleVerifyPayment = (student: Student) => {
    const existingIndex = payments.findIndex(
      (payment) =>
        payment.nisn?.toString() === student.nisn?.toString() ||
        payment.nama?.toLowerCase() === student.nama?.toLowerCase()
    );

    const nextPayments = [...payments];

    if (existingIndex >= 0) {
      nextPayments[existingIndex] = {
        ...nextPayments[existingIndex],
        nama: student.nama,
        kelas: student.kelas,
        nisn: student.nisn,
        status: "paid",
        nominal: sppPrice,
      };
    } else {
      nextPayments.push({
        nama: student.nama,
        kelas: student.kelas,
        nisn: student.nisn,
        bulan: "Manual",
        status: "paid",
        nominal: sppPrice,
        createdAt: new Date().toISOString(),
      });
    }

    savePayments(nextPayments);
    alert(`Pembayaran ${student.nama} berhasil diverifikasi.`);
  };

  const handleSetUnpaid = (student: Student) => {
    const nextPayments = payments.map((payment) => {
      if (
        payment.nisn?.toString() === student.nisn?.toString() ||
        payment.nama?.toLowerCase() === student.nama?.toLowerCase()
      ) {
        return {
          ...payment,
          status: "unpaid",
        };
      }

      return payment;
    });

    savePayments(nextPayments);
    alert(`Status ${student.nama} dikembalikan menjadi belum bayar.`);
  };

  const handleVerifyFromPayment = (payment: Payment) => {
    const nextPayments = payments.map((p) => {
      if (
        p.nisn?.toString() === payment.nisn?.toString() &&
        p.bulan === payment.bulan
      ) {
        return { ...p, status: "paid" };
      }

      return p;
    });

    savePayments(nextPayments);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] font-bold text-[#06442e]">
        Memeriksa akses operator...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 h-screen w-[280px] shrink-0 bg-[#063d2b] px-5 py-6 text-white">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="mb-10 flex items-center gap-3">
                <img
                  src="/logo.jpeg"
                  alt="Logo"
                  className="h-12 w-12 rounded-2xl bg-white object-cover p-1"
                />
                <div>
                  <h1 className="text-2xl font-black">Operator</h1>
                  <p className="text-sm text-white/70">Masyarikul Anwar</p>
                </div>
              </div>

              <nav className="space-y-3">
                <OperatorMenu
                  active={activeMenu === "dashboard"}
                  label="Dashboard"
                  onClick={() => setActiveMenu("dashboard")}
                />
                <OperatorMenu
                  active={activeMenu === "siswa"}
                  label="Data Siswa"
                  onClick={() => setActiveMenu("siswa")}
                />
                <OperatorMenu
                  active={activeMenu === "pembayaran"}
                  label="Pembayaran"
                  onClick={() => setActiveMenu("pembayaran")}
                />
                <OperatorMenu
                  active={activeMenu === "harga"}
                  label="Harga SPP"
                  onClick={() => setActiveMenu("harga")}
                />
                <OperatorMenu
                  active={activeMenu === "rekap"}
                  label="Rekap"
                  onClick={() => setActiveMenu("rekap")}
                />
              </nav>
            </div>

            <div className="border-t border-white/15 pt-5">
              <p className="text-sm text-white/70">Login sebagai</p>
              <h3 className="mt-1 font-black">Admin Operator</h3>

              <button
                onClick={handleLogout}
                className="mt-4 h-11 w-full rounded-2xl bg-white/10 font-black transition hover:bg-white/20"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1 px-8 py-8">
          <header className="mb-6 rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center justify-between gap-5">
              <div>
                <span className="mb-3 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-700">
                  Panel Operator
                </span>
                <h1 className="text-3xl font-black text-[#063d2b]">
                  Dashboard Operator
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Kelola siswa, pembayaran, harga SPP, dan rekap pembayaran.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black hover:bg-slate-50"
                >
                  Cetak Rekap
                </button>
                <button
                  onClick={handleAdd}
                  className="h-11 rounded-2xl bg-[#063d2b] px-5 text-sm font-black text-white hover:bg-[#0b5a40]"
                >
                  Tambah Siswa
                </button>
              </div>
            </div>
          </header>

          <section className="mb-6 grid grid-cols-4 gap-5">
            <StatCard title="Total Siswa" value={students.length} />
            <StatCard title="Sudah Bayar" value={paidCount} green />
            <StatCard title="Menunggu" value={pendingCount} orange />
            <StatCard title="Belum Bayar" value={unpaidCount} red />
          </section>

          <section className="mb-6 grid grid-cols-3 gap-5">
            <MoneyCard title="Harga SPP Aktif" value={formatRupiah(sppPrice)} />
            <MoneyCard
              title="Total Terbayar"
              value={formatRupiah(totalTerbayar)}
              green
            />
            <MoneyCard
              title="Belum Terbayar"
              value={formatRupiah(totalBelumTerbayar)}
              red
            />
          </section>

          <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-5">
              <div>
                <h2 className="text-2xl font-black">
                  {activeMenu === "dashboard" && "Ringkasan Data"}
                  {activeMenu === "siswa" && "Kelola Data Siswa"}
                  {activeMenu === "pembayaran" && "Data Pembayaran"}
                  {activeMenu === "harga" && "Pengaturan Harga SPP"}
                  {activeMenu === "rekap" && "Rekap Pembayaran"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Cari siswa berdasarkan nama, kelas, atau NISN.
                </p>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, kelas, atau NISN..."
                className="h-12 w-[340px] rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#063d2b]"
              />
            </div>
          </section>

          {showForm && (
            <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">
                    {editingIndex !== null ? "Edit Siswa" : "Tambah Siswa"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Lengkapi data siswa dengan benar.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingIndex(null);
                  }}
                  className="rounded-2xl bg-red-100 px-5 py-3 text-sm font-black text-red-600"
                >
                  Tutup
                </button>
              </div>

              <form
                key={editingIndex ?? "new"}
                onSubmit={handleSaveStudent}
                className="grid grid-cols-3 gap-5"
              >
                <FormInput
                  label="Nama Siswa"
                  name="nama"
                  defaultValue={editingStudent?.nama || ""}
                  required
                />
                <FormInput
                  label="Kelas"
                  name="kelas"
                  defaultValue={editingStudent?.kelas || ""}
                  required
                />
                <FormInput
                  label="NISN"
                  name="nisn"
                  defaultValue={editingStudent?.nisn || ""}
                  required
                />
                <FormInput
                  label="Password"
                  name="password"
                  defaultValue={editingStudent?.password || ""}
                  required
                />
                <FormInput
                  label="TTL"
                  name="ttl"
                  defaultValue={editingStudent?.ttl || ""}
                />

                <label className="text-sm font-bold text-slate-600">
                  Jenis Kelamin
                  <select
                    name="jk"
                    defaultValue={editingStudent?.jk || ""}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none"
                  >
                    <option value="">Pilih jenis kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </label>

                <div className="col-span-3">
                  <button
                    type="submit"
                    className="h-12 rounded-2xl bg-[#063d2b] px-6 font-black text-white"
                  >
                    Simpan Data
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeMenu === "harga" && (
            <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black">Pengaturan Harga SPP</h2>
              <p className="mt-2 text-sm text-slate-500">
                Jika harga SPP diubah, halaman siswa akan ikut berubah.
              </p>

              <form
                onSubmit={handleSaveSppPrice}
                className="mt-6 flex max-w-[620px] items-end gap-4"
              >
                <label className="flex-1 text-sm font-bold text-slate-600">
                  Harga SPP Baru
                  <input
                    value={sppInput}
                    onChange={(e) => setSppInput(e.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#063d2b]"
                  />
                </label>

                <button
                  type="submit"
                  className="h-12 rounded-2xl bg-[#063d2b] px-6 font-black text-white"
                >
                  Simpan Harga
                </button>
              </form>
            </section>
          )}

          {(activeMenu === "dashboard" || activeMenu === "siswa") && (
            <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">Data Siswa</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Tambah, edit, hapus, dan verifikasi pembayaran siswa.
                  </p>
                </div>

                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
                  {filteredStudents.length} Data
                </span>
              </div>

              <StudentTable
                students={filteredStudents}
                getStatus={getStatus}
                getPaymentByStudent={getPaymentByStudent}
                sppPrice={sppPrice}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onVerify={handleVerifyPayment}
                onSetUnpaid={handleSetUnpaid}
                onViewProof={setProofModal}
              />
            </section>
          )}

          {activeMenu === "pembayaran" && (
            <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">Data Pembayaran</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Lihat status pembayaran dan bukti pembayaran siswa.
                  </p>
                </div>

                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
                  {filteredPayments.length} Transaksi
                </span>
              </div>

              {loadingPayments ? (
                <EmptyState text="Memuat data pembayaran..." />
              ) : filteredPayments.length > 0 ? (
                <PaymentTable
                  payments={filteredPayments}
                  sppPrice={sppPrice}
                  onViewProof={setProofModal}
                  onVerify={handleVerifyFromPayment}
                />
              ) : (
                <EmptyState text="Belum ada pembayaran siswa." />
              )}
            </section>
          )}

          {activeMenu === "rekap" && (
            <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-black">Rekap Pembayaran</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Rekap ini dapat dicetak sebagai laporan operator.
                </p>
              </div>

              <div className="mb-6 grid grid-cols-3 gap-4">
                <RekapBox title="Total Tagihan" value={formatRupiah(totalTagihan)} />
                <RekapBox title="Sudah Bayar" value={String(paidCount)} />
                <RekapBox title="Belum Bayar" value={String(unpaidCount)} />
              </div>

              <RekapStudentCards
                students={filteredStudents}
                getStatus={getStatus}
                getPaymentByStudent={getPaymentByStudent}
                getNominal={() => sppPrice}
                onViewProof={setProofModal}
              />
            </section>
          )}
        </section>
      </div>

      {proofModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6"
          onClick={() => setProofModal(null)}
        >
          <div
            className="max-h-[88vh] w-full max-w-[760px] overflow-auto rounded-[28px] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#063d2b]">
                  Bukti Pembayaran
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {proofModal.nama} - {proofModal.bulan}
                </p>
              </div>

              <button
                onClick={() => setProofModal(null)}
                className="rounded-2xl bg-red-100 px-5 py-3 text-sm font-black text-red-600"
              >
                Tutup
              </button>
            </div>

            {proofModal.proof ? (
              <img
                src={proofModal.proof}
                alt="Bukti Pembayaran"
                className="max-h-[65vh] w-full rounded-2xl border border-slate-200 object-contain"
              />
            ) : (
              <EmptyState text="Bukti pembayaran tidak tersedia." />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function OperatorMenu({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-12 w-full rounded-2xl px-5 text-left font-black transition ${
        active ? "bg-white text-[#063d2b]" : "text-white/80 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({
  title,
  value,
  green,
  orange,
  red,
}: {
  title: string;
  value: number;
  green?: boolean;
  orange?: boolean;
  red?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-black text-slate-500">{title}</p>
      <h2
        className={`mt-3 text-4xl font-black ${
          red
            ? "text-red-600"
            : orange
            ? "text-orange-500"
            : green
            ? "text-emerald-600"
            : "text-[#063d2b]"
        }`}
      >
        {value}
      </h2>
    </div>
  );
}

function MoneyCard({
  title,
  value,
  green,
  red,
}: {
  title: string;
  value: string;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] p-6 text-white shadow-sm ${
        red ? "bg-red-800" : green ? "bg-emerald-700" : "bg-[#063d2b]"
      }`}
    >
      <p className="text-sm font-black text-white/75">{title}</p>
      <h2 className="mt-4 text-3xl font-black">{value}</h2>
    </div>
  );
}

function FormInput({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: any;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-bold text-slate-600">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#063d2b]"
      />
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeStatus(status);

  const label =
    normalized === "paid"
      ? "Sudah Bayar"
      : normalized === "pending"
      ? "Menunggu"
      : "Belum Bayar";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
        normalized === "paid"
          ? "bg-emerald-100 text-emerald-700"
          : normalized === "pending"
          ? "bg-orange-100 text-orange-700"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {label}
    </span>
  );
}

function StudentTable({
  students,
  getStatus,
  getPaymentByStudent,
  sppPrice,
  onEdit,
  onDelete,
  onVerify,
  onSetUnpaid,
  onViewProof,
  printMode,
}: {
  students: Student[];
  getStatus: (student: Student) => string;
  getPaymentByStudent: (student: Student) => Payment | undefined;
  sppPrice: number;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onVerify: (student: Student) => void;
  onSetUnpaid: (student: Student) => void;
  onViewProof: (payment: Payment) => void;
  printMode?: boolean;
}) {
  if (students.length === 0) {
    return <EmptyState text="Data siswa tidak ditemukan." />;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="w-full border-collapse bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-4 text-left text-sm font-black text-slate-500">Nama</th>
            <th className="p-4 text-left text-sm font-black text-slate-500">Kelas</th>
            <th className="p-4 text-left text-sm font-black text-slate-500">NISN</th>
            <th className="p-4 text-left text-sm font-black text-slate-500">Nominal</th>
            <th className="p-4 text-left text-sm font-black text-slate-500">Status</th>
            <th className="p-4 text-left text-sm font-black text-slate-500">Bukti</th>
            {!printMode && (
              <th className="p-4 text-left text-sm font-black text-slate-500">Aksi</th>
            )}
          </tr>
        </thead>

        <tbody>
          {students.map((student, index) => {
            const status = getStatus(student);
            const payment = getPaymentByStudent(student);

            return (
              <tr key={index} className="border-t border-slate-100">
                <td className="p-4 font-black">{student.nama}</td>
                <td className="p-4">{student.kelas}</td>
                <td className="p-4">{student.nisn}</td>
                <td className="p-4">{formatRupiah(sppPrice)}</td>
                <td className="p-4">
                  <StatusBadge status={status} />
                </td>
                <td className="p-4">
                  {payment?.proof ? (
                    <button
                      onClick={() => onViewProof(payment)}
                      className="rounded-xl bg-sky-100 px-4 py-2 text-xs font-black text-sky-700"
                    >
                      Lihat Bukti
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">
                      Belum ada
                    </span>
                  )}
                </td>

                {!printMode && (
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onEdit(student)}
                        className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(student)}
                        className="rounded-xl bg-red-100 px-3 py-2 text-xs font-black text-red-700"
                      >
                        Hapus
                      </button>

                      {status === "paid" ? (
                        <button
                          onClick={() => onSetUnpaid(student)}
                          className="rounded-xl bg-orange-100 px-3 py-2 text-xs font-black text-orange-700"
                        >
                          Jadikan Belum
                        </button>
                      ) : (
                        <button
                          onClick={() => onVerify(student)}
                          className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700"
                        >
                          Verifikasi
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PaymentTable({
  payments,
  sppPrice,
  onViewProof,
  onVerify,
}: {
  payments: Payment[];
  sppPrice: number;
  onViewProof: (payment: Payment) => void;
  onVerify: (payment: Payment) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="w-full border-collapse bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-4 text-left text-sm font-black text-slate-500">Nama</th>
            <th className="p-4 text-left text-sm font-black text-slate-500">Kelas</th>
            <th className="p-4 text-left text-sm font-black text-slate-500">Bulan</th>
            <th className="p-4 text-left text-sm font-black text-slate-500">Nominal</th>
            <th className="p-4 text-left text-sm font-black text-slate-500">Status</th>
            <th className="p-4 text-left text-sm font-black text-slate-500">Bukti</th>
            <th className="p-4 text-left text-sm font-black text-slate-500">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment, index) => (
            <tr key={index} className="border-t border-slate-100">
              <td className="p-4 font-black">{payment.nama}</td>
              <td className="p-4">{payment.kelas}</td>
              <td className="p-4">{payment.bulan}</td>
              <td className="p-4">{formatRupiah(payment.nominal || sppPrice)}</td>
              <td className="p-4">
                <StatusBadge status={payment.status || "pending"} />
              </td>
              <td className="p-4">
                {payment.proof ? (
                  <button
                    onClick={() => onViewProof(payment)}
                    className="rounded-xl bg-sky-100 px-4 py-2 text-xs font-black text-sky-700"
                  >
                    Lihat Bukti
                  </button>
                ) : (
                  <span className="text-xs font-bold text-slate-400">
                    Belum ada
                  </span>
                )}
              </td>
              <td className="p-4">
                {normalizeStatus(payment.status) !== "paid" ? (
                  <button
                    onClick={() => onVerify(payment)}
                    className="rounded-xl bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-700"
                  >
                    Verifikasi
                  </button>
                ) : (
                  <span className="text-xs font-black text-emerald-700">
                    Selesai
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RekapStudentCards({
  students,
  getStatus,
  getPaymentByStudent,
  getNominal,
  onViewProof,
}: {
  students: Student[];
  getStatus: (student: Student) => string;
  getPaymentByStudent: (student: Student) => Payment | undefined;
  getNominal: (student: Student) => number;
  onViewProof: (payment: Payment) => void;
}) {
  if (students.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center font-bold text-slate-500">
        Data siswa tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 overflow-y-auto rounded-2xl border border-slate-100 p-2 md:grid-cols-2 xl:grid-cols-3">
      {students.map((student, index) => {
        const status = getStatus(student);
        const payment = getPaymentByStudent(student);

        return (
          <div
            key={index}
            className="flex h-full flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            <div>
              <p className="text-sm font-black text-slate-900 truncate">{student.nama}</p>
              <p className="text-xs text-slate-500">NISN: {student.nisn}</p>

              <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Kelas</p>
                  <p className="text-sm font-black text-slate-900">{student.kelas}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Nominal</p>
                  <p className="text-sm font-black text-slate-900">{formatRupiah(getNominal(student))}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={status} />
              {payment?.proof ? (
                <button
                  onClick={() => onViewProof(payment)}
                  className="rounded-xl bg-sky-100 px-3 py-2 text-xs font-black text-sky-700"
                >
                  Lihat Bukti
                </button>
              ) : (
                <span className="text-xs font-bold text-slate-400">
                  Belum ada
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RekapBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <h3 className="mt-2 text-lg font-black text-slate-900">{value}</h3>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center font-bold text-slate-500">
      {text}
    </div>
  );
}