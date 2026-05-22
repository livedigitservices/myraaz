const SECTIONS = [
  {
    title: 'Processing Time',
    content:
      'All orders are processed within 1–2 business days (excluding weekends and public holidays). You will receive an email confirmation once your order has been shipped.',
  },
  {
    title: 'Domestic Shipping (India)',
    content:
      'We offer free standard shipping on all orders above ₹499. Orders below ₹499 carry a flat shipping fee of ₹49. Standard delivery takes 4–7 business days depending on your location. Express delivery (2–3 business days) is available at checkout for ₹99.',
  },
  {
    title: 'Order Tracking',
    content:
      "Once your order is shipped, you will receive a tracking number via email and SMS. You can use this to track your package directly on the courier's website. ",
  },
  {
    title: 'Delays',
    content:
      'Delivery times may be affected by public holidays, extreme weather, or courier delays outside our control. If your order has not arrived within 10 business days, please contact us at support@myraaz.com.',
  },
  {
    title: 'Damaged or Lost Packages',
    content:
      'If your package arrives damaged or is confirmed lost by the courier, please reach out within 48 hours of the expected delivery date. We will arrange a replacement or full refund at no extra cost.',
  },
];

export default function ShippingPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl text-dark font-semibold mb-2">Shipping Policy</h1>
      <p className="text-muted mb-10">Last updated: January 2025</p>

      <div className="space-y-8">
        {SECTIONS.map(({ title, content }) => (
          <section key={title}>
            <h2 className="text-lg font-semibold text-dark mb-2">{title}</h2>
            <p className="text-muted leading-relaxed text-sm">{content}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 bg-soft/30 rounded-2xl p-6 text-sm text-muted">
        Questions about your shipment?{' '}
        <a href="/contact" className="text-primary font-medium hover:underline">
          Contact us
        </a>{' '}
        and we'll sort it out.
      </div>
    </main>
  );
}