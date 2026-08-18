-- CreateTable
CREATE TABLE "GuildCustomCommand" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "discordCommandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildCustomCommand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuildCustomCommand_guildId_name_key" ON "GuildCustomCommand"("guildId", "name");

-- CreateIndex
CREATE INDEX "GuildCustomCommand_guildId_idx" ON "GuildCustomCommand"("guildId");

-- AddForeignKey
ALTER TABLE "GuildCustomCommand" ADD CONSTRAINT "GuildCustomCommand_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
