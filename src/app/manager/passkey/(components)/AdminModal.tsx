import Modal from "@/app/(components)/Modal";
import { Dispatch, SetStateAction } from "react";
import { deleteSession, generateSession } from "../action";

interface BlockedModalProps {
  openDelete: boolean;
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  deleteId: string;
  setRefresh: Dispatch<SetStateAction<boolean>>;
  createId: string;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  openCreate: boolean;
}

export default function BlockedModal({
  openDelete,
  setOpenDelete,
  deleteId,
  setRefresh,
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
        setRefresh={setRefresh}
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
        setRefresh={setRefresh}
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
