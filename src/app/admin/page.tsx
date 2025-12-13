"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="h-full bg-gray-50 p-2">
      <div className="max-w-4xl">
        <div className=" rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome Back, Admin
          </h1>
          <p className="mt-2 text-gray-600">
            You are logged in as {"Admin"}.
          </p>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text font-semibold text-gray-900">Quick Links</h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/client" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <h4 className="text-lg font-medium text-gray-900">Manage Clients</h4>
            <p className="mt-1 text-gray-600">View and manage client accounts.</p>
          </Link>
          <Link href="/admin/block" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <h4 className="text-lg font-medium text-gray-900">Blocked Numbers</h4>
            <p className="mt-1 text-gray-600">Review and update blocked numbers.</p>
          </Link>
          <Link href="/admin/code" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
            <h4 className="text-lg font-medium text-gray-900">Blocked Codes</h4>
            <p className="mt-1 text-gray-600">Manage blocked area codes.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
