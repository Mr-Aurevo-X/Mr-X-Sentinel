-- AlterTable
ALTER TABLE "Poll" ADD COLUMN "ended" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Poll_ended_endsAt_idx" ON "Poll"("ended", "endsAt");

-- CreateTable
CREATE TABLE "StarboardPost" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "sourceMessageId" TEXT NOT NULL,
    "starboardMessageId" TEXT NOT NULL,

    CONSTRAINT "StarboardPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StarboardPost_guildId_sourceMessageId_key" ON "StarboardPost"("guildId", "sourceMessageId");

-- CreateIndex
CREATE INDEX "StarboardPost_guildId_idx" ON "StarboardPost"("guildId");

-- AddForeignKey
ALTER TABLE "StarboardPost" ADD CONSTRAINT "StarboardPost_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
