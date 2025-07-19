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

const formatValue = (val: string) => {
  const chunks = [];
  for (let i = 0; i < val.length; ) {
    const remaining = val.length - i;
    const size = remaining > 4 ? 3 : remaining;
    chunks.push(val.slice(i, i + size));
    i += size;
  }
  return chunks.join("-");
};

export default function TableBody({
  data,
  setDeleteId,
  setOpenDelete,
}: TableBodyProps) {
  return (
    <tbody>
      {data.map(({ createdAt, MNE, blockedBy }) => (
        <tr
          key={MNE}
          className="odd:bg-white even:bg-gray-50 border-b border-gray-200"
        >
          <td className="px-6 py-4 font-semibold text-gray-900 text-center">
            {formatTimestamp(createdAt)}
          </td>
          <td className="px-6 py-4 text-center">{formatValue(MNE)}</td>
          <td className="px-6 py-4 text-center">{blockedBy}</td>

          <td className="px-6 py-4 text-center">
            <button
              onClick={() => {
                setDeleteId(MNE);
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
