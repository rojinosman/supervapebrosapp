from pydantic import BaseModel, Field


class FlavorBase(BaseModel):
    name: str | None = None
    nicotine_mg: int | None = None
    color_hex: str | None = None
    stock: int | None = None


class FlavorCreate(FlavorBase):
    # everything optional; stock defaults to 0 server-side if None
    pass


class FlavorUpdate(FlavorBase):
    pass


class FlavorOut(BaseModel):
    id: str
    product_id: str
    name: str | None = None
    nicotine_mg: int | None = None
    color_hex: str | None = None
    stock: int

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str | None = None
    category: str | None = None
    price: float | None = None
    description: str | None = None
    image_key: str | None = None


class ProductCreate(ProductBase):
    # You may optionally create with initial flavors
    flavors: list[FlavorCreate] | None = Field(default=None)


class ProductUpdate(ProductBase):
    pass


class ProductOut(BaseModel):
    id: str
    name: str | None = None
    category: str | None = None
    price: float | None = None
    description: str | None = None
    image_key: str | None = None
    flavors: list[FlavorOut] = []

    class Config:
        from_attributes = True
