-- ============================================================
-- MARLET GAME - Schéma PostgreSQL pour Supabase
-- Exécuter dans Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  phone TEXT,
  password TEXT,
  "googleId" TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'USER',
  balance DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Transaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reference TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Game" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  "minBet" DOUBLE PRECISION NOT NULL DEFAULT 20,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Bet" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "gameId" UUID NOT NULL REFERENCES "Game"(id) ON DELETE CASCADE,
  amount DOUBLE PRECISION NOT NULL,
  multiplier DOUBLE PRECISION,
  payout DOUBLE PRECISION,
  result TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_transaction_userId ON "Transaction"("userId");
CREATE INDEX idx_transaction_status ON "Transaction"(status);
CREATE INDEX idx_bet_userId ON "Bet"("userId");
CREATE INDEX idx_bet_gameId ON "Bet"("gameId");
CREATE INDEX idx_bet_status ON "Bet"(status);
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_googleId ON "User"("googleId");

-- ============================================================
-- SEED: JEUX
-- ============================================================

INSERT INTO "Game" (name, label, active, "minBet") VALUES
  ('dice', 'Lancer de dés', TRUE, 20),
  ('slots', 'Machine à sous', TRUE, 20),
  ('roulette', 'Roulette', TRUE, 20),
  ('blackjack', 'Blackjack', TRUE, 20)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED: UTILISATEURS
-- admin / admin123 (rôle ADMIN | solde 100000 FCFA)
-- demo / demo123 (rôle USER | solde 5000 FCFA)
-- ============================================================

INSERT INTO "User" (username, phone, password, role, balance) VALUES
  ('admin', '0000000000', '$2a$10$5Zv/x/maoYkvXkwwHV/rheeKHIyV/uKdRno/T7HB4nMGPlR19S7KW', 'ADMIN', 100000),
  ('demo', '0000000001', '$2a$10$Pg44ewBQgIg7puHnUKAV3uBRViHfkmlZRnVeRR5WIJsaycTXmjM4u', 'USER', 5000)
ON CONFLICT (username) DO NOTHING;
