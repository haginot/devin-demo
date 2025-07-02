from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional
import uuid

app = FastAPI(title="Nutrition Tracker API", description="A MyFitnessPal-like nutrition tracking API")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

food_database = {}
food_entries = {}
user_profiles = {}

class FoodItem(BaseModel):
    id: Optional[str] = None
    name: str
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
    fiber_per_100g: Optional[float] = 0
    sugar_per_100g: Optional[float] = 0

class FoodEntry(BaseModel):
    id: Optional[str] = None
    food_id: str
    quantity_grams: float
    meal_type: str  # breakfast, lunch, dinner, snack
    date: date
    timestamp: Optional[datetime] = None

class UserProfile(BaseModel):
    id: Optional[str] = None
    name: str
    daily_calorie_goal: float
    daily_protein_goal: float
    daily_carbs_goal: float
    daily_fat_goal: float

class NutritionSummary(BaseModel):
    date: date
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    total_sugar: float
    calorie_goal: float
    protein_goal: float
    carbs_goal: float
    fat_goal: float

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/api/foods", response_model=FoodItem)
async def create_food(food: FoodItem):
    food_id = str(uuid.uuid4())
    food.id = food_id
    food_database[food_id] = food
    return food

@app.get("/api/foods", response_model=List[FoodItem])
async def get_foods(search: Optional[str] = None):
    foods = list(food_database.values())
    if search:
        foods = [f for f in foods if search.lower() in f.name.lower()]
    return foods

@app.get("/api/foods/{food_id}", response_model=FoodItem)
async def get_food(food_id: str):
    if food_id not in food_database:
        raise HTTPException(status_code=404, detail="Food not found")
    return food_database[food_id]

@app.post("/api/entries", response_model=FoodEntry)
async def create_food_entry(entry: FoodEntry):
    entry_id = str(uuid.uuid4())
    entry.id = entry_id
    entry.timestamp = datetime.now()
    food_entries[entry_id] = entry
    return entry

@app.get("/api/entries", response_model=List[FoodEntry])
async def get_food_entries(date_filter: Optional[date] = None):
    entries = list(food_entries.values())
    if date_filter:
        entries = [e for e in entries if e.date == date_filter]
    return sorted(entries, key=lambda x: x.timestamp, reverse=True)

@app.delete("/api/entries/{entry_id}")
async def delete_food_entry(entry_id: str):
    if entry_id not in food_entries:
        raise HTTPException(status_code=404, detail="Entry not found")
    del food_entries[entry_id]
    return {"message": "Entry deleted"}

@app.post("/api/profile", response_model=UserProfile)
async def create_or_update_profile(profile: UserProfile):
    profile_id = "default"  # Single user for simplicity
    profile.id = profile_id
    user_profiles[profile_id] = profile
    return profile

@app.get("/api/profile", response_model=UserProfile)
async def get_profile():
    profile_id = "default"
    if profile_id not in user_profiles:
        default_profile = UserProfile(
            id=profile_id,
            name="User",
            daily_calorie_goal=2000,
            daily_protein_goal=150,
            daily_carbs_goal=250,
            daily_fat_goal=65
        )
        user_profiles[profile_id] = default_profile
        return default_profile
    return user_profiles[profile_id]

@app.get("/api/nutrition-summary/{date}", response_model=NutritionSummary)
async def get_nutrition_summary(date: date):
    daily_entries = [e for e in food_entries.values() if e.date == date]
    
    total_calories = 0
    total_protein = 0
    total_carbs = 0
    total_fat = 0
    total_fiber = 0
    total_sugar = 0
    
    for entry in daily_entries:
        if entry.food_id in food_database:
            food = food_database[entry.food_id]
            multiplier = entry.quantity_grams / 100
            
            total_calories += food.calories_per_100g * multiplier
            total_protein += food.protein_per_100g * multiplier
            total_carbs += food.carbs_per_100g * multiplier
            total_fat += food.fat_per_100g * multiplier
            total_fiber += (food.fiber_per_100g or 0) * multiplier
            total_sugar += (food.sugar_per_100g or 0) * multiplier
    
    profile = await get_profile()
    
    return NutritionSummary(
        date=date,
        total_calories=round(total_calories, 1),
        total_protein=round(total_protein, 1),
        total_carbs=round(total_carbs, 1),
        total_fat=round(total_fat, 1),
        total_fiber=round(total_fiber, 1),
        total_sugar=round(total_sugar, 1),
        calorie_goal=profile.daily_calorie_goal,
        protein_goal=profile.daily_protein_goal,
        carbs_goal=profile.daily_carbs_goal,
        fat_goal=profile.daily_fat_goal
    )
