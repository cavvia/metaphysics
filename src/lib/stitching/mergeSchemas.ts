import { mergeSchemas as _mergeSchemas } from "graphql-tools"
import { executableGravitySchema } from "lib/stitching/gravity/schema"
import { executableConvectionSchema } from "lib/stitching/convection/schema"
import { consignmentStitchingEnvironment } from "lib/stitching/convection/stitching"
import {
  executableExchangeSchema,
  transformsForExchange,
} from "lib/stitching/exchange/schema"
import { executableKawsSchema } from "lib/stitching/kaws/schema"
import { kawsStitchingEnvironment } from "lib/stitching/kaws/stitching"
import config from "config"

import localSchema from "schema/schema"
import { GraphQLSchema } from "graphql"
import { exchangeStitchingEnvironment } from "./exchange/stitching"
import { executableVortexSchema } from "lib/stitching/vortex/schema"

/**
 * Incrementally merges in schemas according to `process.env`
 */
export const incrementalMergeSchemas = (testConfig?: any) => {
  const environment = testConfig || config

  const {
    ENABLE_COMMERCE_STITCHING,
    ENABLE_CONSIGNMENTS_STITCHING,
  } = environment

  const schemas = [localSchema] as GraphQLSchema[]
  const extensionSchemas = [] as string[]
  const extensionResolvers = {} as any

  const gravitySchema = executableGravitySchema()
  schemas.push(gravitySchema)

  if (ENABLE_COMMERCE_STITCHING) {
    const exchangeSchema = executableExchangeSchema(transformsForExchange)
    schemas.push(exchangeSchema)

    const { extensionSchema, resolvers } = exchangeStitchingEnvironment(
      localSchema,
      exchangeSchema
    )
    extensionSchemas.push(extensionSchema)
    for (var attr in resolvers) {
      extensionResolvers[attr] = resolvers[attr]
    }
  }

  if (ENABLE_CONSIGNMENTS_STITCHING) {
    const convectionSchema = executableConvectionSchema()
    schemas.push(convectionSchema)

    const { extensionSchema, resolvers } = consignmentStitchingEnvironment(
      localSchema,
      convectionSchema
    )
    extensionSchemas.push(extensionSchema)
    for (var attr in resolvers) {
      extensionResolvers[attr] = resolvers[attr]
    }
  }

  const vortexSchema = executableVortexSchema()
  schemas.push(vortexSchema)

  // Always stitch kaws
  const kawsSchema = executableKawsSchema()
  schemas.push(kawsSchema)

  const { extensionSchema, resolvers } = kawsStitchingEnvironment(
    localSchema,
    kawsSchema
  )

  extensionSchemas.push(extensionSchema)
  for (var attr in resolvers) {
    extensionResolvers[attr] = resolvers[attr]
  }

  // The order should only matter in that extension schemas come after the
  // objects that they are expected to build upon
  const mergedSchema = _mergeSchemas({
    schemas: [...schemas, ...extensionSchemas],
    resolvers: extensionResolvers,
  })

  // Because __allowedLegacyNames isn't in the public API
  Object.defineProperty(mergedSchema, "__allowedLegacyNames", {
    value: ["__id"],
  })

  return mergedSchema
}

// The end goal:
//
// export const mergeSchemas = async () => {
//   const convectionSchema = await executableConvectionSchema()
//   const convectionStitching = consignmentStitchingEnvironment(
//     localSchema,
//     convectionSchema
//   )

//   const gravitySchema = await executableGravitySchema()
//   const exchangeSchema = await executableExchangeSchema()

//   // The order should only matter in that extension schemas come after the
//   // objects that they are expected to build upon
//   const mergedSchema = _mergeSchemas({
//     schemas: [
//       gravitySchema,
//       localSchema,
//       convectionSchema,
//       exchangeSchema,
//       convectionStitching.extensionSchema,
//     ],
//     resolvers: {
//       ...convectionStitching.resolvers,
//     },
//   })

//   // Because __allowedLegacyNames isn't in the public API
//   const anyMergedSchema = mergedSchema as any
//   anyMergedSchema.__allowedLegacyNames = ["__id"]

//   return mergedSchema
// }
