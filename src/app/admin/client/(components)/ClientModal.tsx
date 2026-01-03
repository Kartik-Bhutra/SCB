import type { Dispatch, SetStateAction } from "react";
import Modal from "@/app/(components)/Modal";
import { changeTypeAction } from "../action";

interface ClientModalProps {
  openCreate: boolean;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  deleteItem: string;
  reload: () => void;
}

export default function ClientModal({
  openCreate,
  setOpenCreate,
  deleteItem,
  reload,
}: ClientModalProps) {
  return (
    <Modal
      onConfirm={changeTypeAction}
      open={openCreate}
      setOpen={setOpenCreate}
      reload={reload}
      title="Create Sequence"
    >
      <p>Are you sure you want to do that</p>
      <input type="hidden" name="mobileType" value={deleteItem} />
    </Modal>
  );
}
