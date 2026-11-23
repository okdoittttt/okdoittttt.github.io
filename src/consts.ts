// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'okdoittttt';
export const SITE_DESCRIPTION = 'okdoittttt의 AI와 생각 기록';

export const CATEGORIES = ['ai', 'thoughts'] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<Category, string> = {
	ai: 'AI',
	thoughts: 'Thoughts',
};
