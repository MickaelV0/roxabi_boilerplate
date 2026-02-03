# CLI pour Agents IA : Analyse Stratégique

## Contexte

Le boilerplate Roxabi vise à fournir un framework SaaS complet avec une équipe IA intégrée. Actuellement, la documentation et l'architecture ne mentionnent pas la possibilité d'offrir une CLI par-dessus les API pour permettre aux agents IA d'interagir avec les services.

Cette analyse explore la pertinence, les bénéfices et les implications d'ajouter cette capacité comme **fonctionnalité core** du boilerplate.

## Questions explorées

1. Pourquoi une CLI plutôt qu'un MCP server ou SDK ?
2. Comment permettre la découverte des API par les agents IA ?
3. Quelle stratégie d'authentification ?
4. Doit-elle être générique (générateur) ou spécifique au boilerplate ?
5. Quels risques et compromis ?

## Analyse

### Pourquoi une CLI pour les agents IA ?

#### Le problème actuel

Les agents IA (Claude Code, Cursor, Copilot, etc.) interagissent avec les API de trois façons :
1. **Directement via HTTP** : nécessite que l'IA connaisse la structure exacte des endpoints, gère l'auth, parse les réponses
2. **Via MCP servers** : puissant mais limité aux outils supportant MCP
3. **Via CLI** : universel, tout agent capable d'exécuter bash peut l'utiliser

#### L'avantage CLI

Une CLI bien conçue résout trois problèmes majeurs :

| Problème | Solution CLI |
|----------|--------------|
| **Découverte** | `cli --help` liste toutes les actions disponibles avec descriptions |
| **Authentification** | Gérée une fois, stockée, réutilisée automatiquement |
| **Mapping intent → API** | Commandes sémantiques (`user create`) vs endpoints techniques (`POST /api/v1/users`) |

#### Pourquoi pas MCP ?

MCP est une excellente technologie, mais une CLI offre :
- **Universalité** : fonctionne avec tout agent IA capable d'exécuter bash
- **Usage dual** : les développeurs humains l'utilisent aussi (tests, debug, scripts)
- **Simplicité de développement** : pas de protocole à implémenter
- **Inspection facile** : on peut voir exactement ce qui est exécuté

### Inspiration : GitHub CLI (gh)

`gh` est le modèle de référence pour une CLI moderne orientée développeur et IA :

```bash
# Human-friendly par défaut
gh pr list
# → affiche un tableau formaté avec couleurs

# JSON pour les IA et scripts
gh pr list --json number,title,author
# → [{"number": 42, "title": "...", "author": {...}}]

# Filtrage avec jq intégré
gh pr list --json number,title -q '.[0].title'
# → "Mon premier PR"
```

**Caractéristiques clés :**
- Output adaptatif (détection TTY)
- Flag `--json` avec sélection de champs
- Commandes hiérarchiques (`gh repo clone`, `gh pr create`)
- Auth persistante (`gh auth login`)
- Autocomplétion shell

### Architecture proposée

#### Génération depuis OpenAPI

L'API NestJS du boilerplate n'a pas encore de documentation OpenAPI/Swagger. La stratégie recommandée :

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  NestJS API     │ --> │  Spec OpenAPI    │ --> │  CLI        │
│  + decorators   │     │  (générée auto)  │     │  (générée)  │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

**Approche hybride (build-time + validation runtime) :**

1. **Build-time** : génère le code TypeScript typé des commandes
   - Types forts, autocomplétion, erreurs à la compilation
   - Intégré au pipeline de build existant

2. **Runtime (optionnel)** : validation de compatibilité
   - Vérifie que la CLI correspond à la version de l'API
   - Avertit si des endpoints ont changé

**Outils recommandés :**
- `@nestjs/swagger` pour générer la spec OpenAPI depuis les controllers
- `openapi-typescript` ou `orval` pour générer les types
- `commander` ou `oclif` pour le framework CLI

### Authentification multi-modes

Pour supporter à la fois les humains et les agents IA :

| Mode | Use case | Implémentation |
|------|----------|----------------|
| Variables d'env | CI/CD, agents IA | `ROXABI_API_KEY`, `ROXABI_TOKEN` |
| Fichier config | Dev local | `~/.roxabi/config.json` |
| Login interactif | Setup initial | `cli auth login` (OAuth flow) |

