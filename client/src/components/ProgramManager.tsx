
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
import type { Program, CreateProgramInput } from '../../../server/src/schema';

export function ProgramManager() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateProgramInput>({
    name: '',
    description: '',
    status: '',
    start_date: new Date(),
    end_date: new Date()
  });

  const loadPrograms = useCallback(async () => {
    try {
      const result = await trpc.getPrograms.query();
      setPrograms(result);
    } catch (error) {
      console.error('Failed to load programs:', error);
    }
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: '',
      start_date: new Date(),
      end_date: new Date()
    });
    setEditingProgram(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingProgram) {
        await trpc.updateProgram.mutate({
          id: editingProgram.id,
          ...formData
        });
      } else {
        await trpc.createProgram.mutate(formData);
      }
      
      await loadPrograms();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save program:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      description: program.description,
      status: program.status,
      start_date: program.start_date,
      end_date: program.end_date
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteProgram.mutate({ id });
      await loadPrograms();
    } catch (error) {
      console.error('Failed to delete program:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Program Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              ➕ Add Program
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingProgram ? 'Edit Program' : 'Create New Program'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProgramInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter program name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateProgramInput) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Enter program description"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={formData.status}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProgramInput) => ({ ...prev, status: e.target.value }))
                  }
                  placeholder="e.g., Active, Inactive, Pending"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateProgramInput) => ({ ...prev, start_date: new Date(e.target.value) }))
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
                      setFormData((prev: CreateProgramInput) => ({ ...prev, end_date: new Date(e.target.value) }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Saving...' : (editingProgram ? 'Update' : 'Create')}
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

      {programs.length === 0 ? (
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 text-lg">No programs yet. Create your first program!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {programs.map((program: Program) => (
            <Card key={program.id} className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900">{program.name}</CardTitle>
                    <Badge className={`mt-2 text-white ${getStatusColor(program.status)}`}>
                      {program.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(program)}
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
                            This action cannot be undone. This will permanently delete the program "{program.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(program.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{program.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Start Date:</span>
                    <p className="text-gray-900">{program.start_date.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">End Date:</span>
                    <p className="text-gray-900">{program.end_date.toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created: {program.created_at.toLocaleDateString()}
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
