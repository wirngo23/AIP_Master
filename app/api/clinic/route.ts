import { z } from "zod";
import { database, failure, json, owner, readJson } from "@/lib/aip/server";
const schema = z.object({
  name: z.string().trim().min(2).max(80),
  domain: z
    .string()
    .max(200)
    .refine((v) => {
      try {
        const u = new URL(v);
        return (
          u.protocol === "https:" &&
          !u.username &&
          !u.password &&
          u.pathname === "/"
        );
      } catch {
        return false;
      }
    }, "Use a secure website origin."),
  accent: z.enum(["mint", "blue", "rose"]),
});
export async function GET() {
  try {
    const user = await owner();
    const row = await database()
      .prepare("SELECT config FROM clinics WHERE owner=?")
      .bind(user)
      .first<{ config: string }>();
    return json({ clinic: row ? JSON.parse(row.config) : null });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(request: Request) {
  try {
    const user = await owner(request);
    const data = schema.parse(await readJson(request));
    await database()
      .prepare(
        "INSERT INTO clinics(owner,config) VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET config=excluded.config",
      )
      .bind(user, JSON.stringify(data))
      .run();
    return json({ clinic: data });
  } catch (e) {
    return failure(e);
  }
}
