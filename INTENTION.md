# Intention : calcul du prix d'une commande

> Format inspiré des pratiques de spécification par l'intention : le pourquoi, le quoi, des exemples, des oracles, le hors périmètre.

## Pourquoi
Les clients abandonnent leur panier quand le prix final les surprend. Le prix affiché doit être juste au centime près et respecter les promesses commerciales (remise, codes promo, livraison gratuite).

## Résultat observable
Pour un panier et un code promo éventuel, on obtient : le montant des produits, les frais de livraison et le total.

## Règles métier
1. Le sous-total est la somme de prix × quantité. Une quantité ≤ 0 est refusée (erreur).
2. Un panier vide est refusé (erreur).
3. Si le sous-total est **supérieur ou égal à 100 €**, une remise de **10 %** s'applique.
4. Codes promo (insensibles à la casse), appliqués **après** la remise de 10 % :
   - `BIENVENUE` : −5 €
   - `FIDELE` : −15 €
   - tout autre code : erreur « Code promo inconnu ».
   Le montant des produits ne descend jamais sous 0 €.
5. Livraison : **gratuite** si le montant des produits (après remise et code promo) est **supérieur ou égal à 50 €**, sinon **4,90 €**.
6. Les montants sont arrondis au centime.

## Exemples (oracles)
| Panier | Code | Produits | Livraison | Total |
|---|---|---|---|---|
| 1 livre à 20 € | aucun | 20 | 4,90 | 24,90 |
| 1 article à 100 € | aucun | 90 | 0 | 90 |
| 1 article à 99,99 € | aucun | 99,99 | 0 | 99,99 |
| 1 article à 30 € | bienvenue | 25 | 4,90 | 29,90 |
| 1 article à 55 € | BIENVENUE | 50 | 0 | 50 |
| 1 article à 54 € | BIENVENUE | 49 | 4,90 | 53,90 |
| 1 article à 200 € | FIDELE | 165 | 0 | 165 |
| 1 article à 10 € | FIDELE | 0 | 4,90 | 4,90 |
| 3 stylos à 2 € | aucun | 6 | 4,90 | 10,90 |

## Hors périmètre
TVA, devises, cumul de plusieurs codes promo, stock.
