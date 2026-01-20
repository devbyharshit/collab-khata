from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from .core.config import settings
from .api.auth import router as auth_router
from .api.brands import router as brands_router
from .api.collaborations import router as collaborations_router

# Create FastAPI app
app = FastAPI(
    title="Collab Khata API",
    description="Brand Collaboration Tracker for Influencers",
    version="1.0.0",
    debug=settings.debug
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory if it doesn't exist
os.makedirs(settings.upload_dir, exist_ok=True)

# Include routers
app.include_router(auth_router)
app.include_router(brands_router)
app.include_router(collaborations_router)


@app.get("/")
async def root():
    """Root endpoint - API status check"""
    return {
        "message": "Collab Khata API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected",  # TODO: Add actual DB health check
        "upload_dir": os.path.exists(settings.upload_dir)
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Global HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "type": "HTTP_EXCEPTION"
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global exception handler for unexpected errors"""
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error",
                "type": "INTERNAL_ERROR"
            }
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )