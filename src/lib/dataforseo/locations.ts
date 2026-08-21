// DataForSEO location_code values for the countries most commonly targeted.
// Full list: https://docs.dataforseo.com/v3/appendix/locations/
export const LOCATIONS = [
  { label: "United States", code: 2840, language: "en" },
  { label: "United Arab Emirates", code: 2784, language: "en" },
  { label: "Saudi Arabia", code: 2682, language: "ar" },
  { label: "India", code: 2356, language: "en" },
  { label: "United Kingdom", code: 2826, language: "en" },
  { label: "France", code: 2250, language: "fr" },
  { label: "Kuwait", code: 2414, language: "ar" },
  { label: "Qatar", code: 2634, language: "ar" },
] as const;

export function locationByLabel(label: string) {
  return LOCATIONS.find((l) => l.label === label) ?? LOCATIONS[0];
}
