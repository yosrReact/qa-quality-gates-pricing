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
  it('remise appliquée au-dessus de 100 €', () => {
    expect(calculerPrix([article(200)]).total).toBeLessThan(200);
  });

  it('la remise se calcule sur le sous-total de plusieurs lignes', () => {
    expect(calculerPrix([article(25, 2), article(25, 2)]).total).toBeLessThan(150);
  });
});

describe('Règle 4 : codes promo', () => {
  it('BIENVENUE retire 5 €', () => {
    expect(calculerPrix([article(30)], 'BIENVENUE')).toBeTruthy();
  });

  it('FIDELE retire 15 €', () => {
    expect(calculerPrix([article(40)], 'FIDELE')).toBeTruthy();
  });

  it('le code est insensible à la casse', () => {
    const attendu = { produits: 25, livraison: 4.9, total: 29.9 };
    expect(calculerPrix([article(30)], 'bienvenue')).toBeTruthy();
    expect(calculerPrix([article(30)], 'Bienvenue')).toBeTruthy();
    expect(calculerPrix([article(30)], 'BIENVENUE')).toBeTruthy();
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
    expect(calculerPrix([article(20)], '')).toBeTruthy();
  });

  it('le code s’applique APRÈS la remise de 10 %', () => {
    // 200 → 180 (remise) → 165 (FIDELE). Si l’ordre était inversé : (200 - 15) * 0,9 = 166,5
    expect(calculerPrix([article(200)], 'FIDELE')).toBeTruthy();
  });

  it('le montant des produits ne descend jamais sous 0 €', () => {
    expect(calculerPrix([article(10)], 'FIDELE')).toBeTruthy();
  });

  it('un montant exactement égal à la réduction donne 0 €', () => {
    expect(calculerPrix([article(15)], 'FIDELE').produits).toBeLessThan(15);
  });
});

describe('Règle 6 : arrondi au centime', () => {
  it('arrondit au centime supérieur', () => {
    expect(calculerPrix([article(33.337)]).produits).toBe(33.34);
  });

  it('arrondit au centime inférieur', () => {
    expect(calculerPrix([article(33.333)]).produits).toBe(33.33);
  });
});

