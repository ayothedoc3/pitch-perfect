# Coolify Deployment Guide for PitchBuddy

## Quick Setup

### Option 1: Deploy as Separate Services (Recommended)

#### Frontend Service
- **Source**: Your Git repository
- **Branch**: main
- **Build Pack**: Node.js
- **Build Command**: `cd frontend && npm install && npm run build`
- **Start Command**: `cd frontend && npm start`
- **Port**: 3000
- **Environment Variables**:
  ```
  NEXT_PUBLIC_API_URL=https://api.pitchbuddy.online/api
  ```

#### Backend Service
- **Source**: Your Git repository  
- **Branch**: main
- **Build Pack**: Node.js
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`
- **Port**: 3001
- **Environment Variables**:
  ```
  DATABASE_URL=postgresql://postgres:password@db:5432/pitchbuddy?schema=public
  JWT_SECRET=your-super-secret-jwt-key-change-in-production
  OPENAI_API_KEY=sk-your-openai-api-key-here
  NODE_ENV=production
  PORT=3001
  FRONTEND_URL=https://www.pitchbuddy.online
  UPLOAD_MAX_SIZE=100000000
  UPLOAD_DIR=/app/uploads
  ```

#### Database Service
- **Type**: PostgreSQL
- **Version**: 15
- **Database Name**: pitchbuddy
- **Username**: postgres
- **Password**: [set secure password]

### Option 2: Deploy with Docker Compose

1. Create a new service in Coolify
2. Select "Docker Compose" as the build pack
3. Point to your repository
4. Coolify will use the `.coolify/docker-compose.yml` file automatically
5. Set the following environment variables in Coolify:
   ```
   DATABASE_URL=postgresql://postgres:password@db:5432/pitchbuddy?schema=public
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   OPENAI_API_KEY=sk-your-openai-api-key-here
   FRONTEND_URL=https://www.pitchbuddy.online
   BACKEND_URL=https://api.pitchbuddy.online
   POSTGRES_DB=pitchbuddy
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your-secure-password
   ```

## Important Notes

1. **Environment Variables**: Make sure to set all required environment variables in your Coolify service settings
2. **Domains**: Update the FRONTEND_URL and BACKEND_URL with your actual domains
3. **Security**: Change the JWT_SECRET and database password to secure values
4. **OpenAI API**: Add your OpenAI API key for AI-powered features
5. **Persistent Storage**: The uploads volume will persist pitch recordings

## Post-Deployment

1. Your frontend will be available at your configured domain
2. Backend API will be accessible at your backend domain + `/api`
3. Database will be automatically initialized with the schema from `backend/init.sql`
4. Upload directory will be created automatically for storing pitch recordings

## Troubleshooting

- **Network timeouts during npm install**: The project now includes a nixpacks.toml configuration with retry settings to handle network issues during dependency installation
- **Build failures**: Try the "Option 1" deployment method (separate services) if the monorepo build continues to fail
- Check Coolify logs for build/deployment errors  
- Verify all environment variables are set correctly
- Ensure domains are properly configured and pointing to Coolify
- Check that the OpenAI API key is valid if AI features aren't working

## Recent Fixes

- Added nixpacks.toml configuration for more reliable builds
- Improved Dockerfile with network retry settings
- Enhanced .dockerignore to reduce build context
- Fixed development environment startup issues