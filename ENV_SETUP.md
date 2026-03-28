# Environment Variables Setup

Copy the block below into a file named `.env` in the project root before running the app.

```
# MySQL/TiDB connection string
DATABASE_URL=mysql://root:password@localhost:3306/traffic_forecast

# Random secret for session cookies (generate with: openssl rand -hex 32)
JWT_SECRET=your-random-secret-key-here

# App environment
NODE_ENV=production

# Port (optional, defaults to 3000)
PORT=3000
```

## Minimum Required Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | Session signing secret (any random string) |
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | No | Defaults to `3000` |

## Notes

- The traffic prediction and all charts work without a database. The database is only used for user authentication (login/logout).
- If you do not need user login, you can skip the database setup entirely and the dashboard will still display all predictions and charts.
