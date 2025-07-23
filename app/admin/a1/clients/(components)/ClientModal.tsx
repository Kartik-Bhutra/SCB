import Modal from "../../(components)/Modal";
import { Dispatch, SetStateAction } from "react";
import { approveNo, makeNormal, removeNo } from "../action";

interface ClientModalProps {
  openCreate: boolean;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  openDelete: boolean;
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  deleteId: string;
  setRefresh: Dispatch<SetStateAction<boolean>>;
  label: string;
}

export default function ClientModal({
  openCreate,
  setOpenCreate,
  openDelete,
  setOpenDelete,
  deleteId,
  setRefresh,
  label,
}: ClientModalProps) {
  return (
    <>
      <Modal
        onConfirm={approveNo}
        open={openCreate}
        setOpen={setOpenCreate}
        setRefresh={setRefresh}
        title="Create Sequence"
      >
        <p>Are you sure you want to add the MobileNo</p>
        <input type="hidden" name="mobileNo" value={deleteId} />
      </Modal>

      <Modal
        onConfirm={label === "Rejected" ? makeNormal : removeNo}
        open={openDelete}
        setOpen={setOpenDelete}
        setRefresh={setRefresh}
        title="Delete Sequence"
      >
        <p>Are you sure you want to remove that mobileNo</p>
        <input type="hidden" name="mobileNo" value={deleteId} />
      </Modal>
    </>
  );
}
