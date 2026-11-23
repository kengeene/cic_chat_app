const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

export const isUniqueViolation = (error) => error?.code === UNIQUE_CONSTRAINT_VIOLATION;
