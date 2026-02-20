import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
} from "@medusajs/medusa/core-flows"
import { readFileSync } from "fs"
import { join } from "path"

interface VariantData {
  title: string
  sku: string
  price: number
}

interface ProductData {
  title: string
  handle: string
  description: string
  option: string
  variants: VariantData[]
}

interface CategoryData {
  name: string
  description: string
  products: ProductData[]
}

interface ServiceCatalog {
  _comment: string
  categories: CategoryData[]
}

export default async function seedServices({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)

  logger.info("Seeding container service catalog...")

  // Load service catalog from JSON
  const catalogPath = join(__dirname, "..", "data", "services.json")
  const catalog: ServiceCatalog = JSON.parse(
    readFileSync(catalogPath, "utf-8")
  )

  // --- Region: Deutschland (EUR) ---
  logger.info("Creating region Deutschland...")
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Deutschland",
          currency_code: "eur",
          countries: ["de"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  })
  const region = regionResult[0]
  logger.info(`Region created: ${region.id}`)

  // --- Sales Channel: Container-Portal ---
  logger.info("Creating sales channel Container-Portal...")
  let salesChannels = await salesChannelModuleService.listSalesChannels({
    name: "Container-Portal",
  })

  if (!salesChannels.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Container-Portal",
            description: "B2B Kunden-Portal",
          },
        ],
      },
    })
    salesChannels = salesChannelResult
  }
  const salesChannel = salesChannels[0]
  logger.info(`Sales channel: ${salesChannel.id}`)

  // --- Build products from JSON catalog ---
  const eur = "eur" as const

  const allProducts = catalog.categories.flatMap((category) =>
    category.products.map((product) => ({
      title: product.title,
      handle: product.handle,
      description: product.description,
      status: ProductStatus.PUBLISHED,
      options: [
        {
          title: product.option,
          values: product.variants.map((v) => v.title),
        },
      ],
      variants: product.variants.map((v) => ({
        title: v.title,
        sku: v.sku,
        options: { [product.option]: v.title },
        prices: [{ amount: v.price, currency_code: eur }],
        manage_inventory: false,
      })),
      sales_channels: [{ id: salesChannel.id }],
    }))
  )

  logger.info(`Creating ${allProducts.length} container products...`)
  await createProductsWorkflow(container).run({
    input: {
      products: allProducts,
    },
  })

  logger.info(
    `Seed complete: ${allProducts.length} Container-Services mit Varianten erstellt`
  )
}
