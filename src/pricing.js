// Calcul du prix d'une commande.
// Les règles métier sont décrites dans INTENTION.md.

export const SEUIL_REMISE = 100;
export const TAUX_REMISE = 0.1;
export const SEUIL_LIVRAISON_GRATUITE = 50;
export const FRAIS_LIVRAISON = 4.9;
export const CODES_PROMO = { BIENVENUE: 5, FIDELE: 15 };

export function sousTotal(articles) {
  return articles.reduce((total, article) => {
    if (article.quantite <= 0) {
      throw new Error(`Quantité invalide pour ${article.nom}`);
    }
    return total + article.prix * article.quantite;
  }, 0);
}

export function calculerPrix(articles, codePromo) {
  if (!Array.isArray(articles) || articles.length === 0) {
    throw new Error('Le panier est vide');
  }

  let total = sousTotal(articles);

  if (total >= SEUIL_REMISE) {
    total = total - total * TAUX_REMISE;
  }

  if (codePromo) {
    const reduction = CODES_PROMO[codePromo.toUpperCase()];
    if (reduction === undefined) {
      throw new Error('Code promo inconnu');
    }
    total = Math.max(0, total - reduction);
  }

  const livraison = total >= SEUIL_LIVRAISON_GRATUITE ? 0 : FRAIS_LIVRAISON;

  return {
    produits: arrondir(total),
    livraison,
    total: arrondir(total + livraison),
  };
}

function arrondir(montant) {
  return Math.round(montant * 100) / 100;
}
