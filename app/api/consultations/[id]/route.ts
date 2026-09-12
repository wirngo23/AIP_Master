import { z } from "zod";
import {
  database,
  failure,
  HttpError,
  json,
  owner,
  readJson,
} from "@/lib/aip/server";
const update = z.object({
  status: z.enum(["draft", "reviewed", "archived"]),
  note: z.string().max(4000),
});
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await owner(request);
    const { id } = await params;
    const data = update.parse(await readJson(request));
    const r = await database()
      .prepare(
        "UPDATE consultations SET status=?,note=? WHERE id=? AND owner=?",
      )
      .bind(data.status, data.note, id, user)
      .run();
    if (!r.meta.changes) throw new HttpError(404, "Consultation not found.");
    return json({ updated: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await owner(request);
    const { id } = await params;
    const r = await database()
      .prepare("DELETE FROM consultations WHERE id=? AND owner=?")
      .bind(id, user)
      .run();
    if (!r.meta.changes) throw new HttpError(404, "Consultation not found.");
    return json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
