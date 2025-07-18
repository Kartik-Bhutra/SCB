"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import fetchData from "./action";
import { blockedData } from "@/types/serverActions";
import Pagination from "../../(components)/Pagination";
import Error from "../../(components)/Error";

export default function BlockNumber() {
  const searchParams = useSearchParams();
  const [length] = useState(25);
  const [, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setData] = useState([] as blockedData[]);
  const [refresh, setRefresh] = useState(false);
  const page = Number(searchParams.get("page") || "1");
  useEffect(() => {
    (async () => {
      setIsLoading(false);
      const { success, error, data } = await fetchData(page, length);
      setIsLoading(false);
      if (!success) {
        setError(error);
        return;
      }
      setData(data);
    })();
  }, [page, length, refresh]);

  if (error) return <Error message={error} setRefresh={setRefresh} />;

  return (
    <div className="container pb-5">
      <Pagination
        currentPage={page}
        baseUrl="/admin/a1/numbers"
        totalPages={25}
      />
    </div>
  );
}
