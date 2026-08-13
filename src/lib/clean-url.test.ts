import { describe, expect, it } from 'vitest';
import { cleanUrl } from './clean-url';
import { isTrackingParameter } from './tracking-parameters';

describe('cleanUrl', () => {
	it('adds HTTPS to a bare domain and removes known tracking parameters', () => {
		expect(cleanUrl('example.com/article?utm_source=newsletter&id=42#details')).toEqual({
			ok: true,
			url: 'https://example.com/article?id=42#details',
			removedParameters: ['utm_source'],
			removedParameterCount: 1,
		});
	});

	it('preserves an explicit HTTP URL, port, path, repeated functional values, and fragment', () => {
		expect(cleanUrl('http://localhost:8080/search?q=one&q=two#results')).toEqual({
			ok: true,
			url: 'http://localhost:8080/search?q=one&q=two#results',
			removedParameters: [],
			removedParameterCount: 0,
		});
	});

	it('supports bare hosts with ports', () => {
		expect(cleanUrl('localhost:4321/page?gclid=123')).toEqual({
			ok: true,
			url: 'https://localhost:4321/page',
			removedParameters: ['gclid'],
			removedParameterCount: 1,
		});
	});

	it('matches names and prefixes case-insensitively and counts repeated values', () => {
		expect(cleanUrl('https://example.com/?UTM_Source=a&utm_source=b&FbClId=c&keep=yes')).toEqual({
			ok: true,
			url: 'https://example.com/?keep=yes',
			removedParameters: ['UTM_Source', 'FbClId'],
			removedParameterCount: 3,
		});
	});

	it('removes broad referral, campaign, affiliate, and share parameters', () => {
		expect(
			cleanUrl(
				'https://example.com/story?ref=friend&source=social&campaign=summer&tag=affiliate&si=share&story=10',
			),
		).toEqual({
			ok: true,
			url: 'https://example.com/story?story=10',
			removedParameters: ['ref', 'source', 'campaign', 'tag', 'si'],
			removedParameterCount: 5,
		});
	});

	it('removes every query parameter in all mode while preserving the fragment', () => {
		expect(cleanUrl('https://example.com/path?keep=1&utm_medium=email#section', 'all')).toEqual({
			ok: true,
			url: 'https://example.com/path#section',
			removedParameters: ['keep', 'utm_medium'],
			removedParameterCount: 2,
		});
	});

	it('normalizes a protocol-relative web URL', () => {
		expect(cleanUrl('//example.com/path?msclkid=abc')).toEqual({
			ok: true,
			url: 'https://example.com/path',
			removedParameters: ['msclkid'],
			removedParameterCount: 1,
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
