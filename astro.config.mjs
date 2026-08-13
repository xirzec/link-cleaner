// @ts-check
import { defineConfig } from 'astro/config';

const [owner, repository] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
const isGitHubPagesBuild = Boolean(owner && repository);

// https://astro.build/config
export default defineConfig({
	site: isGitHubPagesBuild ? `https://${owner}.github.io` : undefined,
	base: isGitHubPagesBuild ? `/${repository}` : '/',
});
