-- CreateEnum
CREATE TYPE "PricingColor" AS ENUM ('primary', 'success', 'warning');

-- CreateTable
CREATE TABLE "pricing_plans" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "color" "PricingColor" NOT NULL DEFAULT 'primary',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pricing_plans_identifier_key" ON "pricing_plans"("identifier");

-- CreateIndex
CREATE INDEX "pricing_plans_identifier_idx" ON "pricing_plans"("identifier");

-- CreateIndex
CREATE INDEX "pricing_plans_is_active_idx" ON "pricing_plans"("is_active");

-- CreateIndex
CREATE INDEX "pricing_plans_sort_order_idx" ON "pricing_plans"("sort_order");

-- CreateIndex
CREATE INDEX "pricing_plans_is_active_sort_order_idx" ON "pricing_plans"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "pricing_plans_identifier_is_active_idx" ON "pricing_plans"("identifier", "is_active");