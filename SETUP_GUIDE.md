# ⚙️ Setup Guide - Sistem Tanggap Darurat Militer

## 📋 Prerequisites

### Sistem Requirement
- **Node.js**: Version 18.x atau lebih baru
- **npm**: Version 8.x atau lebih baru  
- **Git**: Version 2.x atau lebih baru
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+

### Hardware Minimum
- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4GB (8GB recommended)
- **Storage**: 2GB free space
- **Network**: Broadband internet connection
- **GPS**: Device dengan GPS capability (untuk mobile)

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
# Clone dari GitHub
git clone https://github.com/your-org/military-emergency-system.git
cd military-emergency-system

# Atau download ZIP dan extract
```

### 2. Install Dependencies
```bash
# Install semua dependencies
npm install

# Atau menggunakan yarn
yarn install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit file .env dengan konfigurasi yang sesuai
nano .env
```

### 4. Start Development Server
```bash
# Jalankan development server
npm run dev

# Server akan berjalan di http://localhost:5173
```

---

## 🔧 Detailed Installation

### Step 1: System Dependencies

#### Windows
```powershell
# Install Node.js menggunakan Chocolatey
choco install nodejs

# Atau download dari https://nodejs.org
# Install Git
choco install git
```

#### macOS
```bash
# Install menggunakan Homebrew
brew install node
brew install git

# Atau menggunakan nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### Linux (Ubuntu/Debian)
```bash
# Update package manager
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install git
```

### Step 2: Project Setup

#### Clone dan Install
```bash
# Clone repository
git clone https://github.com/your-org/military-emergency-system.git
cd military-emergency-system

# Verify Node.js version
node --version  # Should be v18.x.x or higher
npm --version   # Should be 8.x.x or higher

# Install dependencies
npm ci  # Untuk production consistency
# atau
npm install  # Untuk development
```

#### Verify Installation
```bash
# Check installed packages
npm list --depth=0

# Run basic tests
npm test

# Build untuk memastikan setup benar
npm run build
```

---

## 🗄️ Database Setup

### Supabase Configuration

#### 1. Create Supabase Project
```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login ke Supabase
supabase login

# Initialize project
supabase init
```

#### 2. Database Migration
```bash
# Jalankan migrations
supabase db reset

# Atau manual migration
supabase migration up
```

#### 3. Setup RLS Policies
```sql
-- Enable RLS pada semua tabel
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Apply security policies (lihat TECHNICAL_DOCS.md untuk detail)
```

### Environment Variables
```bash
# .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional configurations
VITE_MAPS_API_KEY=your-maps-api-key
VITE_VOICE_API_KEY=your-voice-api-key
VITE_SMS_GATEWAY_URL=your-sms-gateway
```

---

## 🗺️ Maps Configuration

### Option 1: OpenStreetMap (Default)
```typescript
// No additional configuration needed
// Uses free OpenStreetMap tiles
const mapConfig = {
  tileLayer: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
};
```

### Option 2: Google Maps
```bash
# Dapatkan API key dari Google Cloud Console
# Enable Maps JavaScript API dan Places API
```

```typescript
// Add to environment
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Option 3: Mapbox
```bash
# Signup di mapbox.com untuk access token
```

```typescript
// Add to environment  
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

---

## 📱 Mobile Setup

### Progressive Web App (PWA)
```bash
# PWA sudah dikonfigurasi, pastikan HTTPS untuk production
# Service worker akan handle offline functionality
```

### Native Mobile (Optional)
```bash
# Install Capacitor untuk native deployment
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# Initialize Capacitor
npx cap init

# Add platforms
npx cap add android
npx cap add ios
```

---

## 🔐 Security Setup

### SSL/HTTPS Configuration
```bash
# Untuk development dengan HTTPS
npm install --save-dev @vitejs/plugin-basic-ssl

# Update vite.config.ts
import basicSsl from '@vitejs/plugin-basic-ssl'

export default {
  plugins: [basicSsl()],
  server: {
    https: true
  }
}
```

### Authentication Setup
```typescript
// Supabase Auth sudah dikonfigurasi
// Untuk custom auth provider, update AuthContext.tsx

// Google OAuth (optional)
const googleProvider = {
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
};
```

---

## 🔄 Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/emergency-voice-commands

# Make changes dan commit
git add .
git commit -m "Add voice command feature"

# Push dan create PR
git push origin feature/emergency-voice-commands
```

### Development Commands
```bash
# Start development server
npm run dev

# Run tests
npm test
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview

# Lint dan format code
npm run lint
npm run format

