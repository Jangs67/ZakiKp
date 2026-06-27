"use client";

import { useEffect, useState } from "react";
import {
  User,
  Wallet,
  School,
  CalendarDays,
  LogOut,
  Bell,
  UploadCloud,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Bill = {
  bulan: string;
  status: string;
  file: File | null;
  fileName?: string;
  reason?: string;
};

type ScheduleItem = {
  hari: string;
  jam: string;
  mapel: string;
};

type BankItem = {
  nama: string;
  nomor: string;
  pemilik: string;
};

type SchoolProfile = {
  nama: string;
  deskripsi: string;
  foto1: string;
  foto2: string;
  foto3: string;
};

type ClassPrices = Record<string, number>;
type ClassSchedules = Record<string, ScheduleItem[]>;

const STORAGE_CLASS_PRICES = "operator_class_prices";
const STORAGE_CLASS_SCHEDULES = "operator_class_schedules";
const STORAGE_SPP_PRICE = "operator_spp_price";
const STORAGE_BANKS = "operator_banks";
const STORAGE_SCHOOL_PROFILE = "operator_school_profile";

const DEMO_PAYMENTS_KEY = "demo_payments";

const DEFAULT_CLASS_PRICES: ClassPrices = {
  "Kelas 1": 150000,
  "Kelas 2": 160000,
  "Kelas 3": 170000,
  "Kelas 4": 180000,
  "Kelas 5": 190000,
  "Kelas 6": 200000,
};

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { hari: "Senin", jam: "07:00 - 08:00", mapel: "Matematika" },
  { hari: "Senin", jam: "08:00 - 09:00", mapel: "Bahasa Indonesia" },
  { hari: "Selasa", jam: "07:00 - 08:00", mapel: "IPA" },
];

const DEFAULT_CLASS_SCHEDULES: ClassSchedules = {
  "Kelas 1": DEFAULT_SCHEDULE,
  "Kelas 2": DEFAULT_SCHEDULE,
  "Kelas 3": DEFAULT_SCHEDULE,
  "Kelas 4": DEFAULT_SCHEDULE,
  "Kelas 5": DEFAULT_SCHEDULE,
  "Kelas 6": DEFAULT_SCHEDULE,
};

const DEFAULT_BANKS: BankItem[] = [
  {
    nama: "BCA",
    nomor: "123456",
    pemilik: "Madrasah Masyarikul Anwar",
  },
  {
    nama: "Mandiri",
    nomor: "987654",
    pemilik: "Madrasah Masyarikul Anwar",
  },
  {
    nama: "BRI",
    nomor: "112233",
    pemilik: "Madrasah Masyarikul Anwar",
  },
];

const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  nama: "Madrasah Ibtidaiah Masyarikul Anwar",
  deskripsi:
    "Sekolah ini bertujuan untuk mewujudkan peserta didik yang berakhlak mulia, cerdas, dan berwawasan Islami.",
  foto1: "/lorong.jpeg",
  foto2: "/kelas.jpeg",
  foto3: "/lapangan.jpeg",
};

const DEFAULT_BILLS: Bill[] = [
  { bulan: "Januari", status: "Belum Bayar", file: null },
  { bulan: "Februari", status: "Belum Bayar", file: null },
  { bulan: "Maret", status: "Belum Bayar", file: null },
  { bulan: "April", status: "Belum Bayar", file: null },
  { bulan: "Mei", status: "Belum Bayar", file: null },
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getClassKey(kelas?: string | number) {
  const text = String(kelas || "").toLowerCase();
  const match = text.match(/[1-6]/);

  if (!match) return "Kelas 1";

  return `Kelas ${match[0]}`;
}

function getSppPriceByClass(classPrices: ClassPrices, kelas?: string | number) {
  const key = getClassKey(kelas);
  return classPrices[key] || DEFAULT_CLASS_PRICES[key] || 150000;
}

export default function Dashboard() {
  const [menu, setMenu] = useState("profilSekolah");
  const [user, setUser] = useState<any>(null);

  const [classPrices, setClassPrices] =
    useState<ClassPrices>(DEFAULT_CLASS_PRICES);

  const [classSchedules, setClassSchedules] =
    useState<ClassSchedules>(DEFAULT_CLASS_SCHEDULES);

  const [banks, setBanks] = useState<BankItem[]>(DEFAULT_BANKS);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(
    DEFAULT_SCHOOL_PROFILE
  );

  const router = useRouter();

  const studentClass = getClassKey(user?.kelas);
  const studentSppPrice = user
    ? getSppPriceByClass(classPrices, user.kelas)
    : DEFAULT_CLASS_PRICES["Kelas 1"];

  const studentSchedule =
    classSchedules[studentClass] ||
    DEFAULT_CLASS_SCHEDULES[studentClass] ||
    DEFAULT_SCHEDULE;

  useEffect(() => {
    const data = localStorage.getItem("user");

    if (!data) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(data);

    if (parsedUser.role === "operator" || parsedUser.username === "admin") {
      router.push("/operator");
      return;
    }

    setUser(parsedUser);
  }, []);

  useEffect(() => {
    const loadOperatorData = () => {
      const savedClassPrices = localStorage.getItem(STORAGE_CLASS_PRICES);
      const savedOldPrice = localStorage.getItem(STORAGE_SPP_PRICE);
      const savedClassSchedules = localStorage.getItem(STORAGE_CLASS_SCHEDULES);
      const savedBanks = localStorage.getItem(STORAGE_BANKS);
      const savedProfile = localStorage.getItem(STORAGE_SCHOOL_PROFILE);

      if (savedClassPrices) {
        setClassPrices({
          ...DEFAULT_CLASS_PRICES,
          ...safeJsonParse<ClassPrices>(savedClassPrices, DEFAULT_CLASS_PRICES),
        });
      } else if (savedOldPrice) {
        const oldPrice = Number(savedOldPrice) || DEFAULT_CLASS_PRICES["Kelas 1"];

        setClassPrices({
          "Kelas 1": oldPrice,
          "Kelas 2": oldPrice,
          "Kelas 3": oldPrice,
          "Kelas 4": oldPrice,
          "Kelas 5": oldPrice,
          "Kelas 6": oldPrice,
        });
      } else {
        setClassPrices(DEFAULT_CLASS_PRICES);
      }

      if (savedClassSchedules) {
        setClassSchedules({
          ...DEFAULT_CLASS_SCHEDULES,
          ...safeJsonParse<ClassSchedules>(
            savedClassSchedules,
            DEFAULT_CLASS_SCHEDULES
          ),
        });
      } else {
        setClassSchedules(DEFAULT_CLASS_SCHEDULES);
      }

      setBanks(safeJsonParse(savedBanks, DEFAULT_BANKS));
      setSchoolProfile(safeJsonParse(savedProfile, DEFAULT_SCHOOL_PROFILE));
    };

    loadOperatorData();

    window.addEventListener("focus", loadOperatorData);

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === STORAGE_CLASS_PRICES ||
        e.key === STORAGE_CLASS_SCHEDULES ||
        e.key === STORAGE_SPP_PRICE ||
        e.key === STORAGE_BANKS ||
        e.key === STORAGE_SCHOOL_PROFILE
      ) {
        loadOperatorData();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("focus", loadOperatorData);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const pageTitle =
    menu === "profilSekolah"
      ? "Profil Sekolah"
      : menu === "spp"
      ? "Pembayaran SPP"
      : menu === "jadwal"
      ? "Jadwal Pelajaran"
      : "Profil Siswa";

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-[260px] shrink-0 border-r border-slate-200 bg-white">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-100 px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <img
                    src="/logo.jpeg"
                    alt="Logo Madrasah"
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                </div>

                <div>
                  <h1 className="text-[18px] font-extrabold leading-tight text-[#06442e]">
                    Portal SPP
                  </h1>
                  <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                    Masyarikul Anwar
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-5">
              <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Menu
              </p>

              <div className="space-y-2">
                <MenuButton
                  active={menu === "profilSekolah"}
                  icon={<School size={18} />}
                  label="Profil Sekolah"
                  onClick={() => setMenu("profilSekolah")}
                />

                <MenuButton
                  active={menu === "spp"}
                  icon={<Wallet size={18} />}
                  label="Pembayaran SPP"
                  onClick={() => setMenu("spp")}
                />

                <MenuButton
                  active={menu === "jadwal"}
                  icon={<CalendarDays size={18} />}
                  label="Jadwal"
                  onClick={() => setMenu("jadwal")}
                />

                <MenuButton
                  active={menu === "profil"}
                  icon={<User size={18} />}
                  label="Profil"
                  onClick={() => setMenu("profil")}
                />
              </div>
            </nav>

            <div className="border-t border-slate-100 p-4">
              <button
                onClick={logout}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-[#f5f7fb]/90 px-7 py-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[25px] font-extrabold leading-tight text-[#06442e]">
                  {pageTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Selamat datang, {user?.nama || "Siswa"}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50">
                  <Bell size={18} />
                </button>

                <button
                  onClick={() => setMenu("profil")}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:bg-slate-50"
                >
                  <div className="text-right">
                    <p className="text-sm font-extrabold leading-tight text-slate-800">
                      {user?.nama || "Siswa"}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-tight text-slate-500">
                      {user?.nisn || "NISN"}
                    </p>
                  </div>

                  <img
                    src="/user.png"
                    alt="Foto Profil"
                    className="h-10 w-10 rounded-full border-2 border-[#0b6b46] object-cover"
                  />
                </button>
              </div>
            </div>
          </header>

          <div className="px-7 py-7">
            <section className="mb-6 grid grid-cols-3 gap-5">
              <SummaryCard
                title={`Total Tagihan ${studentClass}`}
                value={formatRupiah(studentSppPrice * DEFAULT_BILLS.length)}
              />
              <SummaryCard
                title="SPP per Bulan"
                value={formatRupiah(studentSppPrice)}
              />
              <SummaryCard title="Tahun Ajaran" value="2025 / 2026" />
            </section>

            {menu === "profilSekolah" && (
              <ProfilSekolah schoolProfile={schoolProfile} />
            )}

            {menu === "spp" && (
              <SPPComponent
                user={user}
                sppPrice={studentSppPrice}
                banks={banks}
              />
            )}

            {menu === "jadwal" && (
              <JadwalKelas schedule={studentSchedule} kelas={studentClass} />
            )}

            {menu === "profil" && user && <Profil user={user} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function MenuButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-bold transition ${
        active
          ? "bg-[#06442e] text-white shadow-md shadow-emerald-950/10"
          : "text-slate-600 hover:bg-[#f5f7fb] hover:text-[#06442e]"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
          active ? "bg-white/15" : "bg-slate-100"
        }`}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function SummaryCard({
  title,
  value,
  warning,
}: {
  title: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <h3
        className={`mt-2 text-[24px] font-extrabold leading-tight ${
          warning ? "text-orange-500" : "text-[#06442e]"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}

function Profil({ user }: any) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
      <div className="h-20 bg-gradient-to-r from-[#06442e] to-[#0b6b46]" />

      <div className="px-7 pb-7">
        <div className="-mt-8 flex items-center gap-4 border-b border-slate-200 pb-5">
          <img
            src="/user.png"
            alt="Foto Profil"
            className="h-16 w-16 rounded-2xl border-4 border-white object-cover shadow-md"
          />

          <div>
            <h2 className="text-[22px] font-extrabold leading-tight text-slate-900">
              {user.nama}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Siswa Aktif
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-5">
          <InfoBox title="Kelas" value={user.kelas || "-"} />
          <InfoBox title="NISN" value={user.nisn || "-"} />
          <InfoBox title="TTL" value={user.ttl || "-"} />
          <InfoBox title="Jenis Kelamin" value={user.jk || "-"} />
        </div>
      </div>
    </section>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5">
      <p className="text-[13px] font-semibold text-slate-500">{title}</p>
      <h3 className="mt-1 text-[17px] font-extrabold text-slate-900">
        {value}
      </h3>
    </div>
  );
}

function SPPComponent({
  user,
  sppPrice,
  banks,
}: {
  user: any;
  sppPrice: number;
  banks: BankItem[];
}) {
  const [bills, setBills] = useState<Bill[]>(DEFAULT_BILLS);
  const [selectedBanks, setSelectedBanks] = useState<Record<string, string>>({});
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [bulkProofName, setBulkProofName] = useState("");

  const bankOptions = banks.length > 0 ? banks : DEFAULT_BANKS;

  useEffect(() => {
    if (!user) return;

    const loadPayments = () => {
      const savedPayments = localStorage.getItem(DEMO_PAYMENTS_KEY);
      const payments = safeJsonParse<any[]>(savedPayments, []);

      setBills((currentBills) =>
        currentBills.map((bill) => {
          const payment = payments.find(
            (p: any) =>
              p.nisn?.toString() === user.nisn?.toString() &&
              p.bulan === bill.bulan
          );

          if (!payment) {
            return {
              ...bill,
              status: "Belum Bayar",
              fileName: "",
              reason: "",
            };
          }

          let status = "Belum Bayar";

          if (payment.status === "paid" || payment.status === "Sudah Bayar") {
            status = "Sudah Bayar";
          } else if (
            payment.status === "pending" ||
            payment.status === "Menunggu Verifikasi"
          ) {
            status = "Menunggu Verifikasi";
          }

          return {
            ...bill,
            status,
            fileName: payment.proofName || "Bukti pembayaran",
            reason: payment.reason || "",
          };
        })
      );
    };

    loadPayments();

    window.addEventListener("focus", loadPayments);
    window.addEventListener("storage", loadPayments);

    return () => {
      window.removeEventListener("focus", loadPayments);
      window.removeEventListener("storage", loadPayments);
    };
  }, [user]);

  const getBankValue = (billMonth: string) => {
    if (selectedBanks[billMonth]) return selectedBanks[billMonth];

    const firstBank = bankOptions[0];

    if (!firstBank) return "";

    return `${firstBank.nama} - ${firstBank.nomor} - ${firstBank.pemilik}`;
  };

  const handleUpload = async (index: number, e: any) => {
    const fileInput = e.target as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      fileInput.value = "";
      return;
    }

    if (!user || user.role === "operator" || user.username === "admin") {
      alert("Akun operator tidak bisa upload bukti pembayaran siswa.");
      fileInput.value = "";
      return;
    }

    const selectedBank = getBankValue(bills[index].bulan);
    const selectedMonthsToUpload = selectedMonths.length > 0 ? selectedMonths : [bills[index].bulan];

    const formData = new FormData();
    formData.append("file", file);
    formData.append("nama", user.nama || "");
    formData.append("kelas", user.kelas || "");
    formData.append("nisn", user.nisn || "");
    selectedMonthsToUpload.forEach((month) => formData.append("bulan", month));
    formData.append("status", "pending");
    formData.append("bank", selectedBank);
    formData.append("nominal", String(sppPrice));

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        alert(error?.message || "Gagal upload bukti pembayaran.");
        fileInput.value = "";
        return;
      }

      const result = await response.json();
      const uploadedMonths: string[] = Array.isArray(result.bills)
        ? result.bills.map((bill: any) => bill.bulan)
        : [bills[index].bulan];

      const savedPayments = localStorage.getItem(DEMO_PAYMENTS_KEY);
      const payments = safeJsonParse<any[]>(savedPayments, []);

      const nextPayments = [...payments];

      for (const month of uploadedMonths) {
        const paymentData = {
          nama: user.nama || "",
          kelas: user.kelas || "",
          nisn: user.nisn || "",
          bulan: month,
          status: "pending",
          nominal: sppPrice,
          bank: selectedBank,
          proof: result.proof,
          proofName: file.name,
          createdAt: new Date().toISOString(),
        };

        const existingIndex = nextPayments.findIndex(
          (payment: any) =>
            payment.nisn?.toString() === user.nisn?.toString() &&
            payment.bulan === month
        );

        if (existingIndex >= 0) {
          nextPayments[existingIndex] = paymentData;
        } else {
          nextPayments.push(paymentData);
        }
      }

      localStorage.setItem(DEMO_PAYMENTS_KEY, JSON.stringify(nextPayments));

      setBills((currentBills) =>
        currentBills.map((bill) => {
          if (uploadedMonths.includes(bill.bulan)) {
            return {
              ...bill,
              status: "Menunggu Verifikasi",
              file: file,
              fileName: file.name,
            };
          }
          return bill;
        })
      );

      setBulkProofName(file.name);
      setSelectedMonths([]);
      fileInput.value = "";

      alert("Bukti pembayaran berhasil diupload. Menunggu verifikasi operator.");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Gagal membaca file bukti pembayaran.");
      fileInput.value = "";
    }
  };

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-[24px] font-extrabold text-[#06442e]">
          Pembayaran SPP
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Pilih bank lalu upload bukti pembayaran.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm font-medium text-slate-500">
          Bayar Beberapa Bulan Sekaligus
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEFAULT_BILLS.map((month) => (
            <label
              key={month.bulan}
              className="flex items-center gap-3 rounded-xl border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={selectedMonths.includes(month.bulan)}
                onChange={() => {
                  setSelectedMonths((current) =>
                    current.includes(month.bulan)
                      ? current.filter((item) => item !== month.bulan)
                      : [...current, month.bulan]
                  );
                }}
              />
              <span>{month.bulan}</span>
            </label>
          ))}
        </div>
        {selectedMonths.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Bukti akan digunakan untuk bulan: {selectedMonths.join(", ")}.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {bills.map((bill, i) => (
          <div
            key={i}
            className="rounded-[22px] border border-slate-200 bg-[#f8fafc] p-5"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Tagihan Bulan
                </p>
                <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                  {bill.bulan}
                </h3>
              </div>

              <StatusBadge status={bill.status} />
            </div>

            {bill.reason ? (
              <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold">Alasan:</p>
                <p>{bill.reason}</p>
              </div>
            ) : null}

            <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-700">
                Nominal SPP Bulan Ini
              </p>
              <h4 className="mt-1 text-xl font-extrabold text-[#06442e]">
                {formatRupiah(sppPrice)}
              </h4>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-slate-500">
                Pilih Bank
              </p>

              <select
                value={getBankValue(bill.bulan)}
                onChange={(e) =>
                  setSelectedBanks({
                    ...selectedBanks,
                    [bill.bulan]: e.target.value,
                  })
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#0b6b46]"
              >
                {bankOptions.map((bank, index) => (
                  <option
                    key={index}
                    value={`${bank.nama} - ${bank.nomor} - ${bank.pemilik}`}
                  >
                    {bank.nama} - {bank.nomor} a.n {bank.pemilik}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 text-center transition hover:border-[#0b6b46] hover:bg-emerald-50">
              <UploadCloud size={24} className="mb-2 text-[#0b6b46]" />

              <p className="text-sm font-bold text-slate-700">Upload Bukti</p>
              <p className="mt-1 text-xs text-slate-400">
                Klik untuk memilih file
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(i, e)}
                className="hidden"
              />

              {(bill.file || bill.fileName) && (
                <p className="mt-3 max-w-full truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {bill.file?.name || bill.fileName}
                </p>
              )}
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const paid = status === "Sudah Bayar";
  const waiting = status === "Menunggu Verifikasi";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${
        paid
          ? "bg-emerald-100 text-emerald-600"
          : waiting
          ? "bg-orange-100 text-orange-600"
          : "bg-red-100 text-red-600"
      }`}
    >
      {paid ? (
        <CheckCircle2 size={13} />
      ) : waiting ? (
        <Clock3 size={13} />
      ) : (
        <CheckCircle2 size={13} />
      )}
      {status}
    </span>
  );
}

function JadwalKelas({
  schedule,
  kelas,
}: {
  schedule: ScheduleItem[];
  kelas: string;
}) {
  const dayOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  const groupedSchedule = dayOrder
    .map((day) => ({
      day,
      items: schedule
        .filter((item) => item.hari === day)
        .map((item) => [item.jam, item.mapel]),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-[24px] font-extrabold text-[#06442e]">
          Jadwal Pelajaran {kelas}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Jadwal ini diatur oleh operator sesuai kelas siswa.
        </p>
      </div>

      {groupedSchedule.length > 0 ? (
        <div className="space-y-5">
          {groupedSchedule.map((group) => (
            <ScheduleDay
              key={group.day}
              day={group.day}
              items={group.items}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-[#f8fafc] p-8 text-center font-bold text-slate-500">
          Jadwal belum diatur oleh operator.
        </div>
      )}
    </section>
  );
}

function ScheduleDay({ day, items }: { day: string; items: string[][] }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-[#f8fafc] p-5">
      <h3 className="mb-4 text-lg font-extrabold text-slate-900">{day}</h3>

      <div className="grid grid-cols-3 gap-3">
        {items.map((item, index) => (
          <div
            key={index}
            className={`rounded-2xl border p-4 ${
              index === 0
                ? "border-[#06442e] bg-[#06442e] text-white"
                : "border-slate-200 bg-white text-slate-800"
            }`}
          >
            <p
              className={`text-xs ${
                index === 0 ? "text-white/75" : "text-slate-500"
              }`}
            >
              {item[0]}
            </p>
            <h4 className="mt-1 font-bold">{item[1]}</h4>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilSekolah({
  schoolProfile,
}: {
  schoolProfile: SchoolProfile;
}) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-7">
        <span className="mb-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-[#0b6b46]">
          Profil Sekolah
        </span>

        <h2 className="text-[30px] font-extrabold leading-tight text-[#06442e]">
          {schoolProfile.nama}
        </h2>

        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          {schoolProfile.deskripsi}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <SchoolImage src={schoolProfile.foto1} title="Foto Sekolah 1" />
        <SchoolImage src={schoolProfile.foto2} title="Foto Sekolah 2" />
        <SchoolImage src={schoolProfile.foto3} title="Foto Sekolah 3" />
      </div>
    </section>
  );
}

function SchoolImage({ src, title }: { src: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
      <img
        src={src || "/logo.jpeg"}
        alt={title}
        className="h-[210px] w-full object-cover"
      />
      <div className="p-4">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
    </div>
  );
}