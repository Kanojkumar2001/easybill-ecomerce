# Deployment Notes

## Vercel frontend

1. Remove `vercel.json` from project root if it exists.
2. In Vercel project settings:
   - Root Directory: `./`
   - Framework Preset: `TanStack Start`
   - Build Command: `npm run build`
   - Output Directory: leave blank
   - Install Command: `npm install`
3. Add environment variable:
   - `VITE_API_URL` = `https://<your-render-backend>.onrender.com/api`
   - Example: `https://easybill-ecommerce-1.onrender.com/api`
4. Deploy.

## Render backend

1. Service root directory: `backend`
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Environment variables:
   - `MONGODB_URI` = your Atlas connection string
     - Example: `mongodb+srv://<user>:<pass>@cluster0.mongodb.net/easybill?retryWrites=true&w=majority`
   - `JWT_SECRET` = strong secret
   - `NODE_ENV` = `production` (optional)
5. Deploy.

> If Render cannot connect to MongoDB, your app will fall back to the default local string in `backend/config/db.js`, which causes `connect ECONNREFUSED 127.0.0.1:27017`.
>
> That means Render has not received a valid `MONGODB_URI` environment variable.

## Common pitfalls

- Do not use `vite` as the environment variable key.
- The frontend must use `VITE_API_URL`, not a generic name.
- `VITE_API_URL` should include `/api` because the frontend appends API routes like `/auth/login`.
- Do not set an Output Directory in Vercel if you are using the `TanStack Start` preset.
