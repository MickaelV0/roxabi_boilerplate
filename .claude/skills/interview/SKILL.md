---
argument-hint: [sujet ou instructions]
description: Interview approfondi pour créer une spec ou analyse détaillée
allowed-tools: AskUserQuestion, Write, Read, Glob
---

# Interview

Interview l'utilisateur en profondeur pour créer un document détaillé (spec ou analyse).

## Instructions

1. **Commence par demander le type de document** via AskUserQuestion:
   - **Spec**: Spécification technique pour un projet/feature à implémenter
   - **Analyse**: Analyse approfondie d'un sujet, concept ou problème

2. **Interview en profondeur** avec AskUserQuestion:
   - Pose des questions NON évidentes et approfondies
   - Couvre tous les aspects: technique, UX, contraintes, compromis, edge cases
   - Continue à poser des questions jusqu'à avoir une vision complète
   - Regroupe 2-4 questions par appel pour être efficace
   - Ne pose pas de questions dont la réponse est évidente

3. **Questions selon le type**:

   Pour une **Spec**:
   - Objectif et problème résolu
   - Utilisateurs cibles et cas d'usage
   - Comportement attendu (happy path + edge cases)
   - Contraintes techniques et dépendances
   - Points d'intégration avec l'existant
   - Compromis acceptables
   - Critères de succès

   Pour une **Analyse**:
   - Contexte et pourquoi ce sujet
   - Ce que tu sais déjà vs ce que tu veux explorer
   - Questions spécifiques à résoudre
   - Contraintes ou biais à considérer
   - Format d'output souhaité
   - Prochaines étapes envisagées

4. **Génère le document** une fois l'interview complète:
   - Spec: `docs/spec/{slug}.md`
   - Analyse: `knowledge/analyses/{slug}.md`
   - Utilise un slug basé sur le sujet (kebab-case)

## Format du document

### Pour une Spec

```markdown
# {Titre}

## Contexte
{Pourquoi ce projet/feature}

## Objectif
{Ce que ça doit accomplir}

## Utilisateurs & Cas d'usage
{Qui et comment}

## Comportement attendu
### Happy path
{Flux principal}

### Edge cases
{Cas limites et comportement}

## Contraintes
- {Contraintes techniques}
- {Contraintes de temps/ressources}

## Non-goals
{Ce qui est explicitement hors scope}

## Décisions techniques
{Choix à faire et compromis}

## Critères de succès
- [ ] {Critère mesurable}

## Questions ouvertes
{Points à clarifier plus tard}
```

### Pour une Analyse

```markdown
# {Titre}

## Contexte
{Pourquoi cette analyse}

## Questions explorées
{Questions principales}

## Analyse
{Corps de l'analyse}

## Conclusions
{Points clés}

## Prochaines étapes
- {Action à prendre}
```

$ARGUMENTS
