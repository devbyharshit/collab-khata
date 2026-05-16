from pydantic import BaseModel
from enum import Enum

class CollaborationStatus(str, Enum):
    LEAD = "Lead"
    NEGOTIATING = "Negotiating"

class StatusUpdate(BaseModel):
    status: CollaborationStatus

data = StatusUpdate.model_validate({"status": "Negotiating"})
print(repr(data.status))
print(type(data.status))
