/**
 * Docs pages that are gone, each sent to where its content lives now, or to
 * the docs home when the content went with its product. Recovered from every
 * page this repo ever had (git history and old sitemaps), and from the family
 * sites whose old addresses land here, that answered 404 on 2026-10-20. Exact
 * paths only: a wildcard here would catch live pages.
 * docs.ochk.io/<path> reaches these through the old-host rule, one hop more.
 * The fixture in src/__tests__ writes each one out again.
 */
export const MOVED_PAGES: Readonly<Record<string, string>> = {
    // Retired with fleet and its console (2026-09-04); their docs went with them.
    // fleet.ochk.io/docs/api was fleet's own page; its domain now redirects here.
    '/api': '/',
    '/api-reference/fleet': '/',
    '/console': '/',
    '/console/api': '/',
    '/console/integrations': '/',
    '/console/quickstart': '/',
    '/console/webhooks': '/',
    '/fleet': '/',
    '/fleet/api': '/',
    '/fleet/bond': '/',
    '/fleet/compliance': '/',
    '/fleet/integrations': '/',
    '/fleet/interop': '/',
    '/fleet/quickstart': '/',
    '/fleet/reputation': '/',
    '/fleet/webhooks': '/',
    // @orangecheck/agent-signer's reference moved into agent-core.
    '/sdk/agent-signer/functions/canonicalizeScope': '/sdk/agent-core/functions/canonicalizeScope',
    '/sdk/agent-signer/functions/canonicalizeScopes':
        '/sdk/agent-signer/variables/canonicalizeScopes',
    '/sdk/agent-signer/functions/computeActionId': '/sdk/agent-core/functions/computeActionId',
    '/sdk/agent-signer/functions/computeDelegationId':
        '/sdk/agent-core/functions/computeDelegationId',
    '/sdk/agent-signer/functions/computeRevocationId':
        '/sdk/agent-core/functions/computeRevocationId',
    '/sdk/agent-signer/functions/isSubScope': '/sdk/agent-core/functions/isSubScope',
    '/sdk/agent-signer/functions/parseScope': '/sdk/agent-core/functions/parseScope',
    '/sdk/agent-signer/functions/verifyAction': '/sdk/agent-core/functions/verifyAction',
    '/sdk/agent-signer/functions/verifyDelegation': '/sdk/agent-core/functions/verifyDelegation',
    '/sdk/agent-signer/functions/verifyRevocation': '/sdk/agent-core/functions/verifyRevocation',
    '/sdk/agent-signer/interfaces/ActionEnvelope': '/sdk/agent-core/interfaces/ActionEnvelope',
    '/sdk/agent-signer/interfaces/ActionOts': '/sdk/agent-core/interfaces/ActionOts',
    '/sdk/agent-signer/interfaces/DelegationBond': '/sdk/agent-core/interfaces/DelegationBond',
    '/sdk/agent-signer/interfaces/DelegationEnvelope':
        '/sdk/agent-core/interfaces/DelegationEnvelope',
    '/sdk/agent-signer/interfaces/RevocationEnvelope':
        '/sdk/agent-core/interfaces/RevocationEnvelope',
    '/sdk/agent-signer/interfaces/Scope': '/sdk/agent-core/interfaces/Scope',
    '/sdk/agent-signer/interfaces/ScopeConstraint': '/sdk/agent-core/interfaces/ScopeConstraint',
    '/sdk/agent-signer/type-aliases/AgentErrorCode': '/sdk/agent-core/type-aliases/AgentErrorCode',
    '/sdk/agent-signer/variables/REGISTERED_SCOPES': '/sdk/agent-core/variables/REGISTERED_SCOPES',
    // agent-core: canonicalize is a variable now; hexEncode is no longer exported.
    '/sdk/agent-core/functions/canonicalize': '/sdk/agent-core/variables/canonicalize',
    '/sdk/agent-core/functions/hexEncode': '/sdk/agent-core/README',
    // The adapters' fleet calls left with fleet.
    '/sdk/agent-anthropic/functions/invokeWithStampAndPost': '/sdk/agent-anthropic/README',
    '/sdk/agent-anthropic/functions/postActionToFleet': '/sdk/agent-anthropic/README',
    '/sdk/agent-anthropic/interfaces/FleetClient': '/sdk/agent-anthropic/README',
    '/sdk/agent-anthropic/interfaces/InvokeWithStampAndPostInput': '/sdk/agent-anthropic/README',
    '/sdk/agent-anthropic/interfaces/InvokeWithStampAndPostResult': '/sdk/agent-anthropic/README',
    '/sdk/agent-anthropic/interfaces/PostActionResult': '/sdk/agent-anthropic/README',
    '/sdk/agent-langgraph/functions/postActionToFleet': '/sdk/agent-langgraph/README',
    '/sdk/agent-langgraph/interfaces/FleetClient': '/sdk/agent-langgraph/README',
    '/sdk/agent-langgraph/interfaces/PostActionResult': '/sdk/agent-langgraph/README',
    '/sdk/agent-openai/functions/invokeWithStampAndPost': '/sdk/agent-openai/README',
    '/sdk/agent-openai/functions/postActionToFleet': '/sdk/agent-openai/README',
    '/sdk/agent-openai/interfaces/FleetClient': '/sdk/agent-openai/README',
    '/sdk/agent-openai/interfaces/InvokeWithStampAndPostInput': '/sdk/agent-openai/README',
    '/sdk/agent-openai/interfaces/InvokeWithStampAndPostResult': '/sdk/agent-openai/README',
    '/sdk/agent-openai/interfaces/PostActionResult': '/sdk/agent-openai/README',
    '/sdk/agent-vercel/functions/postActionToFleet': '/sdk/agent-vercel/README',
    '/sdk/agent-vercel/interfaces/FleetClient': '/sdk/agent-vercel/README',
    '/sdk/agent-vercel/interfaces/PostActionResult': '/sdk/agent-vercel/README',
    // Sign-in props and the button moved into auth-client.
    '/sdk/auth-client/interfaces/OcSignInProps': '/sdk/auth-client/type-aliases/OcSignInProps',
    '/sdk/me-client/functions/OcSignInButton': '/sdk/auth-client/functions/OcSignInButton',
    '/sdk/me-client/interfaces/OcSignInButtonProps':
        '/sdk/auth-client/interfaces/OcSignInButtonProps',
    // @orangecheck/react re-exports these types from @orangecheck/sdk, which documents them.
    '/sdk/react/interfaces/AttestationEnvelope': '/sdk/react/type-aliases/AttestationEnvelope',
    '/sdk/react/interfaces/CheckResult': '/sdk/sdk/interfaces/CheckResult',
    '/sdk/react/interfaces/IdentityBinding': '/sdk/sdk/interfaces/IdentityBinding',
    '/sdk/react/interfaces/Metrics': '/sdk/sdk/interfaces/Metrics',
    '/sdk/react/interfaces/VerifyOutcome': '/sdk/sdk/interfaces/VerifyOutcome',
    '/sdk/react/type-aliases/Network': '/sdk/sdk/type-aliases/Network',
    '/sdk/react/type-aliases/Scheme': '/sdk/sdk/type-aliases/Scheme',
    '/sdk/react/type-aliases/ScoringAlgorithm': '/sdk/sdk/type-aliases/ScoringAlgorithm',
};
