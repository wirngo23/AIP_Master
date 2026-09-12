import {
  bucket,
  database,
  failure,
  HttpError,
  json,
  owner,
} from "@/lib/aip/server";
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await owner(request);
    const { id } = await params;
    const row = await database()
      .prepare("SELECT photo_key FROM studies WHERE id=? AND owner=?")
      .bind(id, user)
      .first<{ photo_key: string | null }>();
    if (!row) throw new HttpError(404, "Study not found.");
    if (row.photo_key) await bucket().delete(row.photo_key);
    await database().batch([
      database()
        .prepare(
          "UPDATE consultations SET study_id=NULL WHERE study_id=? AND owner=?",
        )
        .bind(id, user),
      database()
        .prepare("DELETE FROM studies WHERE id=? AND owner=?")
        .bind(id, user),
    ]);
    return json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
