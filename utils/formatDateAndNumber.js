export const formatDate = (dateString) => {
  // 1. Cek jika data kosong/null/undefined
  if (!dateString) return "-";

  // 2. Coba konversi ke Date object
  const date = new Date(dateString);

  // 3. Cek apakah hasil konversi valid
  // (isNaN pada getTime() menandakan Invalid Date)
  if (isNaN(date.getTime())) {
    return "-"; // Atau return string original: dateString
  }

  // 4. Format tanggal (Contoh: 17 Agustus 2024)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const formatNumber = (num) => new Intl.NumberFormat("id-ID").format(num);
