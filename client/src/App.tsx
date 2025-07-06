
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgramManager } from '@/components/ProgramManager';
import { AssetManager } from '@/components/AssetManager';
import { TradeManager } from '@/components/TradeManager';
import { Badge } from '@/components/ui/badge';

function App() {
  const [activeTab, setActiveTab] = useState('programs');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📈 Trading Management System
          </h1>
          <p className="text-gray-600 text-lg">
            Comprehensive CRUD operations for Programs, Assets, and Trades
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                🎯 Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">-</div>
              <p className="text-sm text-gray-600">Active programs</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                💰 Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">-</div>
              <p className="text-sm text-gray-600">Total assets</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-purple-700 flex items-center gap-2">
                🔄 Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">-</div>
              <p className="text-sm text-gray-600">Active trades</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Management Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="programs" className="flex items-center gap-2">
                  <span>🎯</span>
                  Programs
                </TabsTrigger>
                <TabsTrigger value="assets" className="flex items-center gap-2">
                  <span>💰</span>
                  Assets
                </TabsTrigger>
                <TabsTrigger value="trades" className="flex items-center gap-2">
                  <span>🔄</span>
                  Trades
                </TabsTrigger>
              </TabsList>

              <TabsContent value="programs">
                <ProgramManager />
              </TabsContent>

              <TabsContent value="assets">
                <AssetManager />
              </TabsContent>

              <TabsContent value="trades">
                <TradeManager />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <Badge variant="outline" className="bg-white/60">
            Backend integration via tRPC
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default App;
