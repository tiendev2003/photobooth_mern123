-- AlterTable
ALTER TABLE `coupon` ADD COLUMN `currentUsage` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `usageLimit` INTEGER NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `currentToken` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Brand` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `background` VARCHAR(191) NULL,
    `primaryColor` VARCHAR(191) NULL,
    `secondaryColor` VARCHAR(191) NULL,
    `socialFacebook` VARCHAR(191) NULL,
    `socialInstagram` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Brand_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Brand` ADD CONSTRAINT `Brand_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
