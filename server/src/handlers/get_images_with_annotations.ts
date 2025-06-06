
import { db } from '../db';
import { imagesTable, annotationResultsTable } from '../db/schema';
import { type ImageWithAnnotation } from '../schema';
import { eq } from 'drizzle-orm';

export const getImagesWithAnnotations = async (): Promise<ImageWithAnnotation[]> => {
  try {
    const results = await db.select()
      .from(imagesTable)
      .leftJoin(
        annotationResultsTable,
        eq(imagesTable.id, annotationResultsTable.image_id)
      )
      .execute();

    return results.map(result => ({
      id: result.images.id,
      filename: result.images.filename,
      file_path: result.images.file_path,
      upload_date: result.images.upload_date,
      file_size: result.images.file_size,
      width: result.images.width,
      height: result.images.height,
      metadata: result.images.metadata as Record<string, any> | null,
      annotation_result: result.annotation_results ? {
        id: result.annotation_results.id,
        image_id: result.annotation_results.image_id,
        status: result.annotation_results.status,
        confidence_score: result.annotation_results.confidence_score,
        confidence_level: result.annotation_results.confidence_level,
        decision_reason: result.annotation_results.decision_reason,
        annotations: result.annotation_results.annotations as Record<string, any> | null,
        processing_time_ms: result.annotation_results.processing_time_ms,
        processed_at: result.annotation_results.processed_at,
        created_at: result.annotation_results.created_at
      } : null
    }));
  } catch (error) {
    console.error('Failed to get images with annotations:', error);
    throw error;
  }
};
