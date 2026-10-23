# Database Architecture Note: MongoDB Atlas & Mongoose ODM

TechLedger uses **MongoDB Atlas** with **Mongoose ODM** (`src/models/*` and `src/lib/mongodb.ts`) rather than Prisma migrations.

## Why Mongoose ODM instead of Prisma for MongoDB?
1. **Native Document Modeling & Schema Validation**: Mongoose provides native schema validation, hooks, virtuals, selective field projection (`select: false` on `passwordHash`), and `.lean()` query execution tailored for MongoDB document structures.
2. **Controlled Indexing Strategy**: MongoDB does not use SQL-style DDL migrations. Instead, indexes are explicitly declared on our Mongoose schemas (`User`, `Article`, `Category`, `Tag`, `AuditLog`, `WebsiteSettings`) and synchronized safely via `Model.syncIndexes()` or controlled administrative scripts.
3. **Serverless Connection Caching**: `src/lib/mongodb.ts` maintains a cached global Mongoose connection across Next.js App Router serverless invocations on Vercel, preventing connection pool exhaustion on MongoDB Atlas M0 free-tier clusters.
