import fs from 'fs';
import path from 'path';

const HELP_DOC_SOURCES = [
  {
    id: 'dashboard-readme',
    title: 'Dashboard README',
    relativePath: 'README.md',
    pathSegments: ['README.md'],
  },
  {
    id: 'bot-readme',
    title: 'Bot README',
    relativePath: 'bot/README.md',
    pathSegments: ['bot', 'README.md'],
  },
];

export function readHelpDocs(rootDir) {
  return HELP_DOC_SOURCES.map((source) => {
    const absolutePath = path.resolve(rootDir, ...source.pathSegments);

    try {
      const stats = fs.statSync(absolutePath);
      return {
        id: source.id,
        title: source.title,
        relativePath: source.relativePath,
        updatedAt: stats.mtime.toISOString(),
        available: true,
        content: fs.readFileSync(absolutePath, 'utf-8'),
      };
    } catch (error) {
      return {
        id: source.id,
        title: source.title,
        relativePath: source.relativePath,
        updatedAt: null,
        available: false,
        content: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

