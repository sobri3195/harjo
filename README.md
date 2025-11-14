# Sistem Tanggap Darurat Militer (Military Emergency Response System)

![Emergency Response System](https://img.shields.io/badge/Status-Active-green) ![Version](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-Military%20Use-red)

## 🚨 Deskripsi Sistem

Sistem Tanggap Darurat Militer adalah aplikasi web real-time yang dirancang khusus untuk menangani situasi darurat di lingkungan militer. Sistem ini memungkinkan pelaporan cepat, pelacakan ambulans, komunikasi tim medis, dan monitoring situasi darurat secara real-time.

## ✨ Fitur Utama

### 🔐 Autentikasi & Keamanan
- **Auto-login untuk Darurat**: Akses cepat tanpa hambatan autentikasi saat darurat
- **Role-based Access**: Admin, personel medis, dan ambulans dengan akses berbeda
- **Keamanan Data**: Row Level Security (RLS) untuk proteksi data sensitif

### 📍 Pelacakan Lokasi Real-time
- **GPS Tracking**: Pelacakan lokasi personel dan ambulans secara real-time
- **Peta Interaktif**: Visualisasi lokasi menggunakan Leaflet Maps
- **Sharing Lokasi**: Berbagi lokasi otomatis saat darurat

### 🚑 Manajemen Ambulans
- **Dispatching Otomatis**: Sistem otomatis mengirim ambulans terdekat
- **Status Tracking**: Monitor status ambulans (tersedia, dalam perjalanan, di lokasi)
- **Navigation**: Panduan rute optimal ke lokasi darurat
- **Equipment Monitoring**: Pelacakan peralatan medis dalam ambulans

### 🏥 Tim Medis
- **Profil Medis**: Database personel medis dengan keahlian
- **Komunikasi Real-time**: Chat sistem untuk koordinasi tim
- **Patient Monitoring**: Monitor kondisi pasien selama perjalanan
- **Medical Records**: Pencatatan tindakan medis

### 📊 Dashboard Admin
- **Analytics**: Statistik darurat, response time, dan performa tim
- **Resource Management**: Manajemen sumber daya medis dan ambulans
- **Alert Broadcasting**: Sistem siaran peringatan darurat
- **Personnel Management**: Manajemen personel dan tim medis

### 🎤 Pelaporan Darurat
- **Voice Reporting**: Laporan darurat menggunakan suara
- **Quick Report**: Tombol darurat untuk trauma, jantung, dll
- **Multi-channel**: Web, mobile, dan voice call integration
- **Priority System**: Klasifikasi tingkat darurat (ringan, sedang, berat, kritis)

## 🛠 Teknologi yang Digunakan

### Frontend
- **React 18** - Framework UI modern
- **TypeScript** - Type safety dan developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Build tool super cepat
- **Shadcn/ui** - Komponen UI yang accessible

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database relational
- **Real-time Subscriptions** - Update data secara real-time
- **Row Level Security** - Keamanan tingkat baris

### Maps & Location
- **Leaflet** - Peta interaktif open source
- **Geolocation API** - Akses lokasi browser
- **Routing Machine** - Perhitungan rute optimal

### Authentication & Security
- **Supabase Auth** - Sistem autentikasi
- **Anonymous Auth** - Akses darurat tanpa registrasi
- **RLS Policies** - Kebijakan keamanan data

## 📱 Antarmuka Pengguna

### Untuk Personel Militer
- **Dashboard Utama**: Overview situasi darurat dan akses cepat
- **Emergency Buttons**: Tombol darurat berdasarkan jenis (trauma, jantung, dll)
- **Location Sharing**: Berbagi lokasi untuk bantuan
- **History**: Riwayat laporan dan tindakan darurat

### Untuk Tim Medis
- **Medical Dashboard**: Overview pasien dan tugas medis
- **Patient Records**: Catatan medis dan riwayat pasien
- **Team Communication**: Komunikasi dengan tim medis lain
- **Resource Tracking**: Pelacakan peralatan dan obat-obatan

### Untuk Ambulans
- **Navigation System**: Panduan rute ke lokasi darurat
- **Patient Monitoring**: Monitor vital signs selama perjalanan
- **Equipment Status**: Status peralatan medis dalam ambulans
- **Communication Hub**: Komunikasi dengan rumah sakit dan dispatch

### Untuk Admin
- **Analytics Dashboard**: Statistik dan performa sistem
- **Resource Management**: Manajemen ambulans dan personel
- **Alert System**: Sistem peringatan dan broadcast
- **System Settings**: Konfigurasi sistem dan pengaturan

## 🚀 Instalasi dan Setup

Lihat [SETUP_GUIDE.md](./SETUP_GUIDE.md) untuk instruksi instalasi lengkap.

## 📖 Panduan Penggunaan

Lihat [USER_GUIDE.md](./USER_GUIDE.md) untuk panduan penggunaan lengkap.

## 🔧 Dokumentasi Teknis

Lihat [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) untuk dokumentasi teknis developer.

## 🏗 Arsitektur Sistem

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   External      │
│   (React)       │◄──►│   Backend       │◄──►│   Services      │
│                 │    │                 │    │                 │
│ - Emergency UI  │    │ - Database      │    │ - Maps API      │
│ - Real-time     │    │ - Auth          │    │ - Voice API     │
│ - Maps          │    │ - Real-time     │    │ - SMS Gateway   │
│ - Admin Panel   │    │ - Storage       │    │ - Push Notif    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🗄 Struktur Database

### Tabel Utama
- **emergency_reports** - Laporan darurat
- **ambulance_tracking** - Pelacakan ambulans
- **emergency_dispatches** - Dispatch ambulans
- **locations** - Lokasi real-time personel
- **medical_team** - Data tim medis
- **personnel** - Data personel militer
- **patient_monitoring** - Monitoring pasien
- **team_chat** - Komunikasi tim

## 🔒 Keamanan

- **Row Level Security (RLS)** pada semua tabel sensitif
- **Autentikasi wajib** untuk akses data
- **Role-based permissions** untuk kontrol akses
- **Data encryption** untuk informasi sensitif
- **Audit logging** untuk jejak aktivitas

## 📈 Performance

- **Real-time updates** menggunakan Supabase subscriptions
- **Optimized queries** dengan proper indexing
- **Lazy loading** untuk komponen besar
- **Caching strategy** untuk data statis
- **Mobile-first responsive design**

## 🤝 Kontribusi

Untuk berkontribusi pada proyek ini:
1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

## 📞 Dukungan

Untuk dukungan teknis atau pertanyaan:
- **Emergency Hotline**: 115 (24/7)
- **Technical Support**: admin@military-emergency.id
- **Documentation**: [docs.military-emergency.id](https://docs.military-emergency.id)

## 📄 Lisensi

Sistem ini dikembangkan untuk penggunaan militer dan tunduk pada regulasi keamanan nasional. Distribusi dan modifikasi memerlukan izin khusus.

---

**⚠️ PENTING**: Sistem ini dirancang untuk situasi darurat militer. Gunakan dengan tanggung jawab dan sesuai protokol yang berlaku.

## 📋 Changelog

### v1.0.0 (2025-01-02)
- ✅ Implementasi sistem autentikasi darurat
- ✅ Real-time location tracking
- ✅ Ambulans dispatching otomatis
- ✅ Dashboard admin lengkap
- ✅ Voice emergency reporting
- ✅ Patient monitoring system
- ✅ Team communication chat
- ✅ Resource management
- ✅ Analytics dan reporting

---

*Dikembangkan dengan ❤️ untuk keselamatan personel militer Indonesia*