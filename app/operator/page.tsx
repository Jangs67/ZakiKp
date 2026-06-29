"use client";

import { useEffect, useMemo, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

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
  proofs?: string[];
  proofName?: string;
  proofNames?: string[];
  reason?: string;
  createdAt?: string;
  bank?: string;
  [key: string]: any;
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

const STORAGE_STUDENTS = "operator_students";
const STORAGE_CLASS_PRICES = "operator_class_prices";
const STORAGE_CLASS_SCHEDULES = "operator_class_schedules";
const STORAGE_SPP_PRICE = "operator_spp_price";
const STORAGE_BANKS = "operator_banks";
const STORAGE_SCHOOL_PROFILE = "operator_school_profile";
const DEMO_PAYMENTS_KEY = "demo_payments";
const ARCHIVED_PAYMENTS_KEY = "operator_archived_payments";

const CLASS_OPTIONS = [
  "Kelas 1",
  "Kelas 2",
  "Kelas 3",
  "Kelas 4",
  "Kelas 5",
  "Kelas 6",
];

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

function getUktPriceByClass(classPrices: ClassPrices, kelas?: string | number) {
  const key = getClassKey(kelas);
  return classPrices[key] || DEFAULT_CLASS_PRICES[key] || 150000;
}

function normalizeStatus(status?: string) {
  if (status === "paid" || status === "Sudah Bayar") return "paid";
  if (status === "pending" || status === "Menunggu Verifikasi") return "pending";
  return "unpaid";
}

function isValidPayment(payment: Payment) {
  const namaValid = !!payment.nama && payment.nama !== "-";
  const kelasValid = !!payment.kelas && payment.kelas !== "-";
  const nisnValid = !!payment.nisn && payment.nisn !== "-";

  return namaValid && kelasValid && nisnValid;
}

function getProofSrc(proof?: string) {
  if (!proof) return "";
  if (proof.startsWith("data:")) return proof;
  if (proof.startsWith("http")) return proof;
  return `/uploads/${proof}`;
}

export default function OperatorPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [archivedPayments, setArchivedPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const [classPrices, setClassPrices] =
    useState<ClassPrices>(DEFAULT_CLASS_PRICES);

  const [classSchedules, setClassSchedules] =
    useState<ClassSchedules>(DEFAULT_CLASS_SCHEDULES);

  const [selectedClass, setSelectedClass] = useState("Kelas 1");
  const [selectedClassPrice, setSelectedClassPrice] = useState(
    String(DEFAULT_CLASS_PRICES["Kelas 1"])
  );

  const [banks, setBanks] = useState<BankItem[]>(DEFAULT_BANKS);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(
    DEFAULT_SCHOOL_PROFILE
  );

  const [scheduleForm, setScheduleForm] = useState<ScheduleItem>({
    hari: "",
    jam: "",
    mapel: "",
  });

  const [editingScheduleIndex, setEditingScheduleIndex] = useState<
    number | null
  >(null);

  const [bankForm, setBankForm] = useState<BankItem>({
    nama: "",
    nomor: "",
    pemilik: "",
  });

  const [editingBankIndex, setEditingBankIndex] = useState<number | null>(null);

  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [proofModal, setProofModal] = useState<Payment | null>(null);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/siswa");
      if (!response.ok) {
        console.warn("Gagal mengambil siswa dari DB", response.status);
        return;
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setStudents(data);
        localStorage.setItem(STORAGE_STUDENTS, JSON.stringify(data));
      }
    } catch (error) {
      console.warn("DB siswa load error", error);
    }
  };

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
    const savedClassPrices = localStorage.getItem(STORAGE_CLASS_PRICES);
    const savedOldPrice = localStorage.getItem(STORAGE_SPP_PRICE);
    const savedClassSchedules = localStorage.getItem(STORAGE_CLASS_SCHEDULES);
    const savedBanks = localStorage.getItem(STORAGE_BANKS);
    const savedProfile = localStorage.getItem(STORAGE_SCHOOL_PROFILE);

    if (savedStudents) {
      setStudents(safeJsonParse(savedStudents, [] as Student[]));
    } else {
      setStudents([]);
    }

    if (savedClassPrices) {
      const parsedPrices = safeJsonParse<ClassPrices>(
        savedClassPrices,
        DEFAULT_CLASS_PRICES
      );

      setClassPrices({
        ...DEFAULT_CLASS_PRICES,
        ...parsedPrices,
      });

      setSelectedClassPrice(
        String(parsedPrices["Kelas 1"] || DEFAULT_CLASS_PRICES["Kelas 1"])
      );
    } else if (savedOldPrice) {
      const oldPrice = Number(savedOldPrice) || DEFAULT_CLASS_PRICES["Kelas 1"];

      const samePriceForAllClasses: ClassPrices = {
        "Kelas 1": oldPrice,
        "Kelas 2": oldPrice,
        "Kelas 3": oldPrice,
        "Kelas 4": oldPrice,
        "Kelas 5": oldPrice,
        "Kelas 6": oldPrice,
      };

      setClassPrices(samePriceForAllClasses);
      setSelectedClassPrice(String(oldPrice));
      localStorage.setItem(
        STORAGE_CLASS_PRICES,
        JSON.stringify(samePriceForAllClasses)
      );
    } else {
      setClassPrices(DEFAULT_CLASS_PRICES);
      setSelectedClassPrice(String(DEFAULT_CLASS_PRICES["Kelas 1"]));
      localStorage.setItem(
        STORAGE_CLASS_PRICES,
        JSON.stringify(DEFAULT_CLASS_PRICES)
      );
    }

    if (savedClassSchedules) {
      const parsedSchedules = safeJsonParse<ClassSchedules>(
        savedClassSchedules,
        DEFAULT_CLASS_SCHEDULES
      );

      setClassSchedules({
        ...DEFAULT_CLASS_SCHEDULES,
        ...parsedSchedules,
      });
    } else {
      setClassSchedules(DEFAULT_CLASS_SCHEDULES);
      localStorage.setItem(
        STORAGE_CLASS_SCHEDULES,
        JSON.stringify(DEFAULT_CLASS_SCHEDULES)
      );
    }

    if (savedBanks) {
      setBanks(safeJsonParse(savedBanks, DEFAULT_BANKS));
    } else {
      setBanks(DEFAULT_BANKS);
      localStorage.setItem(STORAGE_BANKS, JSON.stringify(DEFAULT_BANKS));
    }

    if (savedProfile) {
      setSchoolProfile(safeJsonParse(savedProfile, DEFAULT_SCHOOL_PROFILE));
    } else {
      setSchoolProfile(DEFAULT_SCHOOL_PROFILE);
      localStorage.setItem(
        STORAGE_SCHOOL_PROFILE,
        JSON.stringify(DEFAULT_SCHOOL_PROFILE)
      );
    }

    setAuthorized(true);

    void fetchStudents();
  }, [router]);

  useEffect(() => {
    setSelectedClassPrice(
      String(classPrices[selectedClass] || DEFAULT_CLASS_PRICES[selectedClass])
    );

    setScheduleForm({
      hari: "",
      jam: "",
      mapel: "",
    });

    setEditingScheduleIndex(null);
  }, [selectedClass, classPrices]);

  useEffect(() => {
    if (!authorized) return;

    const loadPayments = () => {
      const savedPayments = localStorage.getItem(DEMO_PAYMENTS_KEY);
      const rawPayments = safeJsonParse<Payment[]>(savedPayments, []);

      const savedArchived = localStorage.getItem(ARCHIVED_PAYMENTS_KEY);
      const rawArchived = safeJsonParse<Payment[]>(savedArchived, []);

      const validPayments = Array.isArray(rawPayments)
        ? rawPayments.filter((payment) => isValidPayment(payment))
        : [];

      const validArchived = Array.isArray(rawArchived)
        ? rawArchived.filter((payment) => isValidPayment(payment))
        : [];

      const fixedPayments = validPayments.map((payment) => {
        const matchedStudent = students.find(
          (student) =>
            student.nisn?.toString() === payment.nisn?.toString() ||
            student.nama?.toLowerCase() === payment.nama?.toLowerCase()
        );

        return {
          ...payment,
          nama: payment.nama || matchedStudent?.nama || "",
          kelas: payment.kelas || matchedStudent?.kelas || "",
          nisn: payment.nisn || matchedStudent?.nisn || "",
          status: payment.status || "pending",
          proofs:
            payment.proofs && payment.proofs.length > 0
              ? payment.proofs
              : payment.proof
              ? [payment.proof]
              : [],
          nominal:
            payment.nominal ||
            getUktPriceByClass(classPrices, payment.kelas || matchedStudent?.kelas),
        };
      });

        const fixedArchivedPayments = validArchived.map((payment) => {
        const matchedStudent = students.find(
          (student) =>
            student.nisn?.toString() === payment.nisn?.toString() ||
            student.nama?.toLowerCase() === payment.nama?.toLowerCase()
        );

        return {
          ...payment,
          nama: payment.nama || matchedStudent?.nama || "",
          kelas: payment.kelas || matchedStudent?.kelas || "",
          nisn: payment.nisn || matchedStudent?.nisn || "",
          status: payment.status || "pending",
          nominal:
            payment.nominal ||
            getUktPriceByClass(classPrices, payment.kelas || matchedStudent?.kelas),
        };
      });

      const orphanPayments = fixedPayments.filter(
        (payment) => !hasStudentForPayment(payment)
      );
      const activePayments = fixedPayments.filter(hasStudentForPayment);
      const finalArchivedPayments = [...fixedArchivedPayments, ...orphanPayments];

      localStorage.setItem(DEMO_PAYMENTS_KEY, JSON.stringify(activePayments));
      localStorage.setItem(
        ARCHIVED_PAYMENTS_KEY,
        JSON.stringify(finalArchivedPayments)
      );
      setPayments(activePayments);
      setArchivedPayments(finalArchivedPayments);
      setLoadingPayments(false);
    };

    loadPayments();

    window.addEventListener("focus", loadPayments);
    window.addEventListener("storage", loadPayments);

    return () => {
      window.removeEventListener("focus", loadPayments);
      window.removeEventListener("storage", loadPayments);
    };
  }, [authorized, students, classPrices]);

  const selectedSchedule = classSchedules[selectedClass] || [];

  const saveStudents = (nextStudents: Student[]) => {
    setStudents(nextStudents);
    localStorage.setItem(STORAGE_STUDENTS, JSON.stringify(nextStudents));
  };

  const hasStudentForPayment = (payment: Payment) => {
    return students.some((student) => matchStudentPayment(payment, student));
  };

  const savePayments = (nextPayments: Payment[]) => {
    const cleanPayments = nextPayments.filter((payment) =>
      isValidPayment(payment)
    );

    const activePayments = cleanPayments.filter(hasStudentForPayment);
    const orphanPayments = cleanPayments.filter((payment) => !hasStudentForPayment(payment));

    if (orphanPayments.length > 0) {
      saveArchivedPayments([...archivedPayments, ...orphanPayments]);
    }

    setPayments(activePayments);
    localStorage.setItem(DEMO_PAYMENTS_KEY, JSON.stringify(activePayments));
  };

  const saveArchivedPayments = (nextPayments: Payment[]) => {
    const cleanPayments = nextPayments.filter((payment) =>
      isValidPayment(payment)
    );

    setArchivedPayments(cleanPayments);
    localStorage.setItem(ARCHIVED_PAYMENTS_KEY, JSON.stringify(cleanPayments));
  };

  const saveClassPrices = (nextPrices: ClassPrices) => {
    setClassPrices(nextPrices);
    localStorage.setItem(STORAGE_CLASS_PRICES, JSON.stringify(nextPrices));
  };

  const saveClassSchedules = (nextSchedules: ClassSchedules) => {
    setClassSchedules(nextSchedules);
    localStorage.setItem(STORAGE_CLASS_SCHEDULES, JSON.stringify(nextSchedules));
  };

  const saveBanks = (nextBanks: BankItem[]) => {
    setBanks(nextBanks);
    localStorage.setItem(STORAGE_BANKS, JSON.stringify(nextBanks));
  };

  const saveSchoolProfile = (nextProfile: SchoolProfile) => {
    setSchoolProfile(nextProfile);
    localStorage.setItem(STORAGE_SCHOOL_PROFILE, JSON.stringify(nextProfile));
  };

  const cleanBrokenPayments = () => {
    const cleanPayments = payments.filter((payment) => isValidPayment(payment));
    const cleanArchived = archivedPayments.filter((payment) =>
      isValidPayment(payment)
    );

    savePayments(cleanPayments);
    saveArchivedPayments(cleanArchived);
    alert("Data pembayaran rusak berhasil dibersihkan.");
  };

  const matchStudentPayment = (payment: Payment, student: Student) => {
    return (
      payment.nisn?.toString() === student.nisn?.toString() ||
      payment.nama?.toLowerCase() === student.nama?.toLowerCase()
    );
  };

  const getPaymentsByStudent = (student: Student) => {
    return payments.filter((payment) => matchStudentPayment(payment, student));
  };

  const getPaymentByStudent = (student: Student) => {
    const list = getPaymentsByStudent(student);
    return (
      list.find(
        (payment) => payment.proof || (payment.proofs && payment.proofs.length > 0)
      ) || list[0]
    );
  };

  const getStatus = (student: Student) => {
    const list = getPaymentsByStudent(student);

    if (list.length === 0) return "unpaid";

    if (list.some((payment) => normalizeStatus(payment.status) === "pending")) {
      return "pending";
    }

    if (list.some((payment) => normalizeStatus(payment.status) === "paid")) {
      return "paid";
    }

    return "unpaid";
  };

  const getStudentNominal = (student: Student) => {
    return getUktPriceByClass(classPrices, student.kelas);
  };

  const getPaymentNominal = (payment: Payment) => {
    return payment.nominal || getUktPriceByClass(classPrices, payment.kelas);
  };

  const stats = useMemo(() => {
    const total = students.length;
    const paidStudents = students.filter((s) => getStatus(s) === "paid");
    const pendingStudents = students.filter((s) => getStatus(s) === "pending");
    const unpaidStudents = students.filter((s) => getStatus(s) === "unpaid");

    const totalTagihan = students.reduce(
      (sum, student) => sum + getStudentNominal(student),
      0
    );

    const totalTerbayar = paidStudents.reduce(
      (sum, student) => sum + getStudentNominal(student),
      0
    );

    const totalBelumBayar = [...pendingStudents, ...unpaidStudents].reduce(
      (sum, student) => sum + getStudentNominal(student),
      0
    );

    return {
      total,
      paid: paidStudents.length,
      pending: pendingStudents.length,
      unpaid: unpaidStudents.length,
      totalTagihan,
      totalTerbayar,
      totalBelumBayar,
    };
  }, [students, payments, classPrices]);

  const archivedStats = useMemo(() => {
    const paid = archivedPayments.filter(
      (payment) => normalizeStatus(payment.status) === "paid"
    ).length;
    const pending = archivedPayments.filter(
      (payment) => normalizeStatus(payment.status) === "pending"
    ).length;
    const unpaid = archivedPayments.filter(
      (payment) => normalizeStatus(payment.status) === "unpaid"
    ).length;

    const totalNominal = archivedPayments.reduce(
      (sum, payment) => sum + getPaymentNominal(payment),
      0
    );

    return {
      count: archivedPayments.length,
      paid,
      pending,
      unpaid,
      totalNominal,
    };
  }, [archivedPayments, classPrices]);

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

  const parseClassGroup = (kelas?: string) => {
    const value = String(kelas || "").trim().toUpperCase();
    const match = value.match(/^(\d+)([A-Z])?$/);
    return {
      grade: match ? `Kelas ${match[1]}` : "Lainnya",
      rombel: match ? match[2] || "Umum" : "Umum",
    };
  };

  const studentGroups = Object.values(
    filteredStudents.reduce((groups, student) => {
      const { grade, rombel } = parseClassGroup(student.kelas?.toString());
      const key = `${grade} - ${rombel}`;

      if (!groups[key]) {
        groups[key] = { grade, rombel, students: [] as Student[] };
      }

      groups[key].students.push(student);
      return groups;
    }, {} as Record<string, { grade: string; rombel: string; students: Student[] }>)
  ).sort((a, b) => {
    if (a.grade === b.grade) return a.rombel.localeCompare(b.rombel);
    return a.grade.localeCompare(b.grade);
  });


  const editingStudent =
    editingIndex !== null ? students[editingIndex] : undefined;

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
    const index = students.findIndex((s) => {
      if (student._id && s._id === student._id) return true;
      return s.nisn?.toString() === student.nisn?.toString();
    });

    if (index < 0) {
      alert("Data siswa tidak ditemukan.");
      return;
    }

    setEditingIndex(index);
    setShowForm(true);
    setActiveMenu("siswa");
  };

  const handleDelete = async (student: Student) => {
    const yakin = confirm(`Hapus data siswa ${student.nama}?`);

    if (!yakin) return;

    const studentId = student._id?.toString?.() || "";
    let apiDeleted = false;

    if (studentId) {
      try {
        const response = await fetch(`/api/siswa/${encodeURIComponent(studentId)}`, {
          method: "DELETE",
        });

        if (response.ok) {
          apiDeleted = true;
        } else {
          const payload = await response.json().catch(() => null);
          alert(payload?.message || "Gagal menghapus siswa dari database.");
          return;
        }
      } catch (error) {
        console.warn("DELETE SISWA ERROR:", error);
        alert("Gagal menghapus siswa dari database.");
        return;
      }
    }

    const nextStudents = students.filter((s) =>
      studentId
        ? s._id?.toString() !== studentId
        : s.nisn?.toString() !== student.nisn?.toString()
    );

    const paymentsToArchive = payments.filter((payment) =>
      matchStudentPayment(payment, student)
    );
    const nextPayments = payments.filter(
      (payment) => !matchStudentPayment(payment, student)
    );
    const nextArchivedPayments = [...archivedPayments, ...paymentsToArchive];

    saveStudents(nextStudents);
    savePayments(nextPayments);
    saveArchivedPayments(nextArchivedPayments);

    alert(`Siswa ${student.nama} berhasil dihapus.`);
  };

  const handleSaveStudent = async (e: any) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const passwordValue = form.get("password")?.toString().trim() || "";

    const student: Student = {
      nama: form.get("nama")?.toString().trim() || "",
      kelas: form.get("kelas")?.toString().trim() || "",
      nisn: form.get("nisn")?.toString().trim() || "",
      ttl: form.get("ttl")?.toString().trim() || "",
      jk: form.get("jk")?.toString().trim() || "",
      ...(passwordValue ? { password: passwordValue } : {}),
    };

    if (!student.nama || !student.kelas || !student.nisn || (!passwordValue && editingIndex === null)) {
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

    let nextStudents = [...students];
    let savedStudent: Student | null = null;
    let apiUpdated = false;

    if (editingIndex !== null && editingStudent?._id) {
      try {
        const response = await fetch(`/api/siswa/${editingStudent._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(student),
        });

        if (response.ok) {
          apiUpdated = true;
          savedStudent = await response.json();
          const sanitizedStudent = { ...savedStudent, password: "" };
          nextStudents[editingIndex] = { ...editingStudent, ...student, ...sanitizedStudent };
        } else {
          const payload = await response.json().catch(() => null);
          alert(payload?.message || "Gagal memperbarui siswa di database.");
          return;
        }
      } catch (error) {
        console.warn("UPDATE SISWA ERROR:", error);
        alert("Gagal memperbarui siswa di database.");
        return;
      }
    } else {
      if (!passwordValue) {
        alert("Password wajib diisi untuk siswa baru.");
        return;
      }

      const response = await fetch("/api/siswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        alert(payload?.message || "Gagal menyimpan siswa ke database.");
        return;
      }

      savedStudent = await response.json();
      const sanitizedStudent = { ...savedStudent, password: "" };
      nextStudents = [...nextStudents, { ...student, ...sanitizedStudent }];
    }

    if (savedStudent) {
      saveStudents(nextStudents);
    }

    setShowForm(false);
    setEditingIndex(null);
    setSearch("");
    setActiveMenu("siswa");

    alert(
      editingIndex !== null
        ? "Data siswa berhasil diperbarui."
        : "Siswa baru berhasil ditambahkan."
    );
  };

  const handleSaveSelectedClassPrice = (e: any) => {
    e.preventDefault();

    const cleanValue = selectedClassPrice.replace(/\D/g, "");
    const newPrice = Number(cleanValue);

    if (!newPrice || newPrice < 1) {
      alert("Harga UKT tidak valid.");
      return;
    }

    const nextPrices = {
      ...classPrices,
      [selectedClass]: newPrice,
    };

    saveClassPrices(nextPrices);

    alert(`Harga UKT ${selectedClass} berhasil diperbarui.`);
  };

  const handleSaveSchedule = (e: any) => {
    e.preventDefault();

    if (!scheduleForm.hari || !scheduleForm.jam || !scheduleForm.mapel) {
      alert("Hari, jam, dan mata pelajaran wajib diisi.");
      return;
    }

    const currentSchedule = classSchedules[selectedClass] || [];
    let nextSelectedSchedule = [...currentSchedule];

    if (editingScheduleIndex !== null) {
      nextSelectedSchedule[editingScheduleIndex] = scheduleForm;
    } else {
      nextSelectedSchedule.push(scheduleForm);
    }

    const nextSchedules = {
      ...classSchedules,
      [selectedClass]: nextSelectedSchedule,
    };

    saveClassSchedules(nextSchedules);

    setScheduleForm({
      hari: "",
      jam: "",
      mapel: "",
    });

    setEditingScheduleIndex(null);

    alert(
      editingScheduleIndex !== null
        ? `Jadwal ${selectedClass} berhasil diperbarui.`
        : `Jadwal ${selectedClass} berhasil ditambahkan.`
    );
  };

  const handleEditSchedule = (item: ScheduleItem, index: number) => {
    setScheduleForm(item);
    setEditingScheduleIndex(index);
  };

  const handleDeleteSchedule = (index: number) => {
    const yakin = confirm(`Hapus jadwal ${selectedClass} ini?`);

    if (!yakin) return;

    const currentSchedule = classSchedules[selectedClass] || [];
    const nextSelectedSchedule = currentSchedule.filter((_, i) => i !== index);

    const nextSchedules = {
      ...classSchedules,
      [selectedClass]: nextSelectedSchedule,
    };

    saveClassSchedules(nextSchedules);
  };

  const handleSaveBank = (e: any) => {
    e.preventDefault();

    if (!bankForm.nama || !bankForm.nomor || !bankForm.pemilik) {
      alert("Nama bank, nomor rekening, dan pemilik wajib diisi.");
      return;
    }

    let nextBanks = [...banks];

    if (editingBankIndex !== null) {
      nextBanks[editingBankIndex] = bankForm;
    } else {
      nextBanks.push(bankForm);
    }

    saveBanks(nextBanks);

    setBankForm({
      nama: "",
      nomor: "",
      pemilik: "",
    });

    setEditingBankIndex(null);

    alert(
      editingBankIndex !== null
        ? "Rekening berhasil diperbarui."
        : "Rekening berhasil ditambahkan."
    );
  };

  const handleEditBank = (item: BankItem, index: number) => {
    setBankForm(item);
    setEditingBankIndex(index);
  };

  const handleDeleteBank = (index: number) => {
    const yakin = confirm("Hapus rekening ini?");

    if (!yakin) return;

    const nextBanks = banks.filter((_, i) => i !== index);
    saveBanks(nextBanks);
  };

  const handleSaveSchoolProfile = (e: any) => {
    e.preventDefault();
    saveSchoolProfile(schoolProfile);
    alert("Profil sekolah berhasil diperbarui.");
  };

  const handleVerifyPayment = (student: Student) => {
    const studentPayments = getPaymentsByStudent(student);
    const studentNominal = getStudentNominal(student);

    let nextPayments = [...payments];

    if (studentPayments.length > 0) {
      nextPayments = nextPayments.map((payment) => {
        if (
          payment.nisn?.toString() === student.nisn?.toString() ||
          payment.nama?.toLowerCase() === student.nama?.toLowerCase()
        ) {
          return {
            ...payment,
            nama: student.nama,
            kelas: student.kelas,
            nisn: student.nisn,
            status: "paid",
            nominal: payment.nominal || studentNominal,
          };
        }

        return payment;
      });
    } else {
      nextPayments.push({
        nama: student.nama,
        kelas: student.kelas,
        nisn: student.nisn,
        bulan: "Manual",
        status: "paid",
        nominal: studentNominal,
        createdAt: new Date().toISOString(),
      });
    }

    savePayments(nextPayments);
    alert(`Pembayaran ${student.nama} berhasil diverifikasi.`);
  };

  const handleSetPaymentUnpaid = (payment: Payment) => {
    const reason = prompt(
      `Masukkan alasan kepada siswa kenapa bukti pembayaran bulan ${payment.bulan} dikembalikan:`
    );

    if (reason === null) return;

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      alert("Alasan harus diisi.");
      return;
    }

    const nextPayments = payments.map((item) =>
      item.nisn?.toString() === payment.nisn?.toString() && item.bulan === payment.bulan
        ? {
            ...item,
            status: "unpaid",
            reason: trimmedReason,
          }
        : item
    );

    savePayments(nextPayments);
    alert(`Pembayaran ${payment.nama} dikembalikan menjadi belum bayar.`);
  };

  const handleSetPaymentReason = (payment: Payment) => {
    const reason = prompt(
      `Masukkan alasan kepada siswa untuk status pembayaran bulan ${payment.bulan}:`
    );

    if (reason === null) return;

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      alert("Alasan harus diisi.");
      return;
    }

    const nextPayments = payments.map((item) =>
      item.nisn?.toString() === payment.nisn?.toString() && item.bulan === payment.bulan
        ? {
            ...item,
            reason: trimmedReason,
          }
        : item
    );

    savePayments(nextPayments);
    alert(`Alasan untuk pembayaran ${payment.nama} berhasil disimpan.`);
  };

  const handleVerifySinglePayment = (payment: Payment) => {
    const nextPayments = payments.map((item) => {
      if (
        item.nisn?.toString() === payment.nisn?.toString() &&
        item.bulan === payment.bulan
      ) {
        return {
          ...item,
          status: "paid",
        };
      }

      return item;
    });

    savePayments(nextPayments);
    alert("Pembayaran berhasil diverifikasi.");
  };

  const handlePrint = () => {
    window.print();
  };

  if (!authorized) {
    return (
      <main className="operator-loading">
        Memeriksa akses operator...
        <style jsx global>{operatorStyles}</style>
      </main>
    );
  }

  return (
    <main className="operator-root">
      <div className="operator-shell">
        <aside className="operator-sidebar">
          <div>
            <div className="operator-brand">
              <img src="/logo.jpeg" alt="Logo" />
              <div>
                <h1>Operator</h1>
                <p>Masyarikul Anwar</p>
              </div>
            </div>

            <nav className="operator-menu">
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
                active={activeMenu === "kelas"}
                label="Kelola Kelas"
                onClick={() => setActiveMenu("kelas")}
              />

              <OperatorMenu
                active={activeMenu === "pembayaran"}
                label="Pembayaran"
                onClick={() => setActiveMenu("pembayaran")}
              />

              <OperatorMenu
                active={activeMenu === "rekening"}
                label="Rekening"
                onClick={() => setActiveMenu("rekening")}
              />

              <OperatorMenu
                active={activeMenu === "profilSekolah"}
                label="Profil Sekolah"
                onClick={() => setActiveMenu("profilSekolah")}
              />

              <OperatorMenu
                active={activeMenu === "rekap"}
                label="Rekap"
                onClick={() => setActiveMenu("rekap")}
              />
            </nav>
          </div>

          <div className="operator-user">
            <p>Login sebagai</p>
            <h3>Admin Operator</h3>

            <button onClick={handleLogout}>Logout</button>
          </div>
        </aside>

        <section className="operator-content">
          <header className="operator-header">
            <div>
              <span>Panel Operator</span>
              <h1>Dashboard Operator</h1>
              <p>
                Kelola siswa, pembayaran, harga SPP per kelas, jadwal per kelas,
                rekening, dan profil sekolah.
              </p>
            </div>

            <div className="header-actions">
              <button className="danger-btn" onClick={cleanBrokenPayments}>
                Bersihkan Data Rusak
              </button>
              <button className="light-btn" onClick={handlePrint}>
                Cetak Rekap
              </button>
              <button className="dark-btn" onClick={handleAdd}>
                Tambah Siswa
              </button>
            </div>
          </header>

          <section className="stat-grid">
            <StatCard title="Total Siswa" value={stats.total} />
            <StatCard title="Sudah Bayar" value={stats.paid} tone="green" />
            <StatCard title="Menunggu" value={stats.pending} tone="orange" />
            <StatCard title="Belum Bayar" value={stats.unpaid} tone="red" />
          </section>

          <section className="money-grid">
            <MoneyCard
              title="Harga SPP"
              value={formatRupiah(
                classPrices[selectedClass] || DEFAULT_CLASS_PRICES[selectedClass]
              )}
            />
            <MoneyCard
              title="Total Terbayar"
              value={formatRupiah(stats.totalTerbayar)}
              tone="green"
            />
            <MoneyCard
              title="Belum Terbayar"
              value={formatRupiah(stats.totalBelumBayar)}
              tone="red"
            />
          </section>

          <section className="toolbar-card">
            <div>
              <h2>
                {activeMenu === "dashboard" && "Ringkasan Data"}
                {activeMenu === "siswa" && "Kelola Data Siswa"}
                {activeMenu === "kelas" && "Kelola Harga SPP dan Jadwal Per Kelas"}
                {activeMenu === "pembayaran" && "Data Pembayaran"}
                {activeMenu === "rekening" && "Pengaturan Rekening Pembayaran"}
                {activeMenu === "profilSekolah" && "Pengaturan Profil Sekolah"}
                {activeMenu === "rekap" && "Rekap Pembayaran"}
              </h2>
              <p>Data yang diubah operator akan dipakai di dashboard siswa.</p>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, kelas, NISN, atau pembayaran..."
            />
          </section>

          {showForm && (
            <section className="form-card">
              <div className="section-head">
                <div>
                  <h2>{editingIndex !== null ? "Edit Siswa" : "Tambah Siswa"}</h2>
                  <p>Lengkapi data siswa dengan benar.</p>
                </div>

                <button
                  className="danger-btn"
                  onClick={() => {
                    setShowForm(false);
                    setEditingIndex(null);
                  }}
                >
                  Tutup
                </button>
              </div>

              <form
                key={editingIndex ?? "new"}
                onSubmit={handleSaveStudent}
                className="student-form"
              >
                <FormInput
                  label="Nama Siswa"
                  name="nama"
                  defaultValue={editingStudent?.nama || ""}
                  required
                />

                <label className="form-label">
                  Kelas
                  <select
                    name="kelas"
                    defaultValue={getClassKey(editingStudent?.kelas)}
                    required
                  >
                    {CLASS_OPTIONS.map((kelas) => (
                      <option key={kelas} value={kelas}>
                        {kelas}
                      </option>
                    ))}
                  </select>
                </label>

                <FormInput
                  label="NISN"
                  name="nisn"
                  defaultValue={editingStudent?.nisn || ""}
                  required
                />

                <FormInput
                  label="Password"
                  name="password"
                  defaultValue=""
                  required={editingIndex === null}
                />
                {editingIndex !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    Biarkan kosong jika tidak ingin mengubah password.
                  </p>
                )}

                <FormInput
                  label="TTL"
                  name="ttl"
                  defaultValue={editingStudent?.ttl || ""}
                />

                <label className="form-label">
                  Jenis Kelamin
                  <select name="jk" defaultValue={editingStudent?.jk || ""}>
                    <option value="">Pilih jenis kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </label>

                <div className="form-submit">
                  <button type="submit" className="dark-btn">
                    Simpan Data
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeMenu === "kelas" && (
            <section className="panel-card">
              <div className="section-head">
                <div>
                  <h2>Kelola Kelas</h2>
                  <p>
                    Pilih kelas, lalu ubah harga SPP dan jadwal pelajaran untuk
                    kelas tersebut.
                  </p>
                </div>
              </div>

              <div className="class-tabs">
                {CLASS_OPTIONS.map((kelas) => (
                  <button
                    key={kelas}
                    className={selectedClass === kelas ? "active" : ""}
                    onClick={() => setSelectedClass(kelas)}
                  >
                    {kelas}
                  </button>
                ))}
              </div>

              <div className="class-panel">
                <div className="class-price-box">
                  <h3>Harga SPP {selectedClass}</h3>
                  <p>
                    Harga ini akan tampil hanya untuk siswa yang berada di{" "}
                    {selectedClass}.
                  </p>

                  <form onSubmit={handleSaveSelectedClassPrice} className="price-form">
                    <label>
                      Harga UKT / SPP
                      <input
                        value={selectedClassPrice}
                        onChange={(e) => setSelectedClassPrice(e.target.value)}
                        placeholder="Contoh: 150000"
                      />
                    </label>

                    <button type="submit" className="dark-btn">
                      Simpan Harga
                    </button>
                  </form>
                </div>

                <div className="class-schedule-box">
                  <h3>Jadwal {selectedClass}</h3>
                  <p>
                    Jadwal ini akan tampil hanya untuk siswa yang berada di{" "}
                    {selectedClass}.
                  </p>

                  <form onSubmit={handleSaveSchedule} className="student-form">
                    <label className="form-label">
                      Hari
                      <select
                        value={scheduleForm.hari}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            hari: e.target.value,
                          })
                        }
                      >
                        <option value="">Pilih hari</option>
                        <option value="Senin">Senin</option>
                        <option value="Selasa">Selasa</option>
                        <option value="Rabu">Rabu</option>
                        <option value="Kamis">Kamis</option>
                        <option value="Jumat">Jumat</option>
                        <option value="Sabtu">Sabtu</option>
                      </select>
                    </label>

                    <label className="form-label">
                      Jam
                      <input
                        value={scheduleForm.jam}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            jam: e.target.value,
                          })
                        }
                        placeholder="Contoh: 07:00 - 08:00"
                      />
                    </label>

                    <label className="form-label">
                      Mata Pelajaran
                      <input
                        value={scheduleForm.mapel}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            mapel: e.target.value,
                          })
                        }
                        placeholder="Contoh: Matematika"
                      />
                    </label>

                    <div className="form-submit form-actions">
                      <button type="submit" className="dark-btn">
                        {editingScheduleIndex !== null
                          ? "Update Jadwal"
                          : "Tambah Jadwal"}
                      </button>

                      {editingScheduleIndex !== null && (
                        <button
                          type="button"
                          className="light-btn"
                          onClick={() => {
                            setEditingScheduleIndex(null);
                            setScheduleForm({ hari: "", jam: "", mapel: "" });
                          }}
                        >
                          Batal Edit
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="table-space">
                    <ScheduleTable
                      schedule={selectedSchedule}
                      onEdit={handleEditSchedule}
                      onDelete={handleDeleteSchedule}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeMenu === "rekening" && (
            <section className="panel-card">
              <div className="section-head">
                <div>
                  <h2>Pengaturan Rekening Pembayaran</h2>
                  <p>
                    Rekening ini akan tampil di pilihan bank pada pembayaran
                    siswa.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveBank} className="student-form">
                <label className="form-label">
                  Nama Bank
                  <input
                    value={bankForm.nama}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, nama: e.target.value })
                    }
                    placeholder="Contoh: BCA"
                  />
                </label>

                <label className="form-label">
                  Nomor Rekening
                  <input
                    value={bankForm.nomor}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, nomor: e.target.value })
                    }
                    placeholder="Contoh: 123456789"
                  />
                </label>

                <label className="form-label">
                  Nama Pemilik
                  <input
                    value={bankForm.pemilik}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, pemilik: e.target.value })
                    }
                    placeholder="Contoh: Madrasah Masyarikul Anwar"
                  />
                </label>

                <div className="form-submit form-actions">
                  <button type="submit" className="dark-btn">
                    {editingBankIndex !== null
                      ? "Update Rekening"
                      : "Tambah Rekening"}
                  </button>

                  {editingBankIndex !== null && (
                    <button
                      type="button"
                      className="light-btn"
                      onClick={() => {
                        setEditingBankIndex(null);
                        setBankForm({ nama: "", nomor: "", pemilik: "" });
                      }}
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              </form>

              <div className="table-space">
                <BankTable
                  banks={banks}
                  onEdit={handleEditBank}
                  onDelete={handleDeleteBank}
                />
              </div>
            </section>
          )}

          {activeMenu === "profilSekolah" && (
            <section className="panel-card">
              <div className="section-head">
                <div>
                  <h2>Pengaturan Profil Sekolah</h2>
                  <p>
                    Profil ini akan tampil di menu Profil Sekolah pada dashboard
                    siswa.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveSchoolProfile} className="profile-form">
                <label className="form-label">
                  Nama Sekolah
                  <input
                    value={schoolProfile.nama}
                    onChange={(e) =>
                      setSchoolProfile({
                        ...schoolProfile,
                        nama: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="form-label full">
                  Deskripsi Sekolah
                  <textarea
                    value={schoolProfile.deskripsi}
                    onChange={(e) =>
                      setSchoolProfile({
                        ...schoolProfile,
                        deskripsi: e.target.value,
                      })
                    }
                    rows={5}
                  />
                </label>

                <FormImageInput
                  label="Foto 1"
                  value={schoolProfile.foto1}
                  onChange={(value) =>
                    setSchoolProfile({ ...schoolProfile, foto1: value })
                  }
                />

                <FormImageInput
                  label="Foto 2"
                  value={schoolProfile.foto2}
                  onChange={(value) =>
                    setSchoolProfile({ ...schoolProfile, foto2: value })
                  }
                />

                <FormImageInput
                  label="Foto 3"
                  value={schoolProfile.foto3}
                  onChange={(value) =>
                    setSchoolProfile({ ...schoolProfile, foto3: value })
                  }
                />

                <div className="form-submit">
                  <button type="submit" className="dark-btn">
                    Simpan Profil Sekolah
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeMenu === "siswa" && (
            <section className="panel-card">
              <div className="section-head">
                <div>
                  <h2>Data Siswa</h2>
                  <p>Daftar siswa spesifik berdasarkan kelas dan rombel.</p>
                </div>

                <span className="count-badge">{filteredStudents.length} Data</span>
              </div>

              {studentGroups.length === 0 ? (
                <EmptyState text="Data siswa tidak ditemukan." />
              ) : (
                studentGroups.map((group) => (
                  <div key={`${group.grade}-${group.rombel}`} className="student-group">
                    <div className="group-label">
                      <strong>{group.grade}</strong> · Rombel {group.rombel}
                    </div>
                    <StudentTable
                      students={group.students}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                ))
              )}
            </section>
          )}

          {activeMenu === "pembayaran" && (
            <section className="panel-card">
              <div className="section-head">
                <div>
                  <h2>Data Pembayaran</h2>
                  <p>Lihat status pembayaran dan bukti pembayaran siswa.</p>
                </div>

                <span className="count-badge">
                  {filteredPayments.length} Transaksi
                </span>
              </div>

              {loadingPayments ? (
                <EmptyState text="Memuat data pembayaran..." />
              ) : filteredPayments.length > 0 ? (
                <PaymentTable
                  payments={filteredPayments}
                  getNominal={getPaymentNominal}
                  onViewProof={setProofModal}
                  onVerify={handleVerifySinglePayment}
                  onSetUnpaid={handleSetPaymentUnpaid}
                  onSetReason={handleSetPaymentReason}
                />
              ) : (
                <EmptyState text="Belum ada pembayaran siswa. Upload bukti dari akun siswa terlebih dahulu." />
              )}
            </section>
          )}

          {activeMenu === "rekap" && (
            <section className="panel-card">
              <div className="section-head">
                <div>
                  <h2>Rekap Pembayaran</h2>
                  <p>Rekap ini dapat dicetak sebagai laporan operator.</p>
                </div>

                <button className="dark-btn" onClick={handlePrint}>
                  Cetak Sekarang
                </button>
              </div>

              <div className="rekap-grid">
                <RekapBox
                  title="Total Tagihan"
                  value={formatRupiah(stats.totalTagihan)}
                />
                <RekapBox title="Sudah Bayar" value={String(stats.paid)} />
                <RekapBox title="Belum Bayar" value={String(stats.unpaid)} />
              </div>

              <RekapStudentCards
                students={filteredStudents}
                getStatus={getStatus}
                getPaymentByStudent={getPaymentByStudent}
                getNominal={getStudentNominal}
                onViewProof={setProofModal}
              />

              {archivedPayments.length > 0 && (
                <section className="panel-card">
                  <div className="section-head">
                    <div>
                      <h2>Rekap Pembayaran Siswa Terhapus</h2>
                      <p>
                        Riwayat pembayaran siswa yang sudah dihapus tetap tersimpan sebagai arsip.
                      </p>
                    </div>
                  </div>

                  <div className="rekap-grid">
                    <RekapBox
                      title="Total Arsip Pembayaran"
                      value={String(archivedStats.count)}
                    />
                    <RekapBox
                      title="Total Nominal Arsip"
                      value={formatRupiah(archivedStats.totalNominal)}
                    />
                    <RekapBox
                      title="Sudah Bayar (Arsip)"
                      value={String(archivedStats.paid)}
                    />
                    <RekapBox
                      title="Belum Bayar (Arsip)"
                      value={String(archivedStats.unpaid)}
                    />
                  </div>

                  <div className="mt-8 space-y-4">
                    {archivedPayments.map((payment, index) => (
                      <div
                        key={`${payment.nisn || payment.nama}-${payment.bulan}-${index}`}
                        className="rounded-[24px] border border-slate-200 bg-white p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-500">
                              {payment.nama || "Siswa Keluar"}
                            </p>
                            <p className="mt-1 text-base font-black text-slate-900">
                              {payment.bulan || "Bulan tidak tersedia"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                              Keluar Sekolah
                            </span>
                            <StatusBadge status={payment.status || "pending"} />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[.2em] text-slate-400">
                              NISN
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-900">
                              {payment.nisn || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[.2em] text-slate-400">
                              Kelas
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-900">
                              {payment.kelas || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[.2em] text-slate-400">
                              Nominal
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-900">
                              {formatRupiah(getUktPriceByClass(classPrices, payment.kelas))}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          {payment.proof || (payment.proofs && payment.proofs.length > 0) ? (
                            <button
                              onClick={() => setProofModal(payment)}
                              className="rounded-xl bg-sky-100 px-4 py-2 text-xs font-black text-sky-700"
                            >
                              Lihat Bukti
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              Belum ada bukti
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </section>
          )}
        </section>
      </div>

      {proofModal && (
        <div className="modal-backdrop" onClick={() => setProofModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="section-head">
              <div>
                <h2>Bukti Pembayaran</h2>
                <p>
                  {proofModal.nama} - {proofModal.bulan || "Pembayaran"}
                </p>
              </div>

              <button className="danger-btn" onClick={() => setProofModal(null)}>
                Tutup
              </button>
            </div>

            {proofModal.proofs?.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {proofModal.proofs.map((src, index) => (
                  <img
                    key={index}
                    src={getProofSrc(src)}
                    alt={`Bukti Pembayaran ${index + 1}`}
                    className="proof-image"
                  />
                ))}
              </div>
            ) : proofModal.proof ? (
              <img
                src={getProofSrc(proofModal.proof)}
                alt="Bukti Pembayaran"
                className="proof-image"
              />
            ) : (
              <EmptyState text="Bukti pembayaran tidak tersedia." />
            )}
          </div>
        </div>
      )}

      <style jsx global>{operatorStyles}</style>
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
    <button className={`op-menu-btn ${active ? "active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

function StatCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone?: "green" | "orange" | "red";
}) {
  return (
    <div className="stat-card">
      <p>{title}</p>
      <h2 className={tone || ""}>{value}</h2>
    </div>
  );
}

function MoneyCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone?: "green" | "red";
}) {
  return (
    <div className={`money-card ${tone || ""}`}>
      <p>{title}</p>
      <h2>{value}</h2>
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
    <label className="form-label">
      {label}
      <input name={name} defaultValue={defaultValue} required={required} />
    </label>
  );
}

function FormImageInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [preview, setPreview] = useState<string>("");
  const [inputMode, setInputMode] = useState<"file" | "url">("file");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "schoolProfile");

    try {
      const res = await fetch("/api/upload-profile", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.fileName) {
        onChange(`/uploads/${data.fileName}`);
      }
    } catch (err) {
      console.error("Upload gagal:", err);
      alert("Gagal upload file");
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    if (url.startsWith("http")) {
      setPreview(url);
    }
  };

  return (
    <label className="form-label image-input-container">
      <div className="image-input-header">
        {label}
        <div className="input-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${inputMode === "file" ? "active" : ""}`}
            onClick={() => setInputMode("file")}
          >
            📁 File
          </button>
          <button
            type="button"
            className={`mode-btn ${inputMode === "url" ? "active" : ""}`}
            onClick={() => setInputMode("url")}
          >
            🔗 URL
          </button>
        </div>
      </div>

      {inputMode === "file" ? (
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="Contoh: https://example.com/image.jpg atau /uploads/image.jpg"
          className="url-input"
        />
      )}

      {preview && (
        <div className="image-preview">
          <img src={preview} alt={label} />
        </div>
      )}
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

  return <span className={`status-badge ${normalized}`}>{label}</span>;
}

