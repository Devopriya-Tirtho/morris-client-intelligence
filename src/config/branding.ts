/** Approved assets only. Null deliberately renders an elegant text placeholder. */
export const branding = {
  clientName: "Zagimē Anishinabēk",
  partnerName: "Morris Interactive",
  clientLogo: "branding/zagime/zagime.jpeg" as string | null,
  partnerLogo: "branding/morris/MI Logo.png" as string | null,
  heroImage: null as string | null,
};
export const brandAsset = (path: string) =>
  `${(import.meta.env?.BASE_URL ?? "./")}${path.replace(/^\//, "")}`;
