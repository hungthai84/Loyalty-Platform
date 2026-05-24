# SEVA Loyalty CRM Platform

**Enterprise Jewelry & Retail CRM / Loyalty Ecosystem**

## 1. System Architecture

### Component Architecture
This prototype uses a modern single-page-application structure:
- **`src/App.tsx`**: Main router shell managing global state and authentication flow.
- **`src/components/layout/`**: Dashboard Shell (Sidebar, Topbar).
- **`src/components/ui/`**: Core primitive components managed by Shadcn (Tailwind + Radix).
- **`src/views/`**: Feature modules:
  - `DashboardView`: Core analytics and KPI summaries.
  - `CustomersView`: Customer management, search, and table visualization.
  - `LoyaltyView`: Rules engine, tiers, and campaign setup.
  - `CustomerPortalView`: Mobile-first responsive touchpoint for end retail customers.

### Deployment Architecture (AWS Native)
For production deployment, SEVA adopts a highly scalable AWS architecture:
- **Frontend**: Next.js deployed on Vercel or AWS Amplify (Edge Network).
- **Backend API**: Node.js/NestJS running on Amazon EKS (Elastic Kubernetes Service).
- **Database**: Amazon Aurora Serverless (PostgreSQL) for transactional data.
- **Cache**: Amazon ElastiCache (Redis) for session management and rate limiting.
- **Async Workers**: Amazon SQS + AWS Lambda for background jobs (loyalty points calculation, email triggers).

### CI/CD Pipeline
- **Continuous Integration**: GitHub Actions on every Pull Request (Runs ESLint, Prettier, Jest unit tests).
- **Continuous Deployment**: Merges to `main` auto-deploy to Staging. Manual approval deploys to Production EKS cluster via ArgoCD.

---

## 2. Docker Setup

Below is the standard `Dockerfile` for the NestJS Backend microservices:

```dockerfile
# Base image
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

---

## 3. Database Schema (ERD Overview)

The PostgreSQL multi-tenant schema uses strict indexing and foreign keys:

- **`customers`**: `id` (UUID), `phone`, `email`, `tier_id` (FK), `lifetime_spend`, `points_balance`.
- **`loyalty_tiers`**: `id`, `name` (Silver, Gold, etc.), `min_spend`, `point_multiplier`.
- **`transactions`**: `id`, `customer_id` (FK), `store_id`, `total_amount`, `points_earned`, `created_at`.
- **`campaigns`**: `id`, `name`, `rule_type`, `bonus_points`, `start_date`, `end_date`.
- **`tickets`**: `id`, `customer_id` (FK), `status`, `assigned_to`, `channel` (Omnichannel ref).

---

## 4. API Specification (REST & GraphQL)

| Endpoint | Method | Description | Roles |
|----------|--------|-------------|-------|
| `/api/v1/customers` | GET | List paginated customers | Admin, Manager |
| `/api/v1/customers/:id/points` | POST | Manually adjust loyalty points | Admin |
| `/api/v1/loyalty/rules` | PUT | Update point calculation formulas | Admin |
| `/api/v1/portal/me` | GET | Fetch current customer profile & barcode | Customer |

*API Authentication uses JWT Bearer tokens with strict scoping. Rate limiting is applied per tenant using Redis.*

---

## 5. Security Summary
- **OWASP Compliance**: Helmet.js for HTTP headers, CSRF protection, input validation via class-validator.
- **Data Encryption**: AES-256 for PII data at rest. TLS 1.3 for data in transit. 
