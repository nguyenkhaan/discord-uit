export interface TaxonomySelection {
    collectionSlugs: string[];
    tagSlugs: string[];
}

export function hasTaxonomySelectionChanged(
    current: TaxonomySelection,
    baseline: TaxonomySelection
): boolean {
    return (
        !haveSameValues(current.collectionSlugs, baseline.collectionSlugs) ||
        !haveSameValues(current.tagSlugs, baseline.tagSlugs)
    );
}

function haveSameValues(left: string[], right: string[]): boolean {
    if (left.length !== right.length) return false;

    const rightValues = new Set(right);
    return left.every((value) => rightValues.has(value));
}
