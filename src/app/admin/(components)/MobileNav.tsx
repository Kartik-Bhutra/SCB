"use client";
import MobileLinks from "./MobileLinks";
import Cross from "@/app/admin/(components)/Cross";
import Logout from "./Logout";
import Links from "./Links";
import Link from "next/link";
import { usePathname } from "next/navigation";
// import { logoutUser } from "@/utils/adminActions";
import { navigation } from "@/constants/navbarItem";

interface MobileNavProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function MobileNav({ isOpen, setIsOpen }: MobileNavProps) {
  const pathname = usePathname();
  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-900"
      >
        <MobileLinks isOpen={isOpen} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-white">
          <div className="pt-5 pb-6 px-5">
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">Menu</div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <Cross />
              </button>
            </div>

            <nav className="mt-8 flex flex-col h-[calc(100vh-8rem)]">
              <div className="flex-1 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 text-base font-medium rounded-xl transition-all duration-200
                        ${
                          isActive
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <Links icon={item.icon} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={()=>{}}
                  className="w-full flex items-center px-3 py-2.5 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                >
                  <Logout />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
