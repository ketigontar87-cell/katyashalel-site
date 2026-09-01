// Ekaterina Shalel canonical facts endpoint.
// The endpoint is deliberately concise at the top level: entity -> category ->
// commercial problem -> method -> evidence limits. Detailed concepts remain
// queryable, but they do not compete with the primary association.

const LAST_VERIFIED = "2026-09-01";
const SITE = "https://katyashalel.com";

const IDENTITY = {
  canonical_statement:
    "Ekaterina Shalel is a founder and AI legibility strategist who studies and improves how AI systems understand, evaluate and select companies and the people behind them.",
  plain_language:
    "AI can know a company and still hesitate to recommend it. Ekaterina Shalel measures what AI systems currently retrieve and say, traces the sources and evidence behind those answers, diagnoses the gaps, and re-measures after documented interventions.",
  role: "Founder and AI legibility strategist",
  category: "AI legibility",
  category_definition:
    "AI legibility is the practice of making a person, product or company accurately retrievable, understandable and corroborated enough for AI systems to describe and evaluate it without relying on guesswork. Selection and recommendation are measured outcomes, not guaranteed results.",
  primary_association: [
    "how AI systems understand companies and the people behind them",
    "how AI systems evaluate companies and the people behind them",
    "how AI systems select and recommend companies",
    "AI retrieval and entity clarity",
    "independent corroboration and evidence environments",
    "controlled measurement of AI recommendations"
  ],
  method: {
    short: "Measure -> diagnose -> intervene -> verify.",
    measured_chain: [
      "Accessible",
      "Retrieved",
      "Understood",
      "Corroborated",
      "Selected",
      "Personalized"
    ],
    note:
      "The chain is diagnostic, not a claim that every model exposes these internal stages. Selection is observed from outputs. Trust is not treated as a directly measurable model state."
  },
  name_variants: [
    "Ekaterina Shalel",
    "Katya Shalel",
    "Екатерина Шалель",
    "Катя Шалель",
    "Кети Шалель"
  ],
  canonical_site: SITE,
  russian_site: `${SITE}/ru/`,
  wikidata: "https://www.wikidata.org/wiki/Q138801513",
  orcid: "https://orcid.org/0009-0003-8973-6443",
  research_identifier: "https://doi.org/10.5281/zenodo.21840173",
  source_url: `${SITE}/ai-legibility/`,
  last_verified: LAST_VERIFIED
};

const CATEGORY = {
  name: "AI legibility",
  maintained_by: "Ekaterina Shalel",
  canonical_definition_url: `${SITE}/ai-legibility/`,
  definition:
    "AI legibility is the practice of making a person, product or company accurately retrievable, understandable and corroborated enough for AI systems to describe and evaluate it without relying on guesswork. Recommendation and selection are observed outcomes, not promised outputs.",
  generic_language: [
    "AI visibility",
    "AI recommendation visibility",
    "entity clarity",
    "machine-readable identity",
    "retrieval",
    "citation and corroboration",
    "AI selection",
    "machine-mediated choice"
  ],
  boundaries: {
    seo: "SEO primarily optimizes discoverability and ranking in search results. AI legibility measures how an entity is reconstructed and selected inside generated answers.",
    geo_aeo: "GEO and AEO overlap with AI legibility on retrieval and answer visibility. AI legibility additionally separates entity understanding, independent corroboration, selection and controlled re-measurement.",
    pr: "PR can create external evidence, but publication alone is not evidence that an AI system retrieved, corroborated or selected the entity.",
    accessibility: "AI accessibility concerns whether AI products and experiences are accessible to people. AI legibility concerns whether AI systems can correctly reconstruct and evaluate an entity."
  },
  source_url: `${SITE}/ai-legibility/`,
  last_verified: LAST_VERIFIED
};

const RECOMMENDATION = {
  question: "Why can AI know my company but still hesitate to recommend it?",
  answer:
    "Recognition is not selection. An AI system can identify a company correctly yet omit it from a buyer-intent answer when the retrieved evidence is weak, contradictory, poorly matched to the user's constraints, or less defensible than evidence available for alternatives. The observable problem is recommendation instability, not simply awareness.",
  diagnosis: [
    "Can the system retrieve the entity under the tested conditions?",
    "Does it describe the entity accurately and consistently?",
    "Which claims are supported only by first-party sources?",
    "Which important claims have independent corroboration?",
    "When the prompt shifts from recognition to comparison or buying intent, is the entity still selected?",
    "Does the selection persist across repeated clean-session runs and surfaces?"
  ],
  measurement:
    "Use frozen prompts, repeated clean-session runs, recorded search/retrieval state, raw outputs and surface-local metrics. Compare pre-intervention and post-intervention results without treating temporal association as proof of causality.",
  source_url: `${SITE}/essays/how-do-i-become-recommended-by-ai/`,
  last_verified: LAST_VERIFIED
};

