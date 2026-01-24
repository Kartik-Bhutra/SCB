import { type Dispatch, type SetStateAction, useState } from "react";
import Modal from "@/app/(components)/Modal";
import { changeTypeAction } from "../action";

interface BlockedModalProps {
  openDelete: boolean;
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  deleteId: string;
  reload: () => void;
}

export default function BlockedModal({
  openDelete,
  setOpenDelete,
  deleteId,
  reload,
}: BlockedModalProps) {
  return (
    <Modal
      onConfirm={changeTypeAction}
      open={openDelete}
      setOpen={setOpenDelete}
      reload={reload}
      title="Delete Sequence"
    >
      <p>Are you sure you want to delete the sequence? It cannot be undone.</p>
      <input type="hidden" name="mobileNo" value={deleteId} />
    </Modal>
  );
}
