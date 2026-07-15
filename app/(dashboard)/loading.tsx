import {
  HeaderSkeleton,
  StatCardsSkeleton,
  ChartSkeleton,
} from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <div>
      <HeaderSkeleton action={false} />
      <StatCardsSkeleton count={4} />
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <ChartSkeleton />
      </div>
    </div>
  );
}
