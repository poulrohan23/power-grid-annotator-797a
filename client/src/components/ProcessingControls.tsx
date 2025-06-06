
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Play, RotateCcw, Zap } from 'lucide-react';

interface ProcessingControlsProps {
  onProcessAll: () => Promise<void>;
  onReset: () => Promise<void>;
  isProcessing: boolean;
  pendingCount: number;
}

export function ProcessingControls({ 
  onProcessAll, 
  onReset, 
  isProcessing, 
  pendingCount 
}: ProcessingControlsProps) {
  return (
    <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          🚀 Processing Controls
        </CardTitle>
        <CardDescription>
          Manage batch processing and system operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={onProcessAll}
            disabled={isProcessing || pendingCount === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {isProcessing 
              ? '🔄 Processing...' 
              : `⚡ Process All Pending (${pendingCount})`
            }
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isProcessing}
                className="border-orange-200 hover:bg-orange-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                🔄 Reset All Processing
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ Reset All Processing Results?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all annotation results and return all images to pending status. 
                  This action cannot be undone. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onReset}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, Reset All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {pendingCount === 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ All images have been processed! No pending items remaining.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
