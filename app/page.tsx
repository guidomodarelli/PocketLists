import { redirect } from "next/navigation";
import { createList, getDefaultListId } from "@/app/features/lists/services";

export const dynamic = "force-dynamic";

export default function Home() {
  const defaultListId = getDefaultListId() ?? createList("Sin nombre").id;
  redirect(`/lists/${encodeURIComponent(defaultListId)}`);
}
