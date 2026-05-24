# Security Spec for Customer Management

## Data Invariants
1. Customers belong to a specific User (userId).
2. Attribute Definitions belong to a specific User (userId).
3. Users can only read/write their own data.
4. Custom IDs must be validated.
5. Required fields must be present and correctly typed.

## The "Dirty Dozen" Payloads
(Exhaustive list of malicious attempts)

1. **Identity Theft**: Creating a customer with a different `userId`.
2. **Resource Poisoning**: Extremely long strings for names/emails.
3. **Ghost Field**: Adding `isAdmin` or other unexpected fields.
4. **State Shortcutting**: Manually setting `createdAt` to a future date instead of `request.time`.
5. **Cross-User Leak**: Reading another user's customers.
6. **Path Traversal**: Using `../` or junk in document IDs.
7. **Type Confusion**: Sending an array where a string is expected.
8. **Orphaned Write**: Creating an attribute without a valid userId.
9. **Update Gap**: Modifying `userId` on an existing customer.
10. **Resource Exhaustion**: Sending a massive object in `customFields`.
11. **Spoofing**: Sending an unverified email (if we enforced verification).
12. **Bypassing Whitelist**: Updating `createdAt` during an update.

## Test Runner (Draft Concepts)
- `permission_denied` for any write where `userId != request.auth.uid`.
- `permission_denied` for updates to immutable fields like `createdAt`.
- `permission_denied` for missing required fields.
