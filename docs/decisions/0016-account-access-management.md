# 0016: Minimal Account and Owner Access Management

Status: Accepted; database migration and account UI deployed, real-account acceptance pending

Date: 2026-09-27

## Context

The owner requested usable account settings and owner permission management alongside the accepted
visual design. Supabase Auth already provides the single identity system for visitors and owners.
Existing database RPCs and RLS protect publishing, moderation, drafts and private media, but there
was no product interface for inspecting accounts or changing their access.

## Decision

1. Keep two roles: visitor and owner. `public.site_owners` records explicit owner membership;
   user-editable Auth metadata cannot grant a role. There is no default administrator password,
   automatic first-registration owner, or separate website identity for provider-console accounts.
2. Bootstrap the first owner only after the person creates and verifies their real website account.
   An authorized operator verifies that person's Auth UUID and explicitly grants membership using
   protected administrative access. Passwords and verification codes remain in the person's secure UI.
3. Add owner-only paginated account inspection and `set_account_access` for role changes and
   application restrictions. `account_status` exposes only the caller's necessary account fields.
   Do not expose Auth password hashes, tokens, or full user records to the browser.
4. Store application restrictions in `private.account_access`. A restricted account may still log in,
   read public content and inspect its own account/messages, but cannot write through application RPCs
   or exercise owner privileges. This is not a Supabase Auth login ban. Existing Auth bans also remove
   effective application privileges and must be lifted in the Auth console before product restoration.
5. Effective owner access requires explicit membership, a verified email, no active Auth ban and no
   application restriction. Check these facts in database permission helpers, including draft reads,
   Storage access and writes; an already-issued JWT does not bypass a later restriction. Previously
   signed media URLs can remain valid until expiry, and downloaded data cannot be recalled.
6. Serialize access mutations with a transaction advisory lock, then recheck the caller. Reject
   self-demotion/self-restriction and changes that would leave no effective owner. Grant ownership
   only to verified, unrestricted, unbanned accounts. These protections cover application RPCs, not
   provider administrators directly changing/deleting Auth users or database rows.
7. Record actual access changes in `private.account_access_events`, including actor, target, before/
   after role and restriction, and timestamp. Retain event identity references after account deletion.
   Both new private tables belong in private business-data backups and isolated restoration checks;
   adding script coverage alone does not prove a durable destination or scheduled backup works.

## Alternatives Considered

- Client-only menu restrictions cannot secure existing sessions or direct API requests.
- A generic role/permission platform adds complexity without a need for more than visitor and owner.
- Treating application restriction as an Auth login ban would misstate the product's actual effect.

## Verification and Release Boundary

The migration `202609270001_accounts.sql` has been applied to production by the lead operator.
At that verification point production had zero real Auth accounts. The account UI is deployed in `766781a`;
real registration, email delivery, first-owner bootstrap,
owner login and independent visitor acceptance remain unproven.

Local Supabase checks passed: 76 account-permission assertions and 186 existing API assertions.
Account coverage includes anonymous/visitor denial, self-protection, concurrent cross-revocation,
unverified/banned identities, existing-session restrictions, private draft/media denial and audit
records. Tests clean their isolated synthetic data and are prohibited against hosted projects.

See [API contract](../operations/API_CONTRACT.md) and [account guide](../operations/ACCOUNT_GUIDE.md).
