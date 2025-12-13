interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  options: Option[];
}

export default function Select({ options }: SelectProps) {
  return (
    <div className="max-w mx-auto my-4">
      <label
        htmlFor="code"
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        Select Country
      </label>
      <select
        id="code"
        name="code"
        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        defaultValue="+91"
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
