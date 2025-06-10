# Rasain Backend

### 🚀 Getting Started

#### Prerequisites
- Node.js 18.0.0 or higher
- Supabase account and project
- PostgreSQL database (via Supabase)

#### Environment Setup
1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret
   ```

#### Installation & Setup
```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

#### Available Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run typecheck    # Type checking without compilation
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database (migrate + seed)
```

### 📚 API Documentation

#### Base URL
- Development: `http://localhost:3000`
- API Version: `/api/v1`

#### Authentication
- JWT-based authentication
- Include token in Authorization header: `Bearer <token>`

#### Key Endpoints

**Authentication**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update profile

**Recipes**
- `GET /api/v1/recipes` - Get recipes with search/filter
- `GET /api/v1/recipes/:id` - Get recipe by ID
- `POST /api/v1/recipes` - Create new recipe
- `PUT /api/v1/recipes/:id` - Update recipe
- `DELETE /api/v1/recipes/:id` - Delete recipe

**Pantry**
- `GET /api/v1/pantry` - Get user's pantry items
- `POST /api/v1/pantry` - Add pantry item
- `PUT /api/v1/pantry/:id` - Update pantry item
- `DELETE /api/v1/pantry/:id` - Delete pantry item

**Community**
- `GET /api/v1/community/posts` - Get community posts
- `POST /api/v1/community/posts` - Create new post
- `POST /api/v1/community/posts/:id/like` - Like/unlike post
- `POST /api/v1/community/posts/:id/comments` - Add comment

**Uploads**
- `POST /api/v1/upload/image` - Upload single image
- `POST /api/v1/upload/images` - Upload multiple images

### 🛠️ Technology Stack

#### Core
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework
- **Supabase** - Backend-as-a-Service (PostgreSQL + Auth)

#### Security & Middleware
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Rate Limiting** - API protection

#### Validation & Utils
- **Joi** - Request validation
- **Multer** - File uploads
- **Winston** - Logging
- **UUID** - Unique identifiers

### 📁 Project Structure

```
src/
├── config/          # Configuration files
│   └── database.ts  # Supabase client setup
├── middleware/      # Express middleware
│   ├── auth.ts      # Authentication middleware
│   ├── errorMiddleware.ts # Error handling
│   ├── rateLimiter.ts     # Rate limiting
│   └── validation.ts      # Request validation
├── models/          # Data models
│   ├── User.ts      # User operations
│   ├── Recipe.ts    # Recipe operations
│   ├── Pantry.ts    # Pantry operations
│   ├── Notification.ts # Notification operations
│   ├── Community.ts # Community operations
│   └── index.ts     # Model exports
├── routes/          # API routes
│   ├── auth.ts      # Authentication routes
│   ├── recipes.ts   # Recipe routes
│   ├── users.ts     # User routes
│   ├── pantry.ts    # Pantry routes
│   ├── community.ts # Community routes
│   ├── chat.ts      # Chat/AI routes
│   ├── notifications.ts # Notification routes
│   └── upload.ts    # File upload routes
├── scripts/         # Database scripts
│   ├── migrate.ts   # Migration script
│   ├── seed.ts      # Seeding script
│   └── reset.ts     # Reset script
├── types/           # TypeScript type definitions
│   └── index.ts     # All type definitions
├── utils/           # Utility functions
│   └── logger.ts    # Winston logger setup
└── server.ts        # Main server file
```

### 🔧 Development Tips

#### Type Safety
- All models use strict TypeScript interfaces
- API responses are properly typed
- Request validation with Joi schemas
- Database operations are type-safe

#### Error Handling
- Custom `AppError` class for consistent error responses
- Global error middleware catches all errors
- Proper HTTP status codes and error messages

#### Database Operations
- All database operations use Supabase client
- Proper error handling and validation
- Transaction support where needed
- Migration and seeding scripts included

#### Testing
- Development server with hot reload
- Type checking without compilation
- Build verification before deployment

### 🐛 Troubleshooting

#### Common Issues

1. **TypeScript compilation errors**
   ```bash
   npm run typecheck
   ```

2. **Database connection issues**
   - Check your `.env.local` file
   - Verify Supabase credentials
   - Ensure database is accessible

3. **Missing dependencies**
   ```bash
   npm install
   ```

4. **Port already in use**
   - Change PORT in `.env.local`
   - Kill existing processes on port 3000

### 🎯 Next Steps

1. **Testing**: Add comprehensive test suite with Jest
2. **Documentation**: Add Swagger/OpenAPI documentation
3. **Deployment**: Set up CI/CD pipeline
4. **Monitoring**: Add application monitoring and logging
5. **Performance**: Implement caching and optimization
6. **Security**: Add additional security measures

### 📝 Default Admin Account

After running migrations and seeding:
- **Email**: `admin@rasain.com`
- **Password**: `admin123!`