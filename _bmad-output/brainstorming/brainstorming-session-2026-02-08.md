---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ['131 Quittances 102 12-25 DELBOS DOS SANTOS FIRME.pdf', 'DELBOS - DOS SANTOS FIRME REVISION LOYER 2025.pdf', '131 Appel loyer 102 01-26 DELBOS DOS SANTOS FIRME.pdf']
session_topic: 'Baillr - SaaS de gestion locative immobilière pour bailleurs (SCI et nom propre)'
session_goals: 'Solution web moderne Next.js/NestJS, event sourcing comptable, simplification UX vs solutions existantes, couverture complète du cycle locatif'
selected_approach: 'ai-recommended'
techniques_used: ['Role Playing', 'First Principles Thinking', 'Morphological Analysis']
ideas_generated: 50
session_active: false
workflow_completed: true
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Monsieur
**Date:** 2026-02-08

## Session Overview

**Topic:** Baillr - SaaS de gestion locative immobilière pour bailleurs (SCI et nom propre)
**Goals:** Solution web moderne Next.js/NestJS, event sourcing comptable, simplification UX vs solutions existantes, couverture complète du cycle locatif
**Stack:** Next.js (frontend) + NestJS (backend) + Event Sourcing
**Real-world reference:** SCI SIRIUS WAT (SIRET 538 583 352 00017) - 52 rue de la Résistance, 82000 Montauban

### Context Guidance

_Projet greenfield SaaS - Alternative simplifiée à Emjysoft Gestion Locative. Architecture event-sourcée pour fiabilité comptable. Destiné exclusivement aux bailleurs (pas aux locataires ni aux comptables). Le produit doit remplacer le combo Emjysoft + Excel actuellement utilisé par les gestionnaires._

### Session Setup

_Approche : Recommandations IA - 3 techniques : Role Playing (ancrage terrain) → First Principles Thinking (déconstruction du domaine) → Morphological Analysis (exploration systématique)._

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Baillr - Gestion locative SaaS avec focus sur event sourcing, simplification UX, et couverture complète du cycle locatif

**Techniques utilisées :**

- **Role Playing:** Incarnation du gérant SCI pour comprendre les frustrations réelles avec Emjysoft et le workflow Excel
- **First Principles Thinking:** Déconstruction du domaine métier pour identifier les 23 événements fondamentaux du cycle locatif
- **Morphological Analysis:** Exploration systématique des paramètres (types de baux, charges, comptabilité, alertes) pour garantir la couverture exhaustive

## Technique Execution Results

### Role Playing - Gérant SCI

**Insights terrain :**
- Le logiciel Emjysoft impose un workflow centré sur la donnée (Lot → Bail → Locataire) au lieu d'un workflow centré utilisateur
- Le gérant utilise Emjysoft pour les appels/quittances mais Excel pour les baux, états des lieux et comptabilité
- La comptabilité SCI se résume à un livre de comptes simple : Date, Opération, Banque, Libellé, Débit, Crédit, Détails
- Multi-banques : Banque Postale + BNP + Caisse
- L'expert-comptable reçoit le livre de comptes et fait la déclaration 2072

### First Principles Thinking - Événements fondamentaux

**23 événements identifiés couvrant tout le cycle locatif :**

#### Biens et lots
1. `BienAjouté` - Immeuble/maison entré dans le système
2. `LotCréé` - Appartement défini (pièces, équipements, surface)
3. `ModèleBailAttribué` - Template de bail attaché au lot
4. `ÉtatDesLieuxModèleCréé` - Structure d'état des lieux pour ce lot

#### Cycle locataire
5. `LocataireEnregistré` - Nouveau locataire (nom, coordonnées, type physique/morale)
6. `BailSigné` - Bail généré (template + locataire + IRL T2 N-1 + dépôt + date exigibilité)
7. `ÉtatDesLieuxEntréeFait` - État des lieux d'entrée signé
8. `DépôtGarantieEncaissé` - Encaissement du dépôt (1 mois)

