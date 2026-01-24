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
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  return (
    <>
      <BlockedModal
        openDelete={openDelete}
        setOpenDelete={setOpenDelete}
        deleteId={deleteId}
        reload={reload}
      />
      <div className="bg-white rounded-lg shadow-sm mx-auto max-w-[100vw]">
        <div className="flex justify-between items-center gap-2 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Reported Numbers
          </h2>
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
                    reporters
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
