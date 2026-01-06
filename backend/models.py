from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import relationship

from .db import Base


def utc_now():
    return datetime.utcnow()


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    default_cost_inr_per_unit = Column(Float, nullable=False)
    unit_label = Column(String(50), nullable=False, default="unit")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=utc_now, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
        server_default=func.now(),
    )

    quote_runs = relationship("QuoteRun", back_populates="product")


class QuoteRun(Base):
    __tablename__ = "quote_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_name = Column(String(255), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    inputs = Column(JSON, nullable=False)
    outputs = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, default=utc_now, server_default=func.now())

    product = relationship("Product", back_populates="quote_runs")