**Ordre de priorité** : env vars > config file > prompt interactif

### Scope : Générateur + Template

La CLI doit servir deux objectifs :

1. **Template intégré** : le boilerplate inclut une CLI pré-configurée
   - Les utilisateurs ont une CLI fonctionnelle dès le départ
   - Personnalisable selon leurs besoins

2. **Générateur réutilisable** : l'outil de génération est exposé
   - Peut être utilisé sur d'autres projets NestJS
   - Devient un différenciateur du boilerplate

### Cas d'usage des agents IA

#### Automatisation
```bash
# L'agent IA peut exécuter des tâches répétitives
roxabi users list --json | jq '.[] | select(.status == "pending")'
roxabi users bulk-activate --ids 1,2,3
```

#### Développement
```bash
# Test d'un endpoint pendant le dev
roxabi api call POST /users --data '{"name": "test"}'

# Debug d'une erreur
roxabi logs --service api --level error --last 100
```

#### Intégration
```bash
# L'agent construit des workflows
roxabi webhooks create --url "https://..." --events user.created
roxabi integrations list --json
```

### Risques identifiés et mitigations

#### 1. Synchronisation API ↔ CLI

**Risque** : la CLI devient obsolète si l'API évolue sans régénération

**Mitigations** :
- Intégrer la génération dans le pipeline CI/CD
- Validation runtime optionnelle qui avertit des incompatibilités
- Versioning sémantique lié à la version de l'API

#### 2. Sécurité des agents IA

**Risque** : un agent IA pourrait exécuter des commandes destructives

**Mitigations** :
- Permissions granulaires sur les API keys
- Flag `--dry-run` sur les commandes destructives
- Confirmation requise pour les actions critiques (sauf si `--yes`)
- Logging de toutes les actions pour audit

#### 3. Complexité ajoutée au boilerplate

**Risque** : augmente la surface de maintenance

**Mitigations** :
- Génération automatique = peu de code manuel
- Tests générés automatiquement depuis la spec
- Documentation générée depuis la spec

### Comparaison des alternatives

| Approche | Universalité | DX | Effort dev | Maintenance |
|----------|--------------|-----|------------|-------------|
| CLI générée | Excellente | Excellente | Moyen | Faible (auto) |
| MCP Server | Limitée | Bonne | Moyen | Moyen |
| SDK TypeScript | Bonne | Excellente | Élevé | Élevé |
| Rien (HTTP direct) | Excellente | Faible | Nul | Nul |

## Conclusions

### Points clés

1. **Une CLI générée depuis OpenAPI est la solution optimale** pour le boilerplate Roxabi, offrant universalité, bonne DX, et maintenance automatisée.

2. **Le modèle gh (GitHub CLI) est la référence** à suivre : output adaptatif, flag `--json`, commandes hiérarchiques, auth persistante.

3. **L'approche hybride (build-time + validation runtime)** offre le meilleur compromis entre typage fort et flexibilité.

4. **C'est un différenciateur** : peu de boilerplates SaaS offrent une CLI AI-ready out-of-the-box.

5. **Les risques sont gérables** via génération automatique, validation runtime, et bonnes pratiques de sécurité.

### Prérequis

Avant d'implémenter la CLI, il faut :
1. Ajouter `@nestjs/swagger` à l'API et documenter les endpoints
2. Choisir un framework CLI (commander, oclif, ou custom)
3. Choisir un générateur OpenAPI → TypeScript

### Impact sur la vision Roxabi

Cette fonctionnalité s'aligne parfaitement avec la vision "équipe IA intégrée" :
- Les agents IA peuvent interagir avec l'API de manière autonome
- Les développeurs humains bénéficient des mêmes outils
- Le boilerplate devient "AI-native" et pas juste "AI-compatible"

## Prochaines étapes

1. Créer une spec détaillée pour l'implémentation de la CLI
2. Évaluer les frameworks CLI (commander vs oclif vs custom)
3. Prototyper la génération depuis une spec OpenAPI simple
4. Définir la structure des commandes (conventions de nommage)
5. Intégrer dans le pipeline de build existant