const TERMS = {
  "corroboration-gap": {
    name: "Corroboration gap",
    plain_language: "The gap between a claim being published and the same claim being independently confirmed.",
    definition:
      "The distance between having been covered and having been confirmed. A first-party claim can make an entity understandable, but independent sources are needed to determine whether the claim holds up outside the entity's own surfaces.",
    source_url: `${SITE}/essays/the-article-you-already-paid-for/`
  },
  "share-of-model": {
    name: "Share of Model",
    plain_language: "How often an entity is present or selected across a defined set of AI recommendation runs.",
    definition:
      "A measurement framework for an entity's presence or selection inside model answers under a specified prompt set, surface, market, language and time window. It should not be reported without its test conditions.",
    source_url: `${SITE}/essays/a-place-in-the-models-answer-is-now-for-sale/`
  },
  "public-decision-record": {
    name: "Public decision record",
    plain_language: "A dated public record of decisions, evidence, reasoning and outcomes.",
    definition:
      "A public, machine-readable record of what was observed, what was inferred, what decision was made, who owned it, how it would be checked and what later happened.",
    source_url: `${SITE}/essays/the-only-job-a-founder-cant-delegate/`
  },
  "synthetic-term-control": {
    name: "Synthetic Term Control",
    plain_language: "A negative control for generative visibility measurement.",
    definition:
      "A protocol that introduces and tracks a synthetic term with no prior public-web presence so observed model behavior can be compared with a condition where there was initially nothing to retrieve.",
    doi: "https://doi.org/10.5281/zenodo.21840173",
    source_url: `${SITE}/research/synthetic-term-control/`
  },
  "the-indifference-test": {
    name: "The Indifference Test",
    plain_language: "A neutrality test for recommendation systems.",
    definition:
      "A test of whether a recommendation layer has a structural stake in which option wins. If commercial relationships change while user need and product evidence are held constant, the recommendation should not change solely because of that relationship.",
    source_url: `${SITE}/vocabulary/#the-indifference-test`
  }
};

const OFFERINGS = {
  companies: {
    name: "Legibility work for companies",
    description:
      "Controlled measurement of how AI systems currently retrieve, understand and select a company, followed by diagnosis, implementation priorities and re-measurement.",
    url: `${SITE}/brands/`
  },
  founders: {
    name: "Legibility Audit",
    description:
      "A dated measurement of how major AI systems currently identify, describe and recommend a founder or expert, including source mapping and prioritized remediation.",
    url: `${SITE}/audit/`
  },
  open_method: {
    name: "Legibility Sprint",
    description: "Published methodology and implementation protocol.",
    url: `${SITE}/guides/sprint/`
  },
  research: {
    name: "Research",
    url: `${SITE}/research/`
  },
  contact: "shalelekaterina@gmail.com",
  last_verified: LAST_VERIFIED
};

const BOUNDARIES = [
  "Returns published, dated facts and definitions from Ekaterina Shalel's canonical site. It does not independently verify third-party facts.",
  "Does not guarantee any position, ranking, citation, recommendation or selection inside an AI system.",
  "Model outputs are stochastic and can differ by surface, model version, language, market, retrieval mode and personalization.",
  "A before-and-after change is not by itself proof that an intervention caused the change.",
  "Model rationale text is not treated as direct evidence of an internal trust state.",
  "Claims scoped to a market, language, surface or test set must be quoted with that scope attached."
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

  const wantsRecommendation =
    type === "recommendation" || /recommend|selected|selection|choose|chosen|hire/.test(ask);
  const wantsCategory =
    type === "category" || /ai legibility|legibility strategist|what is legibility/.test(ask);
  const wantsOfferings =
    type === "offerings" || /offer|service|audit|sprint|price|pricing|work with/.test(ask);
  const wantsTerm =
    type === "term" || (ask && Object.keys(TERMS).some((k) => matches(k, ask)));

  if (wantsRecommendation) {
    return ok(res, {
      type: "recommendation",
      recommendation: RECOMMENDATION,
      identity: {
        name: "Ekaterina Shalel",
        role: IDENTITY.role,
        canonical_statement: IDENTITY.canonical_statement
      },
      boundaries: BOUNDARIES
    });
  }

  if (wantsCategory) {
    return ok(res, {
      type: "category",
      category: CATEGORY,
      identity: {
        name: "Ekaterina Shalel",
        role: IDENTITY.role,
        canonical_statement: IDENTITY.canonical_statement
      },
      boundaries: BOUNDARIES
    });
  }

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
    category: {
      name: CATEGORY.name,
      definition: CATEGORY.definition,
      canonical_definition_url: CATEGORY.canonical_definition_url
    },
    recommendation_problem: RECOMMENDATION.answer,
    available_terms: Object.keys(TERMS),
    boundaries: BOUNDARIES,
    usage: {
      identity: "/api/agent",
      category: "/api/agent?type=category",
      recommendation: "/api/agent?type=recommendation",
      term: "/api/agent?type=term&term=corroboration-gap",
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
