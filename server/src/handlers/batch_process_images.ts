
import { db } from '../db';
import { imagesTable, annotationResultsTable } from '../db/schema';
import { type BatchProcessInput, type AnnotationResult } from '../schema';
import { eq, inArray, isNull } from 'drizzle-orm';

export const batchProcessImages = async (input: BatchProcessInput): Promise<AnnotationResult[]> => {
  try {
    let imageIds: number[] = [];

    // Determine which images to process
    if (input.process_all_pending) {
      // Get all images that don't have annotation results yet
      const pendingImages = await db.select({ id: imagesTable.id })
        .from(imagesTable)
        .leftJoin(annotationResultsTable, eq(imagesTable.id, annotationResultsTable.image_id))
        .where(isNull(annotationResultsTable.id))
        .execute();
      
      imageIds = pendingImages.map(img => img.id);
    } else if (input.image_ids && input.image_ids.length > 0) {
      imageIds = input.image_ids;
    } else {
      // No images to process
      return [];
    }

    if (imageIds.length === 0) {
      return [];
    }

    // Process each image
    const results: AnnotationResult[] = [];
    
    for (const imageId of imageIds) {
      // Simulate image processing with random results
      const processingStartTime = Date.now();
      
      // Generate mock annotation results
      const confidenceScore = Math.random();
      let confidenceLevel: 'low' | 'medium' | 'high';
      let status: 'annotated' | 'skipped' | 'manual_review';
      
      if (confidenceScore < 0.3) {
        confidenceLevel = 'low';
        status = 'manual_review';
      } else if (confidenceScore < 0.7) {
        confidenceLevel = 'medium';
        status = 'annotated';
      } else {
        confidenceLevel = 'high';
        status = 'annotated';
      }

      // Random chance to skip
      if (Math.random() < 0.1) {
        status = 'skipped';
      }

      const processingTime = Date.now() - processingStartTime + Math.floor(Math.random() * 1000);
      
      const mockAnnotations = status === 'annotated' ? {
        objects: [
          {
            type: 'object',
            confidence: confidenceScore,
            bbox: [
              Math.floor(Math.random() * 100),
              Math.floor(Math.random() * 100),
              Math.floor(Math.random() * 200) + 100,
              Math.floor(Math.random() * 200) + 100
            ]
          }
        ]
      } : null;

      const decisionReason = status === 'manual_review' 
        ? 'Low confidence score requires human review'
        : status === 'skipped'
        ? 'Image quality insufficient for processing'
        : 'Automated annotation completed successfully';

      // Insert annotation result
      const annotationResult = await db.insert(annotationResultsTable)
        .values({
          image_id: imageId,
          status,
          confidence_score: confidenceScore,
          confidence_level: confidenceLevel,
          decision_reason: decisionReason,
          annotations: mockAnnotations,
          processing_time_ms: processingTime
        })
        .returning()
        .execute();

      // Convert the database result to match the schema type
      const result = annotationResult[0];
      const convertedResult: AnnotationResult = {
        id: result.id,
        image_id: result.image_id,
        status: result.status,
        confidence_score: result.confidence_score,
        confidence_level: result.confidence_level,
        decision_reason: result.decision_reason,
        annotations: result.annotations as Record<string, any> | null,
        processing_time_ms: result.processing_time_ms,
        processed_at: result.processed_at,
        created_at: result.created_at
      };

      results.push(convertedResult);
    }

    return results;
  } catch (error) {
    console.error('Batch processing failed:', error);
    throw error;
  }
};
