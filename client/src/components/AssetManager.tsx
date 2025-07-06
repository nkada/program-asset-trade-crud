
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Asset, CreateAssetInput } from '../../../server/src/schema';

export function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateAssetInput>({
    name: '',
    description: '',
    currency: '',
    value: 0,
    date: new Date()
  });

  const loadAssets = useCallback(async () => {
    try {
      const result = await trpc.getAssets.query();
      setAssets(result);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      currency: '',
      value: 0,
      date: new Date()
    });
    setEditingAsset(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingAsset) {
        await trpc.updateAsset.mutate({
          id: editingAsset.id,
          ...formData
        });
      } else {
        await trpc.createAsset.mutate(formData);
      }
      
      await loadAssets();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description,
      currency: asset.currency,
      value: asset.value,
      date: asset.date
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteAsset.mutate({ id });
      await loadAssets();
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(value);
  };

  const getCurrencyColor = (currency: string) => {
    switch (currency.toUpperCase()) {
      case 'USD': return 'bg-green-500';
      case 'EUR': return 'bg-blue-500';
      case 'GBP': return 'bg-purple-500';
      case 'JPY': return 'bg-red-500';
      case 'BTC': return 'bg-orange-500';
      case 'ETH': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Asset Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700">
              ➕ Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingAsset ? 'Edit Asset' : 'Create New Asset'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateAssetInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter asset name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateAssetInput) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Enter asset description"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAssetInput) => ({ ...prev, currency: e.target.value }))
                    }
                    placeholder="e.g., USD, EUR, BTC"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAssetInput) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date.toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateAssetInput) => ({ ...prev, date: new Date(e.target.value) }))
                  }
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Saving...' : (editingAsset ? 'Update' : 'Create')}
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

      {assets.length === 0 ? (
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">💰</div>
            <p className="text-gray-600 text-lg">No assets yet. Create your first asset!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assets.map((asset: Asset) => (
            <Card key={asset.id} className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900">{asset.name}</CardTitle>
                    <Badge className={`mt-2 text-white ${getCurrencyColor(asset.currency)}`}>
                      {asset.currency}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(asset)}
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
                            This action cannot be undone. This will permanently delete the asset "{asset.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(asset.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{asset.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Value:</span>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(asset.value, asset.currency)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Date:</span>
                    <p className="text-gray-900">{asset.date.toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created: {asset.created_at.toLocaleDateString()}
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
