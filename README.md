# Acme Outfitters — synthetic testing demo store

A small static store that ELU's synthetic testing runs against. ELU agents use it the way a shopper would (browse, search, open products, add to the cart, sign in and check orders) and report what breaks in ELU Issues.

Live site: https://elu-labs.github.io/synthetic-testing-demo/

Faults are introduced on purpose, as ordinary commits to `main`, to check that ELU notices them after the new version deploys. Each deploy stamps the commit SHA into every page (`<meta name="build">`).

Demo account for the signed-in pages: `shopper@acme-demo.test` / `acme-demo-2026`. It only exists in this page's JavaScript; the cart and session live in your browser's localStorage. Nothing here is for sale.
