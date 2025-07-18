"use client";

import { serverActionState } from "@/types/serverActions";
import {
  useEffect,
  useRef,
  ReactNode,
  Dispatch,
  SetStateAction,
  useActionState,
} from "react";

interface ModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
  title: string;
  onConfirm: (
    _: serverActionState,
    formData: FormData,
  ) => Promise<serverActionState>;
  setRefresh: Dispatch<SetStateAction<boolean>>;
}

export default function Modal({
  open,
  setOpen,
  children,
  title,
  onConfirm,
  setRefresh,
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLFormElement>(null);

  const handleClose = () => {
    if (ref.current) {
      ref.current.style.opacity = "0";
      if (ref2.current) {
        ref2.current.style.transform = "scale(0.9)";
      }
      setTimeout(() => {
        setOpen(false);
      }, 301);
    }
  };

  const [state, actionHandler, isLoading] = useActionState(onConfirm, {
    error: "",
    success: false,
  });

  useEffect(() => {
    if (open && ref.current && ref2.current) {
      ref.current.style.opacity = "0";
      ref2.current.style.transform = "scale(0.9)";
      setTimeout(() => {
        ref.current!.style.opacity = "1";
        ref2.current!.style.transform = "scale(1)";
      }, 10);
    }
  }, [open]);

  useEffect(() => {
    if (state.success) {
      console.log("h11");
      handleClose();
      setRefresh((prev) => !prev);
    }
  }, [state]);

  return open ? (
    <div
      ref={ref}
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
      className="fixed transition-all duration-300 inset-0 bg-black flex items-center justify-center z-50"
    >
      <form
        ref={ref2}
        action={actionHandler}
        className="bg-white transition-transform duration-300 rounded-lg shadow-lg max-w-md w-full p-6 relative"
      >
        <div className="h-8 w-full flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            type="button"
            className="text-gray-500 text-3xl hover:text-gray-700"
            onClick={handleClose}
          >
            &times;
          </button>
        </div>

        <div className="text-gray-700 my-4">{children}</div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={handleClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Confirming..." : "Confirm"}
          </button>
        </div>
      </form>
    </div>
  ) : null;
}
