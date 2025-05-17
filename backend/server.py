from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class FormField(BaseModel):
    type: str
    label: str
    name: str
    required: Union[bool, str] = False
    className: str = "form-control"
    access: bool = False
    subtype: Optional[str] = None
    maxlength: Optional[int] = None
    multiple: Optional[bool] = None
    values: Optional[Union[List[Dict[str, Any]], Dict[str, Dict[str, Any]]]] = None
    conditions: Optional[List[Dict[str, Any]]] = None
    sort_option: Optional[str] = None
    default_display_field: Optional[bool] = None

class FormCreate(BaseModel):
    name: str
    fields: List[FormField]

class Form(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    fields: List[Dict[str, Any]]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Form Builder API Endpoints
@api_router.post("/forms", response_model=Form)
async def create_form(form_data: FormCreate):
    try:
        form = Form(
            name=form_data.name,
            fields=[field.dict() for field in form_data.fields]
        )
        
        result = await db.forms.insert_one(form.dict())
        created_form = await db.forms.find_one({"_id": result.inserted_id})
        
        # Convert MongoDB _id to string id for response
        if created_form:
            created_form["id"] = str(created_form.pop("_id"))
            return Form(**created_form)
        else:
            raise HTTPException(status_code=500, detail="Failed to create form")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/forms", response_model=List[Form])
async def get_forms():
    try:
        forms = await db.forms.find().to_list(100)
        # Convert MongoDB _id to string id for each form
        for form in forms:
            form["id"] = str(form.pop("_id"))
        return forms
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/forms/{form_id}", response_model=Form)
async def get_form(form_id: str):
    try:
        # Try to find the form by id field first
        form = await db.forms.find_one({"id": form_id})
        
        # If not found, check for MongoDB _id (but as string)
        if not form:
            form = await db.forms.find_one({"_id": form_id})
            
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
            
        # Convert MongoDB _id to string id for response if needed
        if "_id" in form and "id" not in form:
            form["id"] = str(form.pop("_id"))
            
        return form
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/forms/{form_id}", response_model=Form)
async def update_form(form_id: str, form_data: FormCreate):
    try:
        # Update with new data and set updated_at timestamp
        form_dict = {
            "name": form_data.name,
            "fields": [field.dict() for field in form_data.fields],
            "updated_at": datetime.utcnow()
        }
        
        result = await db.forms.update_one(
            {"id": form_id},
            {"$set": form_dict}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Form not found")
            
        updated_form = await db.forms.find_one({"id": form_id})
        return updated_form
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/forms/{form_id}")
async def delete_form(form_id: str):
    try:
        result = await db.forms.delete_one({"id": form_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Form not found")
        return {"message": "Form deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Laravel API placeholder endpoints
@api_router.post("/laravel/forms", response_model=Dict[str, Any])
async def laravel_create_form(form_data: FormCreate):
    # This is a placeholder for the Laravel API endpoint
    # In production, this would make a request to the Laravel API
    return {
        "id": str(uuid.uuid4()),
        "name": form_data.name,
        "fields": [field.dict() for field in form_data.fields],
        "created_at": datetime.utcnow().isoformat(),
        "message": "Form saved to Laravel API (placeholder)"
    }

@api_router.get("/laravel/forms", response_model=List[Dict[str, Any]])
async def laravel_get_forms():
    # Placeholder that would fetch forms from Laravel API
    return [
        {
            "id": str(uuid.uuid4()),
            "name": "Contact Form",
            "fields_count": 15,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Survey Form",
            "fields_count": 8,
            "created_at": datetime.utcnow().isoformat()
        }
    ]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
