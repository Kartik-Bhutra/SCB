import Modal from "../../(components)/Modal";
import { Dispatch, SetStateAction } from "react";
import { bulkUpload } from "../action";

interface ClientModalProps {
  openCreate: boolean;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  openDelete: boolean;
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  deleteId: string;
  setRefresh: Dispatch<SetStateAction<boolean>>;
}

export default function ClientModal({
  openCreate,
  setOpenCreate,
  openDelete,
  setOpenDelete,
  deleteId,
  setRefresh,
}: ClientModalProps) {
  return (
    <>
      <Modal
        onConfirm={bulkUpload}
        open={openCreate}
        setOpen={setOpenCreate}
        setRefresh={setRefresh}
        title="Create Sequence"
      >
        <p>
          Are you sure you want to delete the sequence? It cannot be undone.
        </p>
        <input type="hidden" name="mobileNo" value={deleteId} />
      </Modal>

      <Modal
        onConfirm={bulkUpload}
        open={openDelete}
        setOpen={setOpenDelete}
        setRefresh={setRefresh}
        title="Delete Sequence"
      >
        <p>
          Are you sure you want to delete the sequence? It cannot be undone.
        </p>
        <input type="hidden" name="mobileNo" value={deleteId} />
      </Modal>
    </>
  );
}
