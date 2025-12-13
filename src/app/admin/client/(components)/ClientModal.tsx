import Modal from "../../(components)/Modal";
import { Dispatch, SetStateAction } from "react";
import { changeTypeAction } from "../action";
import { deleteItemClent } from "@/types/serverActions";

interface ClientModalProps {
  openCreate: boolean;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  openDelete: boolean;
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  deleteItem: deleteItemClent;
  setRefresh: Dispatch<SetStateAction<boolean>>;
  label: string;
}

export default function ClientModal({
  openCreate,
  setOpenCreate,
  openDelete,
  setOpenDelete,
  deleteItem,
  setRefresh,
  label,
}: ClientModalProps) {
  return (
    <>
      <Modal
        onConfirm={changeTypeAction}
        open={openCreate}
        setOpen={setOpenCreate}
        setRefresh={setRefresh}
        title="Create Sequence"
      >
        <p>Are you sure you want to approve the client</p>
        <input type="hidden" name="mobileNoHashed" value={deleteItem.mobileNoHashed} />
        <input type="hidden" name="type" value={1} />
      </Modal>

      <Modal
        onConfirm={label === "Rejected" ? changeTypeAction : changeTypeAction}
        open={openDelete}
        setOpen={setOpenDelete}
        setRefresh={setRefresh}
        title="Delete Sequence"
      >
        <p>Are you sure you want to remove the client</p>
        <input type="hidden" name="mobileNoHashed" value={deleteItem.mobileNoHashed} />
        <input type="hidden" name="type" value={2} />
      </Modal>
    </>
  );
}
