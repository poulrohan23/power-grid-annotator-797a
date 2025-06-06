
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Eye, Zap, FileImage, Activity } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { DatasetOverview, ImageWithAnnotation, ImageStatus, ConfidenceLevel } from '../../server/src/schema';
import { ImageGrid } from '@/components/ImageGrid';
import { ImageDetailView } from '@/components/ImageDetailView';
import { ProcessingControls } from '@/components/ProcessingControls';

function App() {
  const [overview, setOverview] = useState<DatasetOverview | null>(null);
  const [images, setImages] = useState<ImageWithAnnotation[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageWithAnnotation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [overviewData, imagesData] = await Promise.all([
        trpc.getDatasetOverview.query(),
        trpc.getImagesWithAnnotations.query()
      ]);
      setOverview(overviewData);
      setImages(imagesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProcessImage = async (imageId: number) => {
    setIsProcessing(true);
    try {
      await trpc.processImage.mutate({ image_id: imageId });
      await loadData(); // Refresh data after processing
    } catch (error) {
      console.error('Failed to process image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchProcess = async (imageIds?: number[]) => {
    setIsProcessing(true);
    try {
      await trpc.batchProcessImages.mutate({ 
        image_ids: imageIds,
        process_all_pending: !imageIds 
      });
      await loadData(); // Refresh data after processing
    } catch (error) {
      console.error('Failed to batch process:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetProcessing = async () => {
    setIsProcessing(true);
    try {
      await trpc.resetProcessing.mutate();
      await loadData(); // Refresh data after reset
    } catch (error) {
      console.error('Failed to reset processing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: ImageStatus) => {
    switch (status) {
      case 'annotated':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'manual_review':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConfidenceColor = (level: ConfidenceLevel) => {
    switch (level) {
      case 'high':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Power Grid Inspection Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">⚡ Power Grid Inspector</h1>
              <p className="text-gray-600">Intelligent Image Annotation System</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Dataset Overview */}
        {overview && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              📊 Dataset Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileImage className="w-4 h-4" />
                    Total Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.total_images.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Processed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{overview.processed_images.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    {(overview.processing_completion_rate * 100).toFixed(1)}% complete
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{overview.pending_images.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(overview.average_confidence * 100).toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Processing Progress */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Processing Progress
                </CardTitle>
                <CardDescription>
                  Overall completion: {(overview.processing_completion_rate * 100).toFixed(1)}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={overview.processing_completion_rate * 100} className="mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Annotated: {overview.annotated_images}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Skipped: {overview.skipped_images}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Manual Review: {overview.manual_review_images}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span>Pending: {overview.pending_images}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Processing Controls */}
        <ProcessingControls
          onProcessAll={() => handleBatchProcess()}
          onReset={handleResetProcessing}
          isProcessing={isProcessing}
          pendingCount={overview?.pending_images || 0}
        />

        {/* Main Content */}
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid">🖼️ Image Grid</TabsTrigger>
            <TabsTrigger value="detail" disabled={!selectedImage}>
              🔍 Detailed View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid" className="mt-6">
            <ImageGrid
              images={images}
              onImageSelect={setSelectedImage}
              onProcessImage={handleProcessImage}
              isProcessing={isProcessing}
              getStatusIcon={getStatusIcon}
              getConfidenceColor={getConfidenceColor}
            />
          </TabsContent>
          
          <TabsContent value="detail" className="mt-6">
            {selectedImage ? (
              <ImageDetailView
                image={selectedImage}
                onProcessImage={handleProcessImage}
                isProcessing={isProcessing}
                getStatusIcon={getStatusIcon}
                getConfidenceColor={getConfidenceColor}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileImage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Select an image from the grid to view details</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
