import uuid
from sqlalchemy import String, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)

    name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Optional price — store as float for simplicity
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # For your app's demo images (e.g., "mint" / "strawberry")
    image_key: Mapped[str | None] = mapped_column(String(120), nullable=True)

    flavors: Mapped[list["Flavor"]] = relationship(
        "Flavor",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="Flavor.created_at_ordinal",
    )


class Flavor(Base):
    __tablename__ = "flavors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)

    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id", ondelete="CASCADE"))

    name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    nicotine_mg: Mapped[int | None] = mapped_column(Integer, nullable=True)
    color_hex: Mapped[str | None] = mapped_column(String(16), nullable=True)

    # Inventory per flavor
    stock: Mapped[int] = mapped_column(Integer, default=0)

    # Simple stable ordering within product without adding timestamps
    created_at_ordinal: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped[Product] = relationship("Product", back_populates="flavors")
