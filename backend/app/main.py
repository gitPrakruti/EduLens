from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.db import create_indexes
from app.routers import auth, datasets, filters, notes

settings = get_settings()

print("MONGO DEBUG USER:", settings.mongodb_uri.split("://", 1)[1].split(":", 1)[0])
print("MONGO DEBUG HOST:", settings.mongodb_uri.split("@", 1)[1].split("/", 1)[0])

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_indexes()
    yield


app = FastAPI(title="SmartFilter API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(filters.router, prefix="/api")
app.include_router(notes.router, prefix="/api")


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else None
    field = ".".join(str(part) for part in first["loc"][1:]) if first else "input"
    return JSONResponse(
        status_code=422,
        content={"detail": f"Please check the '{field}' field and try again."},
    )


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    # Never leak stack traces to the client.
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on our end. Please try again."},
    )


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
