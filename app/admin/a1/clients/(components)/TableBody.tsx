import { clientData } from "@/types/serverActions";
import { Dispatch, SetStateAction } from "react";

interface TableBodyProps {
  data: clientData[];
  isApproved: boolean;
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  setDeleteId: Dispatch<SetStateAction<string>>;
}

export default function TableBody({
  data,
  isApproved,
  setDeleteId,
  setOpenDelete,
}: TableBodyProps) {
  return (
    <tbody>
      {data.map(({ MNE, username }) => (
        <tr
          key={MNE}
          className="odd:bg-white even:bg-gray-50 border-b border-gray-200"
        >
          <td className="px-6 py-4 text-center">{MNE}</td>
          <td className="px-6 py-4 text-center">{username}</td>
          <td className="px-6 py-4 flex justify-center text-center">
            {isApproved ? (
              <button
                onClick={() => {
                  setDeleteId(MNE);
                  setOpenDelete(true);
                }}
                className="text-red-500 hover:underline"
              >
                Remove
              </button>
            ) : (
              <div className="flex flex-row max-[900px]:flex-col gap-3 justify-center items-center">
                <button
                  onClick={() => {
                    setDeleteId(MNE);
                    setOpenDelete(true);
                  }}
                  className="text-green-500 hover:underline"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setDeleteId(MNE);
                    setOpenDelete(true);
                  }}
                  className="text-red-500 hover:underline"
                >
                  Decline
                </button>
              </div>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  );
}
