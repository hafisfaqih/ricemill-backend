-- Migration: Ensure analytics columns exist on purchases and sales tables
-- Run this against the production database before deploying analytics-dependent code.

BEGIN;

-- Purchases table adjustments
ALTER TABLE IF EXISTS purchases
    ADD COLUMN IF NOT EXISTS extra_weight DECIMAL(10,2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS pellet_cost DECIMAL(15,2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS truck_cost DECIMAL(15,2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(15,2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15,2);

-- Backfill NULL totals using existing numeric data when available
UPDATE purchases
SET total_cost =
    COALESCE(total_cost,
             (quantity * (weight + COALESCE(extra_weight, 0)) * price)
             + COALESCE(truck_cost, 0)
             + COALESCE(labor_cost, 0)
             + COALESCE(pellet_cost, 0));

-- Sales table adjustments
ALTER TABLE IF EXISTS sales
    ADD COLUMN IF NOT EXISTS extra_weight DECIMAL(10,2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS pellet DECIMAL(15,2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS fuel DECIMAL(15,2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS labor DECIMAL(15,2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS net_profit DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS rendement VARCHAR(10);

-- Normalize NULL operational cost columns to zero for consistency
UPDATE sales
SET pellet = COALESCE(pellet, 0),
    fuel = COALESCE(fuel, 0),
    labor = COALESCE(labor, 0),
    extra_weight = COALESCE(extra_weight, 0);

COMMIT;
