
import { serial, text, pgTable, timestamp, integer, real, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const imageStatusEnum = pgEnum('image_status', ['pending', 'annotated', 'skipped', 'manual_review']);
export const confidenceLevelEnum = pgEnum('confidence_level', ['low', 'medium', 'high']);

// Images table
export const imagesTable = pgTable('images', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  file_path: text('file_path').notNull(),
  upload_date: timestamp('upload_date').defaultNow().notNull(),
  file_size: integer('file_size').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Annotation results table
export const annotationResultsTable = pgTable('annotation_results', {
  id: serial('id').primaryKey(),
  image_id: integer('image_id').notNull().references(() => imagesTable.id, { onDelete: 'cascade' }),
  status: imageStatusEnum('status').notNull(),
  confidence_score: real('confidence_score').notNull(),
  confidence_level: confidenceLevelEnum('confidence_level').notNull(),
  decision_reason: text('decision_reason').notNull(),
  annotations: jsonb('annotations'),
  processing_time_ms: integer('processing_time_ms').notNull(),
  processed_at: timestamp('processed_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const imagesRelations = relations(imagesTable, ({ one }) => ({
  annotationResult: one(annotationResultsTable, {
    fields: [imagesTable.id],
    references: [annotationResultsTable.image_id],
  }),
}));

export const annotationResultsRelations = relations(annotationResultsTable, ({ one }) => ({
  image: one(imagesTable, {
    fields: [annotationResultsTable.image_id],
    references: [imagesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Image = typeof imagesTable.$inferSelect;
export type NewImage = typeof imagesTable.$inferInsert;
export type AnnotationResult = typeof annotationResultsTable.$inferSelect;
export type NewAnnotationResult = typeof annotationResultsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  images: imagesTable, 
  annotationResults: annotationResultsTable 
};
