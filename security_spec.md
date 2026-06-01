# Security Specification - CRM Loyalty System

## Data Invariants
1. **Identity Protection**: Users cannot modify their own `role` or `status` once created.
2. **Admin Supremacy**: Only the primary admin (`hungthai84@gmail.com`) can modify system-wide settings like `role_permissions`.
3. **Resource Ownership**: Documents must have a valid `userId` (creator) which cannot be spoofed to another user's UID on creation.
4. **Immutability**: `createdAt` and `userId` fields cannot be modified after document creation.
5. **Type Integrity**: All points and thresholds must be numbers; names and labels must be reasonably sized strings.
6. **Integrity**: `SystemUser` records require an approved status to perform any data-modifying operations.

## The "Dirty Dozen" Payloads

1. **Privilege Escalation**: User tries to update their own `system_users/{userId}` doc to set `role: "Admin"`.
2. **Status Bypass**: Unapproved user tries to create a new `Customer`.
3. **Ghost ID Injection**: Attacker tries to create a document with a 2MB string as an ID.
4. **Identity Spoofing**: User A tries to create a `Customer` with `userId: "UserB_UID"`.
5. **PII Data Scraping**: Unauthenticated user tries to `list` the `customers` collection.
6. **Config Sabotage**: Non-admin user tries to update `settings/role_permissions`.
7. **Timestamp Tampering**: User tries to update a doc and set `updatedAt` to a future date instead of `serverTimestamp`.
8. **Orphaned Record**: User tries to create a `Company` with a `parentId` that doesn't exist (though Firestore doesn't enforce this natively without get(), we check it).
9. **Negative Points**: User tries to create a `Customer` with `points: -1000`.
10. **Role Hijack**: Attacker tries to create a `system_users` record for themselves with `status: "approved"` directly.
11. **Shadow Field**: Attacker tries to add a hidden field `_internal_admin: true` to a customer record.
12. **Bulk Leak**: Attacker tries a `list` query on `system_users` to harvest all emails and roles.

## Red Team Pass/Fail Criteria
- **Pass**: Operation returns `PERMISSION_DENIED`.
- **Fail**: Operation succeeds, allowing unauthorized state/data change.
