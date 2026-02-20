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
  const regionModuleService = container.resolve(Modules.REGION)
  let existingRegions = await regionModuleService.listRegions({ name: "Deutschland" })
  let region = existingRegions[0]

  if (!region) {
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
    region = regionResult[0]
    logger.info(`Region created: ${region.id}`)
  } else {
    logger.info(`Region already exists: ${region.id}`)
  }

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

  // --- Build products from JSON catalog (skip existing) ---
  const productModuleService = container.resolve(Modules.PRODUCT)
  const eur = "eur" as const

  const allCatalogProducts = catalog.categories.flatMap((category) =>
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

  const existingProducts = await productModuleService.listProducts(
    {},
    { select: ["handle"] }
  )
  const existingHandles = new Set(existingProducts.map((p: any) => p.handle))
  const newProducts = allCatalogProducts.filter(
    (p) => !existingHandles.has(p.handle)
  )

  if (newProducts.length === 0) {
    logger.info(
      `All ${allCatalogProducts.length} products already exist — skipping.`
    )
  } else {
    logger.info(
      `Creating ${newProducts.length} new products (${existingHandles.size} already exist)...`
    )
    await createProductsWorkflow(container).run({
      input: { products: newProducts },
    })
  }

  logger.info(
    `Seed complete: ${allCatalogProducts.length} Container-Services konfiguriert`
  )
}
