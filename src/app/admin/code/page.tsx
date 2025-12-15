"use client";

import { useEffect, useState } from "react";
import Error from "../(components)/Error";
import { fetchData } from "./action";
import Table from "./(components)/Table";

export default function BlockNumber() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([] as string[]);
  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const result = await fetchData();
      setIsLoading(false);
      if (result === "UNAUTHORIZED") {
        setError(result);
        return;
      }
      setData(result);
    })();
  }, [refresh]);

  if (error) return <Error message={error} setRefresh={setRefresh} />;

  return (
    <div className="container pb-5">
      <Table data={data} isLoading={isLoading} setRefresh={setRefresh} />
    </div>
  );
}