function StudentTable({
  students,
  onEdit,
  onDelete,
}: {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}) {
  if (students.length === 0) {
    return <EmptyState text="Data siswa tidak ditemukan." />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Kelas</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={index}>
              <td className="student-name" title={student.nama}>
                <div className="name-main">{student.nama}</div>
                <div className="student-meta">{student.nisn || "-"}</div>
              </td>
              <td className="kelas-cell">{student.kelas}</td>
              <td>
                <div className="row-actions">
                  <button type="button" onClick={() => onEdit(student)}>
                    Edit
                  </button>
                  <button type="button" className="red" onClick={() => onDelete(student)}>
                    Hapus
                  </button>
                </div>
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
    return <EmptyState text="Data siswa tidak ditemukan." />;
  }

  return (
    <div className="rekap-card-grid">
      {students.map((student, index) => {
        const status = getStatus(student);
        const payment = getPaymentByStudent(student);

        return (
          <div key={index} className="rekap-card">
            <div className="rekap-card-header">
              <div>
                <div className="rekap-card-name" title={student.nama}>
                  {student.nama}
                </div>
                <div className="rekap-card-subtitle">
                  NISN: {student.nisn || "-"}
                </div>
              </div>

              <StatusBadge status={status} />
            </div>

            <div className="rekap-card-body">
              <div className="rekap-card-field">
                <span className="rekap-card-field-label">Kelas</span>
                <span className="rekap-card-field-value">{student.kelas || "-"}</span>
              </div>
              <div className="rekap-card-field">
                <span className="rekap-card-field-label">Nominal</span>
                <span className="rekap-card-field-value">
                  {formatRupiah(getNominal(student))}
                </span>
              </div>
            </div>

            <div className="rekap-card-footer">
              {payment?.proof || (payment?.proofs && payment.proofs.length > 0) ? (
                <button
                  type="button"
                  className="blue-btn card-btn"
                  onClick={() => onViewProof(payment)}
                >
                  Lihat Bukti
                </button>
              ) : (
                <span className="muted">Belum ada bukti</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaymentTable({
  payments,
  getNominal,
  onViewProof,
  onVerify,
  onSetUnpaid,
  onSetReason,
}: {
  payments: Payment[];
  getNominal: (payment: Payment) => number;
  onViewProof: (payment: Payment) => void;
  onVerify: (payment: Payment) => void;
  onSetUnpaid: (payment: Payment) => void;
  onSetReason: (payment: Payment) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Kelas</th>
            <th>Bulan</th>
            <th>Nominal</th>
            <th>Status</th>
            <th>Bukti</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment, index) => (
            <tr key={index}>
              <td className="student-name">{payment.nama}</td>
              <td>{payment.kelas}</td>
              <td>{payment.bulan}</td>
              <td>{formatRupiah(getNominal(payment))}</td>
              <td>
                <StatusBadge status={payment.status || "pending"} />
              </td>
              <td>
                {payment.proof || (payment.proofs && payment.proofs.length > 0) ? (
                  <button
                    onClick={() => onViewProof(payment)}
                    className="blue-btn"
                  >
                    Lihat Bukti
                  </button>
                ) : (
                  <span className="muted">Belum ada</span>
                )}
              </td>
              <td>
                {normalizeStatus(payment.status) === "paid" ? (
                  <button
                    className="mini-orange"
                    onClick={() => onSetUnpaid(payment)}
                  >
                    Jadikan Belum
                  </button>
                ) : (
                  <>
                    <button
                      className="mini-green"
                      onClick={() => onVerify(payment)}
                    >
                      Verifikasi
                    </button>
                    <button
                      className="mini-gray ml-2"
                      onClick={() => onSetReason(payment)}
                    >
                      Alasan
                    </button>
                  </>
                )}

                {payment.reason ? (
                  <div className="mt-2 text-xs text-slate-500">
                    Alasan: {payment.reason}
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleTable({
  schedule,
  onEdit,
  onDelete,
}: {
  schedule: ScheduleItem[];
  onEdit: (item: ScheduleItem, index: number) => void;
  onDelete: (index: number) => void;
}) {
  if (schedule.length === 0) {
    return <EmptyState text="Belum ada jadwal untuk kelas ini." />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Hari</th>
            <th>Jam</th>
            <th>Mata Pelajaran</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {schedule.map((item, index) => (
            <tr key={index}>
              <td className="student-name">{item.hari}</td>
              <td>{item.jam}</td>
              <td>{item.mapel}</td>
              <td>
                <div className="row-actions">
                  <button onClick={() => onEdit(item, index)}>Edit</button>
                  <button className="red" onClick={() => onDelete(index)}>
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BankTable({
  banks,
  onEdit,
  onDelete,
}: {
  banks: BankItem[];
  onEdit: (item: BankItem, index: number) => void;
  onDelete: (index: number) => void;
}) {
  if (banks.length === 0) {
    return <EmptyState text="Belum ada rekening pembayaran." />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Bank</th>
            <th>Nomor Rekening</th>
            <th>Pemilik</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {banks.map((item, index) => (
            <tr key={index}>
              <td className="student-name">{item.nama}</td>
              <td>{item.nomor}</td>
              <td>{item.pemilik}</td>
              <td>
                <div className="row-actions">
                  <button onClick={() => onEdit(item, index)}>Edit</button>
                  <button className="red" onClick={() => onDelete(index)}>
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RekapBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rekap-box">
      <p>{title}</p>
      <h3>{value}</h3>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

const operatorStyles = `
.operator-root * {
  box-sizing: border-box;
}

.operator-root {
  min-height: 100vh;
  background: #f4f7fb;
  color: #0f172a;
  font-family: Arial, Helvetica, sans-serif;
}

.operator-shell {
  min-height: 100vh;
  display: flex;
}

.operator-sidebar {
  width: 280px;
  min-height: 100vh;
  background: #063d2b;
  color: white;
  padding: 26px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: sticky;
  top: 0;
  flex-shrink: 0;
}

.operator-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 38px;
}

.operator-brand img {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  object-fit: cover;
  padding: 4px;
  background: white;
}

.operator-brand h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
}

.operator-brand p {
  margin: 6px 0 0;
  font-size: 14px;
  color: rgba(255,255,255,0.75);
}

.operator-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.op-menu-btn {
  min-height: 46px;
  width: 100%;
  border: none;
  border-radius: 16px;
  padding: 0 18px;
  background: transparent;
  color: rgba(255,255,255,0.78);
  text-align: left;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
}

.op-menu-btn:hover,
.op-menu-btn.active {
  background: white;
  color: #063d2b;
}

.operator-user {
  border-top: 1px solid rgba(255,255,255,0.15);
  padding-top: 20px;
  margin-top: 20px;
}

.operator-user p {
  margin: 0 0 6px;
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}

.operator-user h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 900;
}

.operator-user button {
  margin-top: 16px;
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 16px;
  background: rgba(255,255,255,0.12);
  color: white;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
}

.operator-content {
  flex: 1;
  padding: 30px;
  overflow: auto;
}

.operator-header,
.toolbar-card,
.panel-card,
.form-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 28px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

.operator-header {
  padding: 26px;
  margin-bottom: 22px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
}

.operator-header span {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: #dcfce7;
  color: #047857;
  font-size: 12px;
  font-weight: 900;
  margin-bottom: 12px;
}

.operator-header h1 {
  margin: 0;
  color: #063d2b;
  font-size: 32px;
  font-weight: 900;
}

.operator-header p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.dark-btn,
.light-btn,
.danger-btn {
  min-height: 44px;
  border-radius: 14px;
  padding: 0 16px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 900;
}

.dark-btn {
  background: #063d2b;
  color: white;
}

.light-btn {
  background: white;
  color: #0f172a;
  border: 1px solid #cbd5e1;
}

.danger-btn {
  background: #fee2e2;
  color: #dc2626;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 8px 25px rgba(15, 23, 42, 0.05);
}

.stat-card p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 900;
}

.stat-card h2 {
  margin: 12px 0 0;
  color: #063d2b;
  font-size: 38px;
  font-weight: 900;
  line-height: 1;
}

.stat-card h2.green {
  color: #059669;
}

.stat-card h2.orange {
  color: #d97706;
}

.stat-card h2.red {
  color: #dc2626;
}

.money-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.money-card {
  border-radius: 24px;
  background: #063d2b;
  padding: 24px;
  color: white;
  box-shadow: 0 12px 28px rgba(6, 61, 43, 0.16);
}

.money-card.green {
  background: #047857;
}

.money-card.red {
  background: #991b1b;
}

.money-card p {
  margin: 0;
  font-size: 13px;
  font-weight: 900;
  color: rgba(255,255,255,0.78);
}

.money-card h2 {
  margin: 14px 0 0;
  font-size: 28px;
  font-weight: 900;
}

.toolbar-card {
  padding: 22px 24px;
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.toolbar-card h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
}

.toolbar-card p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 14px;
}

.toolbar-card input {
  width: 360px;
  height: 46px;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 0 15px;
  outline: none;
  font-size: 14px;
}

.toolbar-card input:focus {
  border-color: #063d2b;
  box-shadow: 0 0 0 4px rgba(6, 61, 43, 0.1);
}

.panel-card,
.form-card {
  padding: 26px;
  margin-bottom: 22px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.section-head h2,
.panel-card > h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
}

.section-head p,
.panel-card > p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.count-badge {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: #dcfce7;
  color: #047857;
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}

.class-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}

.class-tabs button {
  border: 1px solid #cbd5e1;
  background: white;
  color: #334155;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 900;
}

.class-tabs button.active {
  background: #063d2b;
  border-color: #063d2b;
  color: white;
}

.class-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.class-price-box,
.class-schedule-box {
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 22px;
  padding: 22px;
}

.class-price-box h3,
.class-schedule-box h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
  color: #063d2b;
}

.class-price-box p,
.class-schedule-box p {
  margin: 8px 0 18px;
  color: #64748b;
  font-size: 14px;
}

.student-form,
.profile-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 900;
}

.form-label input,
.form-label select,
.form-label textarea,
.price-form input {
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 0 13px;
  outline: none;
  font-size: 14px;
  font-family: Arial, Helvetica, sans-serif;
}

.form-label input,
.form-label select,
.price-form input {
  height: 44px;
}

.form-label textarea {
  padding: 13px;
  min-height: 120px;
  resize: vertical;
}

.form-label.full {
  grid-column: 1 / -1;
}

.form-label input:focus,
.form-label select:focus,
.form-label textarea:focus,
.price-form input:focus {
  border-color: #063d2b;
  box-shadow: 0 0 0 4px rgba(6, 61, 43, 0.1);
}

.form-submit {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.price-form {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  max-width: 620px;
  margin-top: 22px;
}

.price-form label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 900;
}

.table-space {
  margin-top: 24px;
}

  .bulk-action-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 0;
  }

  .bulk-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .student-group {
    margin-bottom: 22px;
  }

  .group-label {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    min-width: 720px;
  }

  th {
    background: #f8fafc;
    color: #64748b;
    text-align: left;
    padding: 15px 14px;
    font-size: 13px;
    font-weight: 900;
    border-bottom: 1px solid #e5e7eb;
  }

  td {
    padding: 15px 14px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    font-size: 14px;
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }

  .status-badge.paid {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    color: #065f46;
    border-left: 3px solid #059669;
  }

  .status-badge.pending {
    background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
    color: #92400e;
    border-left: 3px solid #d97706;
  }

  .status-badge.unpaid {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    color: #991b1b;
    border-left: 3px solid #dc2626;
  }

  .blue-btn,
  .mini-green,
  .row-actions button {
    border: none;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .blue-btn {
    background: #e0f2fe;
    color: #0369a1;
  }

.blue-btn:hover {
  background: #bae6fd;
  box-shadow: 0 4px 12px rgba(3, 105, 161, 0.15);
  transform: translateY(-1px);
}

.mini-green {
  background: #dcfce7;
  color: #047857;
}

.mini-green:hover {
  background: #bbf7d0;
  box-shadow: 0 4px 12px rgba(4, 120, 87, 0.15);
  transform: translateY(-1px);
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.row-actions button {
  background: #f1f5f9;
  color: #334155;
}

.row-actions button:hover {
  background: #e2e8f0;
  box-shadow: 0 4px 12px rgba(51, 65, 85, 0.1);
  transform: translateY(-1px);
}

.row-actions button.green {
  background: #dcfce7;
  color: #047857;
  color: #334155;
}

.row-actions button.red {
  background: #fee2e2;
  color: #dc2626;
}

.row-actions button.green {
  background: #dcfce7;
  color: #047857;
}

.row-actions button.orange {
  background: #ffedd5;
  color: #d97706;
}

/* Grid layout untuk Rekap (printMode) */
.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 20px;
  padding: 8px;
}

.student-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.student-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.student-info {
  flex: 1;
  min-width: 0;
}

.name-full {
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
}

.nisn-label {
  background: #f1f5f9;
  color: #475569;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 700;
  white-space: nowrap;
}

.nominal-label {
  background: #e0f2fe;
  color: #0369a1;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 700;
  white-space: nowrap;
}

.status-badge-inline {
  flex-shrink: 0;
}

.card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.kelas-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kelas-info .label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kelas-info .value {
  font-size: 15px;
  font-weight: 900;
  color: #0f172a;
}

.card-btn {
  flex-shrink: 0;
  padding: 8px 12px !important;
  font-size: 12px !important;
}


.muted {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 800;
}

.done-text {
  color: #047857;
  font-size: 12px;
  font-weight: 900;
}

.empty-state {
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  border-radius: 18px;
  padding: 28px;
  text-align: center;
  color: #64748b;
  font-weight: 800;
}

.rekap-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.rekap-box {
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 18px;
  padding: 18px;
}

.rekap-box p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 900;
}

.rekap-box h3 {
  margin: 8px 0 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 900;
}

.rekap-card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
  margin-top: 18px;
  scroll-behavior: smooth;
}

.rekap-card {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #ffffff;
  padding: 18px 20px;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.rekap-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.rekap-card-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.rekap-card-name {
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rekap-card-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #94a3b8;
}

.rekap-card-body {
  display: flex;
  gap: 20px;
  flex: 1.5;
}

.rekap-card-field {
  padding: 0;
  border-radius: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rekap-card-field-label {
  font-size: 10px;
  font-weight: 900;
  color: #94a3b8;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.rekap-card-field-value {
  font-size: 14px;
  font-weight: 900;
  color: #0f172a;
}

.rekap-card-footer {
  margin-top: 0;
  flex-shrink: 0;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-box {
  width: min(760px, 100%);
  max-height: 88vh;
  overflow: auto;
  background: white;
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 24px 70px rgba(0,0,0,0.35);
}

.proof-image {
  width: 100%;
  max-height: 65vh;
  object-fit: contain;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #f8fafc;
}

.operator-loading {
  min-height: 100vh;
  background: #f4f7fb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #063d2b;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 900;
}

@media (max-width: 1100px) {
  .operator-shell {
    flex-direction: column;
  }

  .operator-sidebar {
    width: 100%;
    min-height: auto;
    position: static;
  }

  .operator-menu {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }

  .stat-grid,
  .money-grid,
  .student-form,
  .profile-form,
  .rekap-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .operator-content {
    padding: 18px;
  }

  .operator-header,
  .toolbar-card,
  .section-head,
  .price-form {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .header-actions button,
  .toolbar-card input,
  .price-form button {
    width: 100%;
  }

  .stat-grid,
  .money-grid,
  .student-form,
  .profile-form,
  .rekap-grid {
    grid-template-columns: 1fr;
  }

  .operator-menu {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media print {
  .operator-sidebar,
  .operator-header,
  .toolbar-card,
  .form-card,
  .header-actions,
  .row-actions,
  .danger-btn,
  .light-btn,
  .dark-btn {
    display: none !important;
  }

  .operator-shell {
    display: block;
  }

  .operator-content {
    padding: 0;
  }

  .panel-card {
    box-shadow: none;
    border: none;
  }
}

/* Image input styling */
.image-input-container {
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
}

.image-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  border: none !important;
  margin: 0 !important;
  font-size: 14px;
  font-weight: 900;
  color: #475569;
  flex-wrap: wrap;
  gap: 12px;
}

.input-mode-toggle {
  display: flex;
  gap: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 4px;
  background: #f8fafc;
}

.mode-btn {
  border: none;
  background: transparent;
  color: #64748b;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.mode-btn.active {
  background: white;
  color: #063d2b;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.mode-btn:hover:not(.active) {
  color: #334155;
}

.file-input,
.url-input {
  padding: 12px !important;
  border: 2px dashed #cbd5e1 !important;
  border-radius: 10px !important;
  background: #f8fafc !important;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-input:hover,
.url-input:hover {
  border-color: #94a3b8 !important;
  background: #f1f5f9 !important;
}

.file-input:focus,
.url-input:focus {
  border-color: #063d2b !important;
  background: white !important;
  outline: none;
  box-shadow: 0 0 0 4px rgba(6,61,43,0.1) !important;
}

.image-preview {
  margin-top: 12px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 8px;
}

.image-preview img {
  max-height: 200px;
  max-width: 100%;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  border-radius: 6px;
}
`;