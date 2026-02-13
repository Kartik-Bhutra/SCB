"use client";

import { useCallback, useEffect, useState } from "react";
import ErrorComp from "@/app/(components)/Error";
import Pagination from "@/app/(components)/Pagination";
import type { ActionResult } from "@/types/serverActions";
import Table from "./(components)/Table";
import { type Data, fetchData, fetchTotalPages } from "./action";

export default function BlockNumber() {
  const [lastPageNo, setLastPageNo] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Data[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (page > lastPageNo) {
      setPage(lastPageNo);
    }
  }, [page, lastPageNo]);

  const reload = useCallback(async () => {
    setIsLoading(true);

    const result: Data[] | ActionResult = await fetchData(page);

    setIsLoading(false);

    if (result === "UNAUTHORIZED") {
      setError(result);
      return;
    }

    const totalPages = await fetchTotalPages();

    setLastPageNo(totalPages);
    setData(result as Data[]);
  }, [page]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      const result: Data[] | ActionResult = await fetchData(page);

      if (cancelled) return;

      setIsLoading(false);

      if (result === "UNAUTHORIZED") {
        setError(result);
        return;
      }

      const totalPages = await fetchTotalPages();

      if (cancelled) return;

      setLastPageNo(totalPages);
      setData(result as Data[]);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [page]);

  if (error) {
    return <ErrorComp message={error} reload={reload} />;
  }

  return (
    <div className="container pb-5">
      <Table data={data} isLoading={isLoading} reload={reload} />
      <Pagination currentPage={page} totalPages={lastPageNo} setPage={setPage} />
    </div>
  );
}
