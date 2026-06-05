from pydantic_settings import BaseSettings
from typing import Union, List
from pydantic import field_validator

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/collab_khata"
    test_database_url: str = "postgresql://postgres:postgres@localhost:5432/collab_khata_test"
    
    @field_validator('database_url', 'test_database_url', mode='before')
    @classmethod
    def fix_postgres_scheme(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v
    
    # JWT
    jwt_secret_key: str = "your-super-secret-jwt-key-change-this-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True
    
    # File Upload
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 10
    
    # CORS
    allowed_origins: Union[str, List[str]] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    @field_validator('allowed_origins', mode='before')
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
