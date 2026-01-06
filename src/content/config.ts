import { z, defineCollection, reference } from "astro:content";

// Every collection must reflect Decap's config.yml collection schema
// In order to be able to optimize images with Astro built-in components, like <Image />, we first must use this image helper 
// Doc: https://docs.astro.build/en/guides/images/#images-in-content-collections

const detailsCollection = defineCollection({
	type: "data",
	schema: () =>
		z.object({
			name: z.string(),
			abbreviation: z.string(),
			email: z.string(),
			phone: z.string(),
			description: z.string(),
			description_seo: z.string(),
			link_website: z.string(),
			link_facebook: z.string(),
			link_instagram: z.string(),
			link_venmo: z.string(),
			band_video: z.string(),
			homepage_title: z.string(),
			homepage_content: z.string(),
			book_title: z.string(),
			book_content: z.string(),
			book_bullets: z.array(z.string()),
			book_sent: z.string(),
			tip_title: z.string(),
			tip_content: z.string(),
			tip_footer: z.string(),
			keywords: z.array(z.string()).optional(),
		}),
});

const showsCollection = defineCollection({
	type: "content",
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			member: z.array(reference("member")),
			startDate: z.string(),
			startTime: z.string(),
			endDate: z.string(),
			endTime: z.string(),
			location: z.string().optional(),
			locationAddress: z.string().optional(),
			tags: z.array(z.string()).optional(),
			image: image().or(z.string()).optional(),
			imageAlt: z.string().optional(),
		}),
});

const membersCollection = defineCollection({
	type: "content",
	schema: ({ image }) =>
		z.object({
			name: z.string(),
			real_name: z.string().optional(),
			adjective: z.string().optional(),
			instrument: z.string().optional(),
			bio: z.string().optional(),
			main: z.boolean(),
			order: z.number(),
			photoColor: z.string().optional(),
			photo: image().or(z.string()).optional(),
		}),
});

export const collections = {
	details: detailsCollection,
	show: showsCollection,
	member: membersCollection,
};