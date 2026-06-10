-- 1. Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Partial Unique Indexes
CREATE UNIQUE INDEX IF NOT EXISTS address_default_user_idx 
ON addresses (user_id) 
WHERE is_default = true;

CREATE UNIQUE INDEX IF NOT EXISTS variant_default_product_idx 
ON product_variants (product_id) 
WHERE is_default = true;

-- 3. GIN Indexes for AI matching array columns
CREATE INDEX IF NOT EXISTS product_ai_need_tags_gin_idx 
ON product_ai_attributes USING gin (need_tags);

CREATE INDEX IF NOT EXISTS product_ai_flavor_tags_gin_idx 
ON product_ai_attributes USING gin (flavor_tags);

-- 4. Product Catalogue Performance Indexes
CREATE INDEX IF NOT EXISTS products_category_available_featured_active_idx 
ON products (category_id, is_available, is_featured) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS categories_display_order_idx 
ON categories (display_order);

-- 5. Order and Checkout Indexes
CREATE INDEX IF NOT EXISTS orders_payment_reference_idx 
ON orders (payment_reference);

-- 6. AI Log Indexes
CREATE INDEX IF NOT EXISTS ai_quiz_sessions_started_at_idx 
ON ai_quiz_sessions (started_at DESC);

CREATE INDEX IF NOT EXISTS ai_recommendation_events_recommended_at_idx 
ON ai_recommendation_events (recommended_at DESC);

CREATE INDEX IF NOT EXISTS ai_recommendation_events_was_added_to_cart_idx 
ON ai_recommendation_events (was_added_to_cart);

CREATE INDEX IF NOT EXISTS ai_recommendation_events_was_purchased_idx 
ON ai_recommendation_events (was_purchased);

-- 7. Check Constraints (safe addition via DO blocks)
DO $$
BEGIN
  -- Products check
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_base_price') THEN
    ALTER TABLE products ADD CONSTRAINT chk_products_base_price CHECK (base_price > 0);
  END IF;

  -- Cart Items checks
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_cart_items_quantity') THEN
    ALTER TABLE cart_items ADD CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_cart_items_unit_price') THEN
    ALTER TABLE cart_items ADD CONSTRAINT chk_cart_items_unit_price CHECK (unit_price >= 0);
  END IF;

  -- Order Items checks
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_items_quantity') THEN
    ALTER TABLE order_items ADD CONSTRAINT chk_order_items_quantity CHECK (quantity > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_items_unit_price') THEN
    ALTER TABLE order_items ADD CONSTRAINT chk_order_items_unit_price CHECK (unit_price_snapshot >= 0);
  END IF;

  -- Orders checks
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_subtotal') THEN
    ALTER TABLE orders ADD CONSTRAINT chk_orders_subtotal CHECK (subtotal >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_discount') THEN
    ALTER TABLE orders ADD CONSTRAINT chk_orders_discount CHECK (discount_amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_tax') THEN
    ALTER TABLE orders ADD CONSTRAINT chk_orders_tax CHECK (tax_amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_total') THEN
    ALTER TABLE orders ADD CONSTRAINT chk_orders_total CHECK (total_amount >= 0);
  END IF;

  -- Promotions checks
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_promotions_discount') THEN
    ALTER TABLE promotions ADD CONSTRAINT chk_promotions_discount CHECK (discount_value >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_promotions_min_val') THEN
    ALTER TABLE promotions ADD CONSTRAINT chk_promotions_min_val CHECK (min_order_value >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_promotions_current_uses') THEN
    ALTER TABLE promotions ADD CONSTRAINT chk_promotions_current_uses CHECK (current_uses >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_promotions_max_uses') THEN
    ALTER TABLE promotions ADD CONSTRAINT chk_promotions_max_uses CHECK (max_uses IS NULL OR max_uses >= current_uses);
  END IF;

  -- Loyalty Stamps checks
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_stamps_balance') THEN
    ALTER TABLE loyalty_stamps ADD CONSTRAINT chk_stamps_balance CHECK (stamps_balance >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_stamps_earned') THEN
    ALTER TABLE loyalty_stamps ADD CONSTRAINT chk_stamps_earned CHECK (stamps_earned >= 0);
  END IF;

  -- AI Recommendations check
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ai_recs_match_score') THEN
    ALTER TABLE ai_recommendation_events ADD CONSTRAINT chk_ai_recs_match_score CHECK (match_score >= 0 AND match_score <= 100);
  END IF;

  -- Product AI Attributes checks
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ai_attrs_caffeine') THEN
    ALTER TABLE product_ai_attributes ADD CONSTRAINT chk_ai_attrs_caffeine CHECK (caffeine_level BETWEEN 0 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ai_attrs_sweetness') THEN
    ALTER TABLE product_ai_attributes ADD CONSTRAINT chk_ai_attrs_sweetness CHECK (sweetness_level BETWEEN 0 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ai_attrs_strength') THEN
    ALTER TABLE product_ai_attributes ADD CONSTRAINT chk_ai_attrs_strength CHECK (strength_level BETWEEN 0 AND 10);
  END IF;
END $$;

-- 8. Updated At Trigger Function and Triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Trigger for user_preferences
DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Trigger for products
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Trigger for carts
DROP TRIGGER IF EXISTS trg_carts_updated_at ON carts;
CREATE TRIGGER trg_carts_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Trigger for orders
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
