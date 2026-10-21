CREATE TABLE `routes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`total_distance_km` real NOT NULL,
	`coordinates_json` text NOT NULL,
	`waypoints_json` text,
	`stages_json` text,
	`elevation_metrics_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
