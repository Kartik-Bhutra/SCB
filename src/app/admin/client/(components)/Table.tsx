import { clientData, deleteItemClent } from "@/types/serverActions";
import TableBody from "./TableBody";
import { Dispatch, SetStateAction, useState } from "react";
import Loader from "@/app/admin/(components)/Loader";
import ClientModal from "./ClientModal";
import NoData from "@/app/admin/(components)/NoData";
import Link from "next/link";

interface tableProps {
  data: clientData[];
  isLoading: boolean;
  setRefresh: Dispatch<SetStateAction<boolean>>;
  label: string;
}

export default function Table({
  data,
  isLoading,
  setRefresh,
  label,
}: tableProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteItem, setDeleteItem] = useState({} as deleteItemClent);
  return (
    <>
      <ClientModal
        label={label}
        openCreate={openCreate}
        setOpenCreate={setOpenCreate}
        openDelete={openDelete}
        setOpenDelete={setOpenDelete}
        deleteItem={deleteItem}
        setRefresh={setRefresh}
      />
      <div className="bg-white rounded-lg shadow-sm mx-auto max-w-[100vw]">
        <div className="flex justify-between items-center gap-2 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {label} Clients
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
                    Name
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
                  setOpenDelete={setOpenDelete}
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
