import { useAppUserProgress } from "@/hooks/use-app-data";

export function useUserProgress() {
  const query = useAppUserProgress();
  return { progress: query.data ?? null, isLoading: query.isLoading };
}
