import { resolve, relative, isAbsolute } from 'path'

export function isPathInside(parent: string, child: string): boolean {
  let parentResolved = resolve(parent)
  let childResolved = resolve(child)

  if (process.platform === 'win32') {
    parentResolved = parentResolved.toLowerCase()
    childResolved = childResolved.toLowerCase()
  }

  const rel = relative(parentResolved, childResolved)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}
