"use client";
import MobileLinks from "@/icons/MobileLinks";
import Cross from "@/icons/Cross";
import Logout from "@/icons/Logout";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/utils/userActions";

interface MobileNavProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function MobileNav({ isOpen, setIsOpen }: MobileNavProps) {
  const router = useRouter();
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
              <div className="flex-1 space-y-1"></div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={async () => {
                    const { success } = await logoutUser();
                    if (success) {
                      router.replace("/login");
                    }
                  }}
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
