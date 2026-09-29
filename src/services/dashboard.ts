import { supabase } from "../lib/supabase";

export type DashboardData = {
  displayName: string;
  goals: number;
  projects: number;
  memories: number;
  latestJournal: string | null;
};

export const emptyDashboard: DashboardData = {
  displayName: "",
  goals: 0,
  projects: 0,
  memories: 0,
  latestJournal: null,
};

export async function loadDashboard(userId: string): Promise<DashboardData> {
  const [profileResult, goalsResult, projectsResult, memoriesResult, journalResult] =
    await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
      supabase
        .from("goals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "active"),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "active"),
      supabase.from("memories").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase
        .from("journal_entries")
        .select("content")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  return {
    displayName: profileResult.data?.display_name?.trim() || "there",
    goals: goalsResult.count ?? 0,
    projects: projectsResult.count ?? 0,
    memories: memoriesResult.count ?? 0,
    latestJournal: journalResult.data?.content ?? null,
  };
}
