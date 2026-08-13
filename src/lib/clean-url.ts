import { isTrackingParameter } from './tracking-parameters';

export type CleanMode = 'tracking' | 'all';

export type CleanUrlResult =
	| {
			ok: true;
			url: string;
			removedParameters: string[];
			removedParameterCount: number;
	  }
	| {
			ok: false;
			code: 'empty' | 'invalid' | 'unsupported-protocol';
			message: string;
	  };

const EXPLICIT_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const HTTP_SCHEME = /^https?:\/\//i;
const HOST_WITH_PORT = /^(?:localhost|\[[^\]]+\]|[^/?#:\s]+):\d+(?:[/?#]|$)/i;

function parseWebUrl(input: string): URL | CleanUrlResult {
	const trimmedInput = input.trim();

	if (!trimmedInput) {
		return {
			ok: false,
			code: 'empty',
			message: 'Paste a link to get started.',
		};
	}

	let candidate = trimmedInput;
	if (trimmedInput.startsWith('//')) {
		candidate = `https:${trimmedInput}`;
	} else if (!HTTP_SCHEME.test(trimmedInput)) {
		if (EXPLICIT_SCHEME.test(trimmedInput) && !HOST_WITH_PORT.test(trimmedInput)) {
			return {
				ok: false,
				code: 'unsupported-protocol',
				message: 'Only HTTP and HTTPS links are supported.',
			};
		}

		candidate = `https://${trimmedInput}`;
	}

	try {
		const url = new URL(candidate);

		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			return {
				ok: false,
				code: 'unsupported-protocol',
				message: 'Only HTTP and HTTPS links are supported.',
			};
		}

		return url;
	} catch {
		return {
			ok: false,
			code: 'invalid',
			message: 'Enter a valid web link.',
		};
	}
}

export function cleanUrl(input: string, mode: CleanMode = 'tracking'): CleanUrlResult {
	const parsedUrl = parseWebUrl(input);
	if (!(parsedUrl instanceof URL)) {
		return parsedUrl;
	}

	const keysToDelete = new Set<string>();
	const removedParameterNames = new Map<string, string>();
	let removedParameterCount = 0;

	for (const [parameterName] of parsedUrl.searchParams) {
		if (mode === 'all' || isTrackingParameter(parameterName)) {
			keysToDelete.add(parameterName);
			removedParameterCount += 1;

			const normalizedName = parameterName.toLowerCase();
			if (!removedParameterNames.has(normalizedName)) {
				removedParameterNames.set(normalizedName, parameterName);
			}
		}
	}

	if (mode === 'all') {
		parsedUrl.search = '';
	} else {
		for (const parameterName of keysToDelete) {
			parsedUrl.searchParams.delete(parameterName);
		}
	}

	return {
		ok: true,
		url: parsedUrl.toString(),
		removedParameters: [...removedParameterNames.values()],
		removedParameterCount,
	};
}
