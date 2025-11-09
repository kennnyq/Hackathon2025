declare module 'zipcodes' {
  export type ZipLookupResult = {
    zip: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    country: string;
  };

  const zipcodes: {
    lookup(zip: string): ZipLookupResult | undefined;
  };

  export default zipcodes;
}
