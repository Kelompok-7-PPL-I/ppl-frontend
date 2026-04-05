"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; // Import ini wajib untuk navigasi
import './page.css'; // Pastikan CSS lo update pakai yang di bawah
import { motion, useInView } from 'framer-motion';

// --- DEFINISI TIPE DATA (TYPESCRIPT) ---
interface HistoryCardData {
    year: string;
    img: string;
    desc: string;
    align: 'left' | 'right' | 'center';
    size: 'small' | 'medium' | 'large';
}

interface EraSection {
    era: string;
    label: string;
    cards: HistoryCardData[];
}

// --- MAIN COMPONENT ---
export default function LandingPage() {
    const [currentIndex, setCurrentIndex] = useState(0); // Untuk Hero Carousel
    const [activeEra, setActiveEra] = useState('1950s'); // Untuk Auto-Scroll History

    // --- A. DATA HERO CAROUSEL (DESKRIPSI LENGKAP) ---
    const slides = [
        {
            type: "hero",
            title: "Tahukah Kamu?",
            subHeading: "Paradoks Ketahanan Pangan di Negeri Agraris",
            img: "/images/indonesian-image-home.png",
            alt: "Peta diversifikasi pangan Indonesia",
            // --- INI DESKRIPSI LENGKAP HERO 1 ---
            desc: "Indonesia merupakan salah satu negara dengan keragaman pangan terbesar di dunia. Namun, tahukah kamu bahwa masyarakat Indonesia masih sangat bergantung pada beras sebagai komoditas pangan utama? Bahkan, Indonesia masih mengimpor beras dari negara lain meskipun menyandang predikat sebagai salah satu dari lima negara agraris terbesar di dunia. Kenyataan ini adalah tamparan besar yang mengingatkan bahwa kita harus menjadi bangsa yang mandiri secara pangan (kemandirian pangan). Padahal, aneka ragam pangan lokal tersedia melimpah di setiap daerah dan dapat dikonsumsi oleh seluruh lapisan masyarakat, seperti sorgum, jagung, ubi kleci, dan masih banyak lagi. Mari kita kembalikan diversifikasi pangan ke piring makan kita sehari-hari!"
        },
        {
            type: "support",
            title: "Belanja di Panganesia",
            subHeading: "Wujudkan Kedaulatan Pangan dari Rumah",
            img: "/images/ecommerce-preview.png",
            alt: "Interface E-commerce Panganesia",
            // --- INI DESKRIPSI LENGKAP HERO 2 ---
            desc: "Panganesia hadir sebagai jembatan digital bagi Anda yang ingin berkontribusi langsung dalam mendukung pahlawan pangan lokal kita. Di platform e-commerce kami, Anda dapat menemukan kurasi produk pangan alternatif premium mulai dari beras singkong rendah glikemik, tepung mokaf serbaguna, hingga mi sagu instan yang sehat dan lezat. Setiap produk yang Anda beli merupakan bentuk dukungan terhadap petani lokal yang menjaga tradisi budidaya tanaman asli nusantara. Mari beralih ke gaya hidup yang lebih sehat dengan mengeksplorasi cita rasa asli Indonesia. Klik tombol di bawah untuk mulai petualangan kuliner sehat Anda hari ini!"
        },
        {
            type: "video",
            title: "Edukasi Pangan",
            subHeading: "#KenyangGakHarusNasi",
            videoUrl: "https://www.youtube.com/embed/Cuw2TFYEcck?autoplay=1&mute=1&loop=1",
            alt: "Video Edukasi Diversifikasi Pangan",
            // --- INI DESKRIPSI LENGKAP HERO 3 ---
            desc: "Melalui gerakan ini, kita ditantang untuk merombak kebiasaan lama yang menganggap hanya nasi yang bisa memberikan rasa kenyang. Padahal, kekayaan sumber karbohidrat Indonesia seperti jagung, singkong, ubi, hingga sagu memiliki kandungan gizi dan energi yang setara, bahkan lebih tinggi serat dibanding nasi putih. Video dari Asumsi ini memperlihatkan bagaimana ketergantungan kita pada satu komoditas membuat kita lupa akan potensi besar pangan lokal yang lebih adaptif dan ramah lingkungan. Mari buktikan bahwa kenyang berkualitas bisa datang dari mana saja. Dengan mendukung diversifikasi pangan, kita tidak hanya menjaga kesehatan tubuh sendiri, tapi juga memperkuat ketahanan pangan nasional demi masa depan anak cucu kita yang tidak lagi terjebak dalam ketergantungan impor beras."
        }
    ];

    const prevSlide = () => setCurrentIndex(currentIndex === 0 ? slides.length - 1 : currentIndex - 1);
    const nextSlide = () => setCurrentIndex(currentIndex === slides.length - 1 ? 0 : currentIndex + 1);

    const currentHero = slides[currentIndex];

    const historyData: EraSection[] = [
        {
            era: '1950s',
            label: 'Pondasi',
            cards: [
                { year: '1952', img: '/images/history-1952.png', desc: 'Pemerintah mulai fokus pada pemulihan lahan pasca perang. Upaya swasembada beras pertama kali dicanangkan untuk stabilitas nasional.', align: 'right', size: 'large' },
                { year: '1966', img: '/images/history-1966.png', desc: 'Lahirnya instruksi Presiden No. 16 Tahun 1966 tentang Komando Logistik Nasional (KOLOGNAS) untuk mengamankan persediaan pangan.', align: 'left', size: 'large' },
            ]
        },
        {
            era: '1970s',
            label: 'Orde Baru',
            cards: [
                { year: '1970', img: '/images/history-1970.png', desc: 'Revolusi Hijau dimulai secara masif. Sistem irigasi modern dan pupuk kimia difokuskan sepenuhnya pada komoditas beras.', align: 'right', size: 'large' },
                { year: '1984', img: '/images/history-1984.png', desc: 'Indonesia mencapai Swasembada Beras. Prestasi ini mendapat pengakuan dunia melalui penghargaan dari FAO di Roma.', align: 'left', size: 'large' },
                { year: '1998', img: '/images/history-1998.png', desc: 'Krisis ekonomi menyebabkan pergeseran kebijakan. Fokus kembali pada ketahanan pangan rumah tangga dan pemulihan sektor pertanian.', align: 'right', size: 'medium' },
            ]
        },
        {
            era: '2000s',
            label: 'Penyadaran',
            cards: [
                { year: '2012', img: '/images/history-2012.png', desc: 'Lahirnya UU Pangan yang menekankan kedaulatan, kemandirian, dan ketahanan pangan berbasis potensi lokal.', align: 'left', size: 'medium' },
                { year: '2020-2024', img: '/images/history-2020.png', desc: 'Gerakan #KenyangGakHarusNasi masif digalakkan. Pangan lokal seperti Sorgum kembali menjadi primadona baru untuk menghadapi krisis iklim.', align: 'right', size: 'large' },
            ]
        },
    ];

    return (
        <main className="landing-page">
            <div className="main-wrapper">
                {/* --- HEADER (TETAP SAMA) --- */}
                <header className="header">
                    <div className="logo-container">
                        <img src="/images/logo-panganesia.png" alt="Logo Panganesia" className="logo-img" />
                    </div>
                    <Link href="/auth">
                        <button className="btn-login">Login</button>
                    </Link>
                </header>

                {/* --- HERO SECTION (DESKRIPSI LENGKAP) --- */}
                <section className="hero" id="hero-section">
                    <div className="hero-carousel">
                        <button className="nav-btn" onClick={prevSlide}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>

                        <div className="hero-carousel-content">
                            <h1 className="hero-title">{currentHero.title}</h1>
                            <div className="inside-title-split">
                                {currentHero.type === "support" ? (
                                    <>
                                        <div className="media-container">
                                            <img src={currentHero.img} alt={currentHero.alt} className="content-img" />
                                        </div>
                                        <div className="text-content">
                                            <h2 className="sub-heading">{currentHero.subHeading}</h2>
                                            <p className="description">{currentHero.desc}</p>
                                            <button className="btn-cta">BELANJA SEKARANG</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-content">
                                            <h2 className="sub-heading">{currentHero.subHeading}</h2>
                                            <p className="description">{currentHero.desc}</p>
                                        </div>
                                        <div className="media-container">
                                            {currentHero.type === "video" ? (
                                                <div className="video-wrapper">
                                                    <iframe src={currentHero.videoUrl} title={currentHero.alt} frameBorder="0" allowFullScreen></iframe>
                                                </div>
                                            ) : (
                                                <img src={currentHero.img} alt={currentHero.alt} className="content-img" />
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="carousel-dots">
                                {slides.map((_, i) => (
                                    <div key={i} className={`dot ${i === currentIndex ? 'active' : ''}`} onClick={() => setCurrentIndex(i)} />
                                ))}
                            </div>
                        </div>

                        <button className="nav-btn" onClick={nextSlide}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6 6-6"/></svg>
                        </button>
                    </div>
                </section>

                {/* --- BENEFIT SECTION (DESKRIPSI LENGKAP & PADDING FIX) --- */}
                <section className="benefit-section" id="benefit-section">
                    <div className="benefit-header">
                        <div className="badge-container"><span className="benefit-badge">Benefit</span></div>
                        <h2 className="benefit-main-title">Berdaulat di Atas Tanah Sendiri dengan Pangan Negeri</h2>
                        <p className="benefit-subtitle">
                             {/* --- DESKRIPSI SUBTITLE BENEFIT --- */}
                             Kenapa harus tergantung sama satu jenis pangan kalau kita punya pilihan yang melimpah? 
                             Diversifikasi pangan itu seru, sehat, dan pastinya bikin kita lebih mandiri.
                        </p>
                        <button className="btn-benefit-cta">Dukung Pangan Lokal Indonesia</button>
                    </div>

                    <div className="benefit-container">
                        <div className="benefit-masonry-wrapper">
                            <div className="benefit-col">
                                <BenefitCard icon="🧪" title="Nutrisi Beragam" desc="Pangan lokal seperti sorgum dan jagung kaya akan serat serta memiliki indeks glikemik rendah." size="short" />
                                <BenefitCard icon="🌾" title="Bebas Gluten & Alami" desc="Sebagian besar sumber karbohidrat lokal bersifat alami tanpa modifikasi berlebih, menjadikannya pilihan aman bagi diet sehat jangka panjang." size="tall" />
                            </div>
                            <div className="benefit-col central">
                                <BenefitCard icon="🔱" title="Mandiri Tanpa Impor" desc="Dengan mengonsumsi apa yang tumbuh di tanah sendiri, kita mengurangi ketergantungan pada stok pangan luar negeri dan menjaga stabilitas harga nasional bagi seluruh rakyat." size="featured" />
                                <BenefitCard icon="🔗" title="Tangguh Perubahan" desc="Tanaman lokal jauh lebih adaptif terhadap iklim tropis Indonesia menghadapi cuaca ekstrem." size="short" />
                            </div>
                            <div className="benefit-col">
                                <BenefitCard icon="👨‍🌾" title="Sejahterakan Petani" desc="Setiap suapan pangan lokal adalah dukungan langsung bagi kesejahteraan petani di pelosok daerah agar ekonomi desa berputar." size="tall" />
                                <BenefitCard icon="🌳" title="Ramah Lingkungan" desc="Jejak karbon lebih rendah karena logistik dekat dan bahan makanan jauh lebih segar." size="short" />
                            </div>
                        </div>
                        <div className="benefit-card wide-footer">
                            <div className="card-icon">🍱</div>
                            <h3>Warisan untuk Masa Depan</h3>
                            <p>Melestarikan pangan lokal berarti menjaga keberagaman hayati Indonesia dan memastikan anak cucu kita masih bisa menikmati kekayaan alam nusantara.</p>
                        </div>
                    </div>
                </section>

                {/* --- HISTORY SECTION (FULL LENGKAP DENGAN SUBTITLE) --- */}
                <section className="history-section" id="history-section">
                    <div className="history-intro">
                        <h2 className="history-main-title">History</h2>
                        {/* --- SUBTITLE HISTORY YANG TADI HILANG --- */}
                        <p className="history-subtitle">
                            Telusuri bagaimana sejarah bangsa Indonesia dalam hal ketahanan pangan. Pernah ngga sih penasaran kenapa kita punya pernyataan <strong>“belum kenyang kalau belum makan nasi”</strong>? Yuk belajar awal mulanya!
                        </p>
                    </div>
                    
                    {/* --- NAVIGATION STICKY (SIMETRIS) --- */}
                    <div className="history-nav-sticky">
                        <div className="nav-horizontal-container">
                            <div className="nav-gold-line"></div>
                            <div className="nav-items">
                                {historyData.map((item) => (
                                    <div 
                                        key={item.era} 
                                        className={`nav-node ${activeEra === item.era ? 'active' : ''}`}
                                        onClick={() => document.getElementById(item.era)?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        <span className="nav-txt">{item.era}</span>
                                        <div className="nav-visual-wrapper">
                                            {activeEra === item.era ? (
                                                <motion.div layoutId="navIndicator" className="nav-indicator-bar" />
                                            ) : (
                                                <div className="nav-dot-point"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- TIMELINE CONTENT (ZIGZAG & REVEAL ANIMATION) --- */}
                    <div className="timeline-grid">
                        <div className="grid-spine"></div>
                        {historyData.map((section) => (
                            <EraBlock 
                                key={section.era} 
                                section={section} 
                                onVisible={(era: string) => setActiveEra(era)} 
                            />
                        ))}
                        <div className="history-end-text">To be continued</div>
                    </div>
                </section>

                <footer className="footer-container">
                    <div className="footer-content">
                        {/* Kolom 1: Branding & Slogan */}
                        <div className="footer-branding">
                        <div className="footer-logo-wrapper">
                            <img src="/images/logo-footer.png" alt="Panganesia Logo" className="footer-logo" />
                        </div>
                        <p className="footer-slogan">
                            Mari Bersama Wujudkan Kemandirian Pangan Bangsa Indonesia!
                        </p>
                        </div>

                        {/* Kolom 2: Informasi Kontak */}
                        <div className="footer-contact">
                        <h4 className="footer-title">INFORMASI KONTAK</h4>
                        {/* Bagian Kontak */}
                        <div className="contact-item">
                            <svg className="contact-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                            </svg>
                            <a href="mailto:hello.panganesia@gmail.com">hello.panganesia@gmail.com</a>
                        </div>

                        <div className="contact-item">
                            <svg className="contact-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                            <a href="tel:+6281234567">+62-8123-4567</a>
                        </div>

                        {/* Bagian Social Media */}
                        <div className="social-media">
                            {/* Instagram */}
                            <a href="#" className="social-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </a>
                            {/* LinkedIn */}
                            <a href="#" className="social-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                    <rect x="2" y="9" width="4" height="12"></rect>
                                    <circle cx="4" cy="4" r="2"></circle>
                                </svg>
                            </a>
                            {/* Whatsapp */}
                            <a href="#" className="social-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                            </a>
        
                        </div>
                        <button className="footer-btn-dukung">Dukung Pangan Lokal Sekarang</button>
                        </div>

                        {/* Kolom 3: Links */}
                        <div className="footer-links">
                        <h4 className="footer-title">LINKS</h4>
                        <ul>
                            <li><Link href="#hero-section">› Sebaran Pangan Lokal</Link></li>
                            <li><Link href="#benefit-section">› Benefit</Link></li>
                            <li><Link href="#history-section">› History</Link></li>
                            <li><Link href="/auth">› Login</Link></li>
                        </ul>
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="footer-bottom">
                        <p><strong>Panganesia.</strong> 2026. All right reserved.</p>
                    </div>
                    </footer>
                
            </div>
        </main>
    );
}

// --- SUB-KOMPONEN DENGAN TYPESCRIPT ---

function BenefitCard({ icon, title, desc, size }: { icon: string; title: string; desc: string; size: string }) {
    return (
        <div className={`benefit-card ${size}`}>
            <div className="card-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{desc}</p>
        </div>
    );
}

interface EraBlockProps {
    section: EraSection;
    onVisible: (era: string) => void;
}

const EraBlock = ({ section, onVisible }: EraBlockProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { amount: 0.3 }); // Deteksi saat 30% area era terlihat

    useEffect(() => {
        if (isInView) onVisible(section.era);
    }, [isInView, section.era, onVisible]);

    return (
        <div id={section.era} ref={ref} className="era-block-container" style={{ width: '100%' }}>
            <div className="era-marker">
                <div className="era-circle-big">
                    <span className="era-yr">{section.era}</span>
                    <span className="era-lb">{section.label}</span>
                </div>
            </div>

            {section.cards.map((card, idx) => (
                <HistoryCard key={idx} card={card} />
            ))}
        </div>
    );
};

const HistoryCard = ({ card }: { card: HistoryCardData }) => {
    return (
        <motion.div 
            className={`grid-row ${card.align}`}
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // Custom ease-out
        >
            {card.align !== 'left' && <div className="empty-side"></div>}
            
            <div className={`content-side ${card.size}`}>
                <div className="history-card">
                    {/* --- TAHUN DI DALAM CARD --- */}
                    <div className="card-img-wrapper">
                        <img src={card.img} alt={card.year} className="card-img" />
                    </div>
                    <div className="card-text-content">
                        <h3 className="card-year-inside">{card.year}</h3>
                        {/* --- DESKRIPSI CARD LENGKAP --- */}
                        <p className="card-desc">{card.desc}</p>
                    </div>
                </div>
            </div>

            <div className="connector-node"></div>
            
            {card.align !== 'right' && <div className="empty-side"></div>}
        </motion.div>
    );
}