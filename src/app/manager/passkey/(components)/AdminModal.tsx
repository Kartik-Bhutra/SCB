import type { Dispatch, SetStateAction } from "react";
import Modal from "@/app/(components)/Modal";
import { deleteSession, generateSession } from "../action";

interface BlockedModalProps {
  openDelete: boolean;
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  deleteId: string;
  reload: () => void;
  createId: string;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  openCreate: boolean;
}

export default function BlockedModal({
  openDelete,
  setOpenDelete,
  deleteId,
  reload,
  createId,
  openCreate,
  setOpenCreate,
}: BlockedModalProps) {
  return (
    <>
      <Modal
        onConfirm={deleteSession}
        open={openDelete}
        setOpen={setOpenDelete}
        reload={reload}
        title="Delete Token"
      >
        <p>
          Are you sure you want to do that <strong>{deleteId}</strong>?
        </p>
        <input type="hidden" name="userId" value={deleteId}></input>
      </Modal>
      <Modal
        onConfirm={generateSession}
        open={openCreate}
        setOpen={setOpenCreate}
        reload={reload}
        title="Generate Token"
      >
        <p>
          Are you sure you want to do that <strong>{createId}</strong>?
        </p>
        <input type="hidden" name="userId" value={createId}></input>
      </Modal>
    </>
  );
}
