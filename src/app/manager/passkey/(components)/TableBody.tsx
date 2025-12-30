import { Dispatch, SetStateAction } from "react";
import { Data } from "../action";

interface TableBodyProps {
  data: Data[];
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  setDeleteId: Dispatch<SetStateAction<string>>;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  setCreateId: Dispatch<SetStateAction<string>>;
}

export default function TableBody({
  data,
  setDeleteId,
  setOpenDelete,
  setCreateId,
  setOpenCreate,
}: TableBodyProps) {
  return (
    <tbody>
      {data.map(({ sessionId, userId }, key) => (
        <tr
          key={key}
          className="odd:bg-white even:bg-gray-50 border-b border-gray-200"
        >
          <td className="px-6 py-4 text-center">{userId}</td>

          <td className="px-6 py-4 text-center">{sessionId || "-"}</td>

          <td className="px-6 py-4 text-center">
            {sessionId ? (
              <button
                onClick={() => {
                  setDeleteId(userId);
                  setOpenDelete(true);
                }}
                className="text-blue-500 hover:underline"
              >
                Delete
              </button>
            ) : (
              <button
                onClick={() => {
                  setCreateId(userId);
                  setOpenCreate(true);
                }}
                className="text-blue-500 hover:underline"
              >
                Create
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  );
}
