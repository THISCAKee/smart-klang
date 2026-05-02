import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logActivity } from "@/lib/activity-log";

interface SearchLogBody {
  searchType?: string;
  query?: string;
  year?: string;
  ownerId?: string | null;
  firstName?: string;
  lastName?: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as SearchLogBody;

  await logActivity({
    event_type: "search",
    line_user_id: session.user.id,
    line_display_name: session.user.name,
    owner_id: body.ownerId ?? null,
    search_type: body.searchType ?? null,
    search_query: body.query ?? null,
    search_year: body.year ?? null,
    metadata: {
      firstName: body.firstName ?? null,
      lastName: body.lastName ?? null,
    },
  });

  return NextResponse.json({ success: true });
}
