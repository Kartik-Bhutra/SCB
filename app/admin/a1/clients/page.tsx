"use client";
import Link from "next/link";

export default function ClientsPage() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          Client Management
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/a1/clients/requests"
            className="transition-transform hover:scale-105"
          >
            <div className="p-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
              <h2 className="text-2xl font-semibold mb-2">
                Request for Approvals
              </h2>
              <p className="text-blue-100">
                Review and manage new client requests
              </p>
            </div>
          </Link>
          <Link
            href="/admin/a1/clients/approved"
            className="transition-transform hover:scale-105"
          >
            <div className="p-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md">
              <h2 className="text-2xl font-semibold mb-2">Approved Clients</h2>
              <p className="text-blue-100">View all approved client accounts</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
