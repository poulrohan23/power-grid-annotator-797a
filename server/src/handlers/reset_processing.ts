
import { db } from '../db';
import { annotationResultsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const resetProcessing = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Delete all annotation results to reset processing state
    const result = await db.delete(annotationResultsTable).execute();
    
    return {
      success: true,
      message: `Successfully reset processing state. Removed ${result.rowCount || 0} annotation results.`
    };
  } catch (error) {
    console.error('Reset processing failed:', error);
    throw error;
  }
};
