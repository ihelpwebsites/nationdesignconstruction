// Service catalog structure: categories, the services in each, and whole-project overview pages.
// Long-form page content lives in src/content/services/<category>.mjs and src/content/overviews.mjs, keyed by slug.
// Public availability and pricing are NOT set here — they live in the database (admin → Services / Pricing),
// seeded from DEFAULT_AVAILABILITY below.
//
// delivery:
//   'managed'   – we plan, schedule and supervise; trade work is performed by specialist subcontractors.
//   'licensed'  – the work requires a state-licensed specialty contractor (electrical, plumbing, HVAC, roofing,
//                 pool, etc.); performed by appropriately licensed partners under our coordination.
//   'professional' – a licensed design professional (architect, engineer, surveyor, geologist) produces and seals
//                 the work product; we coordinate scope, schedule and integration with construction.
//   'assessment' – scope cannot be known until an investigation/assessment is complete (engineering-led).

export const CATEGORIES = [
  { slug: 'design-preconstruction', name: 'Design & Preconstruction', short: 'Design & Preconstruction',
    blurb: 'Planning, design coordination, selections, budgets and permits — before anything is built.' },
  { slug: 'site-plans-engineering', name: 'Site Plans & Engineering', short: 'Site Plans & Engineering',
    blurb: 'Surveys, site plans and engineering by licensed professionals, coordinated into one buildable plan.' },
  { slug: 'demolition-site-preparation', name: 'Demolition & Site Preparation', short: 'Demolition & Site Prep',
    blurb: 'Careful removal, clearing, grading and hauling that set up the rest of the project.' },
  { slug: 'foundations-structure', name: 'Foundations & Structure', short: 'Foundations & Structure',
    blurb: 'Concrete, masonry, framing and steel — the structure everything else depends on.' },
  { slug: 'roofing-exterior', name: 'Roofing & Building Exterior', short: 'Roofing & Exterior',
    blurb: 'Roofs, openings, waterproofing and finishes that protect the building from Florida weather.' },
  { slug: 'electrical-plumbing-hvac', name: 'Electrical, Plumbing & HVAC', short: 'Electrical, Plumbing & HVAC',
    blurb: 'Power, water and air systems installed by licensed trade partners and coordinated with the build.' },
  { slug: 'interiors-finishes', name: 'Interiors & Finishes', short: 'Interiors & Finishes',
    blurb: 'Walls, floors, cabinetry and millwork — the surfaces people see and touch every day.' },
  { slug: 'kitchens-bathrooms-custom-spaces', name: 'Kitchens, Bathrooms & Custom Spaces', short: 'Kitchens, Baths & Custom Spaces',
    blurb: 'Kitchens, baths and purpose-built rooms planned around how you actually live and work.' },
  { slug: 'pools-outdoor-living', name: 'Pools & Outdoor Living', short: 'Pools & Outdoor Living',
    blurb: 'Pools, lanais, enclosures and outdoor kitchens designed as part of the property.' },
  { slug: 'landscaping-property', name: 'Landscaping & Property Improvements', short: 'Landscaping & Property',
    blurb: 'Planting, irrigation, hardscape, paving, fencing and drainage across the whole site.' },
  { slug: 'technology-low-voltage', name: 'Technology & Low Voltage', short: 'Technology & Low Voltage',
    blurb: 'Networks, audio, smart controls, security and AV — planned in before the walls close.' },
  { slug: 'commercial-construction', name: 'Commercial Construction', short: 'Commercial Construction',
    blurb: 'Ground-up buildings, build-outs and improvements for businesses that need to open on schedule.' },
  { slug: 'specialty-repairs', name: 'Specialty Repairs', short: 'Specialty Repairs',
    blurb: 'Engineered repairs for settlement, sinkhole activity, water intrusion and storm damage.' },
  { slug: 'cleanup-closeout', name: 'Construction Cleanup & Closeout', short: 'Cleanup & Closeout',
    blurb: 'Cleaning, punch lists, inspections and turnover documents that finish a project properly.' },
];

