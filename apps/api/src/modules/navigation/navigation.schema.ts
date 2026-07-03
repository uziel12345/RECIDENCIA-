import { z } from "zod";

const metadataSchema = z.record(z.unknown()).nullable().optional();

export const navigationIdSchema = z.object({
  id: z.string().uuid(),
});

export const createNavigationNodeSchema = z.object({
  code: z.string().trim().min(1).max(80).optional(),
  name: z.string().trim().max(160).nullable().optional(),
  node_type: z.enum(["waypoint", "entrance", "intersection"]),
  x: z.coerce.number().finite(),
  y: z.coerce.number().finite().default(0),
  z: z.coerce.number().finite(),
  floor_level: z.coerce.number().int().default(0),
  is_walkable: z.coerce.boolean().default(true),
  metadata: metadataSchema,
});

export const createNavigationEdgeSchema = z.object({
  from_node_id: z.string().uuid(),
  to_node_id: z.string().uuid(),
  distance: z.coerce.number().positive().optional(),
  path_type: z
    .enum(["walkway", "ramp", "stairs", "hallway", "outdoor"])
    .default("walkway"),
  is_bidirectional: z.coerce.boolean().default(true),
  is_accessible: z.coerce.boolean().default(true),
  metadata: metadataSchema,
});

export const createBuildingEntranceSchema = z.object({
  building_id: z.string().uuid(),
  node_id: z.string().uuid(),
  entrance_name: z.string().trim().max(160).nullable().optional(),
  entrance_type: z.enum(["main", "secondary", "service", "emergency"]).default("main"),
  is_primary: z.coerce.boolean().default(false),
  is_accessible: z.coerce.boolean().default(true),
});
