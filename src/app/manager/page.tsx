import Link from "next/link";

export default function HomePage() {
  return (
    <div className="h-full bg-gray-50 p-2">
      <div className="max-w-4xl">
        <div className=" rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome Back, Manager
          </h1>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text font-semibold text-gray-900">Quick Links</h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/manager/passkey"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <h4 className="text-lg font-medium text-gray-900">Manage Admins</h4>
            <p className="mt-1 text-gray-600">
              View and manage client accounts.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
