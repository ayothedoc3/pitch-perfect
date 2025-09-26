-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "level" TEXT NOT NULL DEFAULT 'beginner',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "totalPitches" INTEGER NOT NULL DEFAULT 0,
    "totalFeedback" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pitchType" TEXT NOT NULL DEFAULT 'Startup Pitch',
    "experienceLevel" TEXT NOT NULL DEFAULT 'Beginner',
    "improvementGoals" TEXT NOT NULL,
    "practiceFrequency" TEXT NOT NULL DEFAULT 'Weekly',
    CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pitches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'startup',
    "duration" INTEGER NOT NULL,
    "videoUrl" TEXT,
    "audioUrl" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pitches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pitch_analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pitchId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "pacing" REAL NOT NULL,
    "clarity" REAL NOT NULL,
    "fillerWordFrequency" REAL NOT NULL,
    "toneVariation" REAL NOT NULL,
    "confidence" REAL NOT NULL,
    "skillBreakdown" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "improvements" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pitch_analysis_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "pitches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pitch_transcriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pitchId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamps" TEXT NOT NULL,
    "keyPhrases" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pitch_transcriptions_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "pitches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "pitch_analysis_pitchId_key" ON "pitch_analysis"("pitchId");

-- CreateIndex
CREATE UNIQUE INDEX "pitch_transcriptions_pitchId_key" ON "pitch_transcriptions"("pitchId");
