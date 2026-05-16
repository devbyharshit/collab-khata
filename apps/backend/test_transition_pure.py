from app.models.collaboration import CollaborationStatus
import enum

print(type(CollaborationStatus.LEAD))
print(hasattr(CollaborationStatus.LEAD, 'value'))

class FakeCollab:
    status = "Lead"

c = FakeCollab()
print(type(c.status))
