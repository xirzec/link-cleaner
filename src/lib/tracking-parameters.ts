export const TRACKING_PARAMETER_PREFIXES = [
	'elq',
	'hsa_',
	'mtm_',
	'pk_',
	'trk',
	'utm_',
] as const;

export const TRACKING_PARAMETER_NAMES = [
	'__cft__',
	'__s',
	'__tn__',
	'_ga',
	'_gl',
	'_hsenc',
	'_hsmi',
	'action_object_map',
	'action_ref_map',
	'action_type_map',
	'ad_id',
	'adgroup',
	'adgroup_id',
	'adgroupid',
	'adid',
	'adset_id',
	'adsetid',
	'aff',
	'aff_id',
	'affid',
	'affiliate',
	'affiliate_id',
	'affiliateid',
	'campaign',
	'campaign_id',
	'campaignid',
	'cid',
	'cmpid',
	'dclid',
	'dlsi',
	'epik',
	'fb_action_ids',
	'fb_action_types',
	'fb_ref',
	'fb_source',
	'fbclid',
	'feature',
	'gad_campaignid',
	'gad_source',
	'gbraid',
	'gclid',
	'gclsrc',
	'hsctatracking',
	'icid',
	'ig_rid',
	'igsh',
	'igshid',
	'irclickid',
	'ko_click_id',
	'li_fat_id',
	'li_source',
	'lipi',
	'mc_cid',
	'mc_eid',
	'mibextid',
	'midsig',
	'midtoken',
	'mkt_tok',
	'ml_subscriber',
	'ml_subscriber_hash',
	'msclkid',
	'ocid',
	'oly_anon_id',
	'oly_enc_id',
	'omnisendcontactid',
	'partner',
	'partner_id',
	'partnerid',
	'rb_clickid',
	'rdt_cid',
	'ref',
	'ref_',
	'referrer',
	'refid',
	's_cid',
	'scid',
	'share',
	'share_id',
	'shareid',
	'si',
	'snapcid',
	'source',
	'sp_cid',
	'spm',
	'src',
	'srsltid',
	'tag',
	'trackingid',
	'ttclid',
	'twclid',
	'vero_conv',
	'vero_id',
	'wbraid',
	'wickedid',
	'wt.mc_id',
	'yclid',
] as const;

export const SOCIAL_HOST_TRACKING_PARAMETERS = [
	{
		domains: ['youtu.be'],
		names: ['is'],
	},
	{
		domains: ['tiktok.com'],
		names: [
			'_r',
			'_t',
			'is_copy_url',
			'is_from_webapp',
			'sec_uid',
			'sec_user_id',
			'sender_device',
			'sender_web_id',
			'share_app_id',
			'share_author_id',
			'share_item_id',
			'share_link_id',
			'social_share_type',
			'trackparams',
			'user_id',
			'web_id',
		],
	},
	{
		domains: ['twitter.com', 'x.com'],
		names: ['cxt', 'ref_src', 'ref_url', 'refsrc', 's', 't'],
	},
	{
		domains: ['reddit.com'],
		names: ['entry_point'],
	},
	{
		domains: ['linkedin.com'],
		names: ['courseclaim', 'origin'],
	},
	{
		domains: ['threads.com', 'threads.net'],
		names: ['xmt'],
	},
	{
		domains: ['open.spotify.com'],
		names: ['pi'],
	},
] as const;

const trackingParameterNames = new Set<string>(TRACKING_PARAMETER_NAMES);

function matchesDomain(hostname: string, domain: string): boolean {
	return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function isTrackingParameter(parameterName: string, hostname?: string): boolean {
	const normalizedName = parameterName.toLowerCase();

	return (
		trackingParameterNames.has(normalizedName) ||
		TRACKING_PARAMETER_PREFIXES.some((prefix) => normalizedName.startsWith(prefix)) ||
		Boolean(
			hostname &&
				SOCIAL_HOST_TRACKING_PARAMETERS.some(
					(rule) =>
						rule.names.some((name) => name === normalizedName) &&
						rule.domains.some((domain) => matchesDomain(hostname.toLowerCase(), domain)),
				),
		)
	);
}
