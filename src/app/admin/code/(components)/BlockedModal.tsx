import Modal from "../../(components)/Modal";
import Select from "../../(components)/Select";
import codes from "@/constants/CountryCodes.json";
import { addActionState, removeActionState } from "../action";
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
  setRefresh,
}: BlockedModalProps) {
  return (
    <>
      <Modal
        onConfirm={addActionState}
        open={openCreate}
        setOpen={setOpenCreate}
        setRefresh={setRefresh}
        title="Block Code"
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
        onConfirm={removeActionState}
        open={openDelete}
        setOpen={setOpenDelete}
        setRefresh={setRefresh}
        title="Unblock Code"
      >
        <p>
          Are you sure you want to unblock the code{" "}
          <strong>{deleteId}</strong>?
        </p>
        <input type="hidden" name="code" value={deleteId}></input>
      </Modal>
    </>
  );
}
