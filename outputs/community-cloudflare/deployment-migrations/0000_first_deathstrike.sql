CREATE TABLE `community_plugins` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`fingerprint` text NOT NULL,
	`work_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`author` text NOT NULL,
	`license` text NOT NULL,
	`source` text NOT NULL,
	`workflow` text NOT NULL,
	`compatibility` text NOT NULL,
	`package_key` text NOT NULL,
	`cover_key` text,
	`cover_mime` text,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_plugins_owner_fingerprint` ON `community_plugins` (`owner`,`fingerprint`);--> statement-breakpoint
CREATE INDEX `community_plugins_created_at` ON `community_plugins` (`created_at`);