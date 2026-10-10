import { PrismaClient } from '@prisma/client';
import "dotenv/config"; // Pastikan ini ada di baris paling atas!

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const recipesData = [
  {
    "id_resep": 1,
    "judul_resep": "nasgor",
    "bahan_bahan": "nasi, minyak, kompor gas",
    "langkah_masak": "masukin minyak, masukin nasi",
    "kategori_jenis": "makanan berat",
    "informasi_gizi": "Kalori: 250kkal",
    "deskripsi_singkat": "nasi di goreng",
    "gambar_url": "https://asset.kompas.com/crops/GgoPUrhHFV5EtkSU71XOR8MrNTY=/0x0:1062x708/1200x800/data/photo/2025/06/15/684e9654425ca.jpg",
    "id_kategori": null,
    "waktu_masak": 20
  },
  {
    "id_resep": 2,
    "judul_resep": "Bubur Kacang Hijau Kupas & Beras Hitam Organik",
    "bahan_bahan": "250g Kacang Hijau Kupas Panganesia, 100g Beras Hitam Organik Panganesia, 2 blok Gula Jawa Panganesia, 1 bungkus Santan Kanil Panganesia, 1 liter air, 2 lembar daun pandan, sedikit garam.",
    "langkah_masak": "1. Cuci bersih Kacang Hijau Kupas dan Beras Hitam Organik di bawah air mengalir hingga jernih.\\n2. Rendam beras hitam selama kurang lebih 2 jam agar teksturnya lebih empuk saat dimasak.\\n3. Rebus beras hitam dalam 1 liter air hingga mekar, kemudian masukkan kacang hijau kupas.\\n4. Tambahkan daun pandan dan masak dengan api kecil hingga semua bahan menjadi bubur kental.\\n5. Masukkan Gula Jawa yang sudah disisir halus, aduk hingga larut sempurna.\\n6. Tuangkan Santan Kanil dan sedikit garam, masak sebentar lagi sambil terus diaduk agar santan tidak pecah.\\n7. Sajikan hangat dalam mangkuk porselen.",
    "kategori_jenis": "Weight Gain",
    "informasi_gizi": "Kalori: 450 kkal, Protein: 12g, Serat: 8g, Karbohidrat: 65g",
    "deskripsi_singkat": "Menu sarapan klasik yang dimodifikasi dengan Beras Hitam Organik Panganesia. Kombinasi ini sangat tinggi serat dan kalori sehat, cocok untuk kamu yang ingin menambah berat badan secara alami tanpa lemak jahat. Rasanya gurih manis dengan tekstur yang sangat lembut.",
    "gambar_url": "https://picsum.photos/seed/kacanghijau/800/600",
    "id_kategori": null,
    "waktu_masak": 45
  },
  {
    "id_resep": 3,
    "judul_resep": "Bolu Kukus Ubi Ungu Lembut",
    "bahan_bahan": "300g Ubi Ungu Pekat Panganesia (dikukus dan dihaluskan), 200g Tepung Beras Merah Panganesia, 150g Gula Jawa (sisir), 3 butir telur, 100ml Minyak Kelapa Panganesia, 1 sdt baking powder, 1/2 sdt vanila bubuk.",
    "langkah_masak": "1. Siapkan kukusan dan panaskan air hingga mendidih. Bungkus tutup kukusan dengan kain bersih agar uap tidak menetes ke kue.\\n2. Kocok telur dan Gula Jawa menggunakan mixer hingga mengembang dan pucat.\\n3. Masukkan ubi ungu yang telah dihaluskan sedikit demi sedikit sambil terus diaduk dengan kecepatan rendah.\\n4. Masukkan Tepung Beras Merah dan baking powder secara bertahap sambil diayak.\\n5. Tuangkan Minyak Kelapa Panganesia dan vanila, aduk lipat menggunakan spatula hingga rata dan tidak ada minyak yang mengendap.\\n6. Tuang adonan ke dalam loyang yang sudah diolesi sedikit minyak.\\n7. Kukus selama 30-35 menit atau hingga matang sempurna (tes tusuk).\\n8. Dinginkan sejenak sebelum dipotong-potong.",
    "kategori_jenis": "Snack",
    "informasi_gizi": "Kalori: 210 kkal, Antioksidan: Tinggi, Karbohidrat: 30g",
    "deskripsi_singkat": "Cemilan sehat dengan warna ungu alami dari Ubi Ungu Pekat Panganesia. Tanpa pewarna buatan, kue ini kaya akan antosianin yang berfungsi sebagai antioksidan. Teksturnya sangat moist dan tidak seret di tenggorokan, sangat disukai anak-anak maupun orang dewasa.",
    "gambar_url": "https://picsum.photos/seed/ubiungu/800/600",
    "id_kategori": null,
    "waktu_masak": 30
  },
  {
    "id_resep": 4,
    "judul_resep": "Sup Sehat Jamur Kuping & Rebung Iris",
    "bahan_bahan": "50g Jamur Kuping Kering Panganesia (rendam air panas), 100g Rebung Iris Panganesia, 1 buah wortel iris bulat, 2 siung bawang putih cincang, 1 batang daun seledri, 1 sdm Tauco Panganesia (sebagai penyedap alami), lada putih secukupnya.",
    "langkah_masak": "1. Cuci bersih jamur kuping yang sudah mengembang, lalu potong-potong memanjang sesuai selera.\\n2. Rebus rebung iris dalam air mendidih selama 5 menit untuk menghilangkan bau langu, lalu tiriskan.\\n3. Tumis bawang putih cincang dengan sedikit minyak kelapa hingga harum dan kecokelatan.\\n4. Masukkan 700ml air, tunggu hingga mendidih.\\n5. Masukkan wortel, rebung, dan jamur kuping secara bersamaan.\\n6. Tambahkan Tauco Panganesia sebagai pengganti garam untuk rasa gurih yang lebih unik dan sehat.\\n7. Masak hingga sayuran empuk, lalu tambahkan lada putih dan irisan seledri tepat sebelum api dimatikan.\\n8. Sajikan selagi panas.",
    "kategori_jenis": "Diet",
    "informasi_gizi": "Kalori: 120 kkal, Serat: 9g, Lemak: 2g, Sodium: Rendah",
    "deskripsi_singkat": "Sup bening yang menyegarkan dengan tekstur renyah dari Jamur Kuping Kering dan Rebung Iris Panganesia. Sangat rendah kalori namun sangat kaya akan mineral. Cocok dinikmati sebagai menu makan malam ringan saat sedang menjalani program detoksifikasi tubuh.",
    "gambar_url": "https://picsum.photos/seed/jamurkuping/800/600",
    "id_kategori": null,
    "waktu_masak": 45
  },
  {
    "id_resep": 5,
    "judul_resep": "Perkedel Kentang Dieng Tanpa Minyak (Air Fryer)",
    "bahan_bahan": "500g Kentang Lokal Dieng Panganesia, 1 butir telur (pisahkan kuning dan putihnya), 2 sdm bawang merah goreng, 1 batang seledri iris halus, 1/2 sdt lada, sedikit garam, 1/2 sdt pala bubuk.",
    "langkah_masak": "1. Kupas kentang Dieng, potong-potong, lalu kukus hingga benar-benar empuk.\\n2. Haluskan kentang selagi panas agar hasilnya lembut sempurna.\\n3. Campurkan kentang halus dengan kuning telur, bawang goreng, seledri, lada, garam, dan pala. Aduk hingga rata.\\n4. Ambil 1 sdm adonan, bentuk bulat pipih sesuai selera.\\n5. Celupkan setiap bulatan perkedel ke dalam putih telur yang sudah dikocok lepas.\\n6. Tata di atas rak air fryer yang sudah dialasi baking paper.\\n7. Panggang dengan suhu 180C selama 15 menit, balik di tengah waktu memasak agar garing merata.\\n8. Angkat dan sajikan sebagai teman nasi atau cemilan protein.",
    "kategori_jenis": "Diet",
    "informasi_gizi": "Kalori: 85 kkal/pcs, Lemak: 1.5g, Karbohidrat: 14g",
    "deskripsi_singkat": "Modifikasi perkedel tradisional menggunakan Kentang Lokal Dieng yang memiliki kadar air rendah. Dengan teknik memanggang atau menggunakan air fryer, perkedel ini jauh lebih sehat karena rendah lemak namun tetap memiliki tekstur luar yang garing dan dalam yang lembut.",
    "gambar_url": "https://picsum.photos/seed/perkedel/800/600",
    "id_kategori": null,
    "waktu_masak": 35
  },
  {
    "id_resep": 6,
    "judul_resep": "Smoothie Bowl Kelor & Jagung Manis",
    "bahan_bahan": "1 sdt Bubuk Kelor Panganesia, 100g Jagung Manis Pipil Panganesia (dikukus), 1 buah pisang beku, 150ml susu almond atau santan encer, topping: Biji Selisih Panganesia, Biji Teratai Panganesia, dan potongan buah segar.",
    "langkah_masak": "1. Masukkan pisang beku, bubuk kelor, dan susu almond ke dalam blender berkecepatan tinggi.\\n2. Blender semua bahan hingga halus dan mencapai tekstur kental seperti es krim lembut(soft serve).\\n3. Tuang smoothie ke dalam mangkuk saji.\\n4. Taburkan jagung manis pipil yang sudah dikukus di atasnya.\\n5. Tambahkan topping Biji Selisih, Biji Teratai, dan potongan buah segar sesuai selera.\\n6. Sajikan segera selagi dingin agar tekstur tetap kental.",
    "kategori_jenis": "High Protein",
    "informasi_gizi": "Protein: 15g, Kalori: 320 kkal, Vitamin A: Sangat Tinggi",
    "deskripsi_singkat": "Superfood smoothie bowl yang menggabungkan manfaat Bubuk Kelor Panganesia dengan manis alami dari Jagung Pipil. Menu ini didesain khusus untuk pemulihan setelah olahraga (post-workout) karena mengandung profil protein dan vitamin yang sangat lengkap.",
    "gambar_url": "https://picsum.photos/seed/kelor/800/600",
    "id_kategori": null,
    "waktu_masak": 15
  },
  {
    "id_resep": 7,
    "judul_resep": "Singkong Mentega Karamel Gula Jawa",
    "bahan_bahan": "500g Singkong Mentega Panganesia, 2 blok Gula Jawa Panganesia, 100ml air, 1/2 sdt garam, 1 bungkus Santan Kelapa Instan Panganesia.",
    "langkah_masak": "1. Kupas singkong mentega, potong ukuran 5cm, dan belah tengahnya untuk membuang serat kasar.\\n2. Rebus singkong dengan air dan sedikit garam hingga merekah dan empuk. Tiriskan.\\n3. Di panci terpisah, rebus Gula Jawa dan air hingga larut dan sedikit mengental menjadi sirup.\\n4. Masukkan singkong rebus ke dalam sirup gula jawa, masak dengan api kecil sambil dibolak-balik hingga gula meresap dan singkong berwarna kecokelatan.\\n5. Terakhir, tuangkan santan instan di atasnya, aduk pelan hingga merata dan saus menjadi sangat kental (creamy).\\n6. Sajikan selagi hangat sebagai teman minum teh.",
    "kategori_jenis": "Weight Gain",
    "informasi_gizi": "Kalori: 480 kkal, Lemak: 12g, Karbohidrat: 85g",
    "deskripsi_singkat": "Olahan singkong premium menggunakan Singkong Mentega Panganesia yang terkenal empuk dan berwarna kuning cantik. Saus karamelnya terbuat dari Gula Jawa asli yang memberikan aroma smoky dan manis yang legit, sangat pas untuk menambah asupan energi harian.",
    "gambar_url": "https://picsum.photos/seed/singkong/800/600",
    "id_kategori": null,
    "waktu_masak": 25
  },
  {
    "id_resep": 8,
    "judul_resep": "Es Rumput Laut & Biji Teratai Segar",
    "bahan_bahan": "100g Rumput Laut Panganesia (cuci bersih), 50g Biji Teratai Panganesia (rebus hingga empuk), 1 sdm Biji Selisih Panganesia (rendam air), Asam Jawa Panganesia (ambil airnya), sirup gula jawa secukupnya.",
    "langkah_masak": "1. Siapkan mangkuk besar atau gelas saji.\\n2. Masukkan rumput laut yang sudah bersih dan dipotong-potong.\\n3. Tambahkan biji teratai yang sudah empuk dan biji selisih yang sudah mengembang.\\n4. Tuangkan 2 sdm air asam jawa untuk memberikan sensasi segar yang menyeimbangkan rasa manis.\\n5. Tambahkan sirup gula jawa sesuai tingkat kemanisan yang diinginkan.\\n6. Beri es batu serut atau es batu kotak.\\n7. Aduk rata dan nikmati di siang hari yang terik.",
    "kategori_jenis": "Snack",
    "informasi_gizi": "Kalori: 150 kkal, Kolagen: Alami, Serat: Tinggi",
    "deskripsi_singkat": "Minuman tradisional yang sangat menyegarkan dan bermanfaat untuk mendinginkan suhu tubuh. Menggunakan Rumput Laut dan Biji Teratai Panganesia yang kaya akan kolagen alami dan mineral penting untuk kesehatan kulit.",
    "gambar_url": "https://picsum.photos/seed/rumputlaut/800/600",
    "id_kategori": null,
    "waktu_masak": 15
  },
  {
    "id_resep": 9,
    "judul_resep": "Ubi Cilembu Panggang Madu Air Fryer",
    "bahan_bahan": "3-4 buah Ubi Jalar Cilembu Panganesia ukuran sedang, sedikit garam (opsional).",
    "langkah_masak": "1. Cuci bersih ubi cilembu menggunakan sikat lembut agar kulitnya bersih dari tanah.\\n2. Tusuk-tusuk permukaan ubi dengan garpu agar panas meresap hingga ke dalam.\\n3. Masukkan ke dalam Air Fryer tanpa perlu dipotong.\\n4. Panggang dengan suhu 200C selama 30-40 menit.\\n5. Balik ubi setiap 15 menit agar cairan madunya tidak hanya mengumpul di satu sisi.\\n6. Ubi siap dinikmati saat kulitnya terlihat sedikit berkerut dan tekstur dalamnya sangat lembut seperti selai.",
    "kategori_jenis": "Diet",
    "informasi_gizi": "Kalori: 180 kkal, Serat: 6g, Glikemik Indeks: Sedang",
    "deskripsi_singkat": "Cara termudah menikmati Ubi Jalar Cilembu Panganesia tanpa ribet. Teknik panggang yang tepat akan mengeluarkan cairan madu alami dari dalam ubi, memberikan rasa manis yang luar biasa tanpa perlu tambahan gula atau pemanis lainnya.",
    "gambar_url": "https://picsum.photos/seed/cilembu/800/600",
    "id_kategori": null,
    "waktu_masak": 25
  },
  {
    "id_resep": 10,
    "judul_resep": "Talas Pratama Kukus Bumbu Tauco",
    "bahan_bahan": "300g Talas Pratama Panganesia (potong dadu besar), 2 sdm Tauco Panganesia, 1 buah cabai merah iris, 2 siung bawang putih cincang, sedikit daun bawang.",
    "langkah_masak": "1. Kukus potongan talas pratama selama 20 menit hingga empuk tapi tidak hancur.\\n2. Sambil menunggu, siapkan tumisan saus: tumis bawang putih dan cabai hingga harum.\\n3. Masukkan Tauco Panganesia, beri sedikit air (sekitar 50ml), aduk hingga rata.\\n4. Masukkan talas yang sudah dikukus ke dalam tumisan saus tauco.\\n5. Aduk perlahan agar setiap sisi talas terbalut bumbu.\\n6. Taburkan daun bawang segar di atasnya sebelum disajikan.",
    "kategori_jenis": "Diet",
    "informasi_gizi": "Kalori: 250 kkal, Serat: 10g, Protein: 4g",
    "deskripsi_singkat": "Menu diet kenyang dengan karbohidrat kompleks dari Talas Pratama Panganesia. Ukurannya yang besar dan teksturnya yang tidak gatal membuatnya sangat nyaman dikonsumsi sebagai pengganti nasi. Saus Tauco memberikan ledakan rasa gurih tanpa kalori berlebih.",
    "gambar_url": "https://picsum.photos/seed/talas/800/600",
    "id_kategori": null,
    "waktu_masak": 40
  },
  {
    "id_resep": 11,
    "judul_resep": "Klepon Tepung Mangrove Isi Gula Jawa",
    "bahan_bahan": "200g Tepung Mangrove Panganesia, 50g Tepung Maizena Panganesia, 150ml air hangat, 1 blok Gula Jawa Panganesia (potong dadu kecil), Kelapa parut kukus untuk taburan.",
    "langkah_masak": "1. Campur tepung mangrove dan tepung maizena dalam satu wadah.\\n2. Tuangkan air hangat sedikit demi sedikit sambil diuleni hingga adonan kalis dan bisa dibentuk.\\n3. Ambil sedikit adonan, pipihkan, lalu beri potongan kecil gula jawa di tengahnya.\\n4. Bulatkan kembali hingga rapat (pastikan tidak ada retakan agar gula tidak bocor saat direbus).\\n5. Rebus dalam air mendidih hingga bola-bola mengapung (tanda sudah matang).\\n6. Angkat dan langsung gulingkan di atas kelapa parut yang sudah diberi sedikit garam.\\n7. Sajikan selagi hangat.",
    "kategori_jenis": "Snack",
    "informasi_gizi": "Kalori: 45 kkal/pcs, Karbohidrat: 8g, Lemak: 1g",
    "deskripsi_singkat": "Inovasi jajanan pasar menggunakan Tepung Mangrove (Lindur) Panganesia. Tepung ini memberikan aroma khas yang unik dan tekstur yang sangat kenyal. Diisi dengan Gula Jawa asli yang akan meledak di mulut saat digigit.",
    "gambar_url": "https://picsum.photos/seed/klepon/800/600",
    "id_kategori": null,
    "waktu_masak": 35
  },
  {
    "id_resep": 12,
    "judul_resep": "Nasi Beras Hitam Tumis Jagung & Jamur",
    "bahan_bahan": "1 cup Beras Hitam Organik Panganesia, 50g Jagung Manis Pipil Panganesia, 30g Jamur Kuping Kering Panganesia (iris), 1 sdm Minyak Kelapa Panganesia, bawang putih, sedikit garam.",
    "langkah_masak": "1. Masak Beras Hitam Organik menggunakan rice cooker dengan rasio air 1:2.5.\\n2. Tumis bawang putih menggunakan minyak kelapa hingga harum.\\n3. Masukkan jagung manis pipil dan irisan jamur kuping, tumis hingga matang.\\n4. Masukkan nasi beras hitam yang sudah matang ke dalam tumisan sayur.\\n5. Tambahkan sedikit garam dan lada, aduk hingga semua bumbu merata.\\n6. Sajikan hangat dengan tambahan telur rebus jika ingin protein lebih tinggi.",
    "kategori_jenis": "High Protein",
    "informasi_gizi": "Protein: 14g, Kalori: 380 kkal, Serat: 11g",
    "deskripsi_singkat": "Makan siang padat nutrisi yang menggabungkan Beras Hitam Organik, Jagung Pipil, dan Jamur Kuping Panganesia. Protein didapat dari kombinasi jamur dan beras hitam yang secara alami memiliki profil asam amino lebih tinggi dibanding beras putih.",
    "gambar_url": "https://picsum.photos/seed/nasihitam/800/600",
    "id_kategori": null,
    "waktu_masak": 20
  },
  {
    "id_resep": 13,
    "judul_resep": "Bubur Hunkwe Santan Gula Jawa",
    "bahan_bahan": "1 bungkus Tepung Hunkwe Panganesia, 1 bungkus Santan Kelapa Panganesia, 150g Gula Jawa Panganesia, 600ml air, 1/4 sdt garam.",
    "langkah_masak": "1. Larutkan tepung hunkwe dengan 200ml air, aduk hingga tidak ada gumpalan.\\n2. Rebus sisa air (400ml) bersama gula jawa dan santan hingga mendidih dan gula larut.\\n3. Saring air gula tersebut agar bersih dari ampas.\\n4. Campurkan larutan hunkwe ke dalam air gula santan yang sedang mendidih.\\n5. Kecilkan api dan aduk terus dengan cepat menggunakan whisk hingga adonan meletup-letup dan berubah menjadi bening kental.\\n6. Tuang ke dalam cetakan atau mangkuk kecil.\\n7. Bisa dinikmati hangat atau dimasukkan ke kulkas untuk tekstur yang lebih kenyal.",
    "kategori_jenis": "Snack",
    "informasi_gizi": "Kalori: 240 kkal, Lemak: 8g, Karbohidrat: 40g",
    "deskripsi_singkat": "Cemilan tradisional yang sangat lembut di lidah. Menggunakan Tepung Hunkwe Panganesia yang berkualitas tinggi, menghasilkan puding atau bubur yang transparan namun tetap kokoh. Sangat cocok disajikan sebagai dessert setelah makan berat.",
    "gambar_url": "https://picsum.photos/seed/hunkwe/800/600",
    "id_kategori": null,
    "waktu_masak": 30
  },
  {
    "id_resep": 14,
    "judul_resep": "Kacang Tanah Kupas Sangrai Gurih",
    "bahan_bahan": "250g Kacang Tanah Kupas Panganesia, 2 siung bawang putih (geprek), 1 sdt garam, 1 sdm Minyak Kelapa Panganesia.",
    "langkah_masak": "1. Cuci kacang tanah kupas sebentar, lalu tiriskan hingga kering.\\n2. Campur kacang dengan minyak kelapa, garam, dan bawang putih geprek. Diamkan 10 menit.\\n3. Siapkan wajan (tanpa minyak lagi) atau oven.\\n4. Sangrai kacang dengan api paling kecil sambil terus diaduk agar tidak gosong sebelah.\\n5. Jika menggunakan oven, panggang di suhu 160C selama 20 menit, aduk setiap 10 menit.\\n6. Kacang matang saat warnanya berubah menjadi kuning keemasan dan aromanya sangat harum.\\n7. Dinginkan hingga benar-benar suhu ruang agar teksturnya menjadi sangat renyah sebelum disimpan di toples.",
    "kategori_jenis": "Snack",
    "informasi_gizi": "Protein: 7g/porsi, Kalori: 165 kkal, Lemak Sehat: 14g",
    "deskripsi_singkat": "Cemilan tinggi lemak sehat yang sangat mudah dibuat. Menggunakan Kacang Tanah Kupas Panganesia yang sudah bersih dan berkualitas, sehingga rasa gurih aslinya sangat menonjol tanpa perlu banyak bumbu tambahan.",
    "gambar_url": "https://picsum.photos/seed/kacang/800/600",
    "id_kategori": null,
    "waktu_masak": 15
  },
  {
    "id_resep": 15,
    "judul_resep": "Sayur Asem Segar Asam Jawa & Jagung",
    "bahan_bahan": "1 blok Asam Jawa Tanpa Biji Panganesia, 1 buah Jagung Manis Panganesia (potong), 50g Kacang Tanah Kupas Panganesia, labu siam, kacang panjang, bumbu halus (bawang merah, cabai, terasi).",
    "langkah_masak": "1. Rebus air dalam panci besar, masukkan bumbu halus dan kacang tanah kupas.\\n2. Masukkan potongan jagung manis dan rebus hingga setengah matang.\\n3. Larutkan Asam Jawa Panganesia dengan sedikit air panas, buang seratnya jika ada, lalu tuangkan larutannya ke dalam panci.\\n4. Masukkan sayuran lainnya (labu siam, kacang panjang).\\n5. Tambahkan garam dan sedikit gula jawa untuk menyeimbangkan rasa asam.\\n6. Masak hingga semua sayuran matang sempurna dan bumbu meresap.\\n7. Sajikan dengan sambal terasi dan ikan asin untuk kenikmatan maksimal.",
    "kategori_jenis": "Diet",
    "informasi_gizi": "Kalori: 110 kkal, Vitamin C: Tinggi, Lemak: 3g",
    "deskripsi_singkat": "Sayur kuah bening yang menjadi favorit banyak orang. Rahasia kesegarannya terletak pada penggunaan Asam Jawa Tanpa Biji Panganesia yang memberikan rasa asam yang bersih dan kuat tanpa membuat kuah menjadi keruh.",
    "gambar_url": "https://picsum.photos/seed/sayurasem/800/600",
    "id_kategori": null,
    "waktu_masak": 60
  },
  {
    "id_resep": 16,
    "judul_resep": "Bubur Talas Ubi Ungu (Talam Modern)",
    "bahan_bahan": "200g Talas Pratama Panganesia, 200g Ubi Ungu Pekat Panganesia, 100ml Santan Kelapa Panganesia, 3 sdm Gula Jawa Panganesia, 1/2 sdt garam.",
    "langkah_masak": "1. Kukus talas dan ubi ungu secara terpisah hingga benar-benar empuk.\\n2. Haluskan talas dengan sedikit santan dan garam, tata di dasar mangkuk.\\n3. Haluskan ubi ungu dengan sisa santan dan gula jawa, tata di atas lapisan talas.\\n4. Kukus kembali mangkuk tersebut selama 10 menit agar kedua lapisan menyatu sempurna.\\n5. Sajikan sebagai hidangan penutup yang mengenyangkan atau menu selingan sore hari.",
    "kategori_jenis": "Weight Gain",
    "informasi_gizi": "Kalori: 410 kkal, Karbohidrat: 75g, Serat: 9g",
    "deskripsi_singkat": "Kombinasi dua umbi-umbian terbaik: Talas Pratama dan Ubi Ungu Pekat Panganesia. Menu ini sangat padat karbohidrat namun tetap menyehatkan karena tanpa pemanis buatan, sangat efektif untuk menambah berat badan dengan cara yang lezat.",
    "gambar_url": "https://picsum.photos/seed/buburtalas/800/600",
    "id_kategori": null,
    "waktu_masak": 35
  },
  {
    "id_resep": 17,
    "judul_resep": "Emping Melinjo Pedas Manis Tauco",
    "bahan_bahan": "200g Emping Melinjo Mentah Panganesia, 1 sdm Tauco Panganesia, 3 buah cabai merah (haluskan), 2 sdm Gula Jawa Panganesia, 1 sdm Minyak Kelapa Panganesia.",
    "langkah_masak": "1. Goreng emping melinjo dalam minyak panas hingga mekar dan garing, tiriskan.\\n2. Panaskan sedikit minyak kelapa, tumis cabai halus dan tauco hingga harum dan matang.\\n3. Masukkan gula jawa, aduk hingga menjadi karamel kental.\\n4. Matikan api, lalu masukkan emping goreng.\\n5. Aduk cepat hingga seluruh permukaan emping tertutup bumbu karamel tauco.\\n6. Biarkan dingin hingga bumbu mengeras dan emping tetap renyah.",
    "kategori_jenis": "Snack",
    "informasi_gizi": "Kalori: 230 kkal, Lemak: 12g, Sodium: Sedang",
    "deskripsi_singkat": "Cemilan tradisional dengan twist modern. Emping Melinjo Mentah Panganesia digoreng renyah lalu dibalut dengan bumbu karamel pedas yang menggunakan Tauco Panganesia untuk rasa gurih yang unik (umami).",
    "gambar_url": "https://picsum.photos/seed/emping/800/600",
    "id_kategori": null,
    "waktu_masak": 40
  },
  {
    "id_resep": 18,
    "judul_resep": "Ayam Asam Manis Alami Asam Jawa",
    "bahan_bahan": "300g Dada ayam fillet (potong kotak), 1 sdm Asam Jawa Panganesia (larutkan), 1 blok Gula Jawa Panganesia, 1 siung bawang bombay, paprika hijau, sedikit Tepung Maizena Panganesia.",
    "langkah_masak": "1. Lumuri potongan ayam dengan sedikit garam dan merica, diamkan 15 menit.\\n2. Panggang ayam di teflon dengan sedikit minyak kelapa hingga matang kecokelatan, sisihkan.\\n3. Tumis bawang bombay dan paprika hingga layu.\\n4. Masukkan air asam jawa dan gula jawa, aduk hingga larut.\\n5. Kentalkan saus dengan larutan tepung maizena.\\n6. Masukkan kembali ayam ke dalam saus, aduk hingga terbalut rata dan saus meresap.\\n7. Sajikan dengan nasi beras merah hangat.",
    "kategori_jenis": "High Protein",
    "informasi_gizi": "Protein: 28g, Kalori: 320 kkal, Vitamin C: 20mg",
    "deskripsi_singkat": "Menu utama yang sehat tanpa saus tomat botolan. Rasa asam didapatkan langsung dari Asam Jawa Tanpa Biji Panganesia dan manis dari Gula Jawa asli. Sangat cocok untuk hidangan keluarga yang peduli kesehatan.",
    "gambar_url": "https://picsum.photos/seed/ayamasam/800/600",
    "id_kategori": null,
    "waktu_masak": 75
  },
  {
    "id_resep": 19,
    "judul_resep": "Puding Maizena Jagung Manis",
    "bahan_bahan": "100g Tepung Maizena Panganesia, 100g Jagung Manis Pipil Panganesia, 500ml susu cair atau santan encer, 100g gula pasir (atau madu), sedikit vanila.",
    "langkah_masak": "1. Blender sebagian jagung manis dengan sedikit susu, saring jika ingin hasil yang sangat lembut.\\n2. Campur tepung maizena dengan sisa susu, aduk hingga rata.\\n3. Rebus susu jagung, gula, dan sisa jagung pipil utuh hingga mendidih.\\n4. Tuangkan larutan maizena sedikit demi sedikit sambil terus diaduk agar tidak menggumpal.\\n5. Masak hingga adonan mengental dan meletup-letup.\\n6. Tuang ke dalam cup kecil, dinginkan di dalam kulkas selama minimal 2 jam sebelum disajikan.",
    "kategori_jenis": "Snack",
    "informasi_gizi": "Kalori: 190 kkal, Lemak: 4g, Serat: 3g",
    "deskripsi_singkat": "Puding sutra yang sangat lembut menggunakan Tepung Maizena Panganesia. Tambahan Jagung Manis Pipil memberikan sensasi tekstur renyah di setiap gigitan. Dessert sehat yang rendah lemak dan menyegarkan.",
    "gambar_url": "https://picsum.photos/seed/pudingjagung/800/600",
    "id_kategori": null,
    "waktu_masak": 60
  },
  {
    "id_resep": 20,
    "judul_resep": "Tumis Rebung Jamur Kuping Pedas",
    "bahan_bahan": "150g Rebung Iris Panganesia, 50g Jamur Kuping Kering Panganesia (iris), 3 siung bawang merah, 2 siung bawang putih, 5 buah cabai rawit, 1 sdm Minyak Kelapa Panganesia.",
    "langkah_masak": "1. Rebus rebung iris selama 10 menit untuk memastikan teksturnya lembut dan bersih.\\n2. Iris tipis bawang merah, bawang putih, dan cabai rawit.\\n3. Tumis bumbu iris dengan minyak kelapa hingga harum.\\n4. Masukkan jamur kuping dan rebung, aduk rata.\\n5. Tambahkan sedikit air, garam, dan lada. Masak hingga air menyusut dan bumbu meresap sempurna.\\n6. Sajikan sebagai lauk makan siang yang ringan namun kaya serat.",
    "kategori_jenis": "Diet",
    "informasi_gizi": "Kalori: 140 kkal, Serat: 7g, Karbohidrat: 12g",
    "deskripsi_singkat": "Tumisan rendah kalori yang mengenyangkan. Tekstur Rebung Iris yang renyah berpadu dengan kenyalnya Jamur Kuping Panganesia. Menggunakan bumbu rempah sederhana tanpa tambahan penyedap buatan.",
    "gambar_url": "https://picsum.photos/seed/tumisrebung/800/600",
    "id_kategori": null,
    "waktu_masak": 50
  },
  {
    "id_resep": 21,
    "judul_resep": "Bola-Bola Ubi Cilembu Isi Cokelat",
    "bahan_bahan": "300g Ubi Jalar Cilembu Panganesia (panggang/kukus), 50g Tepung Tapioka Panganesia, 1 blok Gula Jawa (haluskan), cokelat batang untuk isian.",
    "langkah_masak": "1. Haluskan ubi cilembu yang sudah matang selagi masih hangat.\\n2. Campur ubi dengan tepung tapioka dan sedikit gula jawa hingga adonan bisa dipulung.\\n3. Ambil sedikit adonan, masukkan potongan cokelat ke tengahnya, lalu bulatkan hingga rapat.\\n4. Goreng dengan Minyak Kelapa Panganesia hingga bagian luarnya garing keemasan.\\n5. Tiriskan dan sajikan. Hati-hati saat menggigit karena cokelat di dalamnya akan lumer.",
    "kategori_jenis": "Snack",
    "informasi_gizi": "Kalori: 75 kkal/pcs, Karbohidrat: 15g, Vitamin A: Tinggi",
    "deskripsi_singkat": "Cemilan kekinian dengan bahan dasar Ubi Jalar Cilembu Panganesia. Rasa manis ubi yang sudah seperti madu berpadu dengan lelehan cokelat di dalamnya, menjadikannya snack favorit keluarga.",
    "gambar_url": "https://picsum.photos/seed/bolaubi/800/600",
    "id_kategori": null,
    "waktu_masak": 30
  }
];

// 2. Buat fungsi main yang bersih
async function main() {
  console.log('Seeding recipes...');

  for (const recipe of recipesData) {
    await prisma.resep.upsert({
      where: { id_resep: recipe.id_resep },
      update: recipe,
      create: recipe,
    });
  }

  console.log('Finished seeding recipes.');
}

// 3. Panggil fungsi main
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
