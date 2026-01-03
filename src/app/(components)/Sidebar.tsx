import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation, managerNavigation } from "@/constants/navbarItem";
import { logoutUser } from "../action";
import Links from "./Links";
import Logout from "./Logout";

interface SidebarProps {
  type: boolean;
}

export default function Sidebar({ type }: SidebarProps) {
  const pathname = usePathname();
  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/login";
  };
  return (
    <div className="hidden md:flex h-full flex-col">
      <nav className="flex-1">
        <div className="h-full bg-white/80 backdrop-blur-sm border-r border-blue-100 w-64 flex flex-col">
          <div className="flex-1 px-3 py-4 space-y-1">
            {(type ? adminNavigation : managerNavigation).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`relative group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/50"
                  }`}
                  >
                    <Links icon={item.icon} />
                    <span className="truncate">{item.name}</span>
                    {isActive && (
                      <div className="absolute left-0 w-1 h-full bg-blue-600 rounded-full" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
            >
              <Logout />
              Logout
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
