from sqlalchemy.orm import Session
from sqlalchemy import select, func

from . import models, schemas


def list_products(db: Session) -> list[models.Product]:
    # Eager-load flavors to avoid N+1 queries.
    # For small data, simplest approach is to just access flavors after load.
    return list(db.scalars(select(models.Product)).all())


def get_product(db: Session, product_id: str) -> models.Product | None:
    return db.get(models.Product, product_id)


def create_product(db: Session, payload: schemas.ProductCreate) -> models.Product:
    product = models.Product(
        name=payload.name,
        category=payload.category,
        price=payload.price,
        description=payload.description,
        image_key=payload.image_key,
    )
    db.add(product)
    db.flush()  # ensures product.id exists

    if payload.flavors:
        # Maintain a stable order in which flavors were supplied
        for idx, f in enumerate(payload.flavors):
            flavor = models.Flavor(
                product_id=product.id,
                name=f.name,
                nicotine_mg=f.nicotine_mg,
                color_hex=f.color_hex,
                stock=0 if f.stock is None else int(f.stock),
                created_at_ordinal=idx,
            )
            db.add(flavor)

    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product: models.Product, payload: schemas.ProductUpdate) -> models.Product:
    # Only update fields explicitly present (not None means set to None is impossible via this simple schema).
    # If you want explicit nulling, we can switch to pydantic's model_fields_set.
    if payload.name is not None:
        product.name = payload.name
    if payload.category is not None:
        product.category = payload.category
    if payload.price is not None:
        product.price = payload.price
    if payload.description is not None:
        product.description = payload.description
    if payload.image_key is not None:
        product.image_key = payload.image_key

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: models.Product) -> None:
    db.delete(product)
    db.commit()


def add_flavor(db: Session, product: models.Product, payload: schemas.FlavorCreate) -> models.Flavor:
    # Find next ordinal within the product
    next_ord = db.scalar(
        select(func.coalesce(func.max(models.Flavor.created_at_ordinal), -1)).where(models.Flavor.product_id == product.id)
    )
    if next_ord is None:
        next_ord = -1

    flavor = models.Flavor(
        product_id=product.id,
        name=payload.name,
        nicotine_mg=payload.nicotine_mg,
        color_hex=payload.color_hex,
        stock=0 if payload.stock is None else int(payload.stock),
        created_at_ordinal=int(next_ord) + 1,
    )
    db.add(flavor)
    db.commit()
    db.refresh(flavor)
    return flavor


def get_flavor(db: Session, flavor_id: str) -> models.Flavor | None:
    return db.get(models.Flavor, flavor_id)


def update_flavor(db: Session, flavor: models.Flavor, payload: schemas.FlavorUpdate) -> models.Flavor:
    if payload.name is not None:
        flavor.name = payload.name
    if payload.nicotine_mg is not None:
        flavor.nicotine_mg = payload.nicotine_mg
    if payload.color_hex is not None:
        flavor.color_hex = payload.color_hex
    if payload.stock is not None:
        flavor.stock = int(payload.stock)

    db.commit()
    db.refresh(flavor)
    return flavor


def delete_flavor(db: Session, flavor: models.Flavor) -> None:
    db.delete(flavor)
    db.commit()