// markets: which audience pages list the service. unit: the pricing basis the service is normally quoted on
// (sqft | lf | project | assessment). covers: the specific scope items from the brief, used by directory search.
export const SERVICES = [
  // Design & Preconstruction
  { slug: 'design-coordination', name: 'Custom Design Coordination', category: 'design-preconstruction', markets: ['residential', 'commercial'], delivery: 'professional', unit: 'project',
    covers: ['custom design coordination', 'space planning', 'layouts', 'floor plans', 'architect coordination'] },
  { slug: 'interior-design-selections', name: 'Interior Design & Material Selections', category: 'design-preconstruction', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['interior design', 'material selections', 'finish schedules', 'fixtures', 'color palettes'] },
  { slug: '3d-renderings', name: '3D Renderings & Visualization', category: 'design-preconstruction', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['3d renderings', 'visualization', 'design concepts', 'walkthroughs'] },
  { slug: 'feasibility-budgeting', name: 'Feasibility, Estimating & Budgeting', category: 'design-preconstruction', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['feasibility', 'estimating', 'budgeting', 'cost planning', 'value engineering'] },
  { slug: 'procurement-planning', name: 'Procurement Planning', category: 'design-preconstruction', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['procurement planning', 'long-lead items', 'ordering', 'material logistics'] },
  { slug: 'permit-coordination', name: 'Permit Coordination', category: 'design-preconstruction', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['permit coordination', 'building permits', 'plan review', 'hoa approvals', 'zoning'] },

  // Site Plans & Engineering
  { slug: 'survey-coordination', name: 'Survey Coordination', category: 'site-plans-engineering', markets: ['residential', 'commercial'], delivery: 'professional', unit: 'project',
    covers: ['survey coordination', 'boundary survey', 'topographic survey', 'elevation certificate'] },
  { slug: 'site-plans-civil-engineering', name: 'Site Plans & Civil Engineering', category: 'site-plans-engineering', markets: ['residential', 'commercial'], delivery: 'professional', unit: 'project',
    covers: ['site plans', 'civil engineering', 'drainage design', 'stormwater', 'grading plans'] },
  { slug: 'structural-engineering', name: 'Structural Engineering', category: 'site-plans-engineering', markets: ['residential', 'commercial'], delivery: 'professional', unit: 'project',
    covers: ['structural engineering', 'structural calculations', 'beam sizing', 'wind load'] },
  { slug: 'mep-engineering', name: 'Mechanical, Electrical & Plumbing Engineering', category: 'site-plans-engineering', markets: ['residential', 'commercial'], delivery: 'professional', unit: 'project',
    covers: ['mep engineering', 'mechanical engineering', 'electrical engineering', 'plumbing engineering', 'load calculations'] },
  { slug: 'geotechnical-soil-testing', name: 'Geotechnical Investigations & Soil Testing', category: 'site-plans-engineering', markets: ['residential', 'commercial'], delivery: 'assessment', unit: 'assessment',
    covers: ['geotechnical investigations', 'soil testing', 'soil borings', 'compaction testing'] },

  // Demolition & Site Preparation
  { slug: 'interior-demolition', name: 'Interior Demolition', category: 'demolition-site-preparation', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['interior demolition', 'selective demolition', 'gut renovation', 'strip-out'] },
  { slug: 'structure-demolition', name: 'Structure Demolition & Concrete Removal', category: 'demolition-site-preparation', markets: ['residential', 'commercial'], delivery: 'licensed', unit: 'project',
    covers: ['structure demolition', 'building demolition', 'concrete removal', 'slab removal'] },
  { slug: 'clearing-excavation-grading', name: 'Clearing, Excavation & Grading', category: 'demolition-site-preparation', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['clearing', 'excavation', 'grading', 'fill', 'erosion control', 'land clearing'] },
  { slug: 'hauling-debris-removal', name: 'Hauling & Debris Removal', category: 'demolition-site-preparation', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['hauling', 'debris removal', 'dumpsters', 'construction debris'], alsoIn: ['cleanup-closeout'] },

  // Foundations & Structure
  { slug: 'concrete-foundations', name: 'Concrete Foundations, Footings & Slabs', category: 'foundations-structure', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['footings', 'slabs', 'stem walls', 'concrete foundations'] },
  { slug: 'masonry-block', name: 'Masonry & Block Construction', category: 'foundations-structure', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['masonry', 'block', 'cmu', 'tie beams'] },
  { slug: 'framing', name: 'Wood & Metal Framing', category: 'foundations-structure', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['wood framing', 'metal framing', 'roof trusses', 'steel studs'] },
  { slug: 'structural-steel', name: 'Structural Steel', category: 'foundations-structure', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['structural steel', 'steel beams', 'columns', 'moment frames'] },
  { slug: 'structural-modifications', name: 'Structural Modifications', category: 'foundations-structure', markets: ['residential', 'commercial'], delivery: 'professional', unit: 'project',
    covers: ['structural modifications', 'load-bearing wall removal', 'new openings', 'beam installation'] },

  // Roofing & Building Exterior
  { slug: 'roofing', name: 'Roof Installation, Replacement & Repair', category: 'roofing-exterior', markets: ['residential', 'commercial'], delivery: 'licensed', unit: 'sqft',
    covers: ['roof installation', 'roof replacement', 'roof repair', 'shingle', 'tile roof', 'metal roof', 'flat roof'] },
  { slug: 'waterproofing', name: 'Waterproofing', category: 'roofing-exterior', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['waterproofing', 'balcony waterproofing', 'below-grade waterproofing', 'sealants'] },
  { slug: 'stucco-siding', name: 'Stucco & Siding', category: 'roofing-exterior', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['stucco', 'siding', 'fiber cement', 'stucco repair'] },
  { slug: 'exterior-painting', name: 'Exterior Painting', category: 'roofing-exterior', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['exterior painting', 'elastomeric coating', 'pressure washing'] },
  { slug: 'impact-windows-doors', name: 'Impact Windows & Doors', category: 'roofing-exterior', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['impact windows', 'impact doors', 'hurricane windows', 'sliding glass doors'] },
  { slug: 'storefront-glazing', name: 'Storefront Glazing', category: 'roofing-exterior', markets: ['commercial'], delivery: 'managed', unit: 'project',
    covers: ['storefront glazing', 'storefront', 'curtain wall', 'commercial glass'] },
  { slug: 'gutters-soffit-fascia', name: 'Gutters, Soffits & Fascia', category: 'roofing-exterior', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'lf',
    covers: ['gutters', 'soffits', 'fascia', 'downspouts'] },

  // Electrical, Plumbing & HVAC
  { slug: 'electrical', name: 'Electrical Installations, Panels & Lighting', category: 'electrical-plumbing-hvac', markets: ['residential', 'commercial'], delivery: 'licensed', unit: 'project',
    covers: ['electrical installations', 'panels', 'panel upgrades', 'lighting', 'rewiring'] },
  { slug: 'generators', name: 'Generators', category: 'electrical-plumbing-hvac', markets: ['residential', 'commercial'], delivery: 'licensed', unit: 'project',
    covers: ['generators', 'standby generators', 'transfer switch'] },
  { slug: 'ev-charging', name: 'EV Charging', category: 'electrical-plumbing-hvac', markets: ['residential', 'commercial'], delivery: 'licensed', unit: 'project',
    covers: ['ev charging', 'electric vehicle charger', 'level 2 charger'] },
  { slug: 'plumbing', name: 'Plumbing, Fixtures & Water Heaters', category: 'electrical-plumbing-hvac', markets: ['residential', 'commercial'], delivery: 'licensed', unit: 'project',
    covers: ['plumbing rough-ins', 'fixtures', 'water heaters', 'tankless water heater'] },
  { slug: 'repiping', name: 'Repiping', category: 'electrical-plumbing-hvac', markets: ['residential', 'commercial'], delivery: 'licensed', unit: 'project',
    covers: ['repiping', 'polybutylene replacement', 'pex', 'copper'] },
  { slug: 'hvac', name: 'HVAC Systems, Ductwork & Ventilation', category: 'electrical-plumbing-hvac', markets: ['residential', 'commercial'], delivery: 'licensed', unit: 'project',
    covers: ['hvac systems', 'air conditioning', 'ductwork', 'ventilation', 'controls', 'thermostats'] },

  // Interiors & Finishes
  { slug: 'insulation-drywall', name: 'Insulation, Drywall & Texture', category: 'interiors-finishes', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['insulation', 'drywall', 'texture', 'spray foam'] },
  { slug: 'interior-painting', name: 'Interior Painting', category: 'interiors-finishes', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['interior painting', 'cabinet painting', 'wall coverings'] },
  { slug: 'tile', name: 'Tile Installation', category: 'interiors-finishes', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['tile', 'porcelain', 'stone tile', 'shower tile', 'backsplash'] },
  { slug: 'flooring', name: 'Hardwood, Luxury Vinyl & Carpet', category: 'interiors-finishes', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['hardwood', 'luxury vinyl', 'lvp', 'carpet', 'engineered wood'] },
  { slug: 'polished-concrete-epoxy', name: 'Polished Concrete & Epoxy Flooring', category: 'interiors-finishes', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['polished concrete', 'epoxy flooring', 'garage floors', 'sealed concrete'] },
  { slug: 'cabinetry-countertops', name: 'Cabinetry & Countertops', category: 'interiors-finishes', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'lf',
    covers: ['cabinetry', 'countertops', 'quartz', 'stone countertops', 'custom cabinets'] },
  { slug: 'millwork-trim-doors', name: 'Millwork, Trim & Interior Doors', category: 'interiors-finishes', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'lf',
    covers: ['millwork', 'trim', 'doors', 'built-ins', 'wainscoting'] },
  { slug: 'stairs-railings', name: 'Stairs & Railings', category: 'interiors-finishes', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['stairs', 'railings', 'glass railings', 'stair treads'] },

  // Kitchens, Bathrooms & Custom Spaces
  { slug: 'kitchen-renovation', name: 'Kitchen Renovations', category: 'kitchens-bathrooms-custom-spaces', markets: ['residential'], delivery: 'managed', unit: 'project',
    covers: ['kitchen renovation', 'kitchen remodel', 'kitchen design'] },
  { slug: 'bathroom-renovation', name: 'Bathroom Renovations', category: 'kitchens-bathrooms-custom-spaces', markets: ['residential'], delivery: 'managed', unit: 'project',
    covers: ['bathroom renovation', 'bath remodel', 'shower', 'primary bath'] },
  { slug: 'closets-pantries-laundry', name: 'Closets, Pantries & Laundry Rooms', category: 'kitchens-bathrooms-custom-spaces', markets: ['residential'], delivery: 'managed', unit: 'project',
    covers: ['closets', 'pantries', 'laundry rooms', 'mudroom'] },
  { slug: 'offices-theaters-wine-rooms', name: 'Offices, Theaters & Wine Rooms', category: 'kitchens-bathrooms-custom-spaces', markets: ['residential'], delivery: 'managed', unit: 'project',
    covers: ['offices', 'home office', 'theaters', 'media room', 'wine rooms'] },
  { slug: 'accessibility-improvements', name: 'Accessibility Improvements', category: 'kitchens-bathrooms-custom-spaces', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['accessibility improvements', 'aging in place', 'curbless shower', 'grab bars', 'ramps', 'ada'] },

  // Pools & Outdoor Living
  { slug: 'pools-spas', name: 'Pool & Spa Construction', category: 'pools-outdoor-living', markets: ['residential', 'commercial'], delivery: 'licensed', unit: 'project',
    covers: ['pools', 'spas', 'pool construction', 'hot tub'] },
  { slug: 'pool-renovation', name: 'Pool Renovations', category: 'pools-outdoor-living', markets: ['residential', 'commercial'], delivery: 'licensed', unit: 'project',
    covers: ['pool renovations', 'resurfacing', 'pool deck', 'pool equipment'] },
  { slug: 'decks-lanais-patios', name: 'Decks, Lanais, Covered Patios & Pergolas', category: 'pools-outdoor-living', markets: ['residential'], delivery: 'managed', unit: 'sqft',
    covers: ['decks', 'lanais', 'covered patios', 'pergolas', 'patio roof'] },
  { slug: 'screen-enclosures', name: 'Screen Enclosures', category: 'pools-outdoor-living', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['screen enclosures', 'pool cage', 'rescreening'] },
  { slug: 'outdoor-kitchens', name: 'Outdoor Kitchens, Fire Features & Showers', category: 'pools-outdoor-living', markets: ['residential'], delivery: 'managed', unit: 'project',
    covers: ['outdoor kitchens', 'fire features', 'fire pit', 'outdoor showers', 'summer kitchen'] },

  // Landscaping & Property Improvements
  { slug: 'landscape-design-planting', name: 'Landscape Design, Planting & Sod', category: 'landscaping-property', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['landscape design', 'planting', 'sod', 'trees', 'florida-friendly landscaping'] },
  { slug: 'irrigation', name: 'Irrigation', category: 'landscaping-property', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['irrigation', 'sprinklers', 'drip irrigation', 'irrigation controllers'] },
  { slug: 'landscape-lighting', name: 'Landscape Lighting', category: 'landscaping-property', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['landscape lighting', 'outdoor lighting', 'path lights', 'uplighting'] },
  { slug: 'pavers-driveways-walkways', name: 'Pavers, Driveways & Walkways', category: 'landscaping-property', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['pavers', 'driveways', 'walkways', 'concrete driveway', 'pool deck pavers'] },
  { slug: 'asphalt-parking-lots', name: 'Asphalt & Parking Lots', category: 'landscaping-property', markets: ['commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['asphalt', 'parking lots', 'striping', 'sealcoating', 'resurfacing'] },
  { slug: 'fences-gates', name: 'Fences & Gates', category: 'landscaping-property', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'lf',
    covers: ['fences', 'gates', 'aluminum fence', 'privacy fence', 'automatic gates'] },
  { slug: 'retaining-walls-drainage', name: 'Retaining Walls & Site Drainage', category: 'landscaping-property', markets: ['residential', 'commercial'], delivery: 'professional', unit: 'project',
    covers: ['retaining walls', 'drainage', 'french drains', 'swales', 'yard flooding'] },

  // Technology & Low Voltage
  { slug: 'structured-cabling-wifi', name: 'Structured Cabling & Wi-Fi', category: 'technology-low-voltage', markets: ['residential', 'commercial'], delivery: 'licensed', unit: 'project',
    covers: ['structured cabling', 'wi-fi', 'networking', 'ethernet', 'access points'] },
  { slug: 'audio-home-theater', name: 'Whole-Home Audio & Home Theaters', category: 'technology-low-voltage', markets: ['residential'], delivery: 'licensed', unit: 'project',
    covers: ['speakers', 'whole-home audio', 'theaters', 'home theater', 'media room'] },
  { slug: 'smart-home-shades', name: 'Smart-Home Controls & Motorized Shades', category: 'technology-low-voltage', markets: ['residential'], delivery: 'licensed', unit: 'project',
    covers: ['smart-home controls', 'home automation', 'motorized shades', 'lighting control'] },
  { slug: 'cameras-access-control', name: 'Cameras & Access Control', category: 'technology-low-voltage', markets: ['residential', 'commercial'], delivery: 'licensed', unit: 'project',
    covers: ['cameras', 'security cameras', 'access control', 'video doorbell', 'card readers'] },
  { slug: 'commercial-av', name: 'Commercial Audio-Visual', category: 'technology-low-voltage', markets: ['commercial'], delivery: 'licensed', unit: 'project',
    covers: ['commercial av', 'conference rooms', 'displays', 'background music', 'digital signage'] },

  // Commercial Construction
  { slug: 'restaurants-commercial-kitchens', name: 'Restaurants & Commercial Kitchens', category: 'commercial-construction', markets: ['commercial'], delivery: 'managed', unit: 'project',
    covers: ['restaurants', 'commercial kitchens', 'hood systems', 'grease trap', 'food service'] },
  { slug: 'commercial-restrooms', name: 'Commercial Restrooms', category: 'commercial-construction', markets: ['commercial'], delivery: 'managed', unit: 'project',
    covers: ['restrooms', 'commercial restrooms', 'ada restrooms', 'toilet partitions'] },
  { slug: 'ceilings-partitions', name: 'Acoustical Ceilings & Partitions', category: 'commercial-construction', markets: ['commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['acoustical ceilings', 'partitions', 'demising walls', 'drop ceilings', 'office walls'] },
  { slug: 'warehouse-improvements', name: 'Warehouse Improvements', category: 'commercial-construction', markets: ['commercial'], delivery: 'managed', unit: 'project',
    covers: ['warehouse improvements', 'loading docks', 'mezzanines', 'industrial'] },
  { slug: 'fire-protection-signage-coordination', name: 'Fire Protection & Signage Coordination', category: 'commercial-construction', markets: ['commercial'], delivery: 'licensed', unit: 'project',
    covers: ['fire protection coordination', 'fire sprinklers', 'fire alarm', 'signage coordination', 'sign permits'] },

  // Specialty Repairs
  { slug: 'sinkhole-remediation', name: 'Sinkhole Evaluation & Engineered Remediation', category: 'specialty-repairs', markets: ['residential', 'commercial'], delivery: 'assessment', unit: 'assessment',
    covers: ['sinkhole evaluation', 'sinkhole remediation', 'grouting', 'subsidence'] },
  { slug: 'foundation-repair', name: 'Foundation Repair, Stabilization & Underpinning', category: 'specialty-repairs', markets: ['residential', 'commercial'], delivery: 'assessment', unit: 'assessment',
    covers: ['foundation repair', 'stabilization', 'underpinning', 'settlement repair', 'piers'], alsoIn: ['foundations-structure'] },
  { slug: 'concrete-restoration', name: 'Concrete Restoration', category: 'specialty-repairs', markets: ['residential', 'commercial'], delivery: 'assessment', unit: 'assessment',
    covers: ['concrete restoration', 'spalling', 'balcony repair', 'rebar corrosion'] },
  { slug: 'water-intrusion-repair', name: 'Water Intrusion Repair', category: 'specialty-repairs', markets: ['residential', 'commercial'], delivery: 'assessment', unit: 'assessment',
    covers: ['water intrusion', 'leaks', 'moisture damage', 'envelope repair'] },
  { slug: 'storm-damage-reconstruction', name: 'Storm-Damage Reconstruction', category: 'specialty-repairs', markets: ['residential', 'commercial'], delivery: 'assessment', unit: 'assessment',
    covers: ['storm damage', 'hurricane damage', 'reconstruction', 'insurance claim rebuild'] },

  // Construction Cleanup & Closeout
  { slug: 'construction-cleaning', name: 'Rough & Final Construction Cleaning', category: 'cleanup-closeout', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'sqft',
    covers: ['rough cleaning', 'final cleaning', 'window cleaning', 'post-construction cleaning'] },
  { slug: 'punch-list-closeout', name: 'Punch Lists, Inspections & Turnover', category: 'cleanup-closeout', markets: ['residential', 'commercial'], delivery: 'managed', unit: 'project',
    covers: ['punch lists', 'inspection coordination', 'turnover documents', 'warranty coordination', 'certificate of occupancy'] },
];

// Whole-project overview pages. path = public URL.
export const OVERVIEWS = [
  { slug: 'custom-homes', path: '/residential/custom-homes/', name: 'Custom Homes', market: 'residential' },
  { slug: 'home-additions', path: '/residential/additions/', name: 'Home Additions', market: 'residential' },
  { slug: 'whole-home-renovations', path: '/residential/whole-home-renovations/', name: 'Whole-Home Renovations', market: 'residential' },
  { slug: 'commercial-new-construction', path: '/commercial/new-construction/', name: 'Commercial New Construction', market: 'commercial' },
  { slug: 'commercial-build-outs', path: '/commercial/build-outs/', name: 'Commercial Build-Outs & Tenant Improvements', market: 'commercial' },
  { slug: 'site-development', path: '/commercial/site-development/', name: 'Site Development', market: 'commercial' },
];

// Availability: 'published' = listed + indexable; 'preview' = listed and reachable, noindex, shows an
// availability note; 'hidden' = not listed, 404. Nothing has been confirmed by the owner yet, so every service
// starts in 'preview'. Owner changes this per service in admin → Services.
export const DEFAULT_AVAILABILITY = 'preview';

export const categoryBySlug = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
export const serviceBySlug = Object.fromEntries(SERVICES.map((s) => [s.slug, s]));
