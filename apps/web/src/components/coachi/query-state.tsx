"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { ErrorState, ListSkeleton } from "./states";

/**
 * The same loading / error / empty behavior on every screen:
 * skeletons in the shape of the content, a plain error with Try again, and an EmptyState.
 */
export function QueryState<T>({
  query,
  skeleton = <ListSkeleton />,
  isEmpty,
  empty,
  children,
}: {
  query: UseQueryResult<T>;
  skeleton?: React.ReactNode;
  isEmpty?: (data: T) => boolean;
  empty?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}) {
  if (query.isPending) return <>{skeleton}</>;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  if (empty && isEmpty?.(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
}
