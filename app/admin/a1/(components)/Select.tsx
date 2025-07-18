import { Dispatch, SetStateAction } from "react";

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  options: Option[];
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  label: string;
}

export default function Select({
  options,
  value,
  setValue,
  label,
}: SelectProps) {
  return (
    <div className="max-w mx-auto my-4">
      <label
        htmlFor="options"
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        id="options"
        name="options"
        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((option, key) => (
          <option key={key} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
