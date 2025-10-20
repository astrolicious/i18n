type DataEntryConstraint = {
	id: string;
	collection: string;
	data: Record<string, unknown>;
};
type ContentEntryConstraint = DataEntryConstraint & { slug: string };
type EntryConstraint = DataEntryConstraint | ContentEntryConstraint;
type ReferenceConstraint<TEntry extends EntryConstraint> = {
	collection: TEntry["collection"];
} & (TEntry extends ContentEntryConstraint
	? {
			slug: TEntry["slug"];
		}
	: {
			id: TEntry["id"];
		});

type PickKeysByValue<T, ValueType> = {
	[Key in keyof T as T[Key] extends ValueType ? Key : never]: T[Key];
};

const getEntrySlug = (entry: ReferenceConstraint<EntryConstraint>) =>
	"slug" in entry ? entry.slug : entry.id;

export const handleI18nSlug = (slug: string) => {
	const segments = slug.split("/");
	if (segments.length < 2) {
		throw new Error(
			`The slug "${slug}" does not match the correct format "[locale]/[...parts]"`,
		);
	}
	const [locale, ...parts] = segments;

	return {
		locale: locale as string,
		slug: parts.join("/"),
	};
};

export const collectionFilters = {
	byLocale: <TEntry extends EntryConstraint>(
		entry: TEntry,
		{ locale }: { locale: string },
	): boolean => {
		const slug = getEntrySlug(entry);

		return handleI18nSlug(slug).locale === locale;
	},
	matchingEntries: <
		TEntry extends EntryConstraint,
		TKey extends keyof PickKeysByValue<
			TEntry["data"],
			ReferenceConstraint<TEntry> | undefined
		>,
	>(
		entry: TEntry,
		{
			key,
			currentEntry,
			locale,
			defaultLocale,
		}: {
			currentEntry: TEntry;
			key: TKey;
			locale: string;
			defaultLocale: string;
		},
	): boolean => {
		const slug = getEntrySlug(entry);
		const currentEntrySlug = getEntrySlug(currentEntry);
		const reference = entry.data[key] as
			| ReferenceConstraint<TEntry>
			| undefined;

		if (locale === defaultLocale) {
			// Same entry as the current entry
			if (slug === currentEntrySlug) return true;
			// If there's no reference, that means the entry is not linked to the
			// current entry and can be safely ignored
			if (!reference) return false;
			// Wether or not the referenced entry is the current entry
			return getEntrySlug(reference) === currentEntrySlug;
		}

		const currentEntryReference = currentEntry.data[key] as
			| ReferenceConstraint<TEntry>
			| undefined;

		// If the current entry has no reference, it means that is not linked
		// to any other entries so we can ignore it
		if (!currentEntryReference) return false;
		// Same entry as the reference, ie. the default locale entry
		if (slug === getEntrySlug(currentEntryReference)) return true;
		// If there's no reference, that means the entry is not linked to the
		// current entry and can be safely ignored
		if (!reference) return false;
		// Wether or not the referenced entry is the same as the default locale entry
		return getEntrySlug(reference) === getEntrySlug(currentEntryReference);
	},
};
