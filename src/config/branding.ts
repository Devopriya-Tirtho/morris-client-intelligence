/** Approved assets only. Null deliberately renders an elegant text placeholder. */
export const branding = {
  clientName: "Zagimē Anishinabēk",
  partnerName: "Morris Interactive",
  clientLogo: null as string | null,
  partnerLogo: null as string | null,
  heroImage: null as string | null,
};
export const brandAsset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
