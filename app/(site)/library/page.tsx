import { redirect } from "next/navigation";

/** /library without a space goes to the orange library. */
export default function LibraryIndex() {
  redirect("/library/orange");
}
