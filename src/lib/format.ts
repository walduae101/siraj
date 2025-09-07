export const fmtAED = (n: number) =>
  new Intl.NumberFormat("ar-AE", { style: "currency", currency: "AED" }).format(
    n,
  );
