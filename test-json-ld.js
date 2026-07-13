const productJsonLd = { name: "</script><script>alert(1)</script>" };
console.log(JSON.stringify(productJsonLd).replace(/</g, '\\u003c'));
