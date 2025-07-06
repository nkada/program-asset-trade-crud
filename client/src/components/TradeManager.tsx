
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/utils/trpc';
import type { Trade, CreateTradeInput, Program, Asset } from '../../../server/src/schema';

export function TradeManager() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateTradeInput>({
    name: '',
    description: '',
    status: '',
    start_date: new Date(),
    end_date: new Date(),
    program_id: 0,
    asset_ids: []
  });

  const loadTrades = useCallback(async () => {
    try {
      const result = await trpc.getTrades.query();
      setTrades(result);
    } catch (error) {
      console.error('Failed to load trades:', error);
    }
  }, []);

  const loadPrograms = useCallback(async () => {
    try {
      const result = await trpc.getPrograms.query();
      setPrograms(result);
    } catch (error) {
      console.error('Failed to load programs:', error);
    }
  }, []);

  const loadAssets = useCallback(async () => {
    try {
      const result = await trpc.getAssets.query();
      setAssets(result);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  }, []);

  useEffect(() => {
    loadTrades();
    loadPrograms();
    loadAssets();
  }, [loadTrades, loadPrograms, loadAssets]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: '',
      start_date: new Date(),
      end_date: new Date(),
      program_id: 0,
      asset_ids: []
    });
    setEditingTrade(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingTrade) {
        await trpc.updateTrade.mutate({
          id: editingTrade.id,
          ...formData
        });
      } else {
        await trpc.createTrade.mutate(formData);
      }
      
      await loadTrades();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save trade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setFormData({
      name: trade.name,
      description: trade.description,
      status: trade.status,
      start_date: trade.start_date,
      end_date: trade.end_date,
      program_id: trade.program_id,
      asset_ids: [] // Note: This would need to be fetched from the backend
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteTrade.mutate({ id });
      await loadTrades();
    } catch (error) {
      console.error('Failed to delete trade:', error);
    }
  };

  const handleAssetToggle = (assetId: number, checked: boolean) => {
    setFormData((prev: CreateTradeInput) => ({
      ...prev,
      asset_ids: checked 
        ? [...(prev.asset_ids || []), assetId]
        : (prev.asset_ids || []).filter((id: number) => id !== assetId)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgramName = (programId: number) => {
    const program = programs.find((p: Program) => p.id === programId);
    return program ? program.name : 'Unknown Program';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Trade Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-purple-600 hover:bg-purple-700">
              ➕ Add Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTrade ? 'Edit Trade' : 'Create New Trade'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Trade Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTradeInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter trade name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateTradeInput) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Enter trade description"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={formData.status}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTradeInput) => ({ ...prev, status: e.target.value }))
                    }
                    placeholder="e.g., Active, Pending, Completed"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Program</Label>
                  <Select
                    value={formData.program_id.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateTradeInput) => ({ ...prev, program_id: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program: Program) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTradeInput) => ({ ...prev, start_date: new Date(e.target.value) }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTradeInput) => ({ ...prev, end_date: new Date(e.target.value) }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Associated Assets</Label>
                <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-2">
                  {assets.length === 0 ? (
                    <p className="text-gray-500 text-sm">No assets available</p>
                  ) : (
                    assets.map((asset: Asset) => (
                      <div key={asset.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`asset-${asset.id}`}
                          checked={(formData.asset_ids || []).includes(asset.id)}
                          onCheckedChange={(checked: boolean) => handleAssetToggle(asset.id, checked)}
                        />
                        <Label htmlFor={`asset-${asset.id}`} className="text-sm">
                          {asset.name} ({asset.currency})
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Saving...' : (editingTrade ? 'Update' : 'Create')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {trades.length === 0 ? (
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🔄</div>
            <p className="text-gray-600 text-lg">No trades yet. Create your first trade!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trades.map((trade: Trade) => (
            <Card key={trade.id} className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900">{trade.name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className={`text-white ${getStatusColor(trade.status)}`}>
                        {trade.status}
                      </Badge>
                      <Badge variant="outline" className="text-gray-700">
                        {getProgramName(trade.program_id)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(trade)}
                      className="hover:bg-blue-50"
                    >
                      ✏️ Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="hover:bg-red-50 text-red-600">
                          🗑️ Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the trade "{trade.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(trade.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{trade.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Start Date:</span>
                    <p className="text-gray-900">{trade.start_date.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">End Date:</span>
                    <p className="text-gray-900">{trade.end_date.toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created: {trade.created_at.toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
