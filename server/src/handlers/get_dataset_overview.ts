
import { db } from '../db';
import { imagesTable, annotationResultsTable } from '../db/schema';
import { type DatasetOverview } from '../schema';
import { count, avg, eq, sql } from 'drizzle-orm';

export const getDatasetOverview = async (): Promise<DatasetOverview> => {
  try {
    // Get total images count
    const totalImagesResult = await db.select({ 
      count: count() 
    })
    .from(imagesTable)
    .execute();
    
    const total_images = totalImagesResult[0].count;

    // Get processed images count (images with annotation results)
    const processedImagesResult = await db.select({ 
      count: count() 
    })
    .from(annotationResultsTable)
    .execute();
    
    const processed_images = processedImagesResult[0].count;

    // Get status-specific counts
    const statusCounts = await db.select({
      status: annotationResultsTable.status,
      count: count()
    })
    .from(annotationResultsTable)
    .groupBy(annotationResultsTable.status)
    .execute();

    // Initialize status counts
    let annotated_images = 0;
    let skipped_images = 0;
    let manual_review_images = 0;

    // Map status counts
    statusCounts.forEach(result => {
      switch (result.status) {
        case 'annotated':
          annotated_images = result.count;
          break;
        case 'skipped':
          skipped_images = result.count;
          break;
        case 'manual_review':
          manual_review_images = result.count;
          break;
      }
    });

    // Calculate pending images (total - processed)
    const pending_images = total_images - processed_images;

    // Get average confidence score
    const avgConfidenceResult = await db.select({
      avg_confidence: avg(annotationResultsTable.confidence_score)
    })
    .from(annotationResultsTable)
    .execute();

    const average_confidence = processed_images > 0 
      ? parseFloat(avgConfidenceResult[0].avg_confidence || '0')
      : 0;

    // Calculate processing completion rate
    const processing_completion_rate = total_images > 0 
      ? processed_images / total_images 
      : 0;

    return {
      total_images,
      processed_images,
      pending_images,
      annotated_images,
      skipped_images,
      manual_review_images,
      average_confidence,
      processing_completion_rate
    };
  } catch (error) {
    console.error('Dataset overview retrieval failed:', error);
    throw error;
  }
};
