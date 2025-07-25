"use client";

import { useEffect, useState } from "react";
import { clientData } from "@/types/serverActions";
import Pagination from "../../../(components)/Pagination";
import Error from "../../../(components)/Error";
import { fetchData } from "../action";
import Table from "../(components)/Table";

export default function BlockNumber() {
  const [length, setLength] = useState(25);
  const [lastPageNo, setLastPageNo] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([] as clientData[]);
  const [refresh, setRefresh] = useState(false);
  const [page, setPage] = useState(25);
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const { success, error, data, lastPageNo } = await fetchData(
        page,
        length,
        0,
      );
      setIsLoading(false);
      if (!success) {
        setError(error);
        return;
      }
      if (page > lastPageNo) {
        setPage(lastPageNo);
      }
      setLastPageNo(lastPageNo);
      setData(data);
    })();
  }, [page, length, refresh]);

  if (error) return <Error message={error} setRefresh={setRefresh} />;

  return (
    <div className="container pb-5">
      <Table
        data={data}
        isLoading={isLoading}
        setRefresh={setRefresh}
        isApproved={true}
        label="Rejected"
      />
      <Pagination
        currentPage={page}
        totalPages={lastPageNo}
        setPage={setPage}
        length={length}
        setLength={setLength}
      />
    </div>
  );
}
