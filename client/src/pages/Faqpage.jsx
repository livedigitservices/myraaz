import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const FAQS = [
  {
    category: 'Orders',
    items: [
      { q: 'How do I track my order?', a: 'Once your order is shipped, you will receive a tracking link via email and SMS. You can also contact us at support@myraaz.com with your order number.' },
      { q: 'Can I modify or cancel my order after placing it?', a: 'Orders can be modified or cancelled within 2 hours of placement. After that, they enter processing and cannot be changed. Please contact us immediately if you need to make changes.' },
      { q: 'Do you offer Cash on Delivery (COD)?', a: 'Yes, COD is available for orders up to ₹2,000 across most pin codes in India.' },
    ],
  },
  {
    category: 'Products',
    items: [
      { q: 'Are your products suitable for all hair types?', a: 'Yes! Our range is formulated for all hair types — straight, wavy, curly, and coily. Each product page mentions which hair types benefit the most.' },
      { q: 'Are myRaaz products free from sulphates and parabens?', a: 'Absolutely. All our products are free from sulphates, parabens, silicones, and artificial fragrances.' },
      { q: 'Do you use any animal-derived ingredients?', a: 'We are proud to be a cruelty-free brand. We do not test on animals and avoid animal-derived ingredients wherever possible.' },
    ],
  },
  {
    category: 'Returns & Refunds',
    items: [
      { q: 'What is your return policy?', a: 'We accept returns within 7 days of delivery for unused, sealed products. Visit our Returns page for full details.' },
      { q: 'How long does a refund take?', a: 'Refunds are processed within 5–7 business days after we receive and inspect the returned product.' },
    ],
  },
];

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-soft last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-dark">{q}</span>
        <FiChevronDown
          size={16}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="text-sm text-muted leading-relaxed pb-4 pr-6">{a}</p>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl text-dark font-semibold mb-2">
        Frequently Asked Questions
      </h1>
      <p className="text-muted mb-12">
        Can't find what you're looking for?{' '}
        <a href="/contact" className="text-primary font-medium hover:underline">
          Contact us
        </a>{' '}
        — we're happy to help.
      </p>

      <div className="space-y-10">
        {FAQS.map(({ category, items }) => (
          <section key={category}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
              {category}
            </h2>
            <div className="border border-soft rounded-2xl px-5 divide-y divide-soft">
              {items.map(item => (
                <AccordionItem key={item.q} {...item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}