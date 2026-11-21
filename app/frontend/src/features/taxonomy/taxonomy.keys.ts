export const taxonomyKeys = {
    all: ['taxonomy'] as const,
    adminCollections: (params: object = {}) =>
        [...taxonomyKeys.all, 'admin', 'collections', params] as const,
    adminTags: (params: object = {}) =>
        [...taxonomyKeys.all, 'admin', 'tags', params] as const,
    publicCollections: (params: object = {}) =>
        [...taxonomyKeys.all, 'public', 'collections', params] as const,
    publicCollection: (slug: string) =>
        [...taxonomyKeys.all, 'public', 'collection', slug] as const,
    publicTags: (params: object = {}) =>
        [...taxonomyKeys.all, 'public', 'tags', params] as const,
    publicTag: (slug: string) => [...taxonomyKeys.all, 'public', 'tag', slug] as const,
};
