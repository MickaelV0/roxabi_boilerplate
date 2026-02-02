# Getting Started

Guide de démarrage rapide pour utiliser le Roxabi Boilerplate.

## Prérequis

- [Bun](https://bun.sh/) >= 1.0
- [Git](https://git-scm.com/)
- [GitHub CLI](https://cli.github.com/) (`gh`)
- [Claude Code](https://claude.ai/claude-code) (optionnel mais recommandé)
- PostgreSQL >= 15

## 1. Créer le projet

### Clone le boilerplate

```bash
# Option A: Clone direct (pour contribuer au boilerplate)
git clone https://github.com/MickaelV0/roxabi_boilerplate.git mon-projet
cd mon-projet

# Option B: Use as template (pour un nouveau projet)
gh repo create mon-projet --template MickaelV0/roxabi_boilerplate --private
gh repo clone mon-projet
cd mon-projet
```

### Configurer le remote (si clone direct)

```bash
# Supprimer le remote origin du boilerplate
git remote remove origin

# Créer ton propre repo GitHub
gh repo create mon-projet --private --source=. --push
```

## 2. Configurer GitHub Project

### Créer le projet

```bash
# Créer un projet GitHub pour tracker issues et PRs
gh project create --owner @me --title "Mon Projet"
```

### Activer l'auto-add

1. Aller sur https://github.com/users/TON_USERNAME/projects/N/settings
2. Dans **Workflows** > **Auto-add to project**
3. Activer le workflow
4. Configurer le filtre : `is:issue,pr repo:TON_USERNAME/mon-projet`
5. Sauvegarder

Ou via API :
```bash
# Lister les projets pour trouver l'ID
gh project list --owner @me

# Le workflow auto-add doit être configuré via l'UI GitHub
# car l'API ne supporte pas encore cette fonctionnalité
```

### Configurer les colonnes du projet

Colonnes recommandées :
- **Backlog** - Issues à prioriser
- **Todo** - Prêt à être pris
- **In Progress** - En cours de développement
- **In Review** - PR ouverte, en attente de review
- **Done** - Terminé

### Ajouter les champs custom

Dans les settings du projet, ajouter :

| Champ | Type | Valeurs |
|-------|------|---------|
| Priority | Single select | P1, P2, P3 |
| Size | Single select | XS, S, M, L, XL |
| Sprint | Iteration | 2 semaines |

## 3. Configurer les labels

Les labels sont déjà créés si tu utilises le template. Sinon :

```bash
# Labels de type
gh label create setup --color "0E8A16" --description "Infrastructure & setup"
gh label create feature --color "A2EEEF" --description "New feature"
gh label create bug --color "D73A4A" --description "Bug fix"
gh label create dx --color "1D76DB" --description "Developer Experience"
gh label create docs --color "D4C5F9" --description "Documentation"
gh label create ai --color "FBCA04" --description "AI agents & skills"
gh label create workflow --color "C2E0C6" --description "Workflow & processes"

# Labels de priorité
gh label create P1 --color "B60205" --description "Priority 1 - Critical"
gh label create P2 --color "D93F0B" --description "Priority 2 - Important"
gh label create P3 --color "FBCA04" --description "Priority 3 - Nice to have"

# Labels de taille
gh label create XS --color "E6E6E6" --description "Size: Extra Small"
gh label create S --color "C5DEF5" --description "Size: Small"
gh label create M --color "BFD4F2" --description "Size: Medium"
gh label create L --color "7057FF" --description "Size: Large"
gh label create XL --color "D876E3" --description "Size: Extra Large"
```

## 4. Configurer branch protection

Dans **Settings** > **Branches** > **Add rule** pour `main` :

- [x] Require a pull request before merging
- [x] Require approvals (1)
- [x] Require status checks to pass before merging
  - [x] ci (quand CI configurée)
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

## 5. Installer les dépendances

```bash
# Installer toutes les dépendances du monorepo
bun install
```

## 6. Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer avec tes valeurs
# DATABASE_URL, API keys, etc.
```

## 7. Configurer la base de données

```bash
# Créer la base de données
createdb mon_projet_dev

# Appliquer les migrations (quand configuré)
bun db:migrate
```

## 8. Lancer le projet

```bash
# Lancer tous les apps en mode dev
bun dev

# Ou individuellement
bun --filter @repo/web dev
bun --filter @repo/api dev
```

## 9. Vérifier l'installation

- Frontend: http://localhost:3000
- API: http://localhost:4000
- API Docs (Swagger): http://localhost:4000/docs

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `bun dev` | Lance tous les apps en dev |
| `bun build` | Build tous les packages |
| `bun lint` | Lint avec Biome |
| `bun format` | Format avec Biome |
| `bun typecheck` | Vérification TypeScript |
| `bun test` | Lance tous les tests |
| `bun test:coverage` | Tests avec coverage |

## Prochaines étapes

1. Lire la [Vision](./vision.md) pour comprendre le projet
2. Consulter l'[Architecture](./architecture.md)
3. Voir les [conventions de contribution](./contributing.md)
4. Checker les [issues ouvertes](https://github.com/MickaelV0/roxabi_boilerplate/issues)
