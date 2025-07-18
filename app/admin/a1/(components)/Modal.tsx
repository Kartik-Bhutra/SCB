import { useEffect, useRef, ReactNode } from "react";

interface ModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  children: ReactNode;
  title: string;
  onConfirm: () => void | Promise<void>;
  loading: boolean;
}

export default function Modal({
  open,
  setOpen,
  children,
  title,
  onConfirm,
  loading,
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);

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

  return open ? (
    <div
      ref={ref}
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
      className="fixed transition-all duration-300 inset-0 bg-black flex items-center animate-fade justify-center z-50"
    >
      <div
        ref={ref2}
        className="bg-white transition-transform duration-300  rounded-lg shadow-lg max-w-md w-full p-6 relative"
      >
        <div className="h-8 w-full flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            className="text-gray-500 cursor-pointer text-3xl hover:text-gray-700"
            onClick={() => handleClose()}
          >
            &times;
          </button>
        </div>
        <div className="text-gray-700 mb-4">{children}</div>

        <div className="flex justify-end space-x-2">
          <button
            className="bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
            onClick={() => handleClose()}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Confirming..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  ) : null;
}
