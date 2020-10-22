export function dirName(path: string): string {
  const pathComponents = path.split('/');
  return pathComponents.slice(0, pathComponents.length - 1).join('/');
}

