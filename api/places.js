export const config = { runtime: 'edge' };

// Merchant name → category key overrides (checked before type-based mapping)
const NAME_OVERRIDES = [
  { pattern: /whole foods/i,         category: 'whole_foods' },
  { pattern: /costco/i,              category: 'wholesale_clubs' },
  { pattern: /sam'?s club/i,         category: 'wholesale_clubs' },
  { pattern: /bj'?s/i,               category: 'wholesale_clubs' },
  { pattern: /\btarget\b/i,          category: 'target' },
  { pattern: /walmart/i,             category: 'walmart' },
  { pattern: /amazon fresh/i,        category: 'whole_foods' },
  { pattern: /amazon/i,              category: 'amazon' },
  { pattern: /trader joe/i,          category: 'groceries' },
  { pattern: /lyft/i,                category: 'lyft' },
  { pattern: /uber/i,                category: 'uber' },
  { pattern: /walgreens|cvs|rite aid/i, category: 'drugstores' },
  { pattern: /best buy/i,            category: 'usb_electronics' },
  { pattern: /apple store/i,         category: 'usb_electronics' },
  { pattern: /home depot|lowe'?s/i,  category: 'homeimprove' },
  { pattern: /macy'?s|nordstrom|kohl'?s|jc penney/i, category: 'usb_department' },
  { pattern: /peloton/i,             category: 'peloton' },
];

// Google Places type → category key
const TYPE_MAP = {
  gas_station:               'gas',
  grocery_or_supermarket:    'groceries',
  supermarket:               'groceries',
  restaurant:                'dining',
  food:                      'dining',
  cafe:                      'dining',
  bakery:                    'dining',
  bar:                       'dining',
  meal_takeaway:             'dining',
  meal_delivery:             'dining',
  pharmacy:                  'drugstores',
  drugstore:                 'drugstores',
  transit_station:           'transit',
  subway_station:            'transit',
  bus_station:               'transit',
  train_station:             'transit',
  airport:                   'travel',
  lodging:                   'travel',
  movie_theater:             'entertainment',
  night_club:                'entertainment',
  gym:                       'usb_gym',
  health:                    'usb_gym',
  electronics_store:         'usb_electronics',
  furniture_store:           'usb_furniture',
  home_goods_store:          'homeimprove',
  hardware_store:            'homeimprove',
  clothing_store:            'usb_clothing',
  shoe_store:                'usb_clothing',
  sporting_goods_store:      'usb_sporting',
  department_store:          'usb_department',
  shopping_mall:             'other',
};

function resolveCategory(name, types) {
  // 1. Check name overrides first
  for (const override of NAME_OVERRIDES) {
    if (override.pattern.test(name)) return override.category;
  }
  // 2. Check Google types
  for (const type of (types || [])) {
    if (TYPE_MAP[type]) return TYPE_MAP[type];
  }
  return 'other';
}

export default async function handler(req) {
  const url = new URL(req.url);
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');
  const query = url.searchParams.get('query'); // for text search
  const key = process.env.GOOGLE_PLACES_KEY;

  if (!key) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    let places = [];

    if (query) {
      // Text search for manual merchant lookup
      const searchRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`
      );
      const data = await searchRes.json();
      places = (data.results || []).slice(0, 3).map(p => ({
        name: p.name,
        address: p.formatted_address,
        category: resolveCategory(p.name, p.types),
        types: p.types,
      }));
    } else if (lat && lng) {
      // Nearby search
      const radius = 500; // meters (~1600ft, covers nearby shopping area)
      const nearbyRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${key}`
      );
      const data = await nearbyRes.json();
      
      // Filter out irrelevant types, take top 5
      const skip = new Set(['point_of_interest', 'establishment', 'political', 'locality', 'route', 'street_address', 'premise', 'neighborhood', 'sublocality', 'administrative_area_level_1', 'administrative_area_level_2', 'country', 'postal_code', 'ATM', 'bank', 'insurance_agency', 'real_estate_agency', 'lawyer', 'doctor', 'hospital', 'dentist']);
      
      places = (data.results || [])
        .filter(p => {
          const useful = (p.types || []).some(t => !skip.has(t) && TYPE_MAP[t]);
          const nameOverride = NAME_OVERRIDES.some(o => o.pattern.test(p.name));
          return useful || nameOverride;
        })
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          address: p.vicinity,
          category: resolveCategory(p.name, p.types),
          types: p.types,
          distance: null, // could calculate from lat/lng if needed
        }));
    } else {
      return new Response(JSON.stringify({ error: 'Missing lat/lng or query' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ places }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
