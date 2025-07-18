import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
}: PaginationProps) {
  const prevPages = Array.from(
    { length: Math.max(0, currentPage - 1 - Math.max(1, currentPage - 3) + 1) },
    (_, i) => Math.max(1, currentPage - 3) + i,
  );
  const nextPages = Array.from(
    {
      length: Math.max(
        0,
        Math.min(totalPages, currentPage + 3) - (currentPage + 1) + 1,
      ),
    },
    (_, i) => currentPage + 1 + i,
  );

  return (
    <div className="flex justify-center mt-6">
      <nav className="inline-flex">
        <Link
          href={`${baseUrl}?page=${Math.max(1, currentPage - 1)}`}
          className="px-3 py-2 cursor-pointer bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-l-md"
        >
          Previous
        </Link>

        {prevPages.map((num) => (
          <Link
            key={num}
            href={`${baseUrl}?page=${num}`}
            className="px-3 py-2 cursor-pointer border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {num}
          </Link>
        ))}

        <span className="px-3 py-2 border-t border-b border-gray-300 text-sm font-medium text-blue-600 bg-blue-100">
          {currentPage}
        </span>

        {nextPages.map((num) => (
          <Link
            key={num}
            href={`${baseUrl}?page=${num}`}
            className="px-3 py-2 cursor-pointer border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {num}
          </Link>
        ))}

        <Link
          href={`${baseUrl}?page=${Math.min(totalPages, currentPage + 1)}`}
          className="px-3 py-2 cursor-pointer bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-r-md"
        >
          Next
        </Link>
      </nav>
    </div>
  );
}
