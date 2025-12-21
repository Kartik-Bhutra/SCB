"use client";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import React, { useEffect, useState } from "react";

interface DashboardProps {
  children: React.ReactNode;
  type : boolean;
}

export default function Dashboard({
  children,
  type
}: DashboardProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [status, setStatus] = useState(true);
  useEffect(() => {
    const setOnline = () => setStatus(true);
    const setOffline = () => setStatus(false);

    setStatus(navigator.onLine);

    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);

    return () => {
      window.removeEventListener("online", setOnline);
      window.removeEventListener("offline", setOffline);
    };
  }, []);
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
      <header className="fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between bg-white/80 backdrop-blur-sm px-4 shadow-md md:px-6 border-b border-blue-100">
        <div className="flex items-center gap-4">
          <MobileNav
            isOpen={isMobileMenuOpen}
            setIsOpen={setIsMobileMenuOpen}
            type={type}
          />
          <h1 className="text-xl font-semibold bg-linear-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Army Admin
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div
            className={`w-2 h-2 rounded-full bg-${
              status ? "green" : "red"
            }-500`}
          ></div>
          <span className="font-medium text-gray-900 mr-1"></span>
        </div>
      </header>

      <div className={`flex pt-16 ${isMobileMenuOpen ? "hidden md:flex" : ""}`}>
        <aside className="fixed left-0 hidden md:block w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200">
          <Sidebar type={type}/>
        </aside>

        <main className="w-full md:ml-64 min-h-[calc(100vh-4rem)] p-4 md:p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
                {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
