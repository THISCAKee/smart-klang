import { supabaseAdmin } from "@/lib/supabase-admin";

export type ActivityEventType = "line_login" | "search";

interface ActivityLogInput {
  event_type: ActivityEventType;
  line_user_id?: string | null;
  line_display_name?: string | null;
  owner_id?: string | null;
  search_type?: string | null;
  search_query?: string | null;
  search_year?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity(input: ActivityLogInput) {
  try {
    const { error } = await supabaseAdmin.from("activity_logs").insert({
      event_type: input.event_type,
      line_user_id: input.line_user_id ?? null,
      line_display_name: input.line_display_name ?? null,
      owner_id: input.owner_id ?? null,
      search_type: input.search_type ?? null,
      search_query: input.search_query ?? null,
      search_year: input.search_year ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      console.error("Activity log insert failed:", error.message);
    }
  } catch (error) {
    console.error("Activity log insert failed:", error);
  }
}
