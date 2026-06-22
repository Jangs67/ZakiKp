export function validateSiswaPayload(body: Record<string, unknown>, isUpdate = false) {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Payload harus berupa objek JSON" };
  }

  const { nama, kelas, nisn, password, ttl, jk } = body;

  if (!isUpdate) {
    if (!nama || typeof nama !== "string" || nama.trim().length < 2) {
      return { ok: false, message: "Nama tidak valid (min 2 karakter)" };
    }

    if (!kelas || typeof kelas !== "string" || kelas.trim().length < 1) {
      return { ok: false, message: "Kelas tidak valid" };
    }

    if (!nisn || typeof nisn !== "string" || !/^\d{4,20}$/.test(nisn.trim())) {
      return { ok: false, message: "NISN harus berupa angka (4-20 digit)" };
    }

    if (!password || typeof password !== "string" || password.trim().length < 4) {
      return { ok: false, message: "Password minimal 4 karakter" };
    }
  } else {
    if (nama !== undefined && (typeof nama !== "string" || nama.trim().length < 2)) {
      return { ok: false, message: "Nama tidak valid (min 2 karakter)" };
    }

    if (kelas !== undefined && (typeof kelas !== "string" || kelas.trim().length < 1)) {
      return { ok: false, message: "Kelas tidak valid" };
    }

    if (nisn !== undefined && (typeof nisn !== "string" || !/^\d{4,20}$/.test(nisn))) {
      return { ok: false, message: "NISN harus berupa angka (4-20 digit)" };
    }

    if (password !== undefined && (typeof password !== "string" || password.length < 4)) {
      return { ok: false, message: "Password minimal 4 karakter" };
    }

    if (ttl !== undefined && typeof ttl !== "string") {
      return { ok: false, message: "TTL harus berupa teks" };
    }

    if (jk !== undefined && typeof jk !== "string") {
      return { ok: false, message: "Jenis kelamin harus berupa teks" };
    }
  }

  return { ok: true };
}
