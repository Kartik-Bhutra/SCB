import Logout from "@/icons/Logout";
import { logoutUser } from "@/utils/userActions";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();
  return (
    <div className="hidden md:flex h-full flex-col">
      <nav className="flex-1">
        <div className="h-full bg-white/80 backdrop-blur-sm border-r border-blue-100 w-64 flex flex-col">
          <div className="flex-1 px-3 py-4 space-y-1"></div>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={async () => {
                const { success } = await logoutUser();
                if (success) {
                  router.replace("/login");
                }
              }}
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
