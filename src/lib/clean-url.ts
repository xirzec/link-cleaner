import { isTrackingParameter } from './tracking-parameters';

export type CleanPreset = 'tracking' | 'all';

export interface CleanUrlError {
	ok: false;
	code: 'empty' | 'invalid' | 'unsupported-protocol';
	message: string;
}

export interface QueryParameterGroup {
	name: string;
	normalizedName: string;
	count: number;
	isTracking: boolean;
}

export interface SelectedQueryParameterGroup extends QueryParameterGroup {
	removed: boolean;
}

export interface UrlAnalysis {
	ok: true;
	url: string;
	parameters: QueryParameterGroup[];
	parameterCount: number;
}

export interface CleanUrlSuccess {
	ok: true;
	url: string;
	parameters: SelectedQueryParameterGroup[];
	removedParameters: string[];
	removedParameterCount: number;
	keptParameterCount: number;
}

export type AnalyzeUrlResult = UrlAnalysis | CleanUrlError;
export type CleanUrlResult = CleanUrlSuccess | CleanUrlError;

const EXPLICIT_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const HTTP_SCHEME = /^https?:\/\//i;
const HOST_WITH_PORT = /^(?:localhost|\[[^\]]+\]|[^/?#:\s]+):\d+(?:[/?#]|$)/i;

function parseWebUrl(input: string): URL | CleanUrlError {
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

export function analyzeUrl(input: string): AnalyzeUrlResult {
	const parsedUrl = parseWebUrl(input);
	if (!(parsedUrl instanceof URL)) {
		return parsedUrl;
	}

	const parameterGroups = new Map<string, QueryParameterGroup>();
	let parameterCount = 0;

	for (const [parameterName] of parsedUrl.searchParams) {
		parameterCount += 1;
		const normalizedName = parameterName.toLowerCase();
		const existingGroup = parameterGroups.get(normalizedName);

		if (existingGroup) {
			existingGroup.count += 1;
		} else {
			parameterGroups.set(normalizedName, {
				name: parameterName,
				normalizedName,
				count: 1,
				isTracking: isTrackingParameter(parameterName, parsedUrl.hostname),
			});
		}
	}

	return {
		ok: true,
		url: parsedUrl.toString(),
		parameters: [...parameterGroups.values()],
		parameterCount,
	};
}

export function getPresetSelection(
	parameters: readonly QueryParameterGroup[],
	preset: CleanPreset,
): Set<string> {
	return new Set(
		parameters
			.filter((parameter) => preset === 'all' || parameter.isTracking)
			.map((parameter) => parameter.normalizedName),
	);
}

export function applyParameterSelection(
	analysis: UrlAnalysis,
	removedParameterNames: ReadonlySet<string>,
): CleanUrlSuccess {
	const parsedUrl = new URL(analysis.url);
	const originalEntries = [...parsedUrl.searchParams.entries()];
	let removedParameterCount = 0;

	parsedUrl.search = '';
	for (const [parameterName, parameterValue] of originalEntries) {
		if (removedParameterNames.has(parameterName.toLowerCase())) {
			removedParameterCount += 1;
		} else {
			parsedUrl.searchParams.append(parameterName, parameterValue);
		}
	}

	const parameters = analysis.parameters.map((parameter) => ({
		...parameter,
		removed: removedParameterNames.has(parameter.normalizedName),
	}));

	return {
		ok: true,
		url: parsedUrl.toString(),
		parameters,
		removedParameters: parameters
			.filter((parameter) => parameter.removed)
			.map((parameter) => parameter.name),
		removedParameterCount,
		keptParameterCount: analysis.parameterCount - removedParameterCount,
	};
}

export function cleanUrl(input: string, preset: CleanPreset = 'tracking'): CleanUrlResult {
	const analysis = analyzeUrl(input);
	if (!analysis.ok) {
		return analysis;
	}

	return applyParameterSelection(analysis, getPresetSelection(analysis.parameters, preset));
}
