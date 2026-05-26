# Construction Project Monitoring System

Full-stack system using Node.js, Express.js, MongoDB, HTML, CSS, and JavaScript.

## Features
- Admin and staff login/register
- JWT authentication and bcrypt password hashing
- Project management
- Daily reports with photo uploads
- Progress monitoring
- Materials, expenses, manpower, equipment, issue/risk tracking
- Dashboard statistics
- CSV export for projects, reports, expenses, and manpower
- Responsive construction-themed dashboard

## Test Accounts after Seeding
- Admin: `admin@construction.com` / `123456`
- Staff: `staff@construction.com` / `123456`

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env`
Copy `.env.example` and rename it to `.env`.

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/construction_monitoring
JWT_SECRET=your_long_secret_key
NODE_ENV=development
```

### 3. Run seed data
```bash
npm run seed
```

### 4. Start the server
```bash
npm run dev
```

Open:
```txt
http://localhost:5000
```

## MongoDB Atlas Setup
1. Go to MongoDB Atlas.
2. Create a free cluster.
3. Create database user and password.
4. Go to Network Access and allow your IP or use `0.0.0.0/0` for Render.
5. Copy your connection string.
6. Paste it in `.env` as `MONGODB_URI`.

## GitHub Upload
```bash
git init
git add .
git commit -m "Initial construction monitoring system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/construction-monitoring-system.git
git push -u origin main
```

## Render Deployment
1. Push this project to GitHub.
2. Open Render dashboard.
3. Create New Web Service.
4. Connect your GitHub repository.
5. Build command:
```bash
npm install
```
6. Start command:
```bash
npm start
```
7. Add environment variables:
```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_long_secret_key
NODE_ENV=production
```
8. Deploy.

## Important Notes
- Do not upload `.env` to GitHub.
- Uploaded photos are stored in `public/uploads`.
- For production, use cloud file storage later, such as Cloudinary or AWS S3.
