import EyeCloseIcon from "@/icons/EyeClose";
import EyeOpenIcon from "@/icons/EyeOpen";
import { useState } from "react";

export default function PasswordBtn() {
  const [eye, setEye] = useState(false);
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Password
      </label>
      <div className="relative">
        <input
          type={eye ? "text" : "password"}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
          placeholder="Enter your password"
          name="password"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          onClick={() => setEye((prev) => !prev)}
        >
          {eye ? <EyeOpenIcon /> : <EyeCloseIcon />}
        </button>
      </div>
    </div>
  );
}
