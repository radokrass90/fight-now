# fightersgame progression service

Deployed on SSH host `prod` in `/opt/fightersgame`. The `agents` host is not used.

PostgreSQL database **fightersgame** lives in the existing `supabase-db` PostgreSQL 17 container, in its persistent data volume. This is a separate database, not a schema added to another customer's database. The existing Supabase REST/Auth services continue to use their original databases. A dedicated FastAPI service connects to fightersgame with a limited role; the browser never receives its database password or a Supabase service-role key.

Public game/API: `https://fightersgame.159.195.207.175.sslip.io/`. GitHub Pages `/fight-now/reforged/` uses the same API with explicit CORS permission. The new service binds only `127.0.0.1:7120` and Caddy provides HTTPS. Existing Caddy sites were preserved and the prior file was backed up before adding this hostname.

## Persistent model

- players: guest or named account, coin balance and monotonic revision
- sessions: SHA-256 hashes of random bearer tokens, 180-day expiry
- inventory: permanent account-wide weapon ownership
- loadouts: equipped weapon per fighter, constrained to owned inventory
- upgrades: five levels each of power, guard and focus per fighter
- weapons: 100 seeded catalog records
- matches: server-issued reward ticket, loadout snapshot and one terminal reward
- ledger: append-only balance audit and unique reward per match

Fresh guests receive 250 coins. Naming the profile and choosing a password makes progress recoverable on another browser/device. Passwords use salted scrypt. Signing in switches the active profile; balances are not merged. Named accounts retain inventory independently of a particular device token.

## Economy rules

Versus CPU and arcade pay 130/160/210 coins for easy/normal/hard wins, plus 20 for flawless and 15 for a finisher. A completed loss pays 45. Training/local PvP award no currency. Server tickets must be at least eight seconds old, expire after 24 hours and pay at most once; hourly earned currency is capped at 5,000. The game runs locally and reports its outcome; this is a casual progression service, not server-side combat replay verification.

All prices and upgrade costs are chosen by server code, never accepted from request bodies. Purchases lock the wallet row, reject insufficient funds and cannot double-charge an already owned weapon. All mutation transactions return a profile revision so out-of-order responses cannot roll the displayed wallet backward. Finishing rewards sync before issuing the next match ticket. Pending claims survive page reload and retry on reconnection.

Weapons are permanent and never consumed by matches. A fighter's loadout is snapshotted at match start and retained through rounds. In local PvP both chosen fighters can use the browser account's per-fighter equipment. Opponent CPUs use baseline gear. Weapons affect damage, hand-strike reach and meter gain; character power/guard/focus upgrades affect outgoing damage, incoming damage and meter respectively. All character data stays immutable.

Offline play can use the last cached equipment. Purchases require the server; offline matches without a server-issued ticket cannot create currency. Do not change the production origin or token storage keys without a migration plan for guest sessions.

## Deployment and verification

`provision.py` runs on prod, creates only the named database/limited role and seeds the catalog. Credentials are generated on the server in `/opt/fightersgame/.env` (root-only). Do not copy that file to the repository. `schema.sql` is idempotent; it never drops existing data. `compose.yaml` creates an independent, unprivileged container on the existing internal Supabase network.

The integration test creates its own QA players and funds only those fixtures. It tests all 100 purchases/equips, the fifteen upgrade levels across three tracks, insufficient funds, purchase races, cross-player isolation, account save/login/logout, timed tickets, duplicate reward claims and private DB privileges. It does not edit real player profiles.

```sh
ssh prod 'python3 /opt/fightersgame/api/test_api.py'
ssh prod 'docker exec -u postgres supabase-db psql -d fightersgame -c "SELECT current_database();"'
```

Source checks: `python3 tools/verify-reforged.py` (set GAME_NODE/NODE_PATH for your installed dependencies). `check-economy-runtime.cjs` actually decodes all 100 SVGs and verifies visible changed pixels, bonuses, per-round equipment retention for all 15 fighters, training reward exclusion and offline balance behavior.

Browser evidence is in `review/economy/`: an actual 1200×665 shop purchase, upgrade, reload and full completed CPU match credited 45 coins (30→75). Phone-size German UI, category filtering, inventory and account form are checked separately. Physical iOS/Android hardware has not been tested.
