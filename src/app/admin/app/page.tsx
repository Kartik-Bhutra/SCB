"use client";

import { useCallback, useEffect, useState } from "react";
import ErrorComp from "@/app/(components)/Error";
import type { ActionResult } from "@/types/serverActions";
import Table from "./(components)/Table";
import { fetchData } from "./action";

export default function BlockNumber() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<string[]>([]);

  const reload = useCallback(async () => {
    setIsLoading(true);

    const result: string[] | ActionResult = await fetchData();

    setIsLoading(false);

    if (result === "UNAUTHORIZED") {
      setError(result);
      return;
    }

    setData(result as string[]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      const result: string[] | ActionResult = await fetchData();

      if (cancelled) return;

      setIsLoading(false);

      if (result === "UNAUTHORIZED") {
        setError(result);
        return;
      }

      setData(result as string[]);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <ErrorComp message={error} reload={reload} />;
  }

  return (
    <div className="container pb-5">
      <Table data={data} isLoading={isLoading} reload={reload} />
    </div>
  );
}
