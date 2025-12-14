"use client";

import { useEffect, useState } from "react";
import { clientData } from "@/types/serverActions";
import Pagination from "../(components)/Pagination";
import Error from "../(components)/Error";
import { fetchTotalPages, fetchData } from "./action";
import Table from "./(components)/Table";

export default function BlockNumber() {
  const [lastPageNo, setLastPageNo] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([] as clientData[]);
  const [refresh, setRefresh] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const data = await fetchData(page);
      setIsLoading(false);
      if (data === "Unauthorized") {
        setError(data);
        return;
      }
      setLastPageNo(await fetchTotalPages());
      if (page > lastPageNo) {
        setPage(lastPageNo);
      }
      setData(data);
    })();
  }, [page, refresh]);

  if (error) return <Error message={error} setRefresh={setRefresh} />;

  return (
    <div className="container pb-5">
      <Table
        data={data}
        isLoading={isLoading}
        setRefresh={setRefresh}
        label="Manage"
      />
      <Pagination
        currentPage={page}
        totalPages={lastPageNo}
        setPage={setPage}
      />
    </div>
  );
}
