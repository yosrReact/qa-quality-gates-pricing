export class PanierPage {
  constructor(page) {
    this.page = page;
    this.prix = page.getByLabel("Prix unitaire (€)");
    this.quantite = page.getByLabel("Quantité");
    this.codePromo = page.getByLabel("Code promo");
    this.boutonCalculer = page.getByRole("button", { name: "Calculer" });
    this.produits = page.getByTestId("produits");
    this.livraison = page.getByTestId("livraison");
    this.total = page.getByTestId("total");
    this.erreur = page.getByRole("alert");
  }

  async ouvrir() {
    await this.page.goto("/");
  }

  async calculer(prix, quantite, code) {
    await this.prix.fill(String(prix));
    await this.quantite.fill(String(quantite));
    if (code !== undefined) await this.codePromo.fill(code);
    await this.boutonCalculer.click();
  }
}
