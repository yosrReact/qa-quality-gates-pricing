import { calculerPrix } from '/src/pricing.js';

const euros = (n) => n.toFixed(2).replace('.', ',') + ' €';

document.getElementById('panier').addEventListener('submit', (event) => {
  event.preventDefault();
  const erreur = document.getElementById('erreur');
  erreur.textContent = '';
  try {
    const prix = calculerPrix(
      [{ nom: 'Article', prix: Number(document.getElementById('prix').value), quantite: Number(document.getElementById('quantite').value) }],
      document.getElementById('code').value.trim() || undefined,
    );
    document.querySelector('[data-testid="produits"]').textContent = euros(prix.produits);
    document.querySelector('[data-testid="livraison"]').textContent = euros(prix.livraison);
    document.querySelector('[data-testid="total"]').textContent = euros(prix.total);
  } catch (e) {
    erreur.textContent = e.message;
  }
});
