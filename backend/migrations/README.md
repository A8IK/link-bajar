# Migrations

For initial development the backend uses `sequelize.sync({ alter: false })` at boot to materialize all model tables (see `src/server.js`).

Before production, generate proper migrations:

```bash
npx sequelize-cli migration:generate --name init-schema
```

Then translate each model in `src/models/*.js` into `up/down` migration blocks. Keep migrations append-only — never edit a migration that has already run in production.
