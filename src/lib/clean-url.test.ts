import { describe, expect, it } from 'vitest';
import {
	analyzeUrl,
	applyParameterSelection,
	cleanUrl,
	getPresetSelection,
	type UrlAnalysis,
} from './clean-url';
import { isTrackingParameter } from './tracking-parameters';

describe('cleanUrl', () => {
	it('adds HTTPS to a bare domain and removes known tracking parameters', () => {
		expect(cleanUrl('example.com/article?utm_source=newsletter&id=42#details')).toMatchObject({
			ok: true,
			url: 'https://example.com/article?id=42#details',
			removedParameters: ['utm_source'],
			removedParameterCount: 1,
			keptParameterCount: 1,
		});
	});

	it('preserves an explicit HTTP URL, port, path, repeated functional values, and fragment', () => {
		expect(cleanUrl('http://localhost:8080/search?q=one&q=two#results')).toMatchObject({
			ok: true,
			url: 'http://localhost:8080/search?q=one&q=two#results',
			removedParameters: [],
			removedParameterCount: 0,
			keptParameterCount: 2,
		});
	});

	it('supports bare hosts with ports', () => {
		expect(cleanUrl('localhost:4321/page?gclid=123')).toMatchObject({
			ok: true,
			url: 'https://localhost:4321/page',
			removedParameters: ['gclid'],
			removedParameterCount: 1,
			keptParameterCount: 0,
		});
	});

	it('matches names and prefixes case-insensitively and counts repeated values', () => {
		expect(
			cleanUrl('https://example.com/?UTM_Source=a&utm_source=b&FbClId=c&keep=yes'),
		).toMatchObject({
			ok: true,
			url: 'https://example.com/?keep=yes',
			removedParameters: ['UTM_Source', 'FbClId'],
			removedParameterCount: 3,
			keptParameterCount: 1,
		});
	});

	it('removes broad referral, campaign, affiliate, and share parameters', () => {
		expect(
			cleanUrl(
				'https://example.com/story?ref=friend&source=social&campaign=summer&tag=affiliate&si=share&story=10',
			),
		).toMatchObject({
			ok: true,
			url: 'https://example.com/story?story=10',
			removedParameters: ['ref', 'source', 'campaign', 'tag', 'si'],
			removedParameterCount: 5,
			keptParameterCount: 1,
		});
	});

	it('removes every query parameter in all mode while preserving the fragment', () => {
		expect(
			cleanUrl('https://example.com/path?keep=1&utm_medium=email#section', 'all'),
		).toMatchObject({
			ok: true,
			url: 'https://example.com/path#section',
			removedParameters: ['keep', 'utm_medium'],
			removedParameterCount: 2,
			keptParameterCount: 0,
		});
	});

	it('normalizes a protocol-relative web URL', () => {
		expect(cleanUrl('//example.com/path?msclkid=abc')).toMatchObject({
			ok: true,
			url: 'https://example.com/path',
			removedParameters: ['msclkid'],
			removedParameterCount: 1,
			keptParameterCount: 0,
		});
	});

	it('returns an empty state without treating it as malformed', () => {
		expect(cleanUrl('   ')).toEqual({
			ok: false,
			code: 'empty',
			message: 'Paste a link to get started.',
		});
	});

	it('rejects unsupported URL schemes', () => {
		expect(cleanUrl('javascript:alert(1)')).toEqual({
			ok: false,
			code: 'unsupported-protocol',
			message: 'Only HTTP and HTTPS links are supported.',
		});
	});

	it('rejects malformed web URLs', () => {
		expect(cleanUrl('https://')).toEqual({
			ok: false,
			code: 'invalid',
			message: 'Enter a valid web link.',
		});
	});
});

describe('parameter selection', () => {
	function requireAnalysis(input: string): UrlAnalysis {
		const analysis = analyzeUrl(input);
		if (!analysis.ok) {
			throw new Error(analysis.message);
		}

		return analysis;
	}

	it('groups repeated parameter names case-insensitively', () => {
		const analysis = requireAnalysis(
			'https://example.com/?Filter=one&filter=two&utm_source=newsletter',
		);

		expect(analysis.parameters).toEqual([
			{
				name: 'Filter',
				normalizedName: 'filter',
				count: 2,
				isTracking: false,
			},
			{
				name: 'utm_source',
				normalizedName: 'utm_source',
				count: 1,
				isTracking: true,
			},
		]);
		expect(analysis.parameterCount).toBe(3);
	});

	it('builds recommended and remove-all selections', () => {
		const analysis = requireAnalysis('https://example.com/?page=2&gclid=abc');

		expect([...getPresetSelection(analysis.parameters, 'tracking')]).toEqual(['gclid']);
		expect([...getPresetSelection(analysis.parameters, 'all')]).toEqual(['page', 'gclid']);
	});

	it('restores every repeated value when a grouped key is kept', () => {
		const analysis = requireAnalysis(
			'https://example.com/search?filter=one&utm_source=email&filter=two&page=3#results',
		);
		const selection = getPresetSelection(analysis.parameters, 'all');
		selection.delete('filter');

		expect(applyParameterSelection(analysis, selection)).toMatchObject({
			url: 'https://example.com/search?filter=one&filter=two#results',
			removedParameters: ['utm_source', 'page'],
			removedParameterCount: 2,
			keptParameterCount: 2,
			parameters: [
				{ normalizedName: 'filter', count: 2, removed: false },
				{ normalizedName: 'utm_source', count: 1, removed: true },
				{ normalizedName: 'page', count: 1, removed: true },
			],
		});
	});

	it('supports removing an ordinary parameter while restoring a tracker', () => {
		const analysis = requireAnalysis('https://example.com/?page=2&utm_campaign=spring');
		const selection = new Set(['page']);

		expect(applyParameterSelection(analysis, selection)).toMatchObject({
			url: 'https://example.com/?utm_campaign=spring',
			removedParameters: ['page'],
			removedParameterCount: 1,
			keptParameterCount: 1,
		});
	});
});

describe('isTrackingParameter', () => {
	it.each(['utm_campaign', 'PK_SOURCE', 'hsa_acc', 'elqTrackId', 'trkInfo'])(
		'identifies the %s tracking prefix',
		(parameterName) => {
			expect(isTrackingParameter(parameterName)).toBe(true);
		},
	);

	it('does not classify ordinary functional parameters as tracking', () => {
		expect(isTrackingParameter('article')).toBe(false);
		expect(isTrackingParameter('page')).toBe(false);
		expect(isTrackingParameter('q')).toBe(false);
	});
});
