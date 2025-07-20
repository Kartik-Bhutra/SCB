"use client";
import { useAdmin } from "@/hooks/useAdmin";

export default function HomePage() {
  const { adminType, userId, department } = useAdmin();
  return (
    <div className="h-full bg-gray-50 p-8">
      <div className="max-w-4xl">
        <div className=" rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome Back, {userId} from {department}
          </h1>
          <p className="mt-2 text-gray-600">
            You are logged in as {adminType ? "Owner" : "Administrator"}
          </p>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text font-semibold text-gray-900">Quick Links</h3>
        <div className=" grid grid-cols-1 gap-2 mt-3">
          <div className=" grid grid-cols-1 gap-2 mt-3"></div>
        </div>
      </div>
    </div>
  );
}