#### Cycle mensuel
9. `AppelLoyerGénéré` - Appel automatique (loyer + charges + options)
10. `AppelLoyerEnvoyé` - Envoi au locataire par email + PDF
11. `LoyerEncaissé` - Paiement reçu (banque + montant)
12. `QuittanceGénérée` - Quittance auto après encaissement complet
13. `QuittanceEnvoyée` - Envoi au locataire
14. `RetardDétecté` - Loyer non reçu à date d'exigibilité
15. `RelanceSimpleEnvoyée` - Email de relance (J+15)
16. `MiseEnDemeureEnvoyée` - Recommandé (J+25)
17. `SignalementImpayéÉmis` - Signalement assurance/avocat/garant (J+35)

#### Cycle annuel
18. `IRLRévisé` - Révision annuelle : loyer × (IRL T2 N / IRL T2 N-1)
19. `RégularisationChargesCalculée` - Charges réelles vs provisions
20. `RelevéCompteurSaisi` - Index compteur eau individuel
21. `BilanGénéré` - Bilan annuel depuis le livre de comptes
22. `ExportComptableGénéré` - Export pour l'expert-comptable

#### Fin de bail
23. `PréavisReçu` → `ÉtatDesLieuxSortieFait` → `DépôtGarantieRestitué` → `BailTerminé`

#### Paiements et comptabilité
24. `PaiementReçu` - Avec gestion partiel/trop-perçu
25. `CréditLocataireCréé` - Trop-perçu reporté
26. `AttestationAssuranceReçue` - Assurance habitation locataire
27. `RelevéBancaireImporté` - Import Excel mensuel

### Morphological Analysis - Matrice système

**Paramètres configurables :**

| Paramètre | Approche SaaS |
|-----------|---------------|
| Multi-tenancy | Chaque client SaaS isolé (données, events, documents) |
| Entités propriétaires | N entités par client (SCI, nom propre, mixte) |
| Types de baux | Templates configurables avec defaults intelligents |
| Types de lots | Libres, créés par l'utilisateur |
| Dates d'exigibilité | Configurables par bail |
| Postes de charges | Configurables par entité/bien |
| Paliers de relance | Configurables (defaults : J+15, J+25, J+35) |
| Documents | Templates personnalisables par entité |
| Comptabilité | Livre de comptes par entité, export configurable |

## Idea Organization and Prioritization

### Thème 1 : Philosophie produit et périmètre

| # | Idée | Insight clé |
|---|------|-------------|
| #11 | Philosophie "Entrées-Sorties, point final" | La simplicité est la raison d'être, pas un compromis |
| #12 | Application mono-utilisateur (le bailleur) | Pas de portail locataire, pas d'accès comptable |
| #28 | SaaS multi-tenant | Produit pour tout gestionnaire locatif en France |
| #29 | Tout est configurable, rien n'est en dur | Convention over Configuration avec defaults intelligents |
| #37 | Périmètre verrouillé | Pas de travaux, assurances immeuble, signature électronique, espace locataire |
| #41 | Le gérant supervise, le logiciel exécute | KPI = temps gagné par le gérant chaque mois |

**Périmètre définitif :**

| IN | OUT |
|----|-----|
| Biens / Lots / Locataires / Baux | Travaux / Réparations |
| Appels de loyer / Quittances | Assurances immeuble |
| Relances (email + recommandé) | États des lieux numérique |
| Révision IRL automatique | Signature électronique |
| Charges + compteurs eau individuels | Espace locataire en ligne |
| Régularisation annuelle charges | Déclaration 2072 |
| Livre de comptes (entrées/sorties) | Import/migration données existantes |
| Import relevé bancaire Excel mensuel | |
| Export livre de comptes pour comptable | |
| Génération PDF + envoi email | |
| Suivi assurance habitation locataire | |

### Thème 2 : Modèle de données et hiérarchie

| # | Idée | Insight clé |
|---|------|-------------|
| #2 | Workflow éclaté Emjysoft+Excel | Le concurrent réel c'est les deux outils combinés |
| #4 | Consolidation totale dans une UX simple | Une seule app pour tout, plus simple qu'Excel |
| #26 | Multi-entité propriétaire | Un user → N entités (SCI + nom propre) |
| #27 | Hiérarchie du modèle | User → Entité → Biens → Lots → Baux → Events |
| #30 | Types ouverts, pas d'enums fermés | Types de baux et lots configurables par l'utilisateur |

**Hiérarchie complète :**

