// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'CyberSource Demo',
			description: 'Documentation for the CyberSource Payment Integration Demo',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/CyberSource/cybersource-rest-client-java' }],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Architecture', slug: 'getting-started/architecture' },
						{ label: 'Configuration', slug: 'getting-started/configuration' },
					],
				},
				{
					label: 'Payment Flows',
					items: [
						{ label: 'Card Payments', slug: 'flows/card-payments' },
						{ label: 'Digital Wallets', slug: 'flows/digital-wallets' },
						{ label: 'EFT / eCheck', slug: 'flows/eft-echeck' },
						{ label: 'Tokenized Payments', slug: 'flows/tokenized-payments' },
						{ label: 'Invoices', slug: 'flows/invoices' },
						{ label: 'Payment Links', slug: 'flows/payment-links' },
						{ label: 'PayPal (Coming Soon)', slug: 'flows/paypal' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'API Endpoints', slug: 'reference/api-endpoints' },
						{ label: 'Test Data', slug: 'reference/test-data' },
						{ label: 'SDK Class Reference', slug: 'reference/sdk-classes' },
					],
				},
			],
		}),
	],
});
