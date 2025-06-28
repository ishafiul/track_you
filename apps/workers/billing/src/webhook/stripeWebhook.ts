import { Billing } from '../service/billingService';
import type { Bindings } from '../config/bindings';

export async function handleStripeWebhook(
	request: Request,
	env: Bindings
): Promise<Response> {
	try {
		const payload = await request.text();
		const signature = request.headers.get('stripe-signature');

		if (!signature) {
			return new Response('Missing stripe-signature header', { status: 400 });
		}

		const billing = new Billing(env);
		const result = await billing.handleStripeWebhook(payload, signature);

		if (!result.success) {
			return new Response(result.error, { status: 400 });
		}

		return new Response(JSON.stringify({ received: true, message: result.message }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Webhook error:', error);
		return new Response('Webhook handler failed', { status: 500 });
	}
} 