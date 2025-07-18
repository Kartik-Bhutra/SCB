import Loader from "@/app/admin/(components)/Loader";
import NoData from "@/app/admin/(components)/NoData";
import { blockedData } from "@/types/serverActions";
import { Dispatch, SetStateAction, useState } from "react";
import TableBody from "./TableBody";
import Modal from "../../(components)/Modal";
import Select from "../../(components)/Select";
import SeqInput from "../../(components)/SeqInput";
import codes from "@/constants/CountryCodes.json";
import { addNo, deleteNo } from "../action";

interface tableProps {
  data: blockedData[];
  isLoading: boolean;
  setRefresh: Dispatch<SetStateAction<boolean>>;
}

export default function Table({ data, isLoading, setRefresh }: tableProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [openUpload, setOpenUpload] = useState(false);
  const [code, setCode] = useState("+91");
  const [seq, setSeq] = useState("");
  const [loading, setLoading] = useState(false);
  // const [validNumbers, setValidNumbers] = useState([]);
  return (
    <>
      <Modal
        onConfirm={async () => {
          const fullNumber = `${code}${seq}`;
          if (!seq) {
            return;
          }
          setLoading(true);
          const { success } = await addNo(fullNumber);
          if (!success) {
            return;
          }
          setOpenCreate(false);
          setSeq("");
          setRefresh((prev) => !prev);
          setLoading(false);
        }}
        open={openCreate}
        setOpen={setOpenCreate}
        title="Create Sequence"
        loading={loading}
      >
        <div>
          <Select
            value={code}
            setValue={setCode}
            label="Select Country"
            options={codes.map((i) => ({
              label: `${i.name} ${i.dial_code}`,
              value: i.dial_code,
            }))}
          />
          <SeqInput value={seq} setValue={setSeq} />
        </div>
      </Modal>

      <Modal
        onConfirm={async () => {
          if (!deleteId) return;
          setLoading(true);
          const { success } = await deleteNo(deleteId);
          if (!success) {
            return;
          }
          setOpenDelete(false);
          setDeleteId("");
          setRefresh((prev) => !prev);
          setLoading(false);
        }}
        open={openDelete}
        setOpen={setOpenDelete}
        loading={loading}
        title="Delete Sequence"
      >
        Are you sure you want to delete the sequence? It cannot be undone.
      </Modal>
      <Modal
        open={openUpload}
        setOpen={setOpenUpload}
        title="Bulk Upload"
        loading={loading}
        onConfirm={async () => {}}
      >
        <p className="text-sm mt-5 text-gray-500">
          Upload a text or CSV file of phone numbers to block.
        </p>
        <div className="w-full mt-5 ">
          <label htmlFor="file-input" className="sr-only">
            Choose file
          </label>
          <input
            accept=".txt,.csv"
            onChange={async () => {}}
            type="file"
            name="file-input"
            id="file-input"
            className="block cursor-pointer w-full border border-gray-200 shadow-sm rounded-lg text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none file:bg-gray-50 file:border-0
    file:me-4
    file:py-3 file:px-4"
          ></input>
        </div>
      </Modal>
      <div className="bg-white rounded-lg shadow-sm mx-auto max-w-[100vw]">
        <div className="flex justify-between items-center gap-2 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Blocked Numbers
          </h2>
          <div className="inline-flex rounded-md shadow-xs" role="group">
            <button
              onClick={() => setOpenCreate(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-s mr-[1px]"
            >
              New Sequence
            </button>
            <button
              onClick={() => setOpenUpload(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-e"
            >
              Bulk Upload
            </button>
          </div>
        </div>
        {!data.length && !isLoading ? (
          <NoData />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Number
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Action
                  </th>
                </tr>
              </thead>
              {isLoading ? (
                <tbody>
                  <tr>
                    <td colSpan={3} className="p-0">
                      <Loader />
                    </td>
                  </tr>
                </tbody>
              ) : (
                <TableBody
                  data={data}
                  setOpenDelete={setOpenDelete}
                  setDeleteId={setDeleteId}
                />
              )}
            </table>
          </div>
        )}
      </div>
    </>
  );
}
