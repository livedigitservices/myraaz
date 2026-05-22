export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl text-dark font-semibold mb-4">About myRaaz</h1>
      <p className="text-muted leading-relaxed mb-6">
        myRaaz was born from a simple belief — that nature holds the most powerful secrets
        for beauty and wellness. Founded in Hyderabad, we set out to bring time-tested
        herbal traditions into modern, everyday routines.
      </p>
      <p className="text-muted leading-relaxed mb-6">
        Every product we create is thoughtfully formulated with natural ingredients —
        no harsh chemicals, no shortcuts. From our cold-pressed hair oils to our
        botanical shampoos, each formula is crafted to nourish, strengthen, and restore.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {[
          { title: '100% Natural', desc: 'Every ingredient is plant-derived and carefully sourced.' },
          { title: 'No Harmful Chemicals', desc: 'Free from sulphates, parabens, and silicones.' },
          { title: 'Cruelty Free', desc: 'Never tested on animals. Always ethical.' },
        ].map(({ title, desc }) => (
          <div key={title} className="bg-soft/30 rounded-2xl p-6">
            <h3 className="font-semibold text-dark mb-2">{title}</h3>
            <p className="text-sm text-muted leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}