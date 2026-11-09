export interface SingaporeAddressParts {
  streetAddress?: string;
  unit?: string;
  buildingName?: string;
  postalCode?: string;
}

const cleanPart = (value?: string) => value?.trim().replace(/\s+/g, " ") ?? "";

export const normalizeSingaporeUnit = (unit?: string) => {
  const value = cleanPart(unit);
  if (!value) return "";
  return `#${value.replace(/^#+/, "")}`;
};

export const formatSingaporeAddressLines = ({
  streetAddress,
  unit,
  buildingName,
  postalCode,
}: SingaporeAddressParts) => {
  const firstLine = cleanPart(streetAddress);
  const secondLine = [normalizeSingaporeUnit(unit), cleanPart(buildingName)].filter(Boolean).join(" ");
  const normalizedPostalCode = cleanPart(postalCode);
  const thirdLine = normalizedPostalCode ? `Singapore ${normalizedPostalCode}` : "";

  return [firstLine, secondLine, thirdLine].filter(Boolean);
};

export const formatSingaporeAddress = (address: SingaporeAddressParts) => (
  formatSingaporeAddressLines(address).join("\n")
);
