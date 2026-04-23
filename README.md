# Ghost Draft Publish

Next.js App Router CTF challenge with drafts, previews, restores, review flow, and a one-shot internal export route.

## Run

```bash
docker-compose up --build
```

The container bootstrap script initializes the SQLite database, seeds the challenge data, and starts the app.

## Required environment

- `DATABASE_URL`
- `APP_SECRET`
- `CHALLENGE_FLAG`

## Notes

- The public release does not include organizer solve notes.
- The flag is read only from the `CHALLENGE_FLAG` environment variable.
