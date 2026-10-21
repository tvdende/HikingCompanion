ALTER TABLE `routes` ADD `description` text;--> statement-breakpoint
ALTER TABLE `routes` ADD `location` text;--> statement-breakpoint
ALTER TABLE `routes` ADD `status` text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `routes` ADD `price_eur` real DEFAULT 0 NOT NULL;