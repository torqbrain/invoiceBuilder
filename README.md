# Invoice Builder

## Netlify Deployment

Deploy this app to Netlify with:

- Build command: `npm run build`
- Publish directory: `dist`

Required environment variables in Netlify:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

Use [.env.example](/Users/harshangrajpara/Projects/INVOICE-BUILDER/.env.example:1) as the reference.

For Google login to work in production, add your production app URL to Supabase:

- Site URL: `https://bills.torqbrain.com`
- Additional Redirect URLs:
  - `https://bills.torqbrain.com`
  - `http://127.0.0.1:8080`
  - `http://localhost:8080`
