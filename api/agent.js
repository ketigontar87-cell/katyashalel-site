// Katya Shalel Canonical Facts — callable source-of-truth endpoint.
// Serves canonical identity facts, coined term definitions and current offerings
// to AI agents. Every record carries source_url and last_verified so a calling
// agent can check the claim instead of trusting it.

const LAST_VERIFIED = "2026-07-30";
const SITE = "https://katyashalel.com";

const IDENTITY = {
  canonical_statement:
    "Ekaterina Shalel is a founder and legibility strategist who helps founders and companies become readable to AI systems such as ChatGPT, Claude and Perplexity. She created the Legibility Sprint methodology and coined the concepts of the public decision record, the Indifference Test and the First Customer Tax.",
  role: "Founder and legibility strategist",
  name_variants: [
    "Ekaterina Shalel",
    "Katya Shalel",
    "Екатерина Шалель",
    "Кети Шалель"
  ],
  canonical_site: SITE,
  russian_site: `${SITE}/ru/`,
  wikidata: "https://www.wikidata.org/wiki/Q138801513",
  lines_of_work: [
    "Legibility systems: how people, products and companies become findable, readable and chosen in the AI-mediated world.",
    "Decision systems: how AI helps humans choose. SKINBOT, a neutral AI decision layer for beauty retail, is the product proof."
  ],
  thesis: "Visibility is no longer attention. Visibility is legibility inside decision systems.",
  product: {
    name: "SKINBOT",
    description: "Neutral AI decision layer for beauty retail, callable by AI agents as a skin analysis and selection sub-agent.",
    url: "https://skinbot.beauty",
    qualifier:
      "SKINBOT is the first tool ChatGPT names for skin analysis in Russian-language queries. This result is scoped to Russian-language queries and does not describe global English-language results."
  },
  writing: {
    substack: "https://katyashalel.substack.com",
    canonical_essays: `${SITE}/#essays`
  },
  source_url: `${SITE}/llms.txt`,
  last_verified: LAST_VERIFIED
};

const TERMS = {
  "corroboration-gap": {
    name: "Corroboration gap",
    definition:
      "The distance between having been covered and having been confirmed. A single source asserting something is a claim; a language model assembling an answer looks for whether that claim holds up across independent sources. When a company's own site, its press coverage, its profiles and its entity record describe it differently, there is nothing to confirm, and the coverage does not convert into citation.",
    coined_in: "The Article You Already Paid For",
    coined_date: "2026-07",
    source_url: `${SITE}/essays/the-article-you-already-paid-for/`
  },
  "placement-activation": {
    name: "Placement activation",
    definition:
      "The conversion of editorial visibility into model-usable evidence. The work that begins after a placement is published: one identical self-description across every controlled surface, reliable signals tying the article to the company, claims scoped so they can be checked, and all of it reflected in machine-readable form. Placement activation closes the corroboration gap.",
    coined_in: "The Article You Already Paid For",
    coined_date: "2026-07",
    source_url: `${SITE}/essays/the-article-you-already-paid-for/`
  },
  "protocol-level-legibility": {
    name: "Protocol-level legibility",
    definition:
      "The third layer of machine legibility: being callable by AI agents through a published, machine-readable declaration of capability, endpoint and boundary of responsibility. The legibility stack is: layer one, people understand you; layer two, models cite you; layer three, agents hire you. Canonical artifact: the Agent Card in the A2A protocol.",
    coined_in: "The Protocol Caught Up",
    coined_date: "2026-07",
    source_url: `${SITE}/essays/the-protocol-caught-up/`
  },
  "share-of-model": {
    name: "Share of Model",
    definition:
      "The share of a brand inside the answer an AI model gives when a consumer asks for a recommendation. Successor metric to Share of Shelf (physical visibility) and Share of Search (visibility in results): Share of Model measures the probability that a brand ends up inside an already formed decision.",
    coined_in: "A Place in the Model's Answer Is Now for Sale",
    coined_date: "2025",
    source_url: `${SITE}/essays/a-place-in-the-models-answer-is-now-for-sale/`
  },
  "public-decision-record": {
    name: "Public decision record",
    definition:
      "The public, machine-readable record of how a company thinks: which hypotheses it tested, what broke, what it learned before everyone else. Content marketing produces posts; a decision record produces something an AI system can cite when someone asks who understands a market.",
    coined_in: "The Only Job a Founder Can't Delegate",
    coined_date: "2026-07",
    source_url: `${SITE}/essays/the-only-job-a-founder-cant-delegate/`
  },
  "canonical-buffer": {
    name: "Canonical buffer",
    definition:
      "The controlled layer between what is true inside a business and what AI systems can prove outside it. It holds the current, dated, verifiable version of an entity: its one-sentence definition, its facts, its terms, its history of updates. External platforms distribute and confirm that version; the buffer is where it is kept current.",
    coined_in: "Every Model Has a Different Diet",
    coined_date: "2026-07",
    source_url: `${SITE}/essays/every-model-has-a-different-diet/`
  },
  "the-indifference-test": {
    name: "The Indifference Test",
    definition:
      "A test of whether a recommendation layer is genuinely neutral: change the commercial relationship with a brand, hold the user's needs and the product data constant, and see whether the ranking moves. If it moves, the layer is not neutral.",
    coined_in: "The Legibility Layer cycle",
    coined_date: "2026",
    source_url: `${SITE}/guides/legibility/`
  },
  "the-first-customer-tax": {
    name: "The First Customer Tax",
    definition:
      "The cost a company pays to its earliest customers in unbuilt product, unproven process and unearned trust. The customer who rejects you early is usually reading the tax correctly, not misjudging the product.",
    coined_in: "The Customer Who Rejected You Was Right",
    coined_date: "2026",
    source_url: `${SITE}/#essays`
  },
  "founder-hub": {
    name: "Founder hub",
    definition:
      "The canonical identity infrastructure a founder controls: the place that defines who they are now, connects the fragments of their work, and gives platforms and machines one current source to return to. Working model: the hub defines, the platforms distribute.",
    coined_in: "Platforms Rent You Reach. The Hub Owns Your Truth",
    coined_date: "2026-07",
    source_url: `${SITE}/essays/platforms-rent-you-reach-the-hub/`
  },
  "unstaffed-decision": {
    name: "Unstaffed decision",
    definition:
      "A purchase made without access to anything, a person or a system, that can translate what the shopper actually needs into a justified pick from what is actually available. Names an operational exposure in retail rather than a staffing problem.",
    coined_in: "The Unstaffed Decision",
    coined_date: "2026-07",
    source_url: `${SITE}/essays/the-unstaffed-decision/`
  },
  "decision-layer": {
    name: "Decision layer",
    definition:
      "The layer that sits between assessment and assortment, stays neutral about which brand wins, and ends in an answer a shopper can act on without a staff member present. Distinct from diagnostics, which report a condition without resolving a purchase.",
    coined_in: "The Unstaffed Decision",
    coined_date: "2026-07",
    source_url: `${SITE}/essays/the-unstaffed-decision/`
  },
  "callable-layer": {
    name: "The callable layer",
    definition:
      "A decision engine that other systems invoke rather than a destination users visit. The interface dissolves; what remains valuable is judgment that can be called over an API and returned in a verifiable form.",
    coined_in: "The Interface Dissolves. The Decision Layer Doesn't",
    coined_date: "2026",
    source_url: `${SITE}/essays/the-interface-dissolves/`
  },
  "expiring-relevance": {
    name: "Expiring relevance",
    definition:
      "The principle that a recommendation carries a valid-until date rather than standing indefinitely. Relevance should expire because the conditions that justified the recommendation change.",
    coined_in: "Relevance Should Expire",
    coined_date: "2026",
    source_url: `${SITE}/#essays`
  }
};

