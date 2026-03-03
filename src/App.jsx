// src/App.jsx
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Manifiesto from "./components/Manifiesto";
import Proceso from "./components/Proceso";
import Footer from "./components/Footer";
import Sofia from "./components/Sofia";
import AdminSofia from "./components/AdminSofia";
import { useState, useEffect } from "react";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkHash = () => setIsAdmin(window.location.hash === "#admin");
    checkHash(); // run once
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  if (isAdmin) {
    return <AdminSofia />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Manifiesto />
        <Proceso />
      </main>
      <Footer />
      {/* S.O.F.I.A. — Floating Widget (renders FAB + Chat Panel) */}
      <Sofia />
    </div>
  );
}
