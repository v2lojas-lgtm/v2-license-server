CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  variant_id VARCHAR(255) NOT NULL,
  max_activations INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key VARCHAR(255) NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
  machine_id VARCHAR(255) NOT NULL,
  activated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_validated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(license_key, machine_id)
);

-- Índices para performance nas queries mais frequentes
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_order_id    ON licenses(order_id);
CREATE INDEX IF NOT EXISTS idx_licenses_email        ON licenses(email);
CREATE INDEX IF NOT EXISTS idx_activations_license_key ON activations(license_key);
CREATE INDEX IF NOT EXISTS idx_activations_machine_id  ON activations(machine_id);
