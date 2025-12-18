import Modal from "../../(components)/Modal";
import { Dispatch, SetStateAction } from "react";
import { changeTypeAction } from "../action";

interface ClientModalProps {
  openCreate: boolean;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  deleteItem: string;
  setRefresh: Dispatch<SetStateAction<boolean>>;
}

export default function ClientModal({
  openCreate,
  setOpenCreate,
  deleteItem,
  setRefresh,
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
        <p>Are you sure you want to do that</p>
        <input type="hidden" name="mobileType" value={deleteItem} />
      </Modal>
    </>
  );
}
