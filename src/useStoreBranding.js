import { useEffect, useState } from "react";
import { api } from "./api";

export const DEFAULT_BRAND = {
  brandName: "Naju's Magic Shop",
  logoUrl: "",
};

export function useStoreBranding() {
  const [brand, setBrand] = useState(DEFAULT_BRAND);

  useEffect(() => {
    let active = true;
    api("/storefront/config")
      .then((result) => {
        if (!active) return;
        setBrand({
          brandName: result.brandName || DEFAULT_BRAND.brandName,
          logoUrl: result.logoUrl || "",
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const title = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.content;
    const icon = document.querySelector('link[rel="icon"]');
    const previousIcon = icon?.href;

    document.title = `${brand.brandName} — A little magic`;
    if (description) description.content = `Shop curious finds and treasures from ${brand.brandName}.`;
    if (icon && brand.logoUrl) icon.href = brand.logoUrl;

    return () => {
      document.title = title;
      if (description && previousDescription !== undefined) description.content = previousDescription;
      if (icon && previousIcon !== undefined) icon.href = previousIcon;
    };
  }, [brand.brandName, brand.logoUrl]);

  return [brand, setBrand];
}
