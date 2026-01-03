import type { Dispatch, SetStateAction } from "react";
import Modal from "@/app/(components)/Modal";
import codes from "@/constants/CountryCodes.json";
import Select from "../../(components)/Select";
import { addActionState, removeActionState } from "../action";

interface BlockedModalProps {
  openCreate: boolean;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  openDelete: boolean;
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  deleteId: string;
  reload: () => void;
}

export default function BlockedModal({
  openCreate,
  setOpenCreate,
  openDelete,
  setOpenDelete,
  deleteId,
  reload,
}: BlockedModalProps) {
  return (
    <>
      <Modal
        onConfirm={addActionState}
        open={openCreate}
        setOpen={setOpenCreate}
        reload={reload}
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
        reload={reload}
        title="Unblock Code"
      >
        <p>
          Are you sure you want to unblock the code <strong>{deleteId}</strong>?
        </p>
        <input type="hidden" name="code" value={deleteId}></input>
      </Modal>
    </>
  );
}
