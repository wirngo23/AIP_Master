CREATE TABLE photo_render_requests (
 id text PRIMARY KEY NOT NULL,
 owner text NOT NULL,
 day text NOT NULL
);
--> statement-breakpoint
CREATE INDEX photo_render_owner_day ON photo_render_requests(owner, day);
