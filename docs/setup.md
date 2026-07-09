# Setup Guide

## Prerequisites

- Node.js 18+ (recommended: 20+)
- npm, pnpm, or yarn
- NVIDIA NIM API key

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/townops-skill.git
cd townops-skill

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your NIM API key
```

## Environment Variables

```env
# Required
NIM_API_KEY=nvapi-your-key-here

# Optional (defaults shown)
NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NIM_MODEL=nvidia/llama-3.1-nemotron-70b-instruct
```

## Local Development

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:3000
```

## Verify Installation

```bash
# Test the API
curl http://localhost:3000/api/issues

# Should return JSON with issues array
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# NIM_API_KEY: your NVIDIA NIM key
```

### Manual Deployment

```bash
# Build the application
npm run build

# Start the production server
npm start
```

### Docker

```bash
# Build the Docker image
docker build -t townops-skill .

# Run the container
docker run -p 3000:3000 -e NIM_API_KEY=nvapi-your-key townops-skill
```

## Database

SQLite is used for development. The database file (`townops.db`) is created automatically on first run with demo data.

For production, consider:
- PostgreSQL for better concurrency
- Database migrations for schema management
- Connection pooling for performance

## API Key Setup

1. Visit [build.nvidia.com](https://build.nvidia.com)
2. Create an account or sign in
3. Navigate to API Keys
4. Generate a new key
5. Copy the key (starts with `nvapi-`)
6. Add to `.env.local` as `NIM_API_KEY`

## Troubleshooting

### Database errors
```bash
# Reset the database
rm townops.db
# Restart the server - demo data will be re-seeded
```

### NIM API errors
- Verify your API key is correct
- Check you have credits remaining
- Ensure the model is available in your region

### Build errors
```bash
# Clean install
rm -rf node_modules .next
npm install
npm run build
```
