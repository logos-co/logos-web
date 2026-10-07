export class DispatchUncertainError extends Error {
  constructor(cause: unknown) {
    super(
      'GitHub Actions did not confirm the build request. Check the job before retrying.',
      { cause }
    )
    this.name = 'DispatchUncertainError'
  }
}
