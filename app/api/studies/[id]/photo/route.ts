import { bucket, database, failure, HttpError, owner } from "@/lib/aip/server";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await owner();
    const { id } = await params;
    const row = await database()
      .prepare("SELECT photo_key FROM studies WHERE id=? AND owner=?")
      .bind(id, user)
      .first<{ photo_key: string | null }>();
    if (!row?.photo_key) throw new HttpError(404, "Photo not found.");
    const photo = await bucket().get(row.photo_key);
    if (!photo) throw new HttpError(404, "Photo not found.");
    return new Response(photo.body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
