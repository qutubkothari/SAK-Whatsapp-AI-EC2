const BusinessInfoHandler = require('../routes/handlers/businessInfoHandler');

async function run() {
  console.log('\n=== BusinessInfo Handler Tests ===\n');

  const cases = [
    {
      name: 'Detect GST PDF',
      message: { message: { document: { url: 'https://example.com/cert.pdf', filename: 'GST_Certificate.pdf', mimeType: 'application/pdf' } } },
      expect: true
    },
    {
      name: 'Detect GST text',
      message: { message: { text: { body: 'My GST is 27AABCU9603R1ZM' } } },
      expect: true
    },
    {
      name: 'Ignore normal text',
      message: { message: { text: { body: 'How much for 8x80' } } },
      expect: false
    }
  ];

  for (const c of cases) {
    const res = BusinessInfoHandler.detectBusinessInfo(c.message);
    console.log(c.name, '-> detected:', res.isBusinessInfo, 'expected:', c.expect);
  }

  console.log('\n=== BusinessInfo Handler Tests End ===\n');
}

run().catch(err => {
  console.error('BusinessInfo tests failed:', err.message || err);
  process.exit(1);
});
