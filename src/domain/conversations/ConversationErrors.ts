export class IdempotencyConflictError extends Error {
  constructor(
    message: string = 'Idempotency conflict: key was used previously with different payload.'
  ) {
    super(message);
    this.name = 'IdempotencyConflictError';
  }
}

export class TurnInvariantError extends Error {
  constructor(
    message: string = 'Cannot append user message before assistant responds.'
  ) {
    super(message);
    this.name = 'TurnInvariantError';
  }
}

