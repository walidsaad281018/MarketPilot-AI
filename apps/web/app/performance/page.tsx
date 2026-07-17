import type { Metadata } from "next";
import PerformanceDashboard from "@/components/performance/PerformanceDashboard";

export const metadata: Metadata = {
  title: "AI Performance Center | MarketPilot AI",
  description:
    "Explore MarketPilot AI recommendation performance, success rates and transparent historical records.",
};

export default function PerformancePage() {
  return <PerformanceDashboard />;
}