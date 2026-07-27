# CalorieLens

CalorieLens is an MVP web application for estimating the calorie range of food from an uploaded image. This bootstrap includes the production-ready application foundation and a local image-upload experience only; AI image analysis, OpenAI Vision integration, and USDA FoodData Central integration are intentionally not implemented yet.

## Tech Stack

- Next.js 15 App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui conventions
- Prisma
- SQLite

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

3. Generate the Prisma client:

   ```bash
   npm run prisma:generate
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Useful Scripts

- `npm run dev` - start the local development server.
- `npm run build` - create a production build.
- `npm run start` - run the production server.
- `npm run lint` - run Next.js linting.
- `npm run typecheck` - run TypeScript without emitting files.
- `npm run prisma:generate` - generate Prisma Client.
- `npm run prisma:migrate` - create and apply a local database migration.
- `npm run prisma:studio` - inspect local data with Prisma Studio.

## Project Structure

```text
prisma/                   Prisma schema and local database configuration
src/app/                  Next.js App Router routes and global styles
src/components/home/      Home page feature components
src/components/ui/        shadcn/ui-compatible reusable primitives
src/components/upload/    Reusable upload components
src/lib/                  Shared utility functions
```

## Current Upload Behavior

The home page supports drag-and-drop and click-to-upload image selection for JPG, JPEG, PNG, and WebP files up to 10MB. Selected images are previewed locally in the browser with filename, dimensions, and file size metadata. Users can replace or remove the selected image. No files are sent to a server yet, and no AI analysis is performed.

## Environment Variables

Use `.env.example` as the template for local configuration. `DATABASE_URL` is configured for SQLite by default. API keys are reserved for later OpenAI and USDA FoodData Central integration work.
