
import { db } from '../db';
import { imagesTable, annotationResultsTable } from '../db/schema';
import { type ImageWithAnnotation } from '../schema';
import { eq } from 'drizzle-orm';

export const getImageById = async (id: number): Promise<ImageWithAnnotation | null> => {
  try {
    // Query image with optional annotation result using left join
    const results = await db.select()
      .from(imagesTable)
      .leftJoin(annotationResultsTable, eq(imagesTable.id, annotationResultsTable.image_id))
      .where(eq(imagesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    const imageData = result.images;
    const annotationData = result.annotation_results;

    // Build the response object
    const imageWithAnnotation: ImageWithAnnotation = {
      id: imageData.id,
      filename: imageData.filename,
      file_path: imageData.file_path,
      upload_date: imageData.upload_date,
      file_size: imageData.file_size,
      width: imageData.width,
      height: imageData.height,
      metadata: imageData.metadata as Record<string, any> | null,
      annotation_result: annotationData ? {
        id: annotationData.id,
        image_id: annotationData.image_id,
        status: annotationData.status,
        confidence_score: annotationData.confidence_score,
        confidence_level: annotationData.confidence_level,
        decision_reason: annotationData.decision_reason,
        annotations: annotationData.annotations as Record<string, any> | null,
        processing_time_ms: annotationData.processing_time_ms,
        processed_at: annotationData.processed_at,
        created_at: annotationData.created_at
      } : null
    };

    return imageWithAnnotation;
  } catch (error) {
    console.error('Failed to get image by ID:', error);
    throw error;
  }
};
