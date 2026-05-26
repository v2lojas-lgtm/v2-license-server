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
