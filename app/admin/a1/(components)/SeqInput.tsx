import { useRef, useState } from "react";

export default function SeqInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      setValue((prev) => prev.slice(0, -1));
      return;
    }

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      setValue((prev) => (prev.length < 12 ? prev + e.key : prev));
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <label
        htmlFor="displayedNumber"
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        Enter Sequence
      </label>

      <input
        id="displayedNumber"
        ref={inputRef}
        value={formatValue(value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className="w-full font-mono text-xl tracking-widest text-center px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        maxLength={12}
        inputMode="numeric"
      />

      <input type="hidden" name="number" value={value} />

      <p className="text-sm text-gray-500 mt-1">Max 12 digits.</p>
    </div>
  );
}
