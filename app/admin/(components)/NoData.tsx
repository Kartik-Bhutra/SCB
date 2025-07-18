import NoDataIcon from "@/icons/NoData";
import Link from "next/link";

export default function NoData() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="text-gray-300 mb-4">
        <NoDataIcon />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">
        No Data Found
      </h2>
      <p className="text-gray-600 mb-6 max-w-md">
        There are currently no client requests available.
      </p>
      <Link
        href="/admin"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
