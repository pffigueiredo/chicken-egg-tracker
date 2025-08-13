import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { 
  Chicken, 
  CreateChickenInput, 
  EggRecord, 
  CreateEggRecordInput, 
  DailyEggSummary 
} from '../../server/src/schema';

function App() {
  const [chickens, setChickens] = useState<Chicken[]>([]);
  const [eggRecords, setEggRecords] = useState<EggRecord[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailyEggSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Chicken form state
  const [chickenFormData, setChickenFormData] = useState<CreateChickenInput>({
    name: '',
    breed: ''
  });

  // Egg record form state
  const [eggFormData, setEggFormData] = useState<CreateEggRecordInput>({
    chicken_id: 0,
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    quantity: 0
  });

  const loadData = useCallback(async () => {
    try {
      const [chickensData, eggRecordsData, summariesData] = await Promise.all([
        trpc.getChickens.query(),
        trpc.getEggRecords.query(),
        trpc.getRecentDailySummaries.query({ days: 7 })
      ]);
      setChickens(chickensData);
      setEggRecords(eggRecordsData);
      setDailySummaries(summariesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateChicken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chickenFormData.name || !chickenFormData.breed) return;
    
    setIsLoading(true);
    try {
      const newChicken = await trpc.createChicken.mutate(chickenFormData);
      setChickens((prev: Chicken[]) => [...prev, newChicken]);
      setChickenFormData({ name: '', breed: '' });
    } catch (error) {
      console.error('Failed to create chicken:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEggRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eggFormData.chicken_id || eggFormData.quantity < 0) return;
    
    setIsLoading(true);
    try {
      const newRecord = await trpc.createEggRecord.mutate(eggFormData);
      setEggRecords((prev: EggRecord[]) => [...prev, newRecord]);
      setEggFormData((prev: CreateEggRecordInput) => ({ ...prev, quantity: 0 }));
      // Refresh daily summaries after adding new egg record
      const summariesData = await trpc.getRecentDailySummaries.query({ days: 7 });
      setDailySummaries(summariesData);
    } catch (error) {
      console.error('Failed to create egg record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChicken = async (id: number) => {
    try {
      await trpc.deleteChicken.mutate({ id });
      setChickens((prev: Chicken[]) => prev.filter(c => c.id !== id));
      // Also remove egg records for this chicken
      setEggRecords((prev: EggRecord[]) => prev.filter(r => r.chicken_id !== id));
    } catch (error) {
      console.error('Failed to delete chicken:', error);
    }
  };

  const getTodaysSummary = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysRecords = eggRecords.filter(record => 
      record.date.toISOString().split('T')[0] === today
    );
    const totalEggs = todaysRecords.reduce((sum, record) => sum + record.quantity, 0);
    const chickensLaid = new Set(todaysRecords.map(record => record.chicken_id)).size;
    return { totalEggs, chickensLaid };
  };

  const getChickenName = (chickenId: number) => {
    const chicken = chickens.find(c => c.id === chickenId);
    return chicken ? chicken.name : `Chicken #${chickenId}`;
  };

  const todaysSummary = getTodaysSummary();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🐓 Chicken Egg Tracker
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your flock and track daily egg production
        </p>
      </div>

      {/* Today's Summary Card */}
      <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🥚 Today's Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {todaysSummary.totalEggs}
              </div>
              <div className="text-sm text-gray-600">Total Eggs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {todaysSummary.chickensLaid}
              </div>
              <div className="text-sm text-gray-600">Chickens Laid</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="egg-tracking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="egg-tracking">🥚 Track Eggs</TabsTrigger>
          <TabsTrigger value="manage-chickens">🐓 Manage Chickens</TabsTrigger>
          <TabsTrigger value="reports">📊 Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="egg-tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record Egg Collection</CardTitle>
              <CardDescription>
                Log the number of eggs collected from each chicken today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEggRecord} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Chicken</label>
                    <Select
                      value={eggFormData.chicken_id.toString()}
                      onValueChange={(value: string) =>
                        setEggFormData((prev: CreateEggRecordInput) => ({
                          ...prev,
                          chicken_id: parseInt(value) || 0
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select chicken" />
                      </SelectTrigger>
                      <SelectContent>
                        {chickens.map((chicken: Chicken) => (
                          <SelectItem key={chicken.id} value={chicken.id.toString()}>
                            {chicken.name} ({chicken.breed})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date</label>
                    <Input
                      type="date"
                      value={eggFormData.date}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEggFormData((prev: CreateEggRecordInput) => ({
                          ...prev,
                          date: e.target.value
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quantity</label>
                    <Input
                      type="number"
                      min="0"
                      value={eggFormData.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEggFormData((prev: CreateEggRecordInput) => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 0
                        }))
                      }
                      placeholder="Number of eggs"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading || !eggFormData.chicken_id}>
                  {isLoading ? 'Recording...' : 'Record Eggs'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Egg Records */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Egg Records</CardTitle>
              <CardDescription>
                Latest egg collection entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eggRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No egg records yet. Start tracking above! 🥚
                </p>
              ) : (
                <div className="space-y-3">
                  {eggRecords
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((record: EggRecord) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">
                            {record.quantity} 🥚
                          </Badge>
                          <span className="font-medium">
                            {getChickenName(record.chicken_id)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.date.toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage-chickens" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Chicken</CardTitle>
              <CardDescription>
                Register a new chicken in your flock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateChicken} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name</label>
                    <Input
                      placeholder="Chicken name"
                      value={chickenFormData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setChickenFormData((prev: CreateChickenInput) => ({
                          ...prev,
                          name: e.target.value
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Breed</label>
                    <Input
                      placeholder="e.g., Rhode Island Red, Leghorn"
                      value={chickenFormData.breed}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setChickenFormData((prev: CreateChickenInput) => ({
                          ...prev,
                          breed: e.target.value
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Chicken'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Chicken List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Flock ({chickens.length})</CardTitle>
              <CardDescription>
                Manage your registered chickens
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chickens.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No chickens registered yet. Add your first chicken above! 🐓
                </p>
              ) : (
                <div className="grid gap-4">
                  {chickens.map((chicken: Chicken) => (
                    <div key={chicken.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🐓</div>
                        <div>
                          <h3 className="font-medium">{chicken.name}</h3>
                          <p className="text-sm text-gray-600">{chicken.breed}</p>
                          <p className="text-xs text-gray-400">
                            Added: {chicken.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteChicken(chicken.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Summary</CardTitle>
              <CardDescription>
                Egg production overview for the past 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailySummaries.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No daily summaries available yet. Start tracking eggs to see reports! 📊
                </p>
              ) : (
                <div className="space-y-4">
                  {dailySummaries.map((summary: DailyEggSummary) => (
                    <div key={summary.date.toISOString()} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="font-medium">
                          {summary.date.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">
                          {summary.total_eggs} eggs
                        </Badge>
                        <div className="text-sm text-gray-600">
                          {summary.chickens_laid} chickens laid
                        </div>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="text-center">
                    <div className="text-lg font-medium">Weekly Total</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {dailySummaries.reduce((sum, summary) => sum + summary.total_eggs, 0)} eggs
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;