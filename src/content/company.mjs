// Company-level copy: process, operating principles, FAQs. Same rules as src/content/SCHEMA.md — no invented
// facts, numbers, durations, credentials or guarantees.

export const PROCESS = [
  { id: 'conversation', title: 'Conversation', text: 'You tell us what you want to build, where, and roughly when. We ask about budget early and honestly, so neither of us spends time on a project that doesn’t fit.' },
  { id: 'discovery', title: 'Site visit & discovery', text: 'We walk the property or space, review what exists — surveys, drawings, photos, HOA or landlord requirements — and note the conditions that affect cost and schedule.' },
  { id: 'design', title: 'Design or plan review', text: 'If you need design, we coordinate it with licensed architects, engineers and designers as the project requires. If you already have plans, we review them for buildability, missing information and cost drivers before pricing.' },
  { id: 'scope', title: 'Scope & pricing', text: 'We write a defined scope — what is included, what is not, and the allowances for selections still to be made — and price it line by line, so you can see where the money goes.' },
  { id: 'agreement', title: 'Agreement & schedule', text: 'You receive a written agreement and a realistic schedule with its dependencies: permits, long-lead materials, inspections and the decisions we need from you, and when.' },
  { id: 'permits', title: 'Permits & procurement', text: 'We coordinate permit applications and approvals, order long-lead items early, and line up the specialist trade partners for each phase.' },
  { id: 'build', title: 'Construction', text: 'We manage the site, the sequence of trades and the logistics. You get scheduled updates from one main point of contact, and any change is priced and approved in writing before the work is done.' },
  { id: 'quality', title: 'Quality checks & inspections', text: 'Work is checked against the drawings and specifications at each phase, before it is covered up, and coordinated with the building department’s inspections.' },
  { id: 'closeout', title: 'Cleanup & turnover', text: 'Final cleaning, a punch list walked together, and a turnover package with manuals, product warranties and documentation of what was built.' },
];

export const PRINCIPLES = [
  { icon: 'pencil', title: 'Design that is resolved before it is built', text: 'Layouts, details and selections are worked out on paper, where changes are inexpensive — not improvised on site.' },
  { icon: 'doc', title: 'Clear scopes', text: 'Every proposal states what is included, what is excluded and what is still an allowance. Nothing important is left implied.' },
  { icon: 'scale', title: 'Transparent pricing', text: 'You see how the price is built. When something changes, you see the cost and approve it in writing before work proceeds.' },
  { icon: 'clock', title: 'Careful scheduling', text: 'Schedules account for permits, inspections, lead times and weather — and we tell you early when something moves.' },
  { icon: 'shield', title: 'Quality control & accountability', text: 'Phase-by-phase checks against the drawings and specifications, and one company answerable for the result.' },
  { icon: 'person', title: 'One main point of contact', text: 'One person who knows your project end to end, coordinating every designer, engineer and trade partner involved.' },
];

// Who is responsible for what on a Nation project.
export const RESPONSIBILITIES = [
  { who: 'Nation Design & Construction', items: ['Defining the scope, inclusions, exclusions and allowances in writing', 'Pricing, and pricing any change before the work proceeds', 'The schedule, sequencing and site logistics', 'Selecting, coordinating and supervising specialist trade partners', 'Quality checks at each phase, inspections and closeout', 'Being your one main point of contact'] },
  { who: 'Licensed design professionals', items: ['Architectural drawings where a project requires an architect', 'Engineering — structural, civil, MEP and geotechnical — sealed by licensed engineers', 'Surveys by licensed surveyors'] },
  { who: 'Specialist trade partners', items: ['Hands-on trade work under our supervision', 'Licensed trades (such as electrical, plumbing, mechanical, roofing and pool work) performed and permitted by appropriately licensed contractors'] },
  { who: 'You', items: ['Decisions and selections by the dates in the schedule', 'Approving the scope, the price and any changes in writing', 'Access to the property and any HOA, condo or landlord approvals that require the owner'] },
];

export const HOME_FAQS = [
  { q: 'Do you work from plans I already have?', a: 'Yes. If you have architectural drawings, engineering or a site plan, we review them for completeness and buildability, flag anything missing that would affect permitting or price, and build from them. You don’t need to start over with a new designer.' },
  { q: 'Can you handle the design as well?', a: 'Yes. We coordinate design from early layouts and selections through construction documents, working with licensed architects, engineers and designers wherever the project or the building department requires them. Design and construction are planned together, so the budget is considered as the design develops.' },
  { q: 'Who actually performs the work?', a: 'Specialist subcontractors and professional partners — licensed trades, engineers, architects and designers — perform their parts of the work. We plan the project, coordinate and supervise every party, manage the schedule and logistics, check quality, and remain your one main point of contact.' },
  { q: 'How do you price a project?', a: 'From a defined scope. We price the work line by line, show allowances for selections you haven’t made yet, and explain what could change the cost. Each service page explains how that work is priced and what moves the cost. Engineering, foundation and sinkhole work, and uncertain site conditions, can only be priced after an assessment.' },
  { q: 'Is there a minimum project size?', a: 'It depends on the type of work. We tell you at the start if a project is smaller than we can serve well, rather than after a site visit. Larger complete projects and substantial standalone projects are our focus.' },
  { q: 'Where do you work?', a: 'We’re launching in Florida. Tell us where your project is — in the form or by phone — and we’ll confirm, before any site visit, whether it’s in an area we serve.' },
  { q: 'Do you handle permits?', a: 'We coordinate permitting as part of the project: preparing and assembling the applications with the design professionals involved, responding to plan review comments and scheduling inspections. Permit and government fees are passed through at cost.' },
  { q: 'What happens after I submit the inquiry form?', a: 'We review what you sent — including any plans or photos — and contact you using the details you provided to discuss next steps. Sending an inquiry doesn’t commit you to anything.' },
];
