"use client";

import { useEffect, useState } from "react";
import Pagination from "../(components)/Pagination";
import Error from "../(components)/Error";
import { fetchData } from "./action";
import Table from "./(components)/Table";

export default function BlockNumber() {
  const [length, setLength] = useState(25);
  const [lastPageNo, setLastPageNo] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([] as string[]);
  const [refresh, setRefresh] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const result = await fetchData();
      setIsLoading(false);
      if (result==="Unauthorized") {
        setError(result);
        return;
      }
      setData(result);
    })();
  }, [page, length, refresh]);

  if (error) return <Error message={error} setRefresh={setRefresh} />;

  return (
    <div className="container pb-5">
      <Table data={data} isLoading={isLoading} setRefresh={setRefresh} />
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
