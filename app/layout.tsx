import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/app/context/ToastContext";
import ToastContainer from "@/components/Toast";
import "@/components/Toast.css";

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-jakarta",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id" className={plusJakarta.variable}>
            <body className={`antialiased ${plusJakarta.className}`}>
                <ToastProvider>
                    <Providers>
                        {children}
                    </Providers>
                    <ToastContainer />
                </ToastProvider>
            </body>
        </html>
    );
}