/** The only user shape that leaves the server: never includes passwordHash. */
export const toPublicUser = ({ id, email, displayName, lastSeenAt }) => ({ id, email, displayName, lastSeenAt });
