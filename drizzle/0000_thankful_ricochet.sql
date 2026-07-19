CREATE TABLE `system_metadata` (
	`key` varchar(191) NOT NULL,
	`value` text NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_metadata_key` PRIMARY KEY(`key`)
);
