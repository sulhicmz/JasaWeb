/**
 * UI Text Constants
 * Centralized configuration for all user-facing text and messages
 */

export const uiText = {
  // Navigation and Headers
  nav: {
    home: 'Beranda',
    services: 'Layanan',
    portfolio: 'Portofolio',
    blog: 'Blog',
    about: 'Tentang Kami',
    contact: 'Kontak',
    login: 'Login',
    dashboard: 'Dashboard',
    projects: 'Proyek',
    files: 'File',
    approvals: 'Persetujuan',
    tickets: 'Tiket',
    invoices: 'Faktur',
    reports: 'Laporan',
    knowledgeBase: 'Knowledge Base',
    organization: 'Organisasi',
    settings: 'Pengaturan',
  },

  // Forms
  form: {
    emailPlaceholder: 'masukkan@email.com',
    emailPlaceholderAlt: 'email@contoh.com',
    passwordPlaceholder: 'Masukkan password',
    namePlaceholder: 'Masukkan nama lengkap',
    phonePlaceholder: 'Masukkan nomor telepon',
    messagePlaceholder: 'Tulis pesan Anda di sini...',
    searchPlaceholder: 'Cari...',
  },

  // Status Labels
  status: {
    active: 'Aktif',
    inactive: 'Tidak Aktif',
    pending: 'Menunggu',
    inProgress: 'Dalam Proses',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    onHold: 'Ditunda',
    draft: 'Draft',
    sent: 'Terkirim',
    paid: 'Dibayar',
    overdue: 'Terlambat',
    open: 'Buka',
    resolved: 'Selesai',
    closed: 'Tutup',
  },

  // Priority Labels
  priority: {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    critical: 'Kritis',
    urgent: 'Mendesak',
  },

  // Actions
  actions: {
    create: 'Buat',
    edit: 'Edit',
    update: 'Perbarui',
    delete: 'Hapus',
    save: 'Simpan',
    cancel: 'Batal',
    submit: 'Kirim',
    approve: 'Setujui',
    reject: 'Tolak',
    view: 'Lihat',
    download: 'Unduh',
    upload: 'Unggah',
    search: 'Cari',
    filter: 'Filter',
    export: 'Ekspor',
    print: 'Cetak',
    refresh: 'Refresh',
    back: 'Kembali',
    next: 'Selanjutnya',
    previous: 'Sebelumnya',
  },

  // Messages
  messages: {
    loading: 'Memuat...',
    saving: 'Menyimpan...',
    deleting: 'Menghapus...',
    uploading: 'Mengunggah...',
    downloading: 'Mengunduh...',
    success: 'Berhasil',
    error: 'Terjadi kesalahan',
    warning: 'Peringatan',
    info: 'Informasi',
    noData: 'Tidak ada data',
    confirmDelete: 'Apakah Anda yakin ingin menghapus item ini?',
    confirmApprove: 'Apakah Anda yakin ingin menyetujui item ini?',
    confirmReject: 'Apakah Anda yakin ingin menolak item ini?',
    unsavedChanges:
      'Ada perubahan yang belum disimpan. Apakah Anda ingin melanjutkan?',
    networkError: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
    unauthorized: 'Anda tidak memiliki izin untuk melakukan aksi ini.',
    notFound: 'Data tidak ditemukan.',
    serverError: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
  },

  // Validation Messages
  validation: {
    required: 'Field ini wajib diisi',
    email: 'Format email tidak valid',
    minLength: 'Minimal {min} karakter',
    maxLength: 'Maksimal {max} karakter',
    passwordWeak: 'Password terlalu lemah',
    passwordMismatch: 'Password tidak cocok',
    fileSizeLimit: 'Ukuran file maksimal {size}',
    fileTypeInvalid: 'Tipe file tidak diizinkan',
    urlInvalid: 'Format URL tidak valid',
    phoneInvalid: 'Format nomor telepon tidak valid',
    numberInvalid: 'Harus berupa angka',
    min: 'Minimal {min}',
    max: 'Maksimal {max}',
  },

  // Dashboard
  dashboard: {
    totalProjects: 'Total Proyek',
    activeProjects: 'Proyek Aktif',
    openTickets: 'Tiket Terbuka',
    pendingInvoices: 'Faktur Menunggu',
    recentActivity: 'Aktivitas Terkini',
    upcomingDeadlines: 'Batas Waktu Mendatang',
    teamPerformance: 'Performa Tim',
    projectHealth: 'Kesehatan Proyek',
  },

  // Projects
  projects: {
    newProject: 'Proyek Baru',
    projectDetails: 'Detail Proyek',
    projectTimeline: 'Timeline Proyek',
    milestones: 'Milestone',
    deliverables: 'Deliverables',
    teamMembers: 'Anggota Tim',
    projectStatus: 'Status Proyek',
    startDate: 'Tanggal Mulai',
    endDate: 'Tanggal Selesai',
    budget: 'Anggaran',
    progress: 'Progress',
  },

  // Tickets
  tickets: {
    newTicket: 'Tiket Baru',
    ticketDetails: 'Detail Tiket',
    ticketHistory: 'Riwayat Tiket',
    assignee: 'Penanggung Jawab',
    reporter: 'Pelapor',
    category: 'Kategori',
    description: 'Deskripsi',
    attachments: 'Lampiran',
    createdDate: 'Tanggal Dibuat',
    updatedDate: 'Tanggal Diperbarui',
    resolutionDate: 'Tanggal Penyelesaian',
  },

  // Invoices
  invoices: {
    newInvoice: 'Faktur Baru',
    invoiceDetails: 'Detail Faktur',
    invoiceNumber: 'Nomor Faktur',
    issuedDate: 'Tanggal Terbit',
    dueDate: 'Jatuh Tempo',
    amount: 'Jumlah',
    tax: 'Pajak',
    total: 'Total',
    paymentMethod: 'Metode Pembayaran',
    paymentStatus: 'Status Pembayaran',
    paidDate: 'Tanggal Pembayaran',
  },

  // Files
  files: {
    newFile: 'File Baru',
    fileDetails: 'Detail File',
    fileName: 'Nama File',
    fileSize: 'Ukuran File',
    fileType: 'Tipe File',
    uploadDate: 'Tanggal Unggah',
    uploadedBy: 'Diunggah oleh',
    downloadCount: 'Jumlah Unduh',
    lastAccessed: 'Terakhir Diakses',
    version: 'Versi',
  },

  // Approvals
  approvals: {
    newApproval: 'Persetujuan Baru',
    approvalDetails: 'Detail Persetujuan',
    itemType: 'Tipe Item',
    itemId: 'ID Item',
    requester: 'Peminta',
    reviewer: 'Pemeriksa',
    decision: 'Keputusan',
    reason: 'Alasan',
    requestDate: 'Tanggal Permintaan',
    decisionDate: 'Tanggal Keputusan',
    note: 'Catatan',
  },

  // Time and Date
  time: {
    now: 'Sekarang',
    today: 'Hari Ini',
    yesterday: 'Kemarin',
    tomorrow: 'Besok',
    thisWeek: 'Minggu Ini',
    thisMonth: 'Bulan Ini',
    lastWeek: 'Minggu Lalu',
    lastMonth: 'Bulan Lalu',
    minutesAgo: '{minutes} menit yang lalu',
    hoursAgo: '{hours} jam yang lalu',
    daysAgo: '{days} hari yang lalu',
    weeksAgo: '{weeks} minggu yang lalu',
    monthsAgo: '{months} bulan yang lalu',
  },

  // Units and Formats
  units: {
    bytes: 'B',
    kilobytes: 'KB',
    megabytes: 'MB',
    gigabytes: 'GB',
    items: 'item',
    itemsPlural: 'item',
    percentage: '%',
    currency: 'Rp',
    hours: 'jam',
    minutes: 'menit',
    seconds: 'detik',
    days: 'hari',
    weeks: 'minggu',
    months: 'bulan',
    years: 'tahun',
  },
};

export default uiText;
