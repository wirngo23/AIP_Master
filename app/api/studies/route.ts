import { studySchema } from "@/lib/aip/domain";
import {
  bucket,
  database,
  failure,
  HttpError,
  json,
  limitedBody,
  owner,
} from "@/lib/aip/server";
export async function GET() {
  try {
    const user = await owner();
    const rows = await database()
      .prepare(
        "SELECT id,title,settings,photo_key,created_at FROM studies WHERE owner=? ORDER BY created_at DESC LIMIT 100",
      )
      .bind(user)
      .all();
    return json({
      studies: rows.results.map((r) => ({
        id: r.id,
        title: r.title,
        settings: JSON.parse(String(r.settings)),
        hasPhoto: !!r.photo_key,
        createdAt: r.created_at,
      })),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  let photoKey: string | null = null;
  try {
    const user = await owner(request);
    const count = await database()
      .prepare("SELECT COUNT(*) AS total FROM studies WHERE owner=?")
      .bind(user)
      .first<{ total: number }>();
    if ((count?.total ?? 0) >= 100)
      throw new HttpError(
        409,
        "Your workspace contains 100 studies. Delete an older study to save another.",
      );
    const bytes = await limitedBody(request, 4_500_000);
    const form = await new Response(bytes, {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    let payload: unknown;
    try {
      payload = JSON.parse(String(form.get("data")));
    } catch {
      throw new HttpError(400, "Invalid study.");
    }
    const data = studySchema.parse(payload);
    const id = crypto.randomUUID();
    const photo = form.get("photo");
    if (photo instanceof File) {
      if (form.get("photoConsent") !== "true")
        throw new HttpError(400, "Choose whether to store your photo.");
      if (photo.size > 4_000_000 || photo.type !== "image/jpeg")
        throw new HttpError(400, "Please use a JPEG under 4 MB.");
      const buf = await photo.arrayBuffer();
      const head = new Uint8Array(buf);
      if (head[0] !== 255 || head[1] !== 216 || head[2] !== 255)
        throw new HttpError(400, "The image format is invalid.");
      photoKey = `studies/${user}/${id}.jpg`;
      await bucket().put(photoKey, buf, {
        httpMetadata: { contentType: "image/jpeg" },
      });
    }
    const createdAt = new Date().toISOString();
    try {
      await database()
        .prepare(
          "INSERT INTO studies(id,owner,title,settings,photo_key,created_at) VALUES(?,?,?,?,?,?)",
        )
        .bind(
          id,
          user,
          data.title,
          JSON.stringify(data.settings),
          photoKey,
          createdAt,
        )
        .run();
    } catch (e) {
      if (photoKey) await bucket().delete(photoKey);
      throw e;
    }
    return json(
      {
        study: {
          id,
          title: data.title,
          settings: data.settings,
          hasPhoto: !!photoKey,
          createdAt,
        },
      },
      201,
    );
  } catch (e) {
    return failure(e);
  }
}
