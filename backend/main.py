from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import calc, crud, models, schemas
from .db import Base, engine, get_db

app = FastAPI(title="Quote Calculator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def seed_products(db: Session):
    if crud.get_products(db):
        return
    demo_products = [
        schemas.ProductCreate(
            name="Basmati Rice 5kg",
            default_cost_inr_per_unit=320.0,
            unit_label="bag",
            notes="Premium grade bag",
        ),
        schemas.ProductCreate(
            name="Cotton T-Shirt",
            default_cost_inr_per_unit=180.0,
            unit_label="piece",
            notes="Crew neck, 180 GSM",
        ),
        schemas.ProductCreate(
            name="Copper Wire",
            default_cost_inr_per_unit=650.0,
            unit_label="kg",
            notes="Industrial spool",
        ),
    ]
    for product in demo_products:
        crud.create_product(db, product)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_products(db)
    finally:
        db.close()


@app.post("/calculate", response_model=schemas.CalculationOutput)
def calculate(inputs: schemas.CalculationInputs):
    try:
        return calc.compute_calculation(inputs)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/products", response_model=List[schemas.Product])
def list_products(db: Session = Depends(get_db)):
    return crud.get_products(db)


@app.post("/products", response_model=schemas.Product, status_code=201)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, product)


@app.get("/products/{product_id}", response_model=schemas.Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = crud.update_product(db, product_id, update)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")
    return


@app.post("/products/{product_id}/duplicate", response_model=schemas.Product, status_code=201)
def duplicate_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.duplicate_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.get("/history", response_model=List[schemas.QuoteRun])
def list_history(search: Optional[str] = None, db: Session = Depends(get_db)):
    runs = crud.get_history(db, search)
    return runs


@app.post("/history", response_model=schemas.QuoteRun, status_code=201)
def create_history(run: schemas.QuoteRunCreate, db: Session = Depends(get_db)):
    return crud.create_quote_run(db, run)


@app.get("/history/{run_id}", response_model=schemas.QuoteRun)
def get_history(run_id: int, db: Session = Depends(get_db)):
    run = crud.get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@app.get("/history/compare")
def compare_history(run_a: int, run_b: int, db: Session = Depends(get_db)):
    first = crud.get_run(db, run_a)
    second = crud.get_run(db, run_b)
    if not first or not second:
        raise HTTPException(status_code=404, detail="Run not found")
    return {
        "run_a": schemas.QuoteRun.from_orm(first),
        "run_b": schemas.QuoteRun.from_orm(second),
    }
