import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "Secure API Gateway",
  description: "JWT-authenticated API gateway dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
