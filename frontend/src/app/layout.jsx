import "./globals.css";
import { AuthProvider } from "../context/AuthContext";//all pages use same login info(one authn context) instead of every page fetching and storing login info separately 

//used by browser automatically for tab title etc
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
