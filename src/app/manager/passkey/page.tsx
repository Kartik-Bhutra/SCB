"use client";

import { useEffect, useState } from "react";
import Error from "@/app/(components)/Error";
import { Data, fetchData } from "./action";
import Table from "./(components)/Table";
import { ActionResult } from "@/types/serverActions";

export default function Admins() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([] as Data[]);
  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const result: Data[] | ActionResult = await fetchData();
      setIsLoading(false);
      if (result === "UNAUTHORIZED") {
        setError(result);
        return;
      }
      setData(result as Data[]);
    })();
  }, [refresh]);

  if (error) return <Error message={error} setRefresh={setRefresh} />;

  return (
    <div className="container pb-5">
      <Table data={data} isLoading={isLoading} setRefresh={setRefresh} />
    </div>
  );
}
