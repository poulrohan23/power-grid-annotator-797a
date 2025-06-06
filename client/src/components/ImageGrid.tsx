
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, FileImage } from 'lucide-react';
import type { ImageWithAnnotation, ImageStatus, ConfidenceLevel } from '../../../server/src/schema';
import type { ReactElement } from 'react';

interface ImageGridProps {
  images: ImageWithAnnotation[];
  onImageSelect: (image: ImageWithAnnotation) => void;
  onProcessImage: (imageId: number) => Promise<void>;
  isProcessing: boolean;
  getStatusIcon: (status: ImageStatus) => ReactElement;
  getConfidenceColor: (level: ConfidenceLevel) => string;
}

export function ImageGrid({ 
  images, 
  onImageSelect, 
  onProcessImage, 
  isProcessing, 
  getStatusIcon, 
  getConfidenceColor 
}: ImageGridProps) {
  const getStatusColor = (status: ImageStatus) => {
    switch (status) {
      case 'annotated':
        return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'skipped':
        return 'border-red-200 bg-red-50 hover:bg-red-100';
      case 'manual_review':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100';
      default:
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    }
  };

  const getStatusText = (status: ImageStatus) => {
    switch (status) {
      case 'annotated':
        return '✅ Annotated';
      case 'skipped':
        return '❌ Skipped';
      case 'manual_review':
        return '👁️ Manual Review';
      case 'pending':
        return '⏳ Pending';
      default:
        return '❓ Unknown';
    }
  };

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileImage className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Images Found</h3>
          <p className="text-gray-500">Upload some power grid images to get started with annotation.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">📷 Power Grid Images ({images.length})</h2>
        <div className="flex gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>Annotated</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <span>Skipped</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span>Manual Review</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((image: ImageWithAnnotation) => (
          <Card 
            key={image.id} 
            className={`cursor-pointer transition-all duration-200 ${getStatusColor(
              image.annotation_result?.status || 'pending'
            )}`}
            onClick={() => onImageSelect(image)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium truncate flex-1">
                  {image.filename}
                </CardTitle>
                {getStatusIcon(image.annotation_result?.status || 'pending')}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Image thumbnail placeholder - displays actual image dimensions */}
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FileImage className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <div className="text-xs text-gray-500">
                    {image.width}×{image.height}
                  </div>
                </div>
              </div>

              {/* Status and Confidence */}
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs">
                  {getStatusText(image.annotation_result?.status || 'pending')}
                </Badge>
                
                {image.annotation_result && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Confidence:</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getConfidenceColor(image.annotation_result.confidence_level)}`}
                    >
                      {image.annotation_result.confidence_level} ({(image.annotation_result.confidence_score * 100).toFixed(0)}%)
                    </Badge>
                  </div>
                )}
              </div>

              {/* Processing button for pending images */}
              {image.annotation_result?.status === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onProcessImage(image.id);
                  }}
                  disabled={isProcessing}
                >
                  <Play className="w-3 h-3 mr-1" />
                  {isProcessing ? 'Processing...' : 'Process'}
                </Button>
              )}

              {/* File info */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>Size: {(image.file_size / 1024).toFixed(1)} KB</div>
                <div>Uploaded: {image.upload_date.toLocaleDateString()}</div>
                {image.annotation_result?.processed_at && (
                  <div>Processed: {image.annotation_result.processed_at.toLocaleDateString()}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
