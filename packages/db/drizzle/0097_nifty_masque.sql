CREATE TABLE `libraryKindSettings` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`createdAt` integer NOT NULL,
	`modifiedAt` integer,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `libraryKindSettings_userId_idx` ON `libraryKindSettings` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `libraryKindSettings_userId_kind_idx` ON `libraryKindSettings` (`userId`,`kind`);