```
Utilisateur (le bailleur/gérant)
  └── Entité Propriétaire (SCI SIRIUS WAT | En nom propre | SCI BETA...)
        ├── Comptes bancaires (Banque Postale, BNP, Caisse...)
        ├── Biens (52 rue de la Résistance, 10 avenue Victor Hugo...)
        │     └── Lots (Apt 102, Apt 302, Parking B12, Cave 3...)
        │           ├── Modèle bail
        │           ├── Modèle état des lieux
        │           ├── Compteur eau individuel (optionnel)
        │           └── Options disponibles (chaudière, parking...)
        └── Locataires
              ├── Type: personne physique | personne morale (société)
              ├── Assurance habitation (attestation + date renouvellement)
              └── Baux (lien Locataire ↔ Lot)
                    ├── Paramètres: loyer, IRL, dépôt, exigibilité, durée
                    ├── Lignes de facturation (loyer + charges + options)
                    ├── Appels / Quittances / Relances
                    └── Compte courant locataire (events débit/crédit)
```

### Thème 3 : Cycle locataire et baux

| # | Idée | Insight clé |
|---|------|-------------|
| #1 | Workflow inversé centré utilisateur | Entrée par le locataire, pas par le lot |
| #3 | Données clés du bail simplifié | Peu de données dynamiques : date, IRL, dépôt, caractéristiques |
| #5 | Templates intelligents pour baux | Le bail est généré, pas saisi |
| #6 | États des lieux adaptatifs par lot | Structure persistante par lot, pré-remplie |
| #16 | Révision IRL automatisable | Formule : loyer × (IRL T2 N / IRL T2 N-1), indice auto INSEE |
| #21 | Échéance configurable par type | Par défaut : 5 (physique), 1er (société), mais configurable |
| #49 | Suivi assurance habitation | Attestation PDF + date renouvellement + alertes |

### Thème 4 : Cycle mensuel - appels, paiements, quittances

| # | Idée | Insight clé |
|---|------|-------------|
| #14 | Structure quittance = lignes variables par lot | Chaque lot a ses propres lignes (parking, chaudière...) |
| #15 | Appel vs Quittance = 2 events distincts | Appel AVANT paiement, quittance APRÈS |
| #17 | IBAN unique par SCI sur tous documents | Configuré une fois au niveau entité, propagé partout |
| #24 | Options facturables ≠ Charges récupérables | Parking/chaudière = fixe, charges = régularisation annuelle |
| #25 | Appels générés le 15 du mois précédent | Batch automatique, date configurable |
| #31 | Import et rapprochement bancaire | Import Excel → matching auto paiement ↔ appel |
| #32 | Envoi email + PDF automatique | Batch d'envoi pour tous les documents |
| #34 | Gestion paiements partiels | Reçu partiel + solde restant, quittance seulement après paiement complet |
| #35 | Gestion trop-perçus | Crédit locataire reporté sur mois suivant |
| #39 | Import mensuel relevé bancaire Excel | Le livre de comptes se construit depuis les relevés |
| #40 | Chaîne 100% automatique | Appel → Import → Matching → Quittance → tout auto |

**Flux mensuel automatisé :**

```
~15 du mois : Appels de loyer générés auto → PDF → envoi email (batch)
~1-5 du mois suivant : Loyers exigibles
Import relevé bancaire (Excel) → Rapprochement auto
  ├── Paiement complet → Quittance générée auto → envoi email
  ├── Paiement partiel → Reçu partiel + solde restant dû
  └── Pas de paiement → Relance auto J+15
Trop-perçu → Crédit reporté sur prochain appel
```

### Thème 5 : Relances et impayés

| # | Idée | Insight clé |
|---|------|-------------|
| #22 | Calendrier de relance 3 paliers | J+15 email, J+25 recommandé AR, J+35 signalement |
| #23 | 6 types de courriers | Locataire (×3), assurance, avocat, garant |
| #33 | Recommandé intégré | AR24/Maileva depuis l'interface |

**Processus de relance :**

```
J+15 (pas de paiement) → RelanceSimpleEnvoyée (email + PDF)
J+25 (toujours impayé) → MiseEnDemeureEnvoyée (recommandé AR)
J+25 + 10 jours ouvrés → SignalementImpayéÉmis
  ├── Courrier à l'assurance loyers impayés
  ├── Courrier à l'avocat
  └── Courrier au garant/caution
```

