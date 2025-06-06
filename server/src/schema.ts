
import { z } from 'zod';

// Enum for image processing status
export const imageStatusEnum = z.enum(['pending', 'annotated', 'skipped', 'manual_review']);
export type ImageStatus = z.infer<typeof imageStatusEnum>;

// Enum for confidence levels
export const confidenceLevelEnum = z.enum(['low', 'medium', 'high']);
export type ConfidenceLevel = z.infer<typeof confidenceLevelEnum>;

// Image schema
export const imageSchema = z.object({
  id: z.number(),
  filename: z.string(),
  file_path: z.string(),
  upload_date: z.coerce.date(),
  file_size: z.number(),
  width: z.number().int(),
  height: z.number().int(),
  metadata: z.record(z.any()).nullable(),
  created_at: z.coerce.date()
});

export type Image = z.infer<typeof imageSchema>;

// Annotation result schema
export const annotationResultSchema = z.object({
  id: z.number(),
  image_id: z.number(),
  status: imageStatusEnum,
  confidence_score: z.number(),
  confidence_level: confidenceLevelEnum,
  decision_reason: z.string(),
  annotations: z.record(z.any()).nullable(),
  processing_time_ms: z.number().int(),
  processed_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type AnnotationResult = z.infer<typeof annotationResultSchema>;

// Input schema for creating images
export const createImageInputSchema = z.object({
  filename: z.string(),
  file_path: z.string(),
  file_size: z.number().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  metadata: z.record(z.any()).nullable().optional()
});

export type CreateImageInput = z.infer<typeof createImageInputSchema>;

// Input schema for processing images
export const processImageInputSchema = z.object({
  image_id: z.number()
});

export type ProcessImageInput = z.infer<typeof processImageInputSchema>;

// Dataset overview schema
export const datasetOverviewSchema = z.object({
  total_images: z.number().int(),
  processed_images: z.number().int(),
  pending_images: z.number().int(),
  annotated_images: z.number().int(),
  skipped_images: z.number().int(),
  manual_review_images: z.number().int(),
  average_confidence: z.number(),
  processing_completion_rate: z.number()
});

export type DatasetOverview = z.infer<typeof datasetOverviewSchema>;

// Image with annotation result schema (for detailed view)
export const imageWithAnnotationSchema = z.object({
  id: z.number(),
  filename: z.string(),
  file_path: z.string(),
  upload_date: z.coerce.date(),
  file_size: z.number(),
  width: z.number().int(),
  height: z.number().int(),
  metadata: z.record(z.any()).nullable(),
  annotation_result: annotationResultSchema.nullable()
});

export type ImageWithAnnotation = z.infer<typeof imageWithAnnotationSchema>;

// Batch processing input schema
export const batchProcessInputSchema = z.object({
  image_ids: z.array(z.number()).optional(),
  process_all_pending: z.boolean().optional()
});

export type BatchProcessInput = z.infer<typeof batchProcessInputSchema>;
