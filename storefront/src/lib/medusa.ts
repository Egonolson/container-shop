type LegacyList = {
  products: any[]
  orders: any[]
  regions: any[]
  count: number
}

async function emptyList(..._args: any[]): Promise<LegacyList> {
  return { products: [], orders: [], regions: [], count: 0 }
}

async function createDisabledCart(..._args: any[]): Promise<{ cart: { id: string; metadata?: Record<string, unknown> } }> {
  return { cart: { id: "legacy-medusa-disabled" } }
}

async function noopCartMutation(..._args: any[]): Promise<Record<string, never>> {
  return {}
}

export const medusa = {
  store: {
    order: {
      list: emptyList,
    },
    product: {
      list: emptyList,
    },
    region: {
      list: emptyList,
    },
    cart: {
      create: createDisabledCart,
      createLineItem: noopCartMutation,
      update: noopCartMutation,
    },
  },
}
