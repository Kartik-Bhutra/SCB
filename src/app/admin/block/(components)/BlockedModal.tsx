import { type Dispatch, type SetStateAction, useState } from "react";
import Modal from "@/app/(components)/Modal";
import codes from "@/constants/CountryCodes.json";
import Select from "../../(components)/Select";
import SeqInput from "../../(components)/SeqInput";
import { addNoAction, bulkUploadAction, changeTypeAction } from "../action";

interface BlockedModalProps {
  openCreate: boolean;
  setOpenCreate: Dispatch<SetStateAction<boolean>>;
  openDelete: boolean;
  setOpenDelete: Dispatch<SetStateAction<boolean>>;
  deleteId: string;
  openUpload: boolean;
  setOpenUpload: Dispatch<SetStateAction<boolean>>;
  reload: () => void;
}

export default function BlockedModal({
  openCreate,
  setOpenCreate,
  openDelete,
  setOpenDelete,
  deleteId,
  openUpload,
  setOpenUpload,
  reload,
}: BlockedModalProps) {
  const [number, setNumber] = useState("");
  return (
    <>
      <Modal
        onConfirm={addNoAction}
        open={openCreate}
        setOpen={setOpenCreate}
        reload={reload}
        title="Create Sequence"
      >
        <div>
          <Select
            options={codes.map((i) => ({
              label: `${i.name} ${i.dial_code}`,
              value: i.dial_code,
            }))}
          />
          <SeqInput value={number} setValue={setNumber} />
        </div>
      </Modal>

      <Modal
        onConfirm={changeTypeAction}
        open={openDelete}
        setOpen={setOpenDelete}
        reload={reload}
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
        onConfirm={bulkUploadAction}
        reload={reload}
      >
        <p className="text-sm mt-5 text-gray-500">
          Upload a text or CSV file of phone numbers to block.
        </p>
        <div className="w-full mt-5">
          <label htmlFor="file-input" className="sr-only">
            Choose file
          </label>
          <input
            accept=".txt,.csv"
            type="file"
            name="file-input"
            className="block cursor-pointer w-full border border-gray-200 shadow-sm rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none file:bg-gray-50 file:border-0 file:me-4 file:py-3 file:px-4"
          />
        </div>
      </Modal>
    </>
  );
}
