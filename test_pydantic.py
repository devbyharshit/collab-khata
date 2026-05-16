from pydantic import BaseModel, Field, model_validator
from datetime import date
from typing import Optional
from enum import Enum

class CollaborationStatus(str, Enum):
    OVERDUE = "Overdue"

class CollaborationStatusUpdate(BaseModel):
    status: CollaborationStatus = Field(...)
    posting_date: Optional[date] = Field(None)
    
    @model_validator(mode='before')
    @classmethod
    def empty_string_to_none(cls, data):
        if isinstance(data, dict):
            if data.get('posting_date') == '':
                data['posting_date'] = None
        return data

print(CollaborationStatusUpdate.model_validate({"status": "Overdue", "posting_date": ""}))
