"use client";

import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useActionState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { toast } from "react-toastify";
import type { ActionResult } from "@/types/serverActions";

interface ModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
  title: string;
  onConfirm: (state: ActionResult, formData: FormData) => Promise<ActionResult>;

  reload: () => void;
}

export default function Modal({
  open,
  setOpen,
  children,
  title,
  onConfirm,
  reload,
}: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, actionHandler, isLoading] = useActionState(onConfirm, "");

  const handleClose = useCallback(() => {
    const backdrop = backdropRef.current;
    const form = formRef.current;

    if (!backdrop || !form) return;

    backdrop.style.opacity = "0";
    form.style.transform = "scale(0.9)";

    const id = setTimeout(() => {
      setOpen(false);
    }, 301);

    return () => clearTimeout(id);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;

    const backdrop = backdropRef.current;
    const form = formRef.current;

    if (!backdrop || !form) return;

    backdrop.style.opacity = "0";
    form.style.transform = "scale(0.9)";

    const id = setTimeout(() => {
      backdrop.style.opacity = "1";
      form.style.transform = "scale(1)";
    }, 10);

    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!state || isLoading) return;

    if (state === "OK") {
      toast.success("Success!");
      reload();
      handleClose();
    } else {
      toast.error(state);
    }
  }, [state, isLoading, reload, handleClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300"
    >
      <form
        ref={formRef}
        action={actionHandler}
        className="w-full max-w-md transform rounded-lg bg-white p-6 shadow-lg transition-transform duration-300"
      >
        <div className="flex h-8 items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-3xl text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="my-4 text-gray-700">{children}</div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Confirming..." : "Confirm"}
          </button>
        </div>
      </form>
    </div>
  );
}
