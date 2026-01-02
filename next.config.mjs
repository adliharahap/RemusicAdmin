/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Memperpanjang waktu timeout saat generate halaman/build (satuan detik)
  // 300 detik = 5 menit. Defaultnya biasanya cuma 60 detik.
  staticPageGenerationTimeout: 300,

  experimental: {
    serverActions: {
      // 2. Mengatur batas upload Server Actions menjadi 50MB
      bodySizeLimit: '50mb',
      
      // 3. Mengizinkan akses dari URL ngrok kamu
      allowedOrigins: [
        'thundering-gael-brackish.ngrok-free.dev',
        'localhost:3000' // Saya tambahkan localhost jaga-jaga buat development biasa
      ],
    },
  },
};

export default nextConfig;