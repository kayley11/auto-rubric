CREATE TABLE `host_connection` (
	`id` integer PRIMARY KEY NOT NULL,
	`origin` text NOT NULL,
	`issued_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`registration_id` text NOT NULL
);
