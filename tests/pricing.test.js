// Tests alignés sur INTENTION.md : chaque règle métier et chaque exemple (oracle)
// est vérifié avec des valeurs exactes et les cas limites, pour tuer les mutants Stryker.

import { describe, it, expect } from 'vitest';
import {
  calculerPrix,
  sousTotal,
  SEUIL_REMISE,
  TAUX_REMISE,
  SEUIL_LIVRAISON_GRATUITE,
  FRAIS_LIVRAISON,
  CODES_PROMO,
} from '../src/pricing.js';

const article = (prix, quantite = 1, nom = 'Article') => ({ nom, prix, quantite });

describe('Règle 1 : sous-total', () => {
  it('somme prix × quantité sur plusieurs lignes', () => {
    expect(sousTotal([article(2, 3), article(5, 2)])).toBe(16);
  });

  it('retourne 0 pour une liste vide', () => {
    expect(sousTotal([])).toBe(0);
  });

  it('refuse une quantité égale à 0, avec le nom de l’article', () => {
    expect(() => sousTotal([article(2, 0, 'Stylo')])).toThrow('Quantité invalide pour Stylo');
  });

  it('refuse une quantité négative', () => {
    expect(() => sousTotal([article(2, -1, 'Stylo')])).toThrow('Quantité invalide pour Stylo');
  });

  it('accepte une quantité de 1 (limite)', () => {
    expect(sousTotal([article(7, 1)])).toBe(7);
  });

  it('refuse une quantité invalide dans calculerPrix', () => {
    expect(() => calculerPrix([article(20, 0, 'Livre')])).toThrow('Quantité invalide pour Livre');
  });
});

describe('Règle 2 : panier vide', () => {
  it('refuse un tableau vide', () => {
    expect(() => calculerPrix([])).toThrow('Le panier est vide');
  });

  it('refuse un panier non défini', () => {
    expect(() => calculerPrix(undefined)).toThrow('Le panier est vide');
  });

  it('refuse un panier qui n’est pas un tableau', () => {
    expect(() => calculerPrix({ length: 1 })).toThrow('Le panier est vide');
  });
});

describe('Règle 3 : remise de 10 % dès 100 €', () => {
  it('pas de remise à 99,99 €', () => {
    expect(calculerPrix([article(99.99)])).toEqual({ produits: 99.99, livraison: 0, total: 99.99 });
  });

  it('remise appliquée à exactement 100 €', () => {
    expect(calculerPrix([article(100)])).toEqual({ produits: 90, livraison: 0, total: 90 });
  });

  it('remise appliquée au-dessus de 100 €', () => {
    expect(calculerPrix([article(200)])).toEqual({ produits: 180, livraison: 0, total: 180 });
  });

  it('la remise se calcule sur le sous-total de plusieurs lignes', () => {
    expect(calculerPrix([article(25, 2), article(25, 2)])).toEqual({
      produits: 90,
      livraison: 0,
      total: 90,
    });
  });
});

describe('Règle 4 : codes promo', () => {
  it('BIENVENUE retire 5 €', () => {
    expect(calculerPrix([article(30)], 'BIENVENUE')).toEqual({
      produits: 25,
      livraison: 4.9,
      total: 29.9,
    });
  });

  it('FIDELE retire 15 €', () => {
    expect(calculerPrix([article(40)], 'FIDELE')).toEqual({
      produits: 25,
      livraison: 4.9,
      total: 29.9,
    });
  });

  it('le code est insensible à la casse', () => {
    const attendu = { produits: 25, livraison: 4.9, total: 29.9 };
    expect(calculerPrix([article(30)], 'bienvenue')).toEqual(attendu);
    expect(calculerPrix([article(30)], 'Bienvenue')).toEqual(attendu);
    expect(calculerPrix([article(30)], 'BIENVENUE')).toEqual(attendu);
  });

  it('refuse un code inconnu avec le bon message', () => {
    expect(() => calculerPrix([article(30)], 'FAUX')).toThrow('Code promo inconnu');
  });

  it('refuse un code inconnu même sur un gros panier', () => {
    expect(() => calculerPrix([article(500)], 'NOEL')).toThrow('Code promo inconnu');
  });

  it('n’hérite pas des propriétés de Object (ex. constructor)', () => {
    expect(() => calculerPrix([article(30)], 'constructor')).toThrow('Code promo inconnu');
  });

  it('un code vide est ignoré', () => {
    expect(calculerPrix([article(20)], '')).toEqual({ produits: 20, livraison: 4.9, total: 24.9 });
  });

  it('le code s’applique APRÈS la remise de 10 %', () => {
    // 200 → 180 (remise) → 165 (FIDELE). Si l’ordre était inversé : (200 - 15) * 0,9 = 166,5
    expect(calculerPrix([article(200)], 'FIDELE')).toEqual({
      produits: 165,
      livraison: 0,
      total: 165,
    });
  });

  it('le montant des produits ne descend jamais sous 0 €', () => {
    expect(calculerPrix([article(10)], 'FIDELE')).toEqual({
      produits: 0,
      livraison: 4.9,
      total: 4.9,
    });
  });

  it('un montant exactement égal à la réduction donne 0 €', () => {
    expect(calculerPrix([article(15)], 'FIDELE').produits).toBe(0);
  });
});

