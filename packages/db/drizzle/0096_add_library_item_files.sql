ALTER TABLE `libraryItems` ADD `assetId` text REFERENCES assets(id);--> statement-breakpoint
ALTER TABLE `libraryItems` ADD `fileName` text;--> statement-breakpoint
ALTER TABLE `libraryItems` ADD `contentType` text;--> statement-breakpoint
CREATE INDEX `libraryItems_assetId_idx` ON `libraryItems` (`assetId`);