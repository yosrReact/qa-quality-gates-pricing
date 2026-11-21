# QA quality gates : de l'intention à la CI

## Objectif

Un code de calcul de prix de commande (`src/pricing.js`), décrit par une **intention** ([INTENTION.md](INTENTION.md)), et des tests unitaires **générés avec Claude** à partir de cette intention.

Ces tests ont déjà été jugés par mutation testing : **score Stryker de 100 %** (démarche détaillée dans le dépôt [mutation-testing-pricing](https://github.com/yosrReact/mutation-testing-pricing)).

Ce dépôt va plus loin : on ajoute des **tests de bout en bout (Playwright)** sur l'appli web, puis une **CI GitHub Actions avec des quality gates** qui bloquent une pull request si la qualité baisse.

## Démarche

1. **Intention** : [INTENTION.md](INTENTION.md) décrit le besoin (pourquoi, règles métier, exemples/oracles, hors périmètre). C'est la référence.
2. **Tests unitaires** : [tests/pricing.test.js](tests/pricing.test.js), générés avec Claude à partir de l'intention, validés par Stryker.
3. **Tests de bout en bout** (à venir) : Playwright sur la page panier.
4. **Quality gates en CI** (à venir) : sur chaque pull request, la CI vérifie :
   - les tests unitaires et un seuil de couverture ;
   - un seuil de score de mutation (Stryker) ;
   - les tests de bout en bout (Playwright).

## Règles métier (résumé)

- Sous-total = Σ prix × quantité. Quantité ≤ 0 ou panier vide : erreur.
- Remise de 10 % si sous-total ≥ 100 €.
- Codes promo (insensibles à la casse), appliqués après la remise : `BIENVENUE` −5 €, `FIDELE` −15 €, autre code : erreur. Produits jamais sous 0 €.
- Livraison gratuite si produits ≥ 50 € (après remise et code), sinon 4,90 €.
- Montants arrondis au centime.

Détail complet dans [INTENTION.md](INTENTION.md).

## Structure

```
src/pricing.js          Code à tester
tests/pricing.test.js   Tests unitaires générés avec Claude
INTENTION.md            Spécification (intention et oracles)
server.js, public/      Petite appli web utilisant le calcul
stryker.config.json     Config mutation testing
vitest.config.js        Config des tests et de la couverture
playwright.config.js    Config des tests e2e
```

## Commandes

```bash
npm install
npm start                  # lance l'appli web (http://localhost:3000)
npm test                   # tests unitaires (Vitest)
npm run test:coverage      # couverture
npm run test:mutation      # mutation testing (Stryker), rapport HTML généré
npm run test:e2e           # tests de bout en bout (Playwright)
```

## À retenir

Quand le code et les tests peuvent être générés, la valeur passe à ce qui les cadre : une intention précise et des **quality gates** qui garantissent la confiance dans ce qui est livré.
