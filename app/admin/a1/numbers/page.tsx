"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { blockedData } from "@/types/serverActions";
import Pagination from "../../(components)/Pagination";
import Error from "../../(components)/Error";
import { fetchData } from "./action";
import Table from "./(components)/Table";

export default function BlockNumber() {
  const searchParams = useSearchParams();
  const [length] = useState(25);
  const [lastPageNo, setLastPageNo] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([] as blockedData[]);
  const [refresh, setRefresh] = useState(false);
  const page = Number(searchParams.get("page") || "1");
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const { success, error, data, lastPageNo } = await fetchData(
        page,
        length,
      );
      setIsLoading(false);
      if (!success) {
        setError(error);
        return;
      }
      setLastPageNo(lastPageNo);
      setData(data);
    })();
  }, [page, length, refresh]);

  if (error) return <Error message={error} setRefresh={setRefresh} />;

  return (
    <div className="container pb-5">
      <Table data={data} isLoading={isLoading} setRefresh={setRefresh} />
      <Pagination
        currentPage={page}
        baseUrl="/admin/a1/numbers"
        totalPages={lastPageNo}
      />
    </div>
  );
}