describe('Règle 5 : livraison', () => {
  it('payante (4,90 €) pour une petite commande', () => {
    expect(calculerPrix([article(20)])).toEqual({ produits: 20, livraison: 4.9, total: 24.9 });
  });

  it('payante juste sous 50 € (49 €)', () => {
    expect(calculerPrix([article(54)], 'BIENVENUE')).toEqual({
      produits: 49,
      livraison: 4.9,
      total: 53.9,
    });
  });

  it('payante à 49,99 €', () => {
    expect(calculerPrix([article(49.99)])).toEqual({ produits: 49.99, livraison: 4.9, total: 54.89 });
  });

  it('gratuite à exactement 50 €', () => {
    expect(calculerPrix([article(55)], 'BIENVENUE')).toEqual({
      produits: 50,
      livraison: 0,
      total: 50,
    });
  });

  it('gratuite à 50 € sans code promo', () => {
    expect(calculerPrix([article(50)])).toEqual({ produits: 50, livraison: 0, total: 50 });
  });

  it('le seuil se juge après remise et code promo, pas sur le sous-total', () => {
    // sous-total 60 € (≥ 50) mais 55 € après BIENVENUE... reste gratuit ; avec FIDELE : 45 € → payant
    expect(calculerPrix([article(60)], 'FIDELE')).toEqual({
      produits: 45,
      livraison: 4.9,
      total: 49.9,
    });
  });

  it('le seuil se juge après la remise de 10 %', () => {
    // 105 € → 94,5 € après remise (≥ 50) : gratuit
    expect(calculerPrix([article(105)]).livraison).toBe(0);
  });
});

describe('Règle 6 : arrondi au centime', () => {
  it('arrondit au centime supérieur', () => {
    expect(calculerPrix([article(33.337)])).toEqual({ produits: 33.34, livraison: 4.9, total: 38.24 });
  });

  it('arrondit au centime inférieur', () => {
    expect(calculerPrix([article(33.333)])).toEqual({ produits: 33.33, livraison: 4.9, total: 38.23 });
  });
});

describe('Exemples de l’intention (oracles)', () => {
  const cas = [
    ['1 livre à 20 €', [article(20)], undefined, { produits: 20, livraison: 4.9, total: 24.9 }],
    ['1 article à 100 €', [article(100)], undefined, { produits: 90, livraison: 0, total: 90 }],
    ['1 article à 99,99 €', [article(99.99)], undefined, { produits: 99.99, livraison: 0, total: 99.99 }],
    ['1 article à 30 € + bienvenue', [article(30)], 'bienvenue', { produits: 25, livraison: 4.9, total: 29.9 }],
    ['1 article à 55 € + BIENVENUE', [article(55)], 'BIENVENUE', { produits: 50, livraison: 0, total: 50 }],
    ['1 article à 54 € + BIENVENUE', [article(54)], 'BIENVENUE', { produits: 49, livraison: 4.9, total: 53.9 }],
    ['1 article à 200 € + FIDELE', [article(200)], 'FIDELE', { produits: 165, livraison: 0, total: 165 }],
    ['1 article à 10 € + FIDELE', [article(10)], 'FIDELE', { produits: 0, livraison: 4.9, total: 4.9 }],
    ['3 stylos à 2 €', [article(2, 3, 'Stylo')], undefined, { produits: 6, livraison: 4.9, total: 10.9 }],
  ];

  it.each(cas)('%s', (_nom, panier, code, attendu) => {
    expect(calculerPrix(panier, code)).toEqual(attendu);
  });
});

describe('Constantes métier', () => {
  it('correspondent à l’intention', () => {
    expect(SEUIL_REMISE).toBe(100);
    expect(TAUX_REMISE).toBe(0.1);
    expect(SEUIL_LIVRAISON_GRATUITE).toBe(50);
    expect(FRAIS_LIVRAISON).toBe(4.9);
    expect(CODES_PROMO).toEqual({ BIENVENUE: 5, FIDELE: 15 });
  });
});
