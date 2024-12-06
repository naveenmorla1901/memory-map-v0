//src/utils/validation.ts
import { z } from 'zod';

export const locationInputSchema = z.object({
  name: z.string()
    .min(1, "Location name is required")
    .max(100, "Name cannot exceed 100 characters"),
    
  latitude: z.number()
    .min(-90, "Invalid latitude")
    .max(90, "Invalid latitude"),
    
  longitude: z.number()
    .min(-180, "Invalid longitude")
    .max(180, "Invalid longitude"),
    
  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description cannot exceed 500 characters"),
    
  address: z.string()
    .min(1, "Address is required")
    .max(200, "Address cannot exceed 200 characters"),
    
  category: z.string()
    .min(1, "Category is required"),
    
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

