"use client";

import { useEffect, useState } from "react";
import Pagination from "../(components)/Pagination";
import Error from "../(components)/Error";
import { fetchData,maxPageNo } from "./action";
import Table from "./(components)/Table";
import { blockData } from "@/types/serverActions";

export default function BlockNumber() {
  const [length, setLength] = useState(25);
  const [lastPageNo, setLastPageNo] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([] as blockData[]);
  const [refresh, setRefresh] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => {
    (async () => {
      if (page > lastPageNo) {
        setPage(lastPageNo);
      }
      setIsLoading(true);
      const result = await fetchData(
        page,
      );
      
      setIsLoading(false);
      if (!result) {
        setError("Unauthorized");
        return;
      }

      setLastPageNo(await maxPageNo());
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
