// Resolve hook: a relative import with no extension ("../_lib/http") tries
// the same path with ".ts" when the plain path does not exist.

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../');
    if (relative && !/\.[cm]?[jt]s$|\.json$/.test(specifier)) {
      return next(specifier + '.ts', context);
    }
    throw err;
  }
}
