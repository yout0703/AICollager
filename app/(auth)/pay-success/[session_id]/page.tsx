import { handleOrderSession } from "@/services/order";
import { redirect } from "next/navigation";

export default async function Page(props: any) {
  const { params } = props;
  await handleOrderSession(params.session_id);
  redirect("/");
}
