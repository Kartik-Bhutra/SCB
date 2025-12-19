import { redirect, RedirectType } from "next/navigation";
import Dashboard from "./(components)/Dashboard";
import { check } from "@/server/check";

export default async function adminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const verfied = await check(32);
  if (!verfied) {
    redirect("/login", RedirectType.replace);
  }

  return (
    <Dashboard >
      {children}
    </Dashboard>
  );
}