### Thème 6 : Charges et régularisation

| # | Idée | Insight clé |
|---|------|-------------|
| #18 | Décompte charges annuel configurable | Postes paramétrables par entité |
| #19 | Prorata temporis automatique | Calcul auto basé sur dates d'entrée/sortie |
| #20 | Locataire société = taxe foncière partagée | Flag personne physique/morale modifie le décompte |
| #38 | Compteurs individuels eau | Relevés index → calcul consommation auto |

**Postes de charges récupérables :**
- Électricité parties communes
- Nettoyage et gestion containers poubelle
- Taxe d'enlèvement des ordures ménagères (TEOM)
- Abonnement eau froide
- Distribution eau froide
- Traitement eaux usées
- Organisme public (eau)
- Contrat entretien chaudière
- Taxe foncière (si locataire société)
- Taxe foncière moins TEOM

**Régularisation au 31/12 (ou date de sortie) :**
```
Charges réelles annuelles (saisies par le gérant)
- Provisions mensuelles versées par le locataire (× 12 ou prorata)
= Solde (trop-perçu → remboursement | complément → débit)
```

### Thème 7 : Comptabilité et export

| # | Idée | Insight clé |
|---|------|-------------|
| #7 | Livre de comptes minimaliste | Date, Opération, Banque, Libellé, Débit, Crédit, Détails |
| #9 | Structure multi-comptes | Banque Postale, BNP, Caisse - tag par écriture |
| #10 | Flux simplifié vers déclaration | Export propre pour expert-comptable → déclaration 2072 |

**Structure du livre de comptes :**

| Date | Opération | Banque | Libellé | Débit | Crédit | Détails |
|------|-----------|--------|---------|-------|--------|---------|
| 05/01 | Encaissement loyer | BP | Loyer Apt 102 janv. | | 709,98€ | DOS SANTOS FIRME |
| 10/01 | Charge eau | BP | Facture eau T4 2025 | 234,50€ | | Véolia |
| ... | ... | ... | ... | ... | ... | ... |

### Thème 8 : Architecture event-sourcée

| # | Idée | Insight clé |
|---|------|-------------|
| #8 | Event sourcing = Livre de comptes digital | Le livre de comptes EST un event store par nature |
| #13 | 23+ événements fondamentaux | Tout le cycle locatif en events immuables |
| #36 | Compte courant locataire par events | Solde = projection calculée, jamais stocké |

**Principe fondamental :** L'event sourcing n'est pas un choix technique arbitraire - c'est la traduction exacte de ce qu'est un livre de comptes en comptabilité. Chaque fait locatif est daté, immuable et séquentiel. Les soldes, bilans et décomptes sont des projections calculées depuis les events.

**Exemple compte courant locataire :**
```
AppelLoyerGénéré     → -709,98€
PaiementReçu         → +500,00€
                      ─────────
Solde                = -209,98€ (restant dû)
PaiementReçu         → +209,98€
                      ─────────
Solde                =    0,00€ → QuittanceGénérée automatiquement
```

### Thème 9 : Dashboard et alertes

| # | Idée | Insight clé |
|---|------|-------------|
| #42 | Dashboard "Pouls" | Mosaïque lots vert/orange/rouge/gris + 3 chiffres clés |
| #43 | Fil d'actions "To-do du jour" | Le logiciel pousse les tâches au gérant |
| #44 | Barre de trésorerie mensuelle | Encaissements vs dépenses sur 12 mois |
| #45 | Timeline des échéances | Fins de bail, révisions IRL, régularisations |
| #46 | Alertes proactives email | 8 types d'alertes automatiques |
| #47 | Détection anomalies comportementales | Patterns de paiement inhabituels |
| #48 | Alerte vacance locative | Manque à gagner affiché |
| #50 | Alerte assurance expirée | Suivi automatique attestations |

**Dashboard composé de 4 zones :**
1. **Pouls** - Mosaïque de lots colorée (🟢🟡🔴⚪) + Encaissé/Attendu/Taux
2. **Fil d'actions** - To-do priorisée générée automatiquement avec boutons d'action
3. **Trésorerie** - Graphique barres encaissements vs dépenses sur 12 mois
4. **Timeline** - Échéances à venir (loyers, fins de bail, révisions, régularisations)

