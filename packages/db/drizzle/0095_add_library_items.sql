CREATE TABLE `libraryItems` (
	`id` text PRIMARY KEY NOT NULL,
	`collectionId` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`note` text,
	`createdAt` integer NOT NULL,
	`modifiedAt` integer,
	`userId` text NOT NULL,
	FOREIGN KEY (`collectionId`) REFERENCES `libraryCollections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `libraryItems_userId_idx` ON `libraryItems` (`userId`);--> statement-breakpoint
CREATE INDEX `libraryItems_collectionId_createdAt_idx` ON `libraryItems` (`collectionId`,`createdAt`);