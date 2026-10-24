// Trade-partner prequalification choices.
export const TRADES = [
  'Architecture / design', 'Civil engineering', 'Structural engineering', 'MEP engineering', 'Surveying', 'Geotechnical / testing',
  'Demolition', 'Sitework / excavation / grading', 'Concrete / foundations', 'Masonry / block', 'Framing (wood)', 'Framing (metal)', 'Structural steel',
  'Roofing', 'Waterproofing', 'Stucco / siding', 'Painting', 'Windows & doors', 'Storefront / glazing', 'Gutters / soffit / fascia',
  'Electrical', 'Plumbing', 'HVAC / mechanical', 'Gas', 'Generators', 'Low voltage / AV / security', 'Fire sprinkler / fire alarm',
  'Insulation', 'Drywall / ceilings', 'Tile', 'Flooring', 'Cabinetry / countertops', 'Finish carpentry / millwork', 'Stairs / railings',
  'Pools / spas', 'Screen enclosures', 'Decks / pergolas', 'Landscaping / irrigation', 'Pavers / hardscape', 'Asphalt / paving', 'Fencing / gates',
  'Foundation repair / stabilization', 'Sinkhole remediation', 'Restoration (water / storm)', 'Construction cleaning', 'Hauling / dumpsters',
];
export const PROJECT_SIZES = ['Under $10,000', '$10,000 – $50,000', '$50,000 – $250,000', '$250,000 – $1 million', 'Over $1 million', 'Varies widely'];
export const INSURANCE_STATUS = {
  gl: ['Active policy', 'Can obtain before starting work', 'Not currently insured'],
  wc: ['Active policy', 'Exempt (with exemption certificate)', 'Not applicable / no employees', 'Not currently covered'],
};
export const TRADE_STATUSES = ['new', 'reviewing', 'documents_needed', 'approved', 'inactive'];
export const TRADE_STATUS_LABEL = { new: 'New', reviewing: 'Reviewing', documents_needed: 'Documents needed', approved: 'Approved', inactive: 'Inactive' };
export const INQUIRY_STATUSES = ['new', 'contacted', 'qualified', 'not_a_fit', 'closed'];
export const INQUIRY_STATUS_LABEL = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', not_a_fit: 'Not a fit', closed: 'Closed' };
