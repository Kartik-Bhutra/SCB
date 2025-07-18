import { blockedData } from "@/types/serverActions";
import { Dispatch, SetStateAction } from "react";

interface TableBodyProps {
  data: blockedData[];
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  setDeleteId: Dispatch<SetStateAction<string>>;
}

function formatTimestamp(timestamp: string | Date) {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function TableBody({
  data,
  setDeleteId,
  setOpenDelete,
}: TableBodyProps) {
  return (
    <tbody>
      {data.map((item) => (
        <tr
          key={item.mobileNoEncrypted}
          className="odd:bg-white even:bg-gray-50 border-b border-gray-200"
        >
          <td className="px-6 py-4 font-semibold text-gray-900 text-center">
            {formatTimestamp(item.createdAt)}
          </td>
          <td className="px-6 py-4 text-center">{item.mobileNoEncrypted}</td>
          <td className="px-6 py-4 text-center">
            <button
              onClick={() => {
                setDeleteId(item.mobileNoEncrypted);
                setOpenDelete(true);
              }}
              className="text-red-500 hover:underline"
            >
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
