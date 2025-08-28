# Pitch Perfect - Production Deployment Guide

## Overview

Pitch Perfect is a full-stack application consisting of:
- **Frontend**: Next.js application with TypeScript and Tailwind CSS
- **Backend**: Express.js API with TypeScript and Prisma ORM
- **Database**: PostgreSQL
- **AI Integration**: OpenAI Whisper for speech analysis

## Coolify Deployment

### Prerequisites

1. Coolify instance running
2. OpenAI API key
3. Domain name (optional but recommended)

### Step 1: Environment Variables

Set these environment variables in your Coolify deployment:

#### Backend Environment Variables
```env
DATABASE_URL=postgresql://username:password@db:5432/pitch_perfect?schema=public
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
OPENAI_API_KEY=sk-your-openai-api-key
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com
UPLOAD_MAX_SIZE=100000000
UPLOAD_DIR=/app/uploads
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=15
```

#### Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

### Step 2: Database Setup

1. Create a PostgreSQL service in Coolify
2. Note the connection details
3. The backend will automatically run Prisma migrations on startup

### Step 3: Backend Deployment

1. Create a new service in Coolify
2. Connect your GitHub repository
3. Set build context to `./server`
4. Use the Dockerfile in `server/Dockerfile`
5. Set environment variables from Step 1
6. Deploy

### Step 4: Frontend Deployment

1. Create another service in Coolify
2. Connect the same GitHub repository
3. Use root directory as build context
4. Use `Dockerfile.frontend`
5. Set the `NEXT_PUBLIC_API_URL` environment variable
6. Deploy

### Step 5: File Storage

The application stores uploaded files in `/app/uploads`. For production:

1. **Option A**: Use Coolify's persistent volumes
   - Mount a volume to `/app/uploads` in the backend service

2. **Option B**: Use cloud storage (recommended for scaling)
   - Implement AWS S3 or similar integration
   - Update the file upload endpoints

## Docker Compose Deployment (Alternative)

For local testing or single-server deployment:

1. Clone the repository
2. Copy environment files:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```
3. Update environment variables with your values
4. Run the stack:
   ```bash
   docker-compose up -d
   ```

## Manual Setup (Development)

### Backend Setup

1. Navigate to server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. Set up database:
   ```bash
   npm run migrate
   npm run generate
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment:
   ```bash
   cp .env.example .env.local
   # Edit with your API URL
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Post-Deployment Configuration

### 1. Test the Application

1. Visit your frontend URL
2. Register a new account
3. Try recording a pitch
4. Verify AI analysis works

### 2. Configure CORS

Ensure your backend's `FRONTEND_URL` environment variable matches your actual frontend domain.

### 3. SSL/HTTPS

- Coolify should handle SSL certificates automatically
- Ensure both frontend and backend use HTTPS in production

### 4. Monitoring

Set up monitoring for:
- API response times
- Database connections
- File storage usage
- OpenAI API usage and costs

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │────│   (Express)     │────│  (PostgreSQL)   │
│   Port 3000     │    │   Port 3001     │    │   Port 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         │                       │                       
         │              ┌─────────────────┐              
         │              │   File Storage   │              
         └──────────────│   (/uploads)     │              
                        └─────────────────┘              
                                 │                        
                        ┌─────────────────┐              
                        │   OpenAI API     │              
                        │   (Whisper)      │              
                        └─────────────────┘              
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/preferences` - Update user preferences

### Pitches
- `GET /api/pitches` - Get user's pitches
- `POST /api/pitches` - Create new pitch
- `GET /api/pitches/:id` - Get specific pitch
- `POST /api/pitches/:id/upload` - Upload pitch file
- `GET /api/pitches/:id/status` - Get analysis status
- `DELETE /api/pitches/:id` - Delete pitch

## Database Schema

Key tables:
- `users` - User accounts and stats
- `user_preferences` - User settings
- `sessions` - Authentication sessions
- `pitches` - Pitch recordings
- `pitch_analysis` - AI analysis results
- `pitch_transcriptions` - Speech transcriptions

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- File upload validation
- SQL injection prevention (Prisma)
- XSS protection

## Performance Considerations

- File upload streaming
- Background AI processing
- Database connection pooling
- Response compression
- Static file serving
- CDN integration (recommended)

## Troubleshooting

### Common Issues

1. **Database connection fails**
   - Check DATABASE_URL format
   - Verify database is running
   - Check network connectivity

2. **OpenAI API errors**
   - Verify API key is valid
   - Check usage limits
   - Monitor API costs

3. **File upload fails**
   - Check upload directory permissions
   - Verify file size limits
   - Check disk space

4. **Frontend can't connect to backend**
   - Verify NEXT_PUBLIC_API_URL
   - Check CORS configuration
   - Verify backend is running

### Logs

Check application logs in Coolify dashboard or use:
```bash
# Backend logs
docker logs <backend-container-id>

# Frontend logs  
docker logs <frontend-container-id>
```

## Scaling Considerations

For high-traffic deployments:

1. **Database**: Use connection pooling, read replicas
2. **File Storage**: Move to cloud storage (S3, GCS)
3. **API**: Implement Redis caching
4. **Frontend**: Use CDN for static assets
5. **Background Jobs**: Use Redis/Queue system for AI processing

## Support

For issues and questions:
- Check the GitHub repository issues
- Review the application logs
- Verify environment variables
- Test API endpoints directly