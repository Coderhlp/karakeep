CREATE TABLE `libraryCollections` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text NOT NULL,
	`createdAt` integer NOT NULL,
	`modifiedAt` integer,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `libraryCollections_userId_idx` ON `libraryCollections` (`userId`);--> statement-breakpoint
CREATE INDEX `libraryCollections_userId_kind_idx` ON `libraryCollections` (`userId`,`kind`);