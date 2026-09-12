import { consultationSchema } from "@/lib/aip/domain";
import {
  database,
  failure,
  HttpError,
  json,
  owner,
  readJson,
} from "@/lib/aip/server";
export async function GET() {
  try {
    const user = await owner();
    const data = await database()
      .prepare(
        "SELECT id,name,email,study_id AS studyId,goal,followup,status,note,created_at AS createdAt FROM consultations WHERE owner=? ORDER BY created_at DESC LIMIT 100",
      )
      .bind(user)
      .all();
    return json({
      consultations: data.results.map((r) => ({
        ...r,
        followup: !!r.followup,
      })),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const user = await owner(request);
    const data = consultationSchema.parse(await readJson(request));
    if (
      data.studyId &&
      !(await database()
        .prepare("SELECT id FROM studies WHERE id=? AND owner=?")
        .bind(data.studyId, user)
        .first())
    )
      throw new HttpError(404, "Study not found.");
    const total = await database()
      .prepare("SELECT COUNT(*) AS total FROM consultations WHERE owner=?")
      .bind(user)
      .first<{ total: number }>();
    if ((total?.total ?? 0) >= 100)
      throw new HttpError(
        409,
        "Your workspace has reached its consultation draft limit.",
      );
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await database()
      .prepare(
        "INSERT INTO consultations(id,owner,name,email,study_id,goal,followup,status,note,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
      )
      .bind(
        id,
        user,
        data.name,
        data.email,
        data.studyId,
        data.goal,
        Number(data.followup),
        "draft",
        "",
        createdAt,
      )
      .run();
    return json(
      { consultation: { id, ...data, status: "draft", note: "", createdAt } },
      201,
    );
  } catch (e) {
    return failure(e);
  }
}
