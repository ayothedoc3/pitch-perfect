import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface DashboardProps {
  userName?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userName = 'Pitcher' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">PitchBuddy</h1>
          <div className="flex items-center space-x-4">
            <Button>New Pitch</Button>
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center">
                <span className="text-blue-800 font-medium">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">Welcome to your Pitch Dashboard</CardTitle>
            <CardDescription className="text-lg">
              Practice, receive feedback, and perfect your pitch through our AI-powered platform and community.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="mypitches" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="mypitches">My Pitches</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>
              
              <TabsContent value="mypitches" className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Placeholder for pitch cards */}
                  <Card className="h-64 flex flex-col justify-center items-center">
                    <CardContent className="text-center">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <CardDescription className="mb-4">Record your first pitch to get started</CardDescription>
                      <Button>Record Pitch</Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="feedback" className="mt-8">
                <div className="text-center py-12">
                  <CardDescription>Your feedback will appear here after recording pitches.</CardDescription>
                </div>
              </TabsContent>
              
              <TabsContent value="progress" className="mt-8">
                <div className="text-center py-12">
                  <CardDescription>Track your progress and improvement over time.</CardDescription>
                </div>
              </TabsContent>
              
              <TabsContent value="resources" className="mt-8">
                <div className="text-center py-12">
                  <CardDescription>Helpful resources and tips for improving your pitches.</CardDescription>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard; 