import { redirect, RedirectType } from "next/navigation";
import Dashboard from "./(components)/Dashboard";
import { verify } from "@/server/verify";

export default async function adminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const verfied = await verify();
  if (!verfied) {
    redirect("/login", RedirectType.replace);
  }

  return (
    <Dashboard >
      {children}
    </Dashboard>
  );
}
