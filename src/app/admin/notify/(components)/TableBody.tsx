import type { Data } from "../action";

interface TableBodyProps {
  data: Data[];
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

export default function TableBody({ data }: TableBodyProps) {
  return (
    <tbody>
      {data.map(({ code, mobileNo }, idx) => (
        <tr key={idx} className="odd:bg-white even:bg-gray-50 border-b border-gray-200">
          <td className="px-6 py-4 text-center">{code}</td>
          <td className="px-6 py-4 text-center">{formatValue(mobileNo)}</td>
        </tr>
      ))}
    </tbody>
  );
}
