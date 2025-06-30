import Stripe from 'stripe';

export class StripeService {
	private stripe: Stripe;

	constructor(secretKey: string) {
		this.stripe = new Stripe(secretKey, {
			apiVersion: '2023-10-16',
			// Configure for Cloudflare Workers environment
			httpClient: Stripe.createFetchHttpClient(),
		});
	}

	// Product Management
	async createProduct(params: {
		name: string;
		description?: string;
		metadata?: Record<string, string>;
	}): Promise<Stripe.Product> {
		return await this.stripe.products.create({
			name: params.name,
			description: params.description,
			type: 'service',
			metadata: params.metadata,
		});
	}

	async updateProduct(productId: string, updates: Partial<Stripe.ProductUpdateParams>): Promise<Stripe.Product> {
		return await this.stripe.products.update(productId, updates);
	}

	async getProduct(productId: string): Promise<Stripe.Product> {
		return await this.stripe.products.retrieve(productId);
	}

	async archiveProduct(productId: string): Promise<Stripe.Product> {
		return await this.stripe.products.update(productId, {
			active: false,
		});
	}

	// Price Management
	async createPrice(params: {
		productId: string;
		unitAmount: number;
		currency?: string;
		interval: 'month' | 'year';
		nickname?: string;
	}): Promise<Stripe.Price> {
		return await this.stripe.prices.create({
			product: params.productId,
			unit_amount: params.unitAmount, // Amount in cents
			currency: params.currency || 'usd',
			recurring: {
				interval: params.interval,
			},
			nickname: params.nickname,
		});
	}

	async getPrice(priceId: string): Promise<Stripe.Price> {
		return await this.stripe.prices.retrieve(priceId);
	}

	async archivePrice(priceId: string): Promise<Stripe.Price> {
		return await this.stripe.prices.update(priceId, {
			active: false,
		});
	}

	async listPricesForProduct(productId: string): Promise<Stripe.Price[]> {
		const prices = await this.stripe.prices.list({
			product: productId,
			active: true,
		});
		return prices.data;
	}

	// Customer Management
	async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<Stripe.Customer> {
		return await this.stripe.customers.create({
			email,
			name,
			metadata,
		});
	}

	async getCustomer(customerId: string): Promise<Stripe.Customer> {
		return await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
	}

	async updateCustomer(customerId: string, updates: Partial<Stripe.CustomerUpdateParams>): Promise<Stripe.Customer> {
		return await this.stripe.customers.update(customerId, updates);
	}

	async findCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
		const customers = await this.stripe.customers.list({
			email,
			limit: 1,
		});
		return customers.data.length > 0 ? customers.data[0] : null;
	}

	// Payment Link Management
	async createPaymentLink(params: {
		priceId: string;
		successUrl: string;
		cancelUrl: string;
		metadata?: Record<string, string>;
	}): Promise<Stripe.PaymentLink> {
		return await this.stripe.paymentLinks.create({
			line_items: [
				{
					price: params.priceId,
					quantity: 1,
				},
			],
			after_completion: {
				type: 'redirect',
				redirect: {
					url: params.successUrl,
				},
			},
			metadata: params.metadata,
		});
	}

	async getPaymentLink(paymentLinkId: string): Promise<Stripe.PaymentLink> {
		return await this.stripe.paymentLinks.retrieve(paymentLinkId);
	}

	// Subscription Management
	async createSubscription(
		customerId: string,
		priceId: string,
		metadata?: Record<string, string>
	): Promise<Stripe.Subscription> {
		return await this.stripe.subscriptions.create({
			customer: customerId,
			items: [
				{
					price: priceId,
				},
			],
			payment_behavior: 'default_incomplete',
			payment_settings: { save_default_payment_method: 'on_subscription' },
			expand: ['latest_invoice.payment_intent'],
			metadata,
		});
	}

	async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
		return await this.stripe.subscriptions.retrieve(subscriptionId);
	}

	async updateSubscription(
		subscriptionId: string,
		updates: Partial<Stripe.SubscriptionUpdateParams>
	): Promise<Stripe.Subscription> {
		return await this.stripe.subscriptions.update(subscriptionId, updates);
	}

	async cancelSubscription(
		subscriptionId: string,
		cancelAtPeriodEnd: boolean = true
	): Promise<Stripe.Subscription> {
		if (cancelAtPeriodEnd) {
			return await this.stripe.subscriptions.update(subscriptionId, {
				cancel_at_period_end: true,
			});
		} else {
			return await this.stripe.subscriptions.cancel(subscriptionId);
		}
	}

	async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
		return await this.stripe.subscriptions.update(subscriptionId, {
			cancel_at_period_end: false,
		});
	}

	// Webhook handling
	async constructWebhookEvent(payload: string, signature: string, endpointSecret: string): Promise<Stripe.Event> {
		return await this.stripe.webhooks.constructEventAsync(payload, signature, endpointSecret);
	}

	// Checkout Session for one-time payments or subscriptions
	async createCheckoutSession(params: {
		priceId: string;
		successUrl: string;
		cancelUrl: string;
		mode?: 'payment' | 'subscription';
		customerId?: string;
		customerEmail?: string;
		metadata?: Record<string, string>;
	}): Promise<Stripe.Checkout.Session> {
		const sessionParams: Stripe.Checkout.SessionCreateParams = {
			mode: params.mode || 'subscription',
			line_items: [
				{
					price: params.priceId,
					quantity: 1,
				},
			],
			success_url: params.successUrl,
			cancel_url: params.cancelUrl,
		};

		if (params.customerId) {
			sessionParams.customer = params.customerId;
		} else if (params.customerEmail) {
			sessionParams.customer_email = params.customerEmail;
		} else {
			sessionParams.customer_creation = 'always';
		}

		if (params.mode === 'subscription' || !params.mode) {
			sessionParams.payment_method_collection = 'always';
			
			// For subscriptions, attach metadata to the subscription itself
			if (params.metadata) {
				sessionParams.subscription_data = {
					metadata: params.metadata
				};
			}
		} else {
			// For one-time payments, attach metadata to the payment intent
			if (params.metadata) {
				sessionParams.payment_intent_data = {
					metadata: params.metadata
				};
			}
		}

		return await this.stripe.checkout.sessions.create(sessionParams);
	}

	async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
		return await this.stripe.checkout.sessions.retrieve(sessionId);
	}

	// Invoice Management
	async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
		return await this.stripe.invoices.retrieve(invoiceId);
	}

	async listCustomerInvoices(customerId: string): Promise<Stripe.Invoice[]> {
		const invoices = await this.stripe.invoices.list({
			customer: customerId,
		});
		return invoices.data;
	}
} 