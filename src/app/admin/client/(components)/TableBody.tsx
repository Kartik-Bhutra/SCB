import type { Dispatch, SetStateAction } from "react";
import type { Data } from "../action";

interface TableBodyProps {
  data: Data[];
  setDeleteItem: Dispatch<SetStateAction<string>>;
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
  setOpenCreate,
}: TableBodyProps) {
  return (
    <tbody>
      {data.map(({ name, mobileNo, type }) => (
        <tr
          key={mobileNo}
          className="odd:bg-white even:bg-gray-50 border-b border-gray-200"
        >
          <td className="px-6 py-4 text-center">{name}</td>
          <td className="px-6 py-4 text-center">{formatValue(mobileNo)}</td>
          <td className="px-6 py-4 flex justify-center text-center">
            {type !== 0 ? (
              type === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteItem(`${mobileNo}:2`);
                    setOpenCreate(true);
                  }}
                  className="text-red-500 hover:underline"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteItem(`${mobileNo}:1`);
                    setOpenCreate(true);
                  }}
                  className="text-green-500 hover:underline"
                >
                  Add Back
                </button>
              )
            ) : (
              <div className="flex flex-row max-[900px]:flex-col gap-3 justify-center items-center">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteItem(`${mobileNo}:1`);
                    setOpenCreate(true);
                  }}
                  className="text-green-500 hover:underline"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteItem(`${mobileNo}:2`);
                    setOpenCreate(true);
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
