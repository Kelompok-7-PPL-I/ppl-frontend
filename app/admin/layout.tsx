import AdminSidebar from "./components/AdminSidebar";
import "./layout.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-content">{children}</main>
    </div>
  );
}