export default function Input({ label }: { label: string }) {
  return (
    <div className="max-w-sm my-4">
      <label
        htmlFor="name"
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        type="text"
        name="code"
        placeholder={label}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}
