/*
  # Create Produces and Bids System Schema

  1. New Tables
    - `produces`
      - `id` (uuid, primary key) - Unique identifier for each produce listing
      - `farmer_id` (uuid) - References auth.users, the farmer who listed the produce
      - `name` (text) - Name of the crop/produce
      - `variety` (text, nullable) - Variety of the crop
      - `quantity` (numeric) - Available quantity
      - `unit` (text) - Unit of measurement (kg, quintal, ton)
      - `base_price` (numeric) - Minimum price set by farmer
      - `current_price` (numeric) - Current highest bid price
      - `images` (jsonb) - Array of image URLs
      - `description` (text, nullable) - Description of the produce
      - `location` (text) - Location of the produce
      - `harvest_date` (date, nullable) - When the produce was harvested
      - `status` (text) - Status: active, bidding, sold, expired
      - `created_at` (timestamptz) - When the listing was created
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `bids`
      - `id` (uuid, primary key) - Unique identifier for each bid
      - `produce_id` (uuid) - References produces table
      - `trader_id` (uuid) - References auth.users, the trader placing the bid
      - `trader_name` (text) - Name of the trader
      - `amount` (numeric) - Bid amount
      - `quantity` (numeric) - Quantity being bid for
      - `message` (text, nullable) - Optional message with the bid
      - `status` (text) - Status: pending, accepted, rejected
      - `created_at` (timestamptz) - When the bid was placed
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on all tables
    - Farmers can create and manage their own produces
    - Traders can view all active produces
    - Traders can create bids
    - Farmers can view bids on their produces
    - Users can only update/delete their own content
*/

-- Create produces table
CREATE TABLE IF NOT EXISTS produces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  variety text,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit text NOT NULL CHECK (unit IN ('kg', 'quintal', 'ton')),
  base_price numeric NOT NULL CHECK (base_price > 0),
  current_price numeric NOT NULL CHECK (current_price >= base_price),
  images jsonb DEFAULT '[]'::jsonb,
  description text,
  location text NOT NULL,
  harvest_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'bidding', 'sold', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_id uuid REFERENCES produces(id) ON DELETE CASCADE NOT NULL,
  trader_id uuid REFERENCES auth.users(id) NOT NULL,
  trader_name text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  quantity numeric NOT NULL CHECK (quantity > 0),
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_produces_farmer_id ON produces(farmer_id);
CREATE INDEX IF NOT EXISTS idx_produces_status ON produces(status);
CREATE INDEX IF NOT EXISTS idx_produces_created_at ON produces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_produce_id ON bids(produce_id);
CREATE INDEX IF NOT EXISTS idx_bids_trader_id ON bids(trader_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

-- Enable Row Level Security
ALTER TABLE produces ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for produces table

-- Farmers can view their own produces
CREATE POLICY "Farmers can view own produces"
  ON produces FOR SELECT
  TO authenticated
  USING (auth.uid() = farmer_id);

-- Authenticated users can view all active produces
CREATE POLICY "Users can view active produces"
  ON produces FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Farmers can insert their own produces
CREATE POLICY "Farmers can create produces"
  ON produces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = farmer_id);

-- Farmers can update their own produces
CREATE POLICY "Farmers can update own produces"
  ON produces FOR UPDATE
  TO authenticated
  USING (auth.uid() = farmer_id)
  WITH CHECK (auth.uid() = farmer_id);

-- Farmers can delete their own produces
CREATE POLICY "Farmers can delete own produces"
  ON produces FOR DELETE
  TO authenticated
  USING (auth.uid() = farmer_id);

-- RLS Policies for bids table

-- Traders can view their own bids
CREATE POLICY "Traders can view own bids"
  ON bids FOR SELECT
  TO authenticated
  USING (auth.uid() = trader_id);

-- Farmers can view bids on their produces
CREATE POLICY "Farmers can view bids on their produces"
  ON bids FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM produces
      WHERE produces.id = bids.produce_id
      AND produces.farmer_id = auth.uid()
    )
  );

-- Traders can create bids
CREATE POLICY "Traders can create bids"
  ON bids FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = trader_id);

-- Traders can update their own bids (only if pending)
CREATE POLICY "Traders can update own pending bids"
  ON bids FOR UPDATE
  TO authenticated
  USING (auth.uid() = trader_id AND status = 'pending')
  WITH CHECK (auth.uid() = trader_id AND status = 'pending');

-- Farmers can update bid status on their produces
CREATE POLICY "Farmers can update bid status"
  ON bids FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM produces
      WHERE produces.id = bids.produce_id
      AND produces.farmer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM produces
      WHERE produces.id = bids.produce_id
      AND produces.farmer_id = auth.uid()
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_produces_updated_at
  BEFORE UPDATE ON produces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bids_updated_at
  BEFORE UPDATE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();