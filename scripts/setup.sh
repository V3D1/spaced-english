#!/bin/bash
set -euo pipefail

echo "Setting up spaced-english..."

# 1. Create .env from template
if [ ! -f .env ]; then
  cp .env.example .env
  AUTH_SECRET=$(openssl rand -base64 32)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^AUTH_SECRET=.*|AUTH_SECRET=${AUTH_SECRET}|" .env
  else
    sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=${AUTH_SECRET}|" .env
  fi
  echo "Created .env with generated AUTH_SECRET"
else
  echo ".env already exists, skipping"
fi

# 2. Start database
if command -v docker &> /dev/null; then
  echo "Starting PostgreSQL via Docker Compose..."
  docker compose up -d
else
  echo "Docker not found. Make sure PostgreSQL is running and POSTGRES_URL is set in .env"
fi

# 3. Install dependencies
echo "Installing dependencies..."
pnpm install

# 4. Run migrations
echo "Running database migrations..."
pnpm db:migrate

# 5. Seed database
echo "Seeding database..."
pnpm db:seed

echo ""
echo "Setup complete! Run: pnpm dev"
echo "Then open http://localhost:3000"
