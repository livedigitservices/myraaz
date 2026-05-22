const STEPS = [
  { step: '01', title: 'Contact Us', desc: 'Email support@myraaz.com within 7 days of delivery with your order number and reason for return.' },
  { step: '02', title: 'Get Approval', desc: 'Our team will review your request and send you a return authorisation within 24 hours.' },
  { step: '03', title: 'Ship It Back', desc: 'Pack the unused product in its original packaging and ship it to the address provided. Return shipping is free for damaged or incorrect items.' },
  { step: '04', title: 'Refund Processed', desc: 'Once we receive and inspect the product, your refund will be credited within 5–7 business days to your original payment method.' },
];

export default function ReturnsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl text-dark font-semibold mb-2">Returns & Refunds</h1>
      <p className="text-muted mb-10">
        We want you to love every myRaaz product. If something isn't right, we'll make it right.
      </p>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-dark mb-4">Return Eligibility</h2>
        <ul className="space-y-2 text-sm text-muted">
          {[
            'Item must be returned within 7 days of delivery.',
            'Product must be unused and in its original sealed packaging.',
            'Items purchased during a sale or with a discount code are eligible for exchange only.',
            'Opened or partially used products are not eligible unless defective.',
          ].map(point => (
            <li key={point} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">✓</span>
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-dark mb-6">How It Works</h2>
        <div className="space-y-6">
          {STEPS.map(({ step, title, desc }) => (
            <div key={step} className="flex gap-5">
              <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{step}</span>
              </div>
              <div>
                <p className="font-semibold text-dark text-sm mb-1">{title}</p>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-soft/30 rounded-2xl p-6 text-sm text-muted">
        Need help with a return?{' '}
        <a href="/contact" className="text-primary font-medium hover:underline">
          Get in touch
        </a>{' '}
        and we'll guide you through the process.
      </div>
    </main>
  );
}