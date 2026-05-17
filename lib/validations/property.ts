import * as z from 'zod';

const optNum = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const parsed = Number(val);
  return isNaN(parsed) ? undefined : parsed;
}, z.number().optional());

export const propertySchema = z.object({
  name:               z.string().min(2, "Property name must be at least 2 characters"),
  address:            z.string().min(5, "Address must be at least 5 characters"),
  total_units:        z.number().min(1, "At least 1 unit required").max(500),
  bhk:                z.number().min(0).max(5),
  size_sqft:          optNum,
  floor_number:       optNum,
  total_floors:       optNum,
  is_duplex:          z.boolean(),
  lat:                optNum,
  lng:                optNum,
  google_maps_url:    z.string().url("Must be a valid URL").optional().or(z.literal('')),
  door_facing:        z.enum(['north','south','east','west']).optional(),
  furnishing:         z.enum(['unfurnished','semi','fully']),
  has_solar:          z.boolean(),
  has_borewell:       z.boolean(),
  has_parking:        z.boolean(),
  has_wifi:           z.boolean(),
  has_ac:             z.boolean(),
  has_lift:           z.boolean(),
  has_gym:            z.boolean(),
  has_security:       z.boolean(),
  electricity_model:  z.enum(['included','eb_meter','landlord_fixed']),
  electricity_fixed:  optNum,
  water_model:        z.enum(['included','borewell_free','fixed']),
  water_fixed:        optNum,
  maintenance_charge: optNum,
  security_deposit:   optNum,
  rent_price:         optNum,
  pg_price_sharing:   optNum,
  pg_price_single:    optNum,
  photos:             z.array(z.string()).max(8),
  unit_details:       z.array(z.object({
    unit_number: z.string().min(1),
    rent_price: optNum,
    size_sqft: optNum,
    bhk: optNum
  })).optional().default([])
});

export type PropertyFormValues = z.infer<typeof propertySchema>;
