# Vape Flavor Showcase Backend (FastAPI + SQLite)

This is a tiny REST backend that persists products + flavors (with per-flavor inventory) in a SQLite database (`app.db`).

## Run (local)

```bash
cd vape-backend-fastapi
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# optional: protect the API with a shared key
# export API_KEY="some-secret"

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Open docs: http://localhost:8000/docs

## Using from Expo

If you're running on a physical phone, `localhost` won't point to your computer.

Use your computer's LAN IP instead:

- `http://YOUR_COMPUTER_IP:8000`

Example:

```ts
const BASE_URL = "http://192.168.1.23:8000";
```

## Optional API key

If you set `API_KEY`, every request must include:

- Header: `x-api-key: <your key>`

If you do **not** set `API_KEY`, the backend is open (no auth).

## Data model

- Product
  - name (optional)
  - category (optional)
  - price (optional)
  - description (optional)
  - image_key (optional; for your bundled demo images)
- Flavor
  - name (optional)
  - nicotine_mg (optional)
  - color_hex (optional)
  - stock (integer; default 0)

## Endpoints (summary)

- `GET /products`
- `POST /products`
- `PATCH /products/{product_id}`
- `DELETE /products/{product_id}`
- `POST /products/{product_id}/flavors`
- `PATCH /flavors/{flavor_id}`
- `DELETE /flavors/{flavor_id}`

