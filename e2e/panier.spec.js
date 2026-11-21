import { test, expect } from "@playwright/test";
import { PanierPage } from "./pages/PanierPage.js";

test.describe("Panier", () => {
  let panier;

  test.beforeEach(async ({ page }) => {
    panier = new PanierPage(page);
    await panier.ouvrir();
  });

  test.describe("calcul du prix", () => {
    test("affiche le prix d’un petit panier avec livraison", async () => {
      await panier.calculer(20, 1);
      await expect(panier.total).toHaveText("24,90 €");
    });

    test("applique la remise et la livraison gratuite sur un grand panier", async () => {
      await panier.calculer(200, 2);
      await expect(panier.produits).toHaveText("360,00 €");
      await expect(panier.livraison).toHaveText("0,00 €");
      await expect(panier.total).toHaveText("360,00 €");
    });
  });

  test.describe("codes promo", () => {
    test("accepte un code promo saisi en minuscules", async () => {
      await panier.calculer(30, 1, "bienvenue");
      await expect(panier.produits).toHaveText("25,00 €");
      await expect(panier.livraison).toHaveText("4,90 €");
      await expect(panier.total).toHaveText("29,90 €");
    });

    test("affiche une erreur pour un code promo inconnu", async () => {
      await panier.calculer(30, 1, "INCONNU");
      await expect(panier.erreur).toContainText("Code promo inconnu");
    });
  });

  test.describe("erreurs de saisie", () => {
    test("affiche une erreur pour une quantité à 0", async () => {
      await panier.calculer(20, 0);
      await expect(panier.erreur).toContainText("Quantité invalide");
    });
  });
});
