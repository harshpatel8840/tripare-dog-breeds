import { z } from 'zod';

// ==========================================
// ZOD SCHEMAS FOR RUNTIME VALIDATION
// ==========================================

export const PaginationMetaSchema = z.object({
  current: z.number(),
  next: z.number().nullish(),
  last: z.number().nullish(),
  records: z.number(),
});

export const PaginationLinksSchema = z.object({
  self: z.string().optional(),
  current: z.string().optional(),
  next: z.string().nullish(),
  last: z.string().nullish(),
});

export const ImageAttributionSchema = z.object({
  author: z.string().nullish(),
  license: z.string().nullish(),
  license_url: z.string().nullish(),
  source: z.string().nullish(),
  source_url: z.string().nullish(),
});

export const BreedImageDtoSchema = z.object({
  id: z.string(),
  url: z.string(),
  thumb: z.string().nullish(),
  medium: z.string().nullish(),
  large: z.string().nullish(),
  attribution: ImageAttributionSchema.nullish(),
});

export const BreedTraitsDtoSchema = z.object({
  energy: z.number().nullish(),
  barking: z.number().nullish(),
  drooling: z.number().nullish(),
  grooming: z.number().nullish(),
  shedding: z.number().nullish(),
  trainability: z.number().nullish(),
  good_with_dogs: z.number().nullish(),
  exercise_minutes: z.number().nullish(),
  apartment_friendly: z.number().nullish(),
  good_with_children: z.number().nullish(),
  good_with_strangers: z.number().nullish(),
  temperament: z.array(z.string()).nullish(),
});

export const MinMaxNumberSchema = z.object({
  min: z.number().nullish(),
  max: z.number().nullish(),
});

export const BreedOriginDtoSchema = z.object({
  era: z.string().nullish(),
  region: z.string().nullish(),
  country: z.string().nullish(),
});

export const BreedCoatDtoSchema = z.object({
  type: z.string().nullish(),
  colors: z.array(z.string()).nullish(),
  length: z.string().nullish(),
});

export const BreedSourceDtoSchema = z.object({
  url: z.string().nullish(),
  title: z.string().nullish(),
});

export const BreedAttributesDtoSchema = z.object({
  name: z.string(),
  description: z.string().nullish(),
  life: MinMaxNumberSchema.nullish(),
  male_weight: MinMaxNumberSchema.nullish(),
  female_weight: MinMaxNumberSchema.nullish(),
  hypoallergenic: z.boolean().nullish(),
  male_height: MinMaxNumberSchema.nullish(),
  female_height: MinMaxNumberSchema.nullish(),
  origin: BreedOriginDtoSchema.nullish(),
  coat: BreedCoatDtoSchema.nullish(),
  traits: BreedTraitsDtoSchema.nullish(),
  other_names: z.array(z.string()).nullish(),
  recognized_by: z.array(z.string()).nullish(),
  sources: z.array(BreedSourceDtoSchema).nullish(),
  images: z.array(BreedImageDtoSchema).nullish(),
});

export const BreedDtoSchema = z.object({
  id: z.string(),
  type: z.literal('breed'),
  attributes: BreedAttributesDtoSchema,
  relationships: z
    .object({
      group: z
        .object({
          data: z
            .object({
              id: z.string(),
              type: z.literal('group'),
            })
            .nullish(),
        })
        .nullish(),
    })
    .nullish(),
});

export const BreedsResponseSchema = z.object({
  data: z.array(BreedDtoSchema),
  meta: z
    .object({
      pagination: PaginationMetaSchema.nullish(),
    })
    .nullish(),
  links: PaginationLinksSchema.nullish(),
});

export const SingleBreedResponseSchema = z.object({
  data: BreedDtoSchema,
});

export const GroupAttributesDtoSchema = z.object({
  name: z.string(),
});

export const GroupDtoSchema = z.object({
  id: z.string(),
  type: z.literal('group'),
  attributes: GroupAttributesDtoSchema,
  relationships: z
    .object({
      breeds: z
        .object({
          data: z.array(z.object({ id: z.string(), type: z.literal('breed') })).nullish(),
        })
        .nullish(),
    })
    .nullish(),
});

export const GroupsResponseSchema = z.object({
  data: z.array(GroupDtoSchema),
  meta: z
    .object({
      pagination: PaginationMetaSchema.nullish(),
    })
    .nullish(),
  links: PaginationLinksSchema.nullish(),
});

// Infer TypeScript types from schemas
export type BreedDto = z.infer<typeof BreedDtoSchema>;
export type BreedsResponse = z.infer<typeof BreedsResponseSchema>;
export type SingleBreedResponse = z.infer<typeof SingleBreedResponseSchema>;
export type GroupDto = z.infer<typeof GroupDtoSchema>;
export type GroupsResponse = z.infer<typeof GroupsResponseSchema>;
export type BreedImageDto = z.infer<typeof BreedImageDtoSchema>;
export type ImageAttributionDto = z.infer<typeof ImageAttributionSchema>;
export type BreedTraitsDto = z.infer<typeof BreedTraitsDtoSchema>;
