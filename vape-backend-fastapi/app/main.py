from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from .auth import require_api_key
from . import schemas, crud


# Create tables automatically on startup (good enough for a small personal app)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vape Flavor Showcase Backend", version="1.0.0")

# Expo Go + Metro dev environments can be noisy about origins.
# For a personal project, simplest is to allow all.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/products", response_model=list[schemas.ProductOut], dependencies=[Depends(require_api_key)])
def get_products(db: Session = Depends(get_db)):
    return crud.list_products(db)


@app.post("/products", response_model=schemas.ProductOut, dependencies=[Depends(require_api_key)])
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, payload)


@app.patch("/products/{product_id}", response_model=schemas.ProductOut, dependencies=[Depends(require_api_key)])
def patch_product(product_id: str, payload: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.update_product(db, product, payload)


@app.delete("/products/{product_id}", dependencies=[Depends(require_api_key)])
def remove_product(product_id: str, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    crud.delete_product(db, product)
    return {"deleted": True}


@app.post("/products/{product_id}/flavors", response_model=schemas.FlavorOut, dependencies=[Depends(require_api_key)])
def add_flavor(product_id: str, payload: schemas.FlavorCreate, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.add_flavor(db, product, payload)


@app.patch("/flavors/{flavor_id}", response_model=schemas.FlavorOut, dependencies=[Depends(require_api_key)])
def patch_flavor(flavor_id: str, payload: schemas.FlavorUpdate, db: Session = Depends(get_db)):
    flavor = crud.get_flavor(db, flavor_id)
    if not flavor:
        raise HTTPException(status_code=404, detail="Flavor not found")
    return crud.update_flavor(db, flavor, payload)


@app.delete("/flavors/{flavor_id}", dependencies=[Depends(require_api_key)])
def remove_flavor(flavor_id: str, db: Session = Depends(get_db)):
    flavor = crud.get_flavor(db, flavor_id)
    if not flavor:
        raise HTTPException(status_code=404, detail="Flavor not found")
    crud.delete_flavor(db, flavor)
    return {"deleted": True}
