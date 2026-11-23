import { type CollectionEntry, getCollection } from 'astro:content';
import type { Category } from '../consts';

export async function getPosts(category?: Category) {
	const posts = await getCollection('blog', ({ data }) => !category || data.category === category);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function getPostUrl(post: CollectionEntry<'blog'>) {
	return `/${post.data.category}/${post.id}/`;
}
