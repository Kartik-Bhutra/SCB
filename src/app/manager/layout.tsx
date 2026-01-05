import { RedirectType, redirect } from "next/navigation";
import { isAuthorized, isManager } from "@/server/auth";
import Dashboard from "../(components)/Dashboard";

export default async function adminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const verfied = await isManager();
  if (!verfied) {
    redirect("/login", RedirectType.replace);
  }

  return <Dashboard type={false}>{children}</Dashboard>;
}
