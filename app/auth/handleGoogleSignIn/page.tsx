const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
        // Menggunakan NextAuth untuk memicu login Google
        // callbackUrl memastikan user dilempar ke DashboardProduct setelah login sukses
        await signIn("google", { callbackUrl: "/DashboardProduct" });
    } catch (err: any) {
        setError("Gagal masuk dengan Google. Silakan coba lagi.");
    } finally {
        setLoading(false);
    }
};