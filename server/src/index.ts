
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createImageInputSchema, 
  processImageInputSchema, 
  batchProcessInputSchema 
} from './schema';

// Import handlers
import { createImage } from './handlers/create_image';
import { getImages } from './handlers/get_images';
import { getImagesWithAnnotations } from './handlers/get_images_with_annotations';
import { getImageById } from './handlers/get_image_by_id';
import { processImage } from './handlers/process_image';
import { batchProcessImages } from './handlers/batch_process_images';
import { getDatasetOverview } from './handlers/get_dataset_overview';
import { getAnnotationResults } from './handlers/get_annotation_results';
import { deleteImage } from './handlers/delete_image';
import { resetProcessing } from './handlers/reset_processing';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Image management
  createImage: publicProcedure
    .input(createImageInputSchema)
    .mutation(({ input }) => createImage(input)),
  
  getImages: publicProcedure
    .query(() => getImages()),
  
  getImagesWithAnnotations: publicProcedure
    .query(() => getImagesWithAnnotations()),
  
  getImageById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getImageById(input.id)),
  
  deleteImage: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteImage(input.id)),

  // Processing
  processImage: publicProcedure
    .input(processImageInputSchema)
    .mutation(({ input }) => processImage(input)),
  
  batchProcessImages: publicProcedure
    .input(batchProcessInputSchema)
    .mutation(({ input }) => batchProcessImages(input)),

  // Analytics and results
  getDatasetOverview: publicProcedure
    .query(() => getDatasetOverview()),
  
  getAnnotationResults: publicProcedure
    .query(() => getAnnotationResults()),

  // Utility
  resetProcessing: publicProcedure
    .mutation(() => resetProcessing()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
