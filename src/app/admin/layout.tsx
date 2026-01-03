import { RedirectType, redirect } from "next/navigation";
import { check } from "@/server/check";
import Dashboard from "../(components)/Dashboard";

export default async function adminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const verfied = await check(32);
  if (!verfied) {
    redirect("/login", RedirectType.replace);
  }

  return <Dashboard type={true}>{children}</Dashboard>;
}
