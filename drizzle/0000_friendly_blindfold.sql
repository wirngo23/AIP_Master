CREATE TABLE `clinics` (
	`owner` text PRIMARY KEY NOT NULL,
	`config` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `consultations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`study_id` text,
	`goal` text NOT NULL,
	`followup` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`study_id`) REFERENCES `studies`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `consultations_owner_date` ON `consultations` (`owner`,`created_at`);--> statement-breakpoint
CREATE INDEX `consultations_study` ON `consultations` (`study_id`);--> statement-breakpoint
CREATE TABLE `studies` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`settings` text NOT NULL,
	`photo_key` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `studies_owner_date` ON `studies` (`owner`,`created_at`);