# Type checking
npm run type-check
```

### Development Tools
```bash
# Recommended VS Code extensions
ext install bradlc.vscode-tailwindcss
ext install ms-vscode.vscode-typescript-next
ext install esbenp.prettier-vscode
ext install ms-vscode.vscode-eslint
```

---

## 🚀 Production Deployment

### Lovable Platform (Recommended)
```bash
# Already configured for Lovable
# Just push to GitHub, auto-deployment aktif
git push origin main
```

### Manual Deployment

#### Build Production
```bash
# Build optimized version
npm run build

# Test production build locally
npm run preview
```

#### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build dan deploy
npm run build
netlify deploy --prod --dir=dist
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🧪 Testing Setup

### Unit Testing
```bash
# Install testing dependencies (sudah included)
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### E2E Testing
```bash
# Install Playwright
npm install --save-dev @playwright/test

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

### Testing Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
```

---

## 📊 Monitoring Setup

### Performance Monitoring
```typescript
// Setup performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send metrics to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Error Tracking
```typescript
// Setup error tracking dengan Sentry (optional)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Node Version Issues
```bash
# Check current version
node --version

# Use nvm to manage versions
nvm install 18
nvm use 18
```

#### 2. Permission Errors
```bash
# Linux/macOS permission issues
sudo chown -R $(whoami) ~/.npm

# Windows permission issues
# Run terminal as administrator
```

#### 3. Port Already in Use
```bash
# Find process using port 5173
netstat -ano | findstr :5173  # Windows
lsof -ti:5173                 # macOS/Linux

# Kill process or use different port
npm run dev -- --port 3000
```

#### 4. GPS/Location Issues
```javascript
// Debug location services
navigator.permissions.query({name:'geolocation'}).then(function(result) {
  console.log('Geolocation permission:', result.state);
});

// Test location manually
navigator.geolocation.getCurrentPosition(
  position => console.log('Location:', position),
  error => console.error('Location error:', error),
  { enableHighAccuracy: true }
);
```

#### 5. Supabase Connection Issues
```typescript
// Test Supabase connection
import { supabase } from './src/integrations/supabase/client';

supabase.from('emergency_reports').select('count').then(
  result => console.log('Supabase connected:', result),
  error => console.error('Supabase error:', error)
);
```

### Debug Commands
```bash
# Clear npm cache
npm cache clean --force

# Reset node_modules
rm -rf node_modules package-lock.json
npm install

# Check for outdated packages
npm outdated

# Update packages
npm update
```

---

## 🔄 Updates & Maintenance

### Regular Updates
```bash
# Check for updates
npm outdated

# Update dependencies (carefully)
npm update

# Update major versions (with caution)
npx npm-check-updates -u
npm install
```

### Security Updates
```bash
# Audit dependencies for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Manual security updates
npm install package@version
```

### Database Migrations
```bash
# Create new migration
supabase migration new add_new_feature

# Apply migrations
supabase db push

# Reset database (development only)
supabase db reset
```

---

## 📞 Support & Resources

### Documentation
- **User Guide**: [USER_GUIDE.md](./USER_GUIDE.md)
- **Technical Docs**: [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md)
- **API Reference**: [API.md](./API.md)

### Community
- **GitHub Issues**: [Report bugs](https://github.com/your-org/military-emergency-system/issues)
- **Discussions**: [Community forum](https://github.com/your-org/military-emergency-system/discussions)

### Professional Support
- **Emergency Technical Support**: +62-800-TECH-911
- **Email Support**: tech-support@military-emergency.id
- **SLA**: 24/7 for critical issues

---

## ✅ Post-Installation Checklist

### Basic Functionality
- [ ] Application starts without errors
- [ ] Database connection established
- [ ] Authentication system working
- [ ] Location services enabled
- [ ] Maps loading correctly
- [ ] Real-time updates functioning

### Security Check
- [ ] HTTPS enabled (production)
- [ ] Environment variables secured
- [ ] Database RLS policies active
- [ ] Authentication configured
- [ ] CORS settings correct

### Performance
- [ ] Build size optimized
- [ ] Lazy loading implemented  
- [ ] Caching configured
- [ ] Mobile performance tested
- [ ] GPS accuracy verified

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Manual testing completed
- [ ] Performance benchmarks met

---

**🎉 Congratulations! Sistem Tanggap Darurat Militer siap digunakan.**

Untuk pertanyaan lebih lanjut, hubungi tim teknis atau lihat dokumentasi lengkap di folder `docs/`.

---

*Setup guide ini diperbarui untuk versi terbaru sistem. Pastikan menggunakan versi terbaru untuk keamanan dan performa optimal.*