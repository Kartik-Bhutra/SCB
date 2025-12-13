import { clientData, deleteItemClent } from "@/types/serverActions";
import { Dispatch, SetStateAction } from "react";

interface TableBodyProps {
  data: clientData[];
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  setDeleteItem: Dispatch<SetStateAction<deleteItemClent>>;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
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
  setDeleteItem,
  setOpenDelete,
  setOpenCreate,
}: TableBodyProps) {
  return (
    <tbody>
      {data.map(({ name,mobileNohashed,mobileNoEncrypted,mobNoEn ,type}) => (
        <tr
          key={mobNoEn}
          className="odd:bg-white even:bg-gray-50 border-b border-gray-200"
        >
          <td className="px-6 py-4 text-center">{name}</td>
          <td className="px-6 py-4 text-center">{formatValue(mobNoEn)}</td>
          <td className="px-6 py-4 flex justify-center text-center">
            {type!==0 ? (
              type===1?<button
                onClick={() => {
                  setDeleteItem({mobileNoHashed:mobileNohashed,type:type});
                  setOpenDelete(true);
                }}
                className="text-red-500 hover:underline"
              >
                Remove
              </button>:<button
                onClick={() => {
                  setDeleteItem({mobileNoHashed:mobileNohashed,type:type});
                  setOpenCreate(true);
                }}
                className="text-green-500 hover:underline"
              >
                Add Back
              </button>
            ) : (
              <div className="flex flex-row max-[900px]:flex-col gap-3 justify-center items-center">
                <button
                  onClick={() => {
                    setDeleteItem({mobileNoHashed:mobileNohashed,type:type});
                    setOpenCreate(true);
                  }}
                  className="text-green-500 hover:underline"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setDeleteItem({mobileNoHashed:mobileNohashed,type:type});
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
