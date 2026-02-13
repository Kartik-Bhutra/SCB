import type { Dispatch, SetStateAction } from "react";
import type { Data } from "../action";

interface TableBodyProps {
  data: Data[];
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  setDeleteId: Dispatch<SetStateAction<string>>;
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

export default function TableBody({ data, setDeleteId, setOpenDelete }: TableBodyProps) {
  return (
    <tbody>
      {data.map(({ mobileNo, type, reporter }) => (
        <tr
          key={mobileNo}
          className={`odd:bg-white even:bg-gray-50 border-b border-gray-200 ${
            type ? "line-through text-gray-400" : ""
          }`}
        >
          <td className="px-6 py-4 text-center">{formatValue(mobileNo)}</td>
          <td className="px-6 py-4 text-center">{reporter}</td>
          <td className="px-6 py-4 text-center">
            {type !== 0 ? (
              type === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteId(`${mobileNo}:2`);
                    setOpenDelete(true);
                  }}
                  className="text-red-500 hover:underline"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteId(`${mobileNo}:1`);
                    setOpenDelete(true);
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
                    setDeleteId(`${mobileNo}:1`);
                    setOpenDelete(true);
                  }}
                  className="text-green-500 hover:underline"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteId(`${mobileNo}:2`);
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
