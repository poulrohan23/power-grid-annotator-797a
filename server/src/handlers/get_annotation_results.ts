
import { db } from '../db';
import { annotationResultsTable } from '../db/schema';
import { type AnnotationResult } from '../schema';

export const getAnnotationResults = async (): Promise<AnnotationResult[]> => {
  try {
    const results = await db.select()
      .from(annotationResultsTable)
      .execute();

    // Convert numeric fields back to numbers and handle jsonb types
    return results.map(result => ({
      ...result,
      confidence_score: parseFloat(result.confidence_score.toString()),
      annotations: result.annotations as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Failed to get annotation results:', error);
    throw error;
  }
};
