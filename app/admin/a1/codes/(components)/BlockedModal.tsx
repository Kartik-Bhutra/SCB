import Modal from "../../(components)/Modal";
import Select from "../../(components)/Select";
import SeqInput from "../../(components)/SeqInput";
import codes from "@/constants/CountryCodes.json";
import { addNo, deleteNo } from "../action";
import { Dispatch, SetStateAction } from "react";

interface BlockedModalProps {
  openCreate: boolean;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  openDelete: boolean;
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  deleteId: string;
  openUpload: boolean;
  setOpenUpload: Dispatch<SetStateAction<boolean>>;
  setRefresh: Dispatch<SetStateAction<boolean>>;
}

export default function BlockedModal({
  openCreate,
  setOpenCreate,
  openDelete,
  setOpenDelete,
  deleteId,
  openUpload,
  setOpenUpload,
  setRefresh,
}: BlockedModalProps) {
  return (
    <>
      <Modal
        onConfirm={addNo}
        open={openCreate}
        setOpen={setOpenCreate}
        setRefresh={setRefresh}
        title="Create Sequence"
      >
        <div>
          <Select
            options={codes.map((i) => ({
              label: `${i.name} ${i.dial_code}`,
              value: i.dial_code,
            }))}
          />
        </div>
      </Modal>

      <Modal
        onConfirm={deleteNo}
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

      <Modal
        open={openUpload}
        setOpen={setOpenUpload}
        title="Bulk Upload"
        onConfirm={addNo}
        setRefresh={setRefresh}
      >
        <div>
          <SeqInput />
        </div>
      </Modal>
    </>
  );
}
