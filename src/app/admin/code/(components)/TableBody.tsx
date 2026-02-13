import type { Dispatch, SetStateAction } from "react";

interface TableBodyProps {
  data: string[];
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  setDeleteId: Dispatch<SetStateAction<string>>;
}

import countryData from "@/constants/CountryCodes.json";

const codeToName = new Map<string, string>();
countryData.forEach((country: { name: string; dial_code: string }) => {
  codeToName.set(country.dial_code, country.name);
});

export default function TableBody({ data, setDeleteId, setOpenDelete }: TableBodyProps) {
  return (
    <tbody>
      {data.map((code) => (
        <tr key={code} className="odd:bg-white even:bg-gray-50 border-b border-gray-200">
          <td className="px-6 py-4 text-center">{code}</td>
          <td className="px-6 py-4 text-center">{codeToName.get(code)}</td>

          <td className="px-6 py-4 text-center">
            <button
              type="button"
              onClick={() => {
                setDeleteId(code);
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
