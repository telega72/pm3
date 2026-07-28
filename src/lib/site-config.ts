import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type SiteConfig = {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  sessionDays: number;
  passwordResetMinutes: number;
  pricing: {
    paidAdPriceRub: number;
  };
  avatar: {
    maxSizeKb: number;
    allowedFormats: string[];
  };
  ads: {
    maxTitleLength: number;
    maxDescriptionLength: number;
    maxImageSizeKb: number;
    maxImagesCount: number;
    imageCompressionQuality: number;
  };
  aiAssistant: {
    enabled: boolean;
    autoModeration: boolean;
    supportAutoReply: boolean;
    ticketThreshold: number;
  };
  defaultAdmin: {
    name: string;
    phone: string;
    city: string;
    email: string;
    password: string;
  };
};

function getConfigPath() {
  return join(process.cwd(), "server-config.json");
}

export function getSiteConfig(): SiteConfig {
  const raw = readFileSync(getConfigPath(), "utf-8");
  return JSON.parse(raw) as SiteConfig;
}

export function updateSiteConfig(next: SiteConfig) {
  writeFileSync(getConfigPath(), JSON.stringify(next, null, 2), "utf-8");
}
