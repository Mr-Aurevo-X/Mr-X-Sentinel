-- CreateTable
CREATE TABLE "GuildStatHour" (
    "guildId" TEXT NOT NULL,
    "hour" TIMESTAMP(3) NOT NULL,
    "joins" INTEGER NOT NULL DEFAULT 0,
    "leaves" INTEGER NOT NULL DEFAULT 0,
    "messages" INTEGER NOT NULL DEFAULT 0,
    "uniqueChatters" INTEGER NOT NULL DEFAULT 0,
    "automodHits" INTEGER NOT NULL DEFAULT 0,
    "cases" INTEGER NOT NULL DEFAULT 0,
    "ticketsOpened" INTEGER NOT NULL DEFAULT 0,
    "voiceJoins" INTEGER NOT NULL DEFAULT 0,
    "voiceMinutes" INTEGER NOT NULL DEFAULT 0,
    "memberCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GuildStatHour_pkey" PRIMARY KEY ("guildId","hour")
);

-- CreateTable
CREATE TABLE "GuildChannelStatHour" (
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "hour" TIMESTAMP(3) NOT NULL,
    "messages" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GuildChannelStatHour_pkey" PRIMARY KEY ("guildId","channelId","hour")
);

-- CreateIndex
CREATE INDEX "GuildStatHour_guildId_hour_idx" ON "GuildStatHour"("guildId", "hour");

-- CreateIndex
CREATE INDEX "GuildChannelStatHour_guildId_hour_idx" ON "GuildChannelStatHour"("guildId", "hour");

-- AddForeignKey
ALTER TABLE "GuildStatHour" ADD CONSTRAINT "GuildStatHour_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildChannelStatHour" ADD CONSTRAINT "GuildChannelStatHour_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
