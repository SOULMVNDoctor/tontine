-- CreateTable
CREATE TABLE "Tontine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "dailyAmount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tontineId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Participant_tontineId_fkey" FOREIGN KEY ("tontineId") REFERENCES "Tontine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tontineId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "paidForDate" DATETIME NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_tontineId_fkey" FOREIGN KEY ("tontineId") REFERENCES "Tontine" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_slug_key" ON "Participant"("slug");

-- CreateIndex
CREATE INDEX "Payment_tontineId_paidForDate_idx" ON "Payment"("tontineId", "paidForDate");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_participantId_paidForDate_key" ON "Payment"("participantId", "paidForDate");