**Alertes email au gérant :**

| Alerte | Déclencheur | Urgence |
|--------|-------------|---------|
| Impayé détecté | J+5 après exigibilité | 🔴 Haute |
| Assurance expirée | Date dépassée | 🔴 Haute |
| Paiement partiel reçu | Montant < appelé | 🟡 Moyenne |
| Lot vacant X jours | Pas de bail actif | 🟡 Moyenne |
| Bail expire bientôt | 6/3/1 mois avant fin | 🟡 Moyenne |
| Anomalie paiement | Pattern inhabituel | 🟡 Moyenne |
| Relevé bancaire non importé | Passé le 10 du mois | 🔵 Info |
| Régularisation charges à faire | Janvier | 🔵 Info |
| Révision IRL disponible | Nouvel indice INSEE publié | 🔵 Info |
| Quittances en attente d'envoi | Paiements rapprochés | 🔵 Info |

## Documents de référence analysés

### Quittance de loyer (SCI SIRIUS WAT)

**Apt 102 - DELBOS / DOS SANTOS FIRME :**
- Loyer : 630,00€ → révisé à 636,55€ (janv. 2026)
- Provisions de charges : 64,10€
- Entretien chaudière : 9,33€
- Total : 703,43€ → 709,98€ après révision
- Virement IBAN FR76 1313 5000 8008 0015 7546 674

**Apt 302 - ACCO :**
- Loyer : 848,00€
- Provisions de charges : 90,00€
- Entretien chaudière : 9,33€
- Abonnement parking Roosevelt : 39,00€
- Total : 986,33€

### Révision de loyer
- Formule : 630,00 × (146,68 / 145,17) = 636,55€
- Indice IRL T2 2025 : 146,68 / IRL T2 2024 : 145,17
- Applicable au 1er janvier 2026
- Lettre formelle avec référence à l'article 3.6 du bail

### Avis d'échéance de loyer
- Période : 01/01/2026 au 31/01/2026
- Montant à payer : 709,98€
- Exigible avant le : 05/01/2026
- Mention légale : "ne peut en aucun cas servir de quittance"

## Session Summary and Insights

### Concepts transversaux (breakthroughs)

1. **L'event sourcing EST le métier** - Ce n'est pas un pattern technique imposé, c'est la réalité comptable traduite en code. Le livre de comptes est par nature un event store.
2. **Le concurrent c'est Emjysoft + Excel** - Baillr doit remplacer les deux avec la simplicité d'Excel et la puissance d'un vrai logiciel.
3. **Le gérant supervise, le logiciel exécute** - Automatisation totale avec validation humaine. Le samedi matin, 15 minutes au lieu de 2 heures.

### Key Achievements

- **50 idées** générées couvrant l'intégralité du domaine métier
- **9 thèmes** structurés de la philosophie produit au dashboard
- **27 événements** métier identifiés pour l'architecture event-sourcée
- **Périmètre produit** verrouillé avec IN/OUT clairement définis
- **Flux automatisés** de bout en bout (appels → paiements → quittances → relances)
- **Analyse de documents réels** (quittance, appel de loyer, révision IRL) ancrant le modèle dans la réalité terrain

### Creative Facilitation Narrative

_Session de brainstorming intensive avec Monsieur, portant sur la conception d'un SaaS de gestion locative (Baillr). La session a commencé par un Role Playing incarnant le gérant SCI, révélant que le vrai problème n'est pas un mauvais logiciel mais un workflow éclaté entre deux outils. Le First Principles Thinking a permis d'identifier que l'event sourcing est la traduction naturelle de la comptabilité locative. L'analyse morphologique, enrichie par l'étude de documents réels de la SCI SIRIUS WAT, a systématiquement couvert chaque paramètre du système. Le moment clé fut la décision de construire un SaaS universel plutôt qu'un outil personnel, recadrant l'ambition du projet._

### Platform & Constraints

- **Frontend:** Next.js
- **Backend:** NestJS
- **Architecture:** Event Sourcing (event store par entité propriétaire)
- **Device:** Desktop uniquement
- **Users:** Bailleurs uniquement (pas de portail locataire)
- **Scope:** SaaS multi-tenant pour gestionnaires locatifs en France
