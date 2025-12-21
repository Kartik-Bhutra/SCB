"use client";

import { Dispatch, SetStateAction } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  setPage: Dispatch<SetStateAction<number>>;
}

export default function Pagination({
  currentPage,
  totalPages,
  setPage,
}: PaginationProps) {
  const handlePageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawPage = Number(formData.get("page"));
    const safePage = Math.min(Math.max(1, rawPage), totalPages);
    setPage(safePage);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-6">
      <form
        onSubmit={handlePageSubmit}
        className="flex items-center border border-blue-300 rounded-md text-sm overflow-hidden"
      >
        <input
          name="page"
          type="number"
          min={1}
          max={totalPages}
          defaultValue={currentPage}
          className="px-3 py-1.5 w-20 focus:outline-none text-gray-800"
        />
        <span className="bg-blue-100 text-blue-700 px-2 py-1 border-l border-blue-300 select-none">
          / {totalPages}
        </span>
        <button
          type="submit"
          className="ml-2 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700"
        >
          Go
        </button>
      </form>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1 text-sm">
        <button
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          className="px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-l-md"
        >
          Previous
        </button>

        {Array.from(
          { length: Math.max(0, currentPage - Math.max(1, currentPage - 3)) },
          (_, i) => {
            const num = Math.max(1, currentPage - 3) + i;
            return (
              <button
                key={num}
                onClick={() => setPage(num)}
                className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                {num}
              </button>
            );
          },
        )}

        <span className="px-3 py-2 border border-gray-300 text-blue-600 bg-blue-100">
          {currentPage}
        </span>

        {Array.from(
          {
            length: Math.max(
              0,
              Math.min(totalPages, currentPage + 3) - (currentPage + 1) + 1,
            ),
          },
          (_, i) => {
            const num = currentPage + 1 + i;
            return (
              <button
                key={num}
                onClick={() => setPage(num)}
                className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                {num}
              </button>
            );
          },
        )}

        <button
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          className="px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-r-md"
        >
          Next
        </button>
      </div>
    </div>
  );
}
