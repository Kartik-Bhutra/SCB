"use client";

import {
  type PublicKeyCredentialRequestOptionsJSON,
  startAuthentication,
} from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import PasswordBtn from "@/app/(components)/PasswordBtn";
import type { loginActionResult } from "@/types/serverActions";
import { startLogin, completeLogin } from "./action";

export default function LoginForm() {
  const router = useRouter();

  const [state, actionHandler, isLoading] = useActionState<
    loginActionResult | PublicKeyCredentialRequestOptionsJSON,
    FormData
  >(startLogin, "");

  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!state) return;

    if (typeof state === "string") {
      if (state === "OK") {
        router.replace("/manager");
        return;
      }

      setLocalError(state);
      return;
    }

    if (!window.PublicKeyCredential) {
      setLocalError("WebAuthn is not supported on this device");
      return;
    }

    (async () => {
      try {
        const credential = await startAuthentication({
          optionsJSON: state,
        });

        const result = await completeLogin(credential);

        if (result !== "OK") {
          setLocalError(result);
          return;
        }

        router.replace("/admin");
      } catch {
        setLocalError("Authentication was cancelled or failed");
      }
    })();
  }, [state, router]);

  function handleInputChange() {
    if (localError) setLocalError("");
  }

  const inputClass = [
    "w-full px-3 sm:px-4 py-2.5 sm:py-3",
    "border border-gray-200 rounded-xl",
    "text-sm sm:text-base transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  ].join(" ");

  const submitClass = [
    "w-full py-2.5 sm:py-3 px-4",
    "bg-blue-600 text-white rounded-xl font-medium text-sm sm:text-base",
    "transition-all duration-200 hover:bg-blue-700 focus:outline-none",
    "focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    "transform hover:-translate-y-0.5 disabled:opacity-50",
  ].join(" ");

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
            className={inputClass}
          />
        </div>

        <PasswordBtn handleInputChange={handleInputChange} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="remember-me"
            className="h-4 w-4 text-blue-600 rounded-lg border-gray-300 transition-all duration-200"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 text-xs sm:text-sm text-gray-600"
          >
            Remember me
          </label>
        </div>

        <button
          type="button"
          className="text-xs sm:text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
        >
          Forgot password?
        </button>
      </div>

      {localError && (
        <div
          className="w-full px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mt-2"
          style={{ minHeight: "1.5rem" }}
        >
          {localError}
        </div>
      )}

      <button type="submit" disabled={isLoading} className={submitClass}>
        Sign In
      </button>
    </form>
  );
}
