
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileImage, 
  Play, 
  Clock, 
  Zap, 
  Info, 
  Calendar,
  HardDrive,
  Monitor,
  Brain
} from 'lucide-react';
import type { ImageWithAnnotation, ImageStatus, ConfidenceLevel } from '../../../server/src/schema';
import type { ReactElement } from 'react';

interface ImageDetailViewProps {
  image: ImageWithAnnotation;
  onProcessImage: (imageId: number) => Promise<void>;
  isProcessing: boolean;
  getStatusIcon: (status: ImageStatus) => ReactElement;
  getConfidenceColor: (level: ConfidenceLevel) => string;
}

export function ImageDetailView({ 
  image, 
  onProcessImage, 
  isProcessing, 
  getStatusIcon, 
  getConfidenceColor 
}: ImageDetailViewProps) {
  const annotation = image.annotation_result;

  const getStatusDescription = (status: ImageStatus) => {
    switch (status) {
      case 'annotated':
        return '✅ Successfully processed and annotated by the AI system';
      case 'skipped':
        return '❌ Skipped due to quality issues or processing constraints';
      case 'manual_review':
        return '👁️ Requires human review due to uncertainty or complexity';
      case 'pending':
        return '⏳ Waiting to be processed by the annotation engine';
      default:
        return '❓ Unknown status';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Image Preview and Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            {image.filename}
          </CardTitle>
          <CardDescription>
            Power grid inspection image • ID: {image.id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image preview area - displays actual power grid image when available */}
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FileImage className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <div className="text-sm text-gray-600">
                Power Grid Image Preview
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {image.width} × {image.height} pixels
              </div>
            </div>
          </div>

          {/* Basic Image Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Dimensions:</span>
              <span className="font-medium">{image.width} × {image.height}</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Size:</span>
              <span className="font-medium">{(image.file_size / 1024).toFixed(1)} KB</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Uploaded:</span>
              <span className="font-medium">{image.upload_date.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Path:</span>
              <span className="font-medium text-xs truncate">{image.file_path}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Annotation Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            🤖 AI Annotation Results
          </CardTitle>
          <CardDescription>
            Intelligent analysis and processing results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {annotation ? (
            <>
              {/* Processing Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(annotation.status)}
                  <span className="font-medium">Status</span>
                </div>
                <Badge variant="outline" className="text-sm">
                  {annotation.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="text-sm text-gray-600">
                {getStatusDescription(annotation.status)}
              </div>

              <Separator />

              {/* Confidence Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Confidence Level</span>
                  <Badge 
                    variant="outline" 
                    className={getConfidenceColor(annotation.confidence_level)}
                  >
                    {annotation.confidence_level.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Confidence Score</span>
                  <span className="text-lg font-bold">
                    {(annotation.confidence_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <Separator />

              {/* Decision Reasoning */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">AI Decision Reasoning</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 {annotation.decision_reason}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Processing Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Processing Time:</span>
                </div>
                <span className="font-medium">{annotation.processing_time_ms}ms</span>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Processed At:</span>
                </div>
                <span className="font-medium">
                  {annotation.processed_at.toLocaleString()}
                </span>
              </div>

              {/* Annotations Data */}
              {annotation.annotations && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <span className="font-medium">🔍 Detailed Annotations</span>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-xs text-gray-700 overflow-auto">
                        {JSON.stringify(annotation.annotations, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ⏳ Awaiting Processing
              </h3>
              <p className="text-gray-600 mb-4">
                This image hasn't been processed by the AI annotation engine yet.
              </p>
              <Button
                onClick={() => onProcessImage(image.id)}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Process Now'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      {image.metadata && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>📋 Image Metadata</CardTitle>
            <CardDescription>
              Additional technical information about the image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-auto">
                {JSON.stringify(image.metadata, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
