import { comarkContent, type JsonSchema } from 'comark-content'
import fs from 'comark-content/sources/fs'
import yaml from 'comark-content/plugins/yaml'
import schemaValidation from 'comark-content/plugins/schema-validation'
import { toolJsonSchema } from '#shared/schema'

/**
 * The content layer. One source, one file per tool, validated against the
 * JSON Schema derived from `shared/schema.ts` so an invalid document stops
 * the build instead of silently disappearing.
 */
export const content = comarkContent({
  sources: {
    tools: fs('./content/tools', { schema: toolJsonSchema() as JsonSchema })
  },
  plugins: [
    yaml({ onError: 'throw' }),
    schemaValidation({ onError: 'throw' })
  ]
})
