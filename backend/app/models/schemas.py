from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class ExtractRequest(BaseModel):
    url: str = Field(..., description="Target social media or media URL")

class MediaItemSchema(BaseModel):
    id: str
    type: Literal["image", "video"]
    thumbnail_url: str
    media_url: str
    duration: Optional[float] = None

class ExtractResponse(BaseModel):
    platform: Literal["instagram", "youtube", "threads", "twitter", "generic"]
    media_type: Literal["single_image", "carousel", "video"]
    title: str
    items: List[MediaItemSchema]
