import { Dispatch, SetStateAction } from "react";

interface TableBodyProps {
  data: string[];
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  setDeleteId: Dispatch<SetStateAction<string>>;
}

export default function TableBody({
  data,
  setDeleteId,
  setOpenDelete,
}: TableBodyProps) {
  return (
    <tbody>
      {data.map((code,key) => (
        <tr
          key={key}
          className="odd:bg-white even:bg-gray-50 border-b border-gray-200"
        >
          <td className="px-6 py-4 text-center">{code}</td>
          
          <td className="px-6 py-4 text-center">
            <button
              onClick={() => {
                setDeleteId(code);
                setOpenDelete(true);
              }}
              className="text-blue-500 hover:underline"
            >
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