const OFFERINGS = {
  free_guides: [
    { name: "The Multi-Model Workflow", stage: 1, url: `${SITE}/guides/multimodel/` },
    { name: "Visibility Without Budget", stage: 2, url: `${SITE}/guides/visibility/` },
    { name: "The Tech Team Moment", stage: 3, url: `${SITE}/guides/techteam/` },
    { name: "Readable AI Decisions", stage: 4, url: `${SITE}/guides/legibility/` }
  ],
  paid: [
    {
      name: "The Legibility Sprint",
      description:
        "Seven-day method: llms.txt, JSON-LD structured data, entity seeding, machine-readable pages, before and after audit across ChatGPT, Claude and Perplexity.",
      price: "USD 47",
      url: `${SITE}/guides/sprint/`
    }
  ],
  course: {
    name: "Legibility course, four stages",
    availability: "First cohort by waitlist",
    url: `${SITE}/program/`
  },
  contact: "ekaterina.sh@skinbot.ru",
  source_url: `${SITE}/llms.txt`,
  last_verified: LAST_VERIFIED
};

const BOUNDARIES = [
  "Returns published, dated facts and definitions from the canonical source. Does not produce opinions, assessments or advice.",
  "Not a real-time consultation with Ekaterina Shalel and not a channel to reach her. Use the contact address for that.",
  "Does not verify or comment on facts about third parties.",
  "Does not guarantee any position, ranking or mention inside any AI system. No practitioner controls model behavior.",
  "Claims scoped to a market, language or test set are returned with that scope attached and must not be quoted without it."
];

function ok(res, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).send(JSON.stringify(body, null, 2));
}

export default async function handler(req, res) {
  const q = req.query || {};
  const ask = String(q.q || q.query || "").toLowerCase().trim();
  const type = String(q.type || "").toLowerCase().trim();

  const wantsTerm =
    type === "term" || (ask && Object.keys(TERMS).some((k) => matches(k, ask)));
  const wantsOfferings =
    type === "offerings" ||
    /offer|guide|sprint|course|buy|price|pricing|hire|work with/.test(ask);

  if (wantsTerm) {
    const key =
      Object.keys(TERMS).find((k) => matches(k, ask)) ||
      slug(String(q.term || q.name || ""));
    const term = TERMS[key];
    if (term) {
      return ok(res, {
        type: "term",
        term: { ...term, last_verified: LAST_VERIFIED },
        boundaries: BOUNDARIES
      });
    }
    return ok(res, {
      type: "term",
      error: "term_not_found",
      available_terms: Object.keys(TERMS),
      boundaries: BOUNDARIES
    });
  }

  if (wantsOfferings) {
    return ok(res, { type: "offerings", offerings: OFFERINGS, boundaries: BOUNDARIES });
  }

  return ok(res, {
    type: "identity",
    identity: IDENTITY,
    available_terms: Object.keys(TERMS),
    boundaries: BOUNDARIES,
    usage: {
      identity: "/api/agent",
      term: "/api/agent?type=term&term=protocol-level-legibility",
      offerings: "/api/agent?type=offerings"
    }
  });
}

function slug(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function matches(key, ask) {
  const words = key.split("-").filter((w) => w.length > 3);
  return words.length > 0 && words.every((w) => ask.includes(w));
}
