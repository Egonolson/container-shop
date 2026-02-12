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

export default async function seedServices({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)

  logger.info("Seeding container service catalog...")

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
  logger.info(`Sales channel created: ${salesChannel.id}`)

  // --- Container-Typen als Produkte mit Varianten ---
  const containerTypes = [
    {
      title: "Absetzcontainer 3m\u00B3",
      handle: "absetzcontainer-3m3",
      description: "Kleiner Absetzcontainer f\u00FCr begrenzte Fl\u00E4chen",
      variants: [
        { title: "Bauschutt", sku: "AC3-BAUSCHUTT", prices: [{ amount: 28900, currency_code: "eur" as const }] },
        { title: "Mischm\u00FCll", sku: "AC3-MISCHMUELL", prices: [{ amount: 34900, currency_code: "eur" as const }] },
        { title: "Holz (A1-A3)", sku: "AC3-HOLZ", prices: [{ amount: 24900, currency_code: "eur" as const }] },
        { title: "Gr\u00FCnschnitt", sku: "AC3-GRUENSCHNITT", prices: [{ amount: 19900, currency_code: "eur" as const }] },
      ],
    },
    {
      title: "Absetzcontainer 7m\u00B3",
      handle: "absetzcontainer-7m3",
      description: "Standard-Absetzcontainer f\u00FCr Baustellen",
      variants: [
        { title: "Bauschutt", sku: "AC7-BAUSCHUTT", prices: [{ amount: 38900, currency_code: "eur" as const }] },
        { title: "Mischm\u00FCll", sku: "AC7-MISCHMUELL", prices: [{ amount: 44900, currency_code: "eur" as const }] },
        { title: "Holz (A1-A3)", sku: "AC7-HOLZ", prices: [{ amount: 34900, currency_code: "eur" as const }] },
        { title: "Sperrm\u00FCll", sku: "AC7-SPERRMUELL", prices: [{ amount: 49900, currency_code: "eur" as const }] },
      ],
    },
    {
      title: "Abrollcontainer 10m\u00B3",
      handle: "abrollcontainer-10m3",
      description: "Gro\u00DFer Abrollcontainer f\u00FCr umfangreiche Projekte",
      variants: [
        { title: "Bauschutt", sku: "ARC10-BAUSCHUTT", prices: [{ amount: 52900, currency_code: "eur" as const }] },
        { title: "Mischm\u00FCll", sku: "ARC10-MISCHMUELL", prices: [{ amount: 59900, currency_code: "eur" as const }] },
        { title: "Boden / Erdaushub", sku: "ARC10-ERDAUSHUB", prices: [{ amount: 44900, currency_code: "eur" as const }] },
      ],
    },
    {
      title: "Abrollcontainer 20m\u00B3",
      handle: "abrollcontainer-20m3",
      description: "Extra-gro\u00DFer Abrollcontainer f\u00FCr Gewerbe",
      variants: [
        { title: "Mischm\u00FCll", sku: "ARC20-MISCHMUELL", prices: [{ amount: 79900, currency_code: "eur" as const }] },
        { title: "Holz (A1-A3)", sku: "ARC20-HOLZ", prices: [{ amount: 64900, currency_code: "eur" as const }] },
        { title: "Gewerbeabfall", sku: "ARC20-GEWERBE", prices: [{ amount: 89900, currency_code: "eur" as const }] },
      ],
    },
  ]

  logger.info("Creating container products...")
  await createProductsWorkflow(container).run({
    input: {
      products: containerTypes.map((ct) => ({
        title: ct.title,
        handle: ct.handle,
        description: ct.description,
        status: ProductStatus.PUBLISHED,
        options: [
          {
            title: "Abfallart",
            values: ct.variants.map((v) => v.title),
          },
        ],
        variants: ct.variants.map((v) => ({
          title: v.title,
          sku: v.sku,
          options: { Abfallart: v.title },
          prices: v.prices,
          manage_inventory: false,
        })),
        sales_channels: [{ id: salesChannel.id }],
      })),
    },
  })

  logger.info(
    "Seed complete: 4 Container-Services mit Varianten erstellt"
  )
}
