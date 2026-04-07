/**
 * Adds a `classification` prop (default: "PUBLIC") to every block type in a
 * BlockNote schema. The approach mirrors `withPageBreak` from @blocknote/core:
 * we iterate over the existing blockSpecs, shallow-clone each spec while
 * extending its `config.propSchema`, then rebuild the schema via `extend`.
 *
 * Because BlockNote 0.47 only supports per-block propSchemas (there is no
 * global "add prop to all blocks" API), we inject the prop at schema-creation
 * time by mutating every spec's config before the TipTap nodes are created.
 */
import type {
  BlockSchema,
  InlineContentSchema,
  StyleSchema,
} from '@blocknote/core';
import type { BlockNoteSchema } from '@blocknote/core';

import { DEFAULT_CLASSIFICATION } from './constants';

/**
 * The prop definition that will be added to every block's propSchema.
 * BlockNote prop definitions follow the shape { default: <value> }.
 */
export const classificationPropDef = {
  classification: { default: DEFAULT_CLASSIFICATION as string },
} as const;

/**
 * Adds the `classification` prop to every block spec already registered in
 * `schema`. The mutation happens in-place on the schema's internal blockSpecs
 * map, then `init()` is NOT called again (it was already called during
 * construction). Instead we directly patch each spec's config.propSchema so
 * that TipTap node attributes are created correctly when the editor boots.
 *
 * Returns the same schema reference (mutated) for chaining.
 */
export function withClassification<
  B extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
>(schema: BlockNoteSchema<B, I, S>): typeof schema {
  // Access the internal blockSpecs map. The type system exposes this as a
  // public readonly property on CustomBlockNoteSchema.
  const specs = schema.blockSpecs as Record<
    string,
    { config: { propSchema: Record<string, unknown> } }
  >;

  for (const key of Object.keys(specs)) {
    const spec = specs[key];
    if (spec?.config?.propSchema) {
      // Only add if not already present (idempotent).
      if (!('classification' in spec.config.propSchema)) {
        spec.config.propSchema.classification =
          classificationPropDef.classification;
      }
    }
  }

  return schema;
}
