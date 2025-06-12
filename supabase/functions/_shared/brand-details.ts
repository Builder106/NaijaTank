import { GasStationBrand } from '../../../shared/enums.ts';
import { FuelPrices } from './types.ts'; // Assuming FuelPrices is also in _shared/types.ts or will be moved

export interface BrandDetails {
  website: string | null;
  brandDomainForLogo?: string | null; // Domain for Brandfetch
  defaultFuelPrices?: FuelPrices | null;
}

// New interface for the enriched details
export interface EnrichedBrandDetails extends BrandDetails {
  brandfetchLogoUrl: string | null;
}

export const brandLookupTable: Readonly<Record<GasStationBrand, BrandDetails>> = {
  [GasStationBrand.Mobil]: {
    website: "https://mobil.com",
    brandDomainForLogo: "mobil.com",
    defaultFuelPrices: null,
  },
  [GasStationBrand.Shell]: {
    website: "https://www.shell.com.ng",
    brandDomainForLogo: "shell.com",
    defaultFuelPrices: null,
  },
  [GasStationBrand.Chevron]: {
    website: "https://www.chevron.com",
    brandDomainForLogo: "chevron.com",
    defaultFuelPrices: null,
  },
  [GasStationBrand.Total]: {
    website: "https://www.totalenergies.com",
    brandDomainForLogo: "totalenergies.com",
    defaultFuelPrices: null,
  },
  [GasStationBrand.NNPC]: {
    website: "https://www.nnpcgroup.com",
    brandDomainForLogo: "nnpcgroup.com",
    defaultFuelPrices: null,
  },
  [GasStationBrand.Oando]: {
    website: "https://www.oandoplc.com",
    brandDomainForLogo: "oandoplc.com",
    defaultFuelPrices: null,
  },
  [GasStationBrand.Conoil]: {
    website: "https://www.conoilplc.com",
    brandDomainForLogo: "conoilplc.com",
    defaultFuelPrices: null,
  },
  [GasStationBrand.Ardova]: {
    website: "https://www.ardovaplc.com",
    brandDomainForLogo: "ardovaplc.com",
    defaultFuelPrices: null,
  },
  [GasStationBrand.MRS]: {
    website: "https://mrsholdings.com",
    brandDomainForLogo: "mrsholdings.com",
    defaultFuelPrices: null,
  },
  [GasStationBrand.Other]: {
    website: null,
    brandDomainForLogo: null,
    defaultFuelPrices: null,
  },
  [GasStationBrand.Unknown]: {
    website: null,
    brandDomainForLogo: null,
    defaultFuelPrices: null,
  },
};

export function getBrandDetails(brand: GasStationBrand): EnrichedBrandDetails | undefined {
  const details = brandLookupTable[brand];
  if (!details) {
    return undefined;
  }

  let brandfetchLogoUrl: string | null = null;
  const clientId = Deno.env.get("BRANDFETCH_CLIENT_ID");

  if (details.brandDomainForLogo && clientId) {
    brandfetchLogoUrl = `https://cdn.brandfetch.io/${details.brandDomainForLogo}?c=${clientId}`;
  } else if (details.brandDomainForLogo && !clientId) {
    console.warn("BRANDFETCH_CLIENT_ID environment variable is not set. Cannot generate logo URL.");
  }

  return {
    ...details,
    brandfetchLogoUrl,
  };
} 