-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingStatus" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingPreferences" JSONB;