import Link from "next/link";

export default function ClientsPage() {
  return (
    <div className="max-w-[800px] mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-10 text-center">
          Client Management
        </h1>
        <div className="flex flex-col space-y-6">
          <Link
            href="/admin/a1/clients/requests"
            className="transition-all duration-300 hover:scale-102 hover:shadow-xl"
          >
            <div className="p-8 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
              <h2 className="text-2xl font-semibold mb-3">
                Request for Approvals
              </h2>
              <p className="text-blue-100 text-lg">
                Review and manage new client requests
              </p>
            </div>
          </Link>
          <Link
            href="/admin/a1/clients/approved"
            className="transition-all duration-300 hover:scale-102 hover:shadow-xl"
          >
            <div className="p-8 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md">
              <h2 className="text-2xl font-semibold mb-3">Approved Clients</h2>
              <p className="text-green-100 text-lg">
                View all approved client accounts
              </p>
            </div>
          </Link>
          <Link
            href="/admin/a1/clients/rejected"
            className="transition-all duration-300 hover:scale-102 hover:shadow-xl"
          >
            <div className="p-8 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md">
              <h2 className="text-2xl font-semibold mb-3">Rejected Clients</h2>
              <p className="text-red-100 text-lg">
                View all rejected client accounts
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
