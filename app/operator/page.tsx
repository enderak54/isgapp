import type { Metadata } from "next";
import OperatorBelgeleri from "@/components/operator-belgeleri";

export const metadata: Metadata = {
  title: "Operatör Belgeleri - ISG Takip",
};

export default function Page() {
  return <OperatorBelgeleri />;
}