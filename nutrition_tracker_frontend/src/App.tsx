import { useState, useEffect } from 'react'
import { Plus, Search, Target, User, Utensils, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface FoodItem {
  id: string
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g?: number
  sugar_per_100g?: number
}

interface FoodEntry {
  id: string
  food_id: string
  quantity_grams: number
  meal_type: string
  date: string
  timestamp: string
}

interface NutritionSummary {
  date: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber: number
  total_sugar: number
  calorie_goal: number
  protein_goal: number
  carbs_goal: number
  fat_goal: number
}

interface UserProfile {
  id: string
  name: string
  daily_calorie_goal: number
  daily_protein_goal: number
  daily_carbs_goal: number
  daily_fat_goal: number
}

function App() {
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false)
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const [newFood, setNewFood] = useState({
    name: '',
    calories_per_100g: 0,
    protein_per_100g: 0,
    carbs_per_100g: 0,
    fat_per_100g: 0,
    fiber_per_100g: 0,
    sugar_per_100g: 0
  })

  const [newEntry, setNewEntry] = useState({
    food_id: '',
    quantity_grams: 100,
    meal_type: 'breakfast'
  })

  useEffect(() => {
    fetchFoods()
    fetchProfile()
    fetchEntries()
    fetchNutritionSummary()
  }, [selectedDate])

  const fetchFoods = async () => {
    try {
      const response = await fetch(`${API_URL}/api/foods`)
      const data = await response.json()
      setFoods(data)
    } catch (error) {
      console.error('Error fetching foods:', error)
    }
  }

  const fetchEntries = async () => {
    try {
      const response = await fetch(`${API_URL}/api/entries?date_filter=${selectedDate}`)
      const data = await response.json()
      setEntries(data)
    } catch (error) {
      console.error('Error fetching entries:', error)
    }
  }

  const fetchNutritionSummary = async () => {
    try {
      const response = await fetch(`${API_URL}/api/nutrition-summary/${selectedDate}`)
      const data = await response.json()
      setNutritionSummary(data)
    } catch (error) {
      console.error('Error fetching nutrition summary:', error)
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile`)
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const addFood = async () => {
    try {
      const response = await fetch(`${API_URL}/api/foods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFood)
      })
      if (response.ok) {
        fetchFoods()
        setIsAddFoodOpen(false)
        setNewFood({
          name: '',
          calories_per_100g: 0,
          protein_per_100g: 0,
          carbs_per_100g: 0,
          fat_per_100g: 0,
          fiber_per_100g: 0,
          sugar_per_100g: 0
        })
      }
    } catch (error) {
      console.error('Error adding food:', error)
    }
  }

  const addEntry = async () => {
    try {
      const response = await fetch(`${API_URL}/api/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEntry,
          date: selectedDate
        })
      })
      if (response.ok) {
        fetchEntries()
        fetchNutritionSummary()
        setIsAddEntryOpen(false)
        setNewEntry({
          food_id: '',
          quantity_grams: 100,
          meal_type: 'breakfast'
        })
      }
    } catch (error) {
      console.error('Error adding entry:', error)
    }
  }

  const deleteEntry = async (entryId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/entries/${entryId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchEntries()
        fetchNutritionSummary()
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
  }

  const updateProfile = async () => {
    if (!profile) return
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      if (response.ok) {
        fetchProfile()
        fetchNutritionSummary()
        setIsProfileOpen(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getEntriesByMeal = (mealType: string) => {
    return entries.filter(entry => entry.meal_type === mealType)
  }

  const getFoodById = (foodId: string) => {
    return foods.find(food => food.id === foodId)
  }

  const calculateEntryNutrition = (entry: FoodEntry) => {
    const food = getFoodById(entry.food_id)
    if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    
    const multiplier = entry.quantity_grams / 100
    return {
      calories: Math.round(food.calories_per_100g * multiplier),
      protein: Math.round(food.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(food.carbs_per_100g * multiplier * 10) / 10,
      fat: Math.round(food.fat_per_100g * multiplier * 10) / 10
    }
  }

  const [activeTab, setActiveTab] = useState('dashboard')

  const CircularProgress = ({ value, max, color, size = 120, strokeWidth = 8, children }: {
    value: number
    max: number
    color: string
    size?: number
    strokeWidth?: number
    children?: React.ReactNode
  }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const percentage = Math.min((value / max) * 100, 100)
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">myfitnesspal</h1>
            <p className="text-xs text-gray-500">PREMIUM ⭐</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsProfileOpen(true)}>
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>プロフィール設定</DialogTitle>
            <DialogDescription>
              日々の栄養目標を設定してください
            </DialogDescription>
          </DialogHeader>
          {profile && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="calories">カロリー目標 (kcal)</Label>
                <Input
                  id="calories"
                  type="number"
                  value={profile.daily_calorie_goal}
                  onChange={(e) => setProfile({...profile, daily_calorie_goal: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="protein">タンパク質目標 (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={profile.daily_protein_goal}
                  onChange={(e) => setProfile({...profile, daily_protein_goal: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="carbs">炭水化物目標 (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={profile.daily_carbs_goal}
                  onChange={(e) => setProfile({...profile, daily_carbs_goal: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="fat">脂質目標 (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={profile.daily_fat_goal}
                  onChange={(e) => setProfile({...profile, daily_fat_goal: Number(e.target.value)})}
                />
              </div>
              <Button onClick={updateProfile} className="w-full">
                保存
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="p-4 space-y-4">
            {/* Date Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Today</h2>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-sm border-0 bg-transparent text-blue-500 font-medium"
                />
                <Button variant="ghost" size="sm" className="text-blue-500">
                  Edit
                </Button>
              </div>
            </div>

            {/* Calorie Card */}
            {nutritionSummary && (
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Calories</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Remaining = Goal - Food + Exercise</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CircularProgress
                        value={nutritionSummary.total_calories}
                        max={nutritionSummary.calorie_goal}
                        color="#3b82f6"
                        size={140}
                      >
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {Math.max(0, nutritionSummary.calorie_goal - nutritionSummary.total_calories).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">Remaining</div>
                        </div>
                      </CircularProgress>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Base Goal</span>
                        <span className="font-semibold">{nutritionSummary.calorie_goal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-600">Food</span>
                        <span className="font-semibold">{nutritionSummary.total_calories}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Exercise</span>
                        <span className="font-semibold">0</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Macros Card */}
            {nutritionSummary && (
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Macros</h3>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <CircularProgress
                        value={nutritionSummary.total_carbs}
                        max={nutritionSummary.carbs_goal}
                        color="#14b8a6"
                        size={80}
                        strokeWidth={6}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold">{Math.round(nutritionSummary.total_carbs)}</div>
                          <div className="text-xs text-gray-500">/{nutritionSummary.carbs_goal}g</div>
                        </div>
                      </CircularProgress>
                      <p className="text-sm font-medium text-teal-600 mt-2">Carbohydrates</p>
                      <p className="text-xs text-gray-500">{Math.max(0, nutritionSummary.carbs_goal - nutritionSummary.total_carbs).toFixed(0)}g left</p>
                    </div>
                    
                    <div className="text-center">
                      <CircularProgress
                        value={nutritionSummary.total_fat}
                        max={nutritionSummary.fat_goal}
                        color="#8b5cf6"
                        size={80}
                        strokeWidth={6}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold">{Math.round(nutritionSummary.total_fat)}</div>
                          <div className="text-xs text-gray-500">/{nutritionSummary.fat_goal}g</div>
                        </div>
                      </CircularProgress>
                      <p className="text-sm font-medium text-purple-600 mt-2">Fat</p>
                      <p className="text-xs text-gray-500">{Math.max(0, nutritionSummary.fat_goal - nutritionSummary.total_fat).toFixed(0)}g left</p>
                    </div>
                    
                    <div className="text-center">
                      <CircularProgress
                        value={nutritionSummary.total_protein}
                        max={nutritionSummary.protein_goal}
                        color="#f59e0b"
                        size={80}
                        strokeWidth={6}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold">{Math.round(nutritionSummary.total_protein)}</div>
                          <div className="text-xs text-gray-500">/{nutritionSummary.protein_goal}g</div>
                        </div>
                      </CircularProgress>
                      <p className="text-sm font-medium text-amber-600 mt-2">Protein</p>
                      <p className="text-xs text-gray-500">{Math.max(0, nutritionSummary.protein_goal - nutritionSummary.total_protein).toFixed(0)}g left</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Steps and Exercise Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Steps</span>
                  </div>
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-gray-500">Goal: 10,000 steps</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">Exercise</span>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-600">0 kj</div>
                  <div className="text-sm text-gray-500">0:00 hr</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'diary' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">食事記録</h2>
              <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    食事を追加
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>食事を追加</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="food-select">食品</Label>
                      <Select value={newEntry.food_id} onValueChange={(value) => setNewEntry({...newEntry, food_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="食品を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {foods.map(food => (
                            <SelectItem key={food.id} value={food.id}>
                              {food.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quantity">量 (g)</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={newEntry.quantity_grams}
                        onChange={(e) => setNewEntry({...newEntry, quantity_grams: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="meal-type">食事タイプ</Label>
                      <Select value={newEntry.meal_type} onValueChange={(value) => setNewEntry({...newEntry, meal_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">朝食</SelectItem>
                          <SelectItem value="lunch">昼食</SelectItem>
                          <SelectItem value="dinner">夕食</SelectItem>
                          <SelectItem value="snack">間食</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addEntry} className="w-full" disabled={!newEntry.food_id}>
                      追加
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                const mealEntries = getEntriesByMeal(mealType)
                const mealNames = {
                  breakfast: '朝食',
                  lunch: '昼食', 
                  dinner: '夕食',
                  snack: '間食'
                }
                
                return (
                  <Card key={mealType} className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">{mealNames[mealType as keyof typeof mealNames]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {mealEntries.length === 0 ? (
                        <p className="text-gray-500 text-sm">記録がありません</p>
                      ) : (
                        <div className="space-y-2">
                          {mealEntries.map(entry => {
                            const food = getFoodById(entry.food_id)
                            const nutrition = calculateEntryNutrition(entry)
                            
                            return (
                              <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <span className="font-medium">{food?.name}</span>
                                  <span className="text-sm text-gray-500 ml-2">{entry.quantity_grams}g</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm">{nutrition.calories} kcal</span>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteEntry(entry.id)}
                                  >
                                    削除
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'foods' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">食品データベース</h2>
              <Dialog open={isAddFoodOpen} onOpenChange={setIsAddFoodOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    食品を追加
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新しい食品を追加</DialogTitle>
                    <DialogDescription>
                      100gあたりの栄養価を入力してください
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="food-name">食品名</Label>
                      <Input
                        id="food-name"
                        value={newFood.name}
                        onChange={(e) => setNewFood({...newFood, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="calories">カロリー (kcal)</Label>
                        <Input
                          id="calories"
                          type="number"
                          value={newFood.calories_per_100g}
                          onChange={(e) => setNewFood({...newFood, calories_per_100g: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="protein">タンパク質 (g)</Label>
                        <Input
                          id="protein"
                          type="number"
                          value={newFood.protein_per_100g}
                          onChange={(e) => setNewFood({...newFood, protein_per_100g: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="carbs">炭水化物 (g)</Label>
                        <Input
                          id="carbs"
                          type="number"
                          value={newFood.carbs_per_100g}
                          onChange={(e) => setNewFood({...newFood, carbs_per_100g: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fat">脂質 (g)</Label>
                        <Input
                          id="fat"
                          type="number"
                          value={newFood.fat_per_100g}
                          onChange={(e) => setNewFood({...newFood, fat_per_100g: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <Button onClick={addFood} className="w-full" disabled={!newFood.name}>
                      追加
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="食品を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-2">
              {filteredFoods.map(food => (
                <Card key={food.id} className="bg-white shadow-sm p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{food.name}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        100gあたり: {food.calories_per_100g} kcal, 
                        タンパク質 {food.protein_per_100g}g, 
                        炭水化物 {food.carbs_per_100g}g, 
                        脂質 {food.fat_per_100g}g
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 p-4">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <Target className="h-6 w-6" />
            <span className="text-xs">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('diary')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'diary' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <Utensils className="h-6 w-6" />
            <span className="text-xs">Diary</span>
          </button>
          <button
            onClick={() => setActiveTab('foods')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'foods' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <Search className="h-6 w-6" />
            <span className="text-xs">Foods</span>
          </button>
          <button
            onClick={() => setActiveTab('more')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'more' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <BarChart3 className="h-6 w-6" />
            <span className="text-xs">More</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default App
