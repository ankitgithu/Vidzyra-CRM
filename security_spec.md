# Security Specification: Vidzyra CRM Firestore Security Rules

## 1. Data Invariants
1. **Admin Authority**: Only authenticated administrators have unconditional management access across all CRM collections (clients, editors, projects, payments, expenses, notifications, activities, revisions, settings, sharedLinks).
2. **Project Ownership & Association**: A project must have a valid non-empty `clientId` and valid `name`. Clients can only read their own projects (`project.clientId == client.id`). Editors can only read projects assigned to them (`project.assignedTo == editor.id`).
3. **Portal Token Isolation**: Shared links and tokens must map strictly to their respective client or editor entity without allowing cross-entity escalation.
4. **Read/Write Least Privilege**: Clients and editors interacting via shared portals or client views can only update permitted workflow fields (such as `clientUploadConfirmed`, `clientDownloadConfirmed`, `editorUploadConfirmed`, `editorDownloadConfirmed`, revision requests, and approvals). They cannot modify financial billings, billing rates, or internal notes arbitrarily.
5. **Collection Integrity**: All records must have an alphanumeric ID within 128 characters (`^[a-zA-Z0-9_\\-]+$`).

## 2. The Dirty Dozen Attack Payloads
1. **Unauthenticated Admin Escalation**: Anonymous or unauthenticated write to `/clients/c1` attempting to alter client records.
2. **Client Project Injection**: A client attempts to create an unassigned project with arbitrary billing rate without admin privileges.
3. **Cross-Tenant Project Access**: Client A attempts to fetch or update projects belonging to Client B.
4. **Editor Financial Tampering**: Editor attempts to update `clientRate` or `totalBilling` on a project.
5. **Rate Hijacking**: An editor attempts to increase their `editorRate` on an assigned project.
6. **Malicious ID Injection**: A payload using a 2KB garbage string as `{clientId}` or `{projectId}` to exhaust database resources.
7. **Ghost Field Poisoning**: An update request inserting unexpected root keys such as `isAdmin: true` into a client document.
8. **Direct Expense Tampering**: An unauthenticated or client actor attempting to delete or insert an expense record into `/expenses`.
9. **Fake Payment Creation**: Client attempts to create a fake `clientPayment` marked as `Paid` with a forged reference number.
10. **Activity Log Deletion**: Any client or editor attempting to truncate or wipe the audit log in `/activities`.
11. **Settings Tampering**: Non-admin attempting to modify payment methods, banking details, or portal welcome text in `/settings/business`.
12. **Shared Link Expiry Bypass**: Modifying `sharedLinks` token parameters to hijack an active session.

## 3. Test Runner & Verification
All twelve dirty payloads must be rejected by Firestore Security Rules with `PERMISSION_DENIED`.
