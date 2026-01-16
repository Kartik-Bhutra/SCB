import { useState } from "react";
import Loader from "@/app/(components)/Loader";
import NoData from "@/app/(components)/NoData";
import type { Data } from "../action";
import ClientModal from "./ClientModal";
import TableBody from "./TableBody";

interface tableProps {
  data: Data[];
  isLoading: boolean;
  reload: () => void;
}

export default function Table({ data, isLoading, reload }: tableProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [deleteItem, setDeleteItem] = useState("");
  return (
    <>
      <ClientModal
        openCreate={openCreate}
        setOpenCreate={setOpenCreate}
        deleteItem={deleteItem}
        reload={reload}
      />
      <div className="bg-white rounded-lg shadow-sm mx-auto max-w-[100vw]">
        <div className="flex justify-between items-center gap-2 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Clients</h2>
        </div>
        {!data.length && !isLoading ? (
          <NoData />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3">
                    deviceId
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
                    <td colSpan={4} className="p-0">
                      <Loader />
                    </td>
                  </tr>
                </tbody>
              ) : (
                <TableBody
                  setOpenCreate={setOpenCreate}
                  data={data}
                  setDeleteItem={setDeleteItem}
                />
              )}
            </table>
          </div>
        )}
      </div>
    </>
  );
}
