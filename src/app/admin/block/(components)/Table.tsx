import { useState } from "react";
import Loader from "@/app/(components)/Loader";
import NoData from "@/app/(components)/NoData";
import type { Data } from "../action";
import BlockedModal from "./BlockedModal";
import TableBody from "./TableBody";

interface tableProps {
  data: Data[];
  isLoading: boolean;
  reload: () => void;
}

export default function Table({ data, isLoading, reload }: tableProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [openUpload, setOpenUpload] = useState(false);
  return (
    <>
      <BlockedModal
        openCreate={openCreate}
        setOpenCreate={setOpenCreate}
        openDelete={openDelete}
        setOpenDelete={setOpenDelete}
        deleteId={deleteId}
        openUpload={openUpload}
        setOpenUpload={setOpenUpload}
        reload={reload}
      />
      <div className="bg-white rounded-lg shadow-sm mx-auto max-w-[100vw]">
        <div className="flex justify-between items-center gap-2 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Blocked Numbers
          </h2>
          <fieldset className="inline-flex rounded-md shadow-xs">
            <button
              type="button"
              onClick={() => setOpenCreate(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-s mr-px"
            >
              New Sequence
            </button>
            <button
              type="button"
              onClick={() => setOpenUpload(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-e"
            >
              Bulk Upload
            </button>
          </fieldset>
        </div>
        {!data.length && !isLoading ? (
          <NoData />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
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
                    <td colSpan={4} className="p-0">
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
