import nodemailer from 'nodemailer';

// Konfigurasi transporter menggunakan Gmail
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Fungsi pembantu (helper) biar tinggal panggil
export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const info = await transporter.sendMail({
            from: `"Panganesia Admin" <${process.env.EMAIL_USER}>`, // Nama pengirim
            to,
            subject,
            html, // Pakai HTML biar emailnya bisa didesain rapi
        });
        console.log("Email terkirim: %s", info.messageId);
        return { success: true };
    } catch (error) {
        console.error("Gagal mengirim email:", error);
        return { success: false, error };
    }
};