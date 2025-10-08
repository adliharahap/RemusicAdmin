export const formatDate = (timestamp) => {
  // cek kalau timestamp punya toDate (Firestore Timestamp)
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

  export const formatNumber = (num) => new Intl.NumberFormat("id-ID").format(num);
