import Modal from "@/app/(components)/Modal";
import { Dispatch, SetStateAction } from "react";
import { generateSession } from "../action";

interface BlockedModalProps {
  openDelete: boolean;
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  deleteId: string;
  setRefresh: Dispatch<SetStateAction<boolean>>;
}

export default function BlockedModal({
  openDelete,
  setOpenDelete,
  deleteId,
  setRefresh,
}: BlockedModalProps) {
  return (
    <Modal
      onConfirm={generateSession}
      open={openDelete}
      setOpen={setOpenDelete}
      setRefresh={setRefresh}
      title="Generate Token"
    >
      <p>
        Are you sure you want to do that <strong>{deleteId}</strong>?
      </p>
      <input type="hidden" name="userId" value={deleteId}></input>
    </Modal>
  );
}
