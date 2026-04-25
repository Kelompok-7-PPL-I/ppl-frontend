"use client";
import { useEffect, useRef, useState } from 'react';
import './LandingPage.css';
import { motion, useInView, AnimatePresence } from 'framer-motion';

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

export default function LandingPage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeEra, setActiveEra] = useState('1950s');
    const [isScrolled, setIsScrolled] = useState(false);

useEffect(() => {
    window.scrollTo(0, 0)
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
}, [])

    const slides = [
        {
            type: "hero",
            eyebrow: "Tahukah Kamu?",
            title: "Paradoks Ketahanan Pangan",
            highlight: "di Negeri Agraris",
            img: "/images/indonesian-image-home.png",
            alt: "Peta diversifikasi pangan Indonesia",
            desc: "Indonesia menyandang predikat sebagai salah satu dari lima negara agraris terbesar di dunia — namun masih mengimpor beras. Kita punya sorgum, jagung, ubi, sagu, dan ratusan pangan lokal melimpah. Sudah saatnya kita kembalikan keberagaman ke piring makan kita.",
            cta: null,
            stat: "77%",
            statLabel: "konsumsi pangan nasional masih bergantung pada beras"
        },
        {
            type: "support",
            eyebrow: "Belanja di Panganesia",
            title: "Wujudkan Kedaulatan",
            highlight: "Pangan dari Rumah",
            img: "/images/ecommerce-preview.png",
            alt: "Interface E-commerce Panganesia",
            desc: "Temukan kurasi produk pangan alternatif premium — beras singkong rendah glikemik, tepung mokaf serbaguna, hingga mi sagu instan. Setiap produk yang kamu beli adalah dukungan nyata bagi petani lokal penjaga tradisi nusantara.",
            cta: "MULAI BELANJA",
            stat: "500+",
            statLabel: "produk pangan lokal tersedia untuk kamu"
        },
        {
            type: "video",
            eyebrow: "Edukasi Pangan",
            title: "#KenyangGakHarus",
            highlight: "Nasi",
            videoUrl: "https://www.youtube.com/embed/Cuw2TFYEcck?autoplay=1&mute=1&loop=1",
            alt: "Video Edukasi Diversifikasi Pangan",
            desc: "Kekayaan sumber karbohidrat Indonesia — jagung, singkong, ubi, sagu — memiliki kandungan gizi dan energi setara, bahkan lebih tinggi serat dibanding nasi putih. Kita bisa kenyang berkualitas dari mana saja.",
            cta: null,
            stat: "300+",
            statLabel: "jenis pangan lokal tumbuh di tanah nusantara"
        }
    ];

    const prevSlide = () => setCurrentIndex(i => i === 0 ? slides.length - 1 : i - 1);
    const nextSlide = () => setCurrentIndex(i => i === slides.length - 1 ? 0 : i + 1);

    useEffect(() => {
        const timer = setInterval(nextSlide, 7000);
        return () => clearInterval(timer);
    }, []);

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

                {/* ========== HEADER ========== */}
                <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
                    <div className="header-inner">
                        <div className="logo-container">
                            <img src="/images/logo-panganesia.png" alt="Logo Panganesia" className="logo-img" />
                        </div>
                        <nav className="header-nav">
                            <a href="#hero-section" className="nav-link">Beranda</a>
                            <a href="#benefit-section" className="nav-link">Manfaat</a>
                            <a href="#history-section" className="nav-link">Sejarah</a>
                        </nav>
                        <div className="header-actions">
                            <a href="/auth">
                                <button className="btn-login">
                                    <span>Masuk</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </button>
                            </a>
                        </div>
                    </div>
                </header>

                {/* ========== HERO SECTION ========== */}
                <section className="hero" id="hero-section">
                    <div className="hero-bg-decoration">
                        <div className="hero-grain"></div>
                        <div className="hero-circle-1"></div>
                        <div className="hero-circle-2"></div>
                        <div className="hero-leaf-pattern">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className={`leaf leaf-${i + 1}`}>🌾</div>
                            ))}
                        </div>
                    </div>

                    <div className="hero-slide-counter">
                        <span className="counter-current">{String(currentIndex + 1).padStart(2, '0')}</span>
                        <div className="counter-bar">
                            <motion.div
                                className="counter-progress"
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 7, ease: 'linear' }}
                            />
                        </div>
                        <span className="counter-total">{String(slides.length).padStart(2, '0')}</span>
                    </div>

                    {/* ✅ di AnimatePresence — force re-evaluate tree */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            className="hero-content-grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className={`hero-text-panel ${currentHero.type === 'support' ? 'order-2' : 'order-1'}`}>
                                <motion.span
                                    className="hero-eyebrow"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.6 }}
                                >
                                    {currentHero.eyebrow}
                                </motion.span>

                                <motion.h1
                                    className="hero-title-main"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.7 }}
                                >
                                    {currentHero.title}
                                    <br />
                                    <span className="hero-title-highlight">{currentHero.highlight}</span>
                                </motion.h1>

                                <motion.p
                                    className="hero-desc"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35, duration: 0.6 }}
                                >
                                    {currentHero.desc}
                                </motion.p>

                                <motion.div
                                    className="hero-stat-card"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                >
                                    <span className="stat-number">{currentHero.stat}</span>
                                    <span className="stat-label">{currentHero.statLabel}</span>
                                </motion.div>

                                <motion.div
                                    className="hero-actions"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6, duration: 0.5 }}
                                >
                                    {currentHero.cta ? (
                                        <a href="/auth">
                                            <button className="btn-hero-primary">{currentHero.cta}</button>
                                        </a>
                                    ) : (
                                        <a href="/auth">
                                            <button className="btn-hero-primary">Jelajahi Marketplace</button>
                                        </a>
                                    )}
                                    <a href="#benefit-section" className="btn-hero-ghost">Pelajari Lebih →</a>
                                </motion.div>
                            </div>

                            <motion.div
                                className={`hero-media-panel ${currentHero.type === 'support' ? 'order-1' : 'order-2'}`}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                            >
                                <div className="hero-media-frame">
                                    <div className="media-frame-decoration"></div>
                                    {currentHero.type === "video" ? (
                                        <div className="video-wrapper">
                                            <iframe src={(currentHero as any).videoUrl} title={currentHero.alt} frameBorder="0" allowFullScreen></iframe>
                                        </div>
                                    ) : (
                                        <img src={currentHero.img} alt={currentHero.alt} className="hero-media-img" />
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="hero-nav-controls">
                        <button className="hero-nav-btn" onClick={prevSlide} aria-label="Previous">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                        <div className="hero-dots">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    className={`hero-dot ${i === currentIndex ? 'active' : ''}`}
                                    onClick={() => setCurrentIndex(i)}
                                    aria-label={`Slide ${i + 1}`}
                                />
                            ))}
                        </div>
                        <button className="hero-nav-btn" onClick={nextSlide} aria-label="Next">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </section>

                {/* ========== BENEFIT SECTION ========== */}
                <section className="benefit-section" id="benefit-section">
                    <div className="benefit-header">
                        <div className="badge-container"><span className="benefit-badge">Manfaat</span></div>
                        <h2 className="benefit-main-title">Berdaulat di Atas Tanah Sendiri dengan Pangan Negeri</h2>
                        <p className="benefit-subtitle">
                            Kenapa harus tergantung sama satu jenis pangan kalau kita punya pilihan yang melimpah?
                            Diversifikasi pangan itu seru, sehat, dan pastinya bikin kita lebih mandiri.
                        </p>
                        <a href="/auth"><button className="btn-benefit-cta">Dukung Pangan Lokal Indonesia</button></a>
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

                {/* ========== HISTORY SECTION ========== */}
                <section className="history-section" id="history-section">
                    <div className="history-intro">
                        <h2 className="history-main-title">Sejarah</h2>
                        <p className="history-subtitle">
                            Telusuri bagaimana sejarah bangsa Indonesia dalam hal ketahanan pangan. Pernah ngga sih penasaran kenapa kita punya pernyataan <strong>"belum kenyang kalau belum makan nasi"</strong>? Yuk belajar awal mulanya!
                        </p>
                    </div>

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

                {/* ========== FOOTER ========== */}
                <footer className="footer">
                    <div className="footer-cta-band">
                        <div className="footer-cta-grain"></div>
                        <div className="footer-cta-inner">
                            <div className="footer-cta-decor">
                                <span>🌾</span><span>🌽</span><span>🍠</span>
                            </div>
                            <h2 className="footer-cta-title">
                                Siap Jadi Bagian dari<br />
                                <span className="footer-cta-highlight">Gerakan Pangan Lokal?</span>
                            </h2>
                            <p className="footer-cta-sub">
                                Login sekarang dan mulai eksplorasi ratusan produk pangan lokal pilihan dari seluruh penjuru nusantara.
                            </p>
                            <a href="/auth">
                                <button className="footer-cta-btn">
                                    Masuk ke Marketplace
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </button>
                            </a>
                        </div>
                    </div>

                    <div className="footer-body">
                        <div className="footer-body-grain"></div>
                        <div className="footer-body-inner">
                            <div className="footer-brand-col">
                                <div className="footer-logo-wrap">
                                    <img src="/images/logo-panganesia.png" alt="Panganesia" className="footer-logo" />
                                </div>
                                <p className="footer-tagline">
                                    Mari Bersama Wujudkan<br />Kemandirian Pangan<br />Bangsa Indonesia.
                                </p>
                                <div className="footer-socials">
                                    <a href="#" className="footer-social-btn" aria-label="Instagram">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                                        </svg>
                                    </a>
                                    <a href="#" className="footer-social-btn" aria-label="LinkedIn">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                                        </svg>
                                    </a>
                                    <a href="#" className="footer-social-btn" aria-label="WhatsApp">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            <div className="footer-divider-v"></div>

                            <div className="footer-links-col">
                                <h4 className="footer-col-title">Navigasi</h4>
                                <ul className="footer-link-list">
                                    <li><a href="#hero-section">Beranda</a></li>
                                    <li><a href="#benefit-section">Manfaat Pangan Lokal</a></li>
                                    <li><a href="#history-section">Sejarah Pangan Indonesia</a></li>
                                    <li><a href="/auth">Login / Daftar</a></li>
                                </ul>
                            </div>

                            <div className="footer-contact-col">
                                <h4 className="footer-col-title">Hubungi Kami</h4>
                                <div className="footer-contact-list">
                                    <a href="mailto:hello.panganesia@gmail.com" className="footer-contact-item">
                                        <div className="footer-contact-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                        </div>
                                        <span>hello.panganesia@gmail.com</span>
                                    </a>
                                    <a href="tel:+6281234567" className="footer-contact-item">
                                        <div className="footer-contact-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                        </div>
                                        <span>+62-8123-4567</span>
                                    </a>
                                    <div className="footer-badge-row">
                                        <span className="footer-badge-pill">🌱 100% Lokal</span>
                                        <span className="footer-badge-pill">🇮🇩 Produk Indonesia</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="footer-bottom">
                            <div className="footer-bottom-inner">
                                <p className="footer-copyright">
                                    <strong>Panganesia.</strong> 2026. Semua hak dilindungi.
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </main>
    );
}

// ===== SUB-COMPONENTS =====

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
    const [mounted, setMounted] = useState(false);
    const isInView = useInView(ref, { amount: 0.3 });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && isInView) onVisible(section.era);
    }, [mounted, isInView, section.era, onVisible]);

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
            viewport={{ once: false, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            {card.align !== 'left' && <div className="empty-side"></div>}
            <div className={`content-side ${card.size}`}>
                <div className="history-card">
                    <div className="card-img-wrapper">
                        <img src={card.img} alt={card.year} className="card-img" />
                    </div>
                    <div className="card-text-content">
                        <h3 className="card-year-inside">{card.year}</h3>
                        <p className="card-desc">{card.desc}</p>
                    </div>
                </div>
            </div>
            <div className="connector-node"></div>
            {card.align !== 'right' && <div className="empty-side"></div>}
        </motion.div>
    );
};