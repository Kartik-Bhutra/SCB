"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import PasswordBtn from "@/app/(components)/PasswordBtn";
import { serverAction } from "./action";

export default function LoginForm() {
  const router = useRouter();
  const [state, actionHandler, isLoading] = useActionState(serverAction, "");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!state) return;

    if (state !== "OK") {
      setLocalError(state);
      return;
    }

    router.push("/login");
  }, [state, router]);

  function handleInputChange() {
    if (localError) setLocalError("");
  }

  return (
    <form className="space-y-4 sm:space-y-6" action={actionHandler}>
      <div className="space-y-4 sm:space-y-5">
        <div className="space-y-1.5 sm:space-y-2">
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="userId"
          >
            User Id
          </label>
          <input
            type="text"
            name="userId"
            required
            placeholder="Enter your user Id"
            onChange={handleInputChange}
            onFocus={handleInputChange}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm sm:text-base
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <PasswordBtn handleInputChange={handleInputChange} />
        <PasswordBtn handleInputChange={handleInputChange} name="newPassword" />
      </div>

      {localError && (
        <div className="w-full px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {localError}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 sm:py-3 px-4 bg-blue-600 text-white rounded-xl font-medium
          transition-all duration-200 hover:bg-blue-700 focus:outline-none
          focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        Change Password
      </button>
    </form>
  );
}
