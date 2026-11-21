# QA quality gates : de l'intention à la CI

## Objectif

Un code de calcul de prix de commande (`src/pricing.js`), décrit par une **intention** ([INTENTION.md](INTENTION.md)), et des tests unitaires **générés avec Claude** à partir de cette intention.

Ces tests ont déjà été jugés par mutation testing : **score Stryker de 100 %** (démarche détaillée dans le dépôt [mutation-testing-pricing](https://github.com/yosrReact/mutation-testing-pricing)).

Ce dépôt va plus loin : on ajoute des **tests de bout en bout (Playwright)** sur l'appli web, puis une **CI GitHub Actions avec des quality gates** qui bloquent une pull request si la qualité baisse.

## Démarche

1. **Intention** : [INTENTION.md](INTENTION.md) décrit le besoin (pourquoi, règles métier, exemples/oracles, hors périmètre). C'est la référence.
2. **Tests unitaires** : [tests/pricing.test.js](tests/pricing.test.js), générés avec Claude à partir de l'intention, validés par Stryker.
3. **Tests de bout en bout** : [e2e/panier.spec.js](e2e/panier.spec.js), Playwright sur la page panier, avec un Page Object ([e2e/pages/PanierPage.js](e2e/pages/PanierPage.js)).
4. **Quality gates en CI** : [.github/workflows/quality-gates.yml](.github/workflows/quality-gates.yml). Sur chaque pull request et chaque push sur `main`, 3 jobs indépendants tournent en parallèle :
   - **Gate 1** : tests unitaires et seuil de couverture ;
   - **Gate 2** : seuil de score de mutation (Stryker), rapport publié en artefact ;
   - **Gate 3** : tests de bout en bout (Playwright), rapport et traces publiés en artefact en cas d'échec.

   Des jobs séparés montrent clairement quelle gate bloque une pull request.
5. **Protection de la branche `main`** : un ruleset GitHub rend les **3 gates obligatoires** avant toute fusion, et interdit la suppression de `main` et les push forcés. Tout changement passe donc par une pull request dont les 3 gates sont vertes.

## Démonstration : une pull request bloquée

La [pull request n°1](https://github.com/yosrReact/qa-quality-gates-pricing/pull/1) affaiblit volontairement les tests unitaires : suppression des tests de valeurs limites, du bloc livraison et du tableau des oracles, et remplacement d'assertions précises (`toEqual`) par des assertions vagues (`toBeTruthy`, `toBeLessThan`).

| Gate | Résultat |
|---|---|
| Gate 1 : tests unitaires et couverture | ✅ 23 tests verts, **couverture toujours à 100 %** |
| Gate 2 : score de mutation | ❌ **82,98 %**, sous le seuil de 85 % (8 mutants survivants) |
| Gate 3 : tests de bout en bout | ✅ le code applicatif n'a pas changé |

Résultat : **la fusion est bloquée**. La couverture dit que le code est exécuté, le score de mutation dit qu'il est vraiment vérifié.

Les mutants survivants touchent les limites de remise (100 €) et de livraison gratuite (50 €), le calcul de la remise, le plancher à 0 € et l'ajout des frais de livraison au total : des bugs qui coûteraient de l'argent.

À noter : supprimer les seuls tests de valeurs limites ne suffisait pas à faire baisser le score, car d'autres tests couvraient aussi le cas des 100 €. Une suite de tests bien construite est redondante, donc robuste.

## Seuils des quality gates

| Gate | Seuil | Pourquoi |
|---|---|---|
| Couverture (Vitest) | 80 % (lignes, branches, fonctions, instructions) | Filet minimal. La couverture dit seulement quelles lignes sont exécutées, pas si elles sont vérifiées : la vraie gate de qualité des tests est la mutation. |
| Score de mutation (Stryker) | `break` à 85 % | Bloque les tests complaisants, même quand la couverture reste à 100 %. Pas 100 %, car certains mutants sont **équivalents** : ils modifient le code sans changer son comportement, donc aucun test ne peut les tuer. Un seuil à 100 % pousserait à écrire des tests artificiels juste pour le score. |
| Tests de bout en bout (Playwright) | tous les tests passent | Les parcours critiques de l'utilisateur doivent fonctionner. |

Dans `stryker.config.json`, `high` (90) et `low` (70) ne servent qu'à colorer le rapport ; seul `break` fait échouer la CI.

## Règles métier (résumé)

- Sous-total = Σ prix × quantité. Quantité ≤ 0 ou panier vide : erreur.
- Remise de 10 % si sous-total ≥ 100 €.
- Codes promo (insensibles à la casse), appliqués après la remise : `BIENVENUE` −5 €, `FIDELE` −15 €, autre code : erreur. Produits jamais sous 0 €.
- Livraison gratuite si produits ≥ 50 € (après remise et code), sinon 4,90 €.
- Montants arrondis au centime.

Détail complet dans [INTENTION.md](INTENTION.md).

## Structure

```
src/pricing.js                       Code à tester
INTENTION.md                         Spécification (intention et oracles)
tests/pricing.test.js                Tests unitaires générés avec Claude
e2e/panier.spec.js                   Tests de bout en bout (Playwright)
e2e/pages/PanierPage.js              Page Object de la page panier
server.js, public/                   Petite appli web utilisant le calcul
.github/workflows/quality-gates.yml  CI GitHub Actions (3 quality gates)
stryker.config.json                  Config mutation testing (seuils)
vitest.config.js                     Config des tests et de la couverture (seuils)
playwright.config.js                 Config des tests e2e (rapport HTML, traces)
```

## Commandes

```bash
npm install
npx playwright install chromium   # une seule fois, avant les tests e2e
npm start                  # lance l'appli web (http://localhost:3000)
npm test                   # tests unitaires (Vitest)
npm run test:coverage      # couverture
npm run test:mutation      # mutation testing (Stryker), rapport HTML généré
npm run test:e2e           # tests de bout en bout (Playwright)
npx playwright test --ui   # mode interactif, rejoue chaque étape
```

## Pistes d'amélioration

- **Accélérer la gate 3** : Chromium est réinstallé à chaque exécution de la CI (machine neuve). L'image Docker officielle de Playwright (navigateurs préinstallés) ou un cache des navigateurs ferait gagner du temps.
- **Accélérer la gate 2 sur un gros projet** : Stryker relance les tests pour chaque mutant. Le mode incrémental (`--incremental`) ne teste que le code modifié dans la pull request.
- **Relever les seuils progressivement** : couverture et score de mutation au fil des améliorations, sans viser 100 %.

## À retenir

Quand le code et les tests peuvent être générés, la valeur passe à ce qui les cadre : une intention précise et des **quality gates** qui garantissent la confiance dans ce qui est livré.
