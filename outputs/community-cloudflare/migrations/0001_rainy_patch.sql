CREATE TABLE `community_downloads` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`actor` text NOT NULL,
	`day` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_downloads_work_actor_day` ON `community_downloads` (`work_id`,`actor`,`day`);--> statement-breakpoint
CREATE INDEX `community_downloads_created_at` ON `community_downloads` (`created_at`);--> statement-breakpoint
CREATE TABLE `community_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_likes_work_actor` ON `community_likes` (`work_id`,`actor`);--> statement-breakpoint
CREATE INDEX `community_likes_created_at` ON `community_likes` (`created_at`);--> statement-breakpoint
CREATE TABLE `community_pets` (
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
	`presentation` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_pets_owner_fingerprint` ON `community_pets` (`owner`,`fingerprint`);--> statement-breakpoint
CREATE INDEX `community_pets_created_at` ON `community_pets` (`created_at`);--> statement-breakpoint
CREATE TABLE `community_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`fingerprint` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_requests_owner_fingerprint` ON `community_requests` (`owner`,`fingerprint`);--> statement-breakpoint
CREATE INDEX `community_requests_created_at` ON `community_requests` (`created_at`);