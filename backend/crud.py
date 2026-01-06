from typing import List, Optional

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from . import models, schemas


def get_products(db: Session) -> List[models.Product]:
    result = db.execute(select(models.Product).order_by(models.Product.name))
    return result.scalars().all()


def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    return db.get(models.Product, product_id)


def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(db: Session, product_id: int, update: schemas.ProductUpdate) -> Optional[models.Product]:
    db_product = db.get(models.Product, product_id)
    if not db_product:
        return None
    for key, value in update.dict(exclude_unset=True).items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int) -> bool:
    db_product = db.get(models.Product, product_id)
    if not db_product:
        return False
    db.delete(db_product)
    db.commit()
    return True


def duplicate_product(db: Session, product_id: int) -> Optional[models.Product]:
    db_product = db.get(models.Product, product_id)
    if not db_product:
        return None
    new_product = models.Product(
        name=f"{db_product.name} Copy",
        default_cost_inr_per_unit=db_product.default_cost_inr_per_unit,
        unit_label=db_product.unit_label,
        notes=db_product.notes,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


def create_quote_run(db: Session, data: schemas.QuoteRunCreate) -> models.QuoteRun:
    db_run = models.QuoteRun(
        run_name=data.run_name,
        product_id=data.product_id,
        inputs=data.inputs.dict(),
        outputs=data.outputs.dict(),
    )
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run


def get_history(db: Session, search: Optional[str] = None) -> List[models.QuoteRun]:
    stmt = select(models.QuoteRun).order_by(desc(models.QuoteRun.created_at))
    if search:
        stmt = stmt.where(models.QuoteRun.run_name.ilike(f"%{search}%"))
    result = db.execute(stmt)
    return result.scalars().all()


def get_run(db: Session, run_id: int) -> Optional[models.QuoteRun]:
    return db.get(models.QuoteRun, run_id)
