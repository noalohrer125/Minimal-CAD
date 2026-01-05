# Deployment Guide

## Automatisches Deployment via GitHub Actions

### DEV Environment
- **Branch:** `main`
- **Firebase Project:** `minimalcad-dev`
- **Hosting URL:** https://minimalcad-dev.web.app
- **Build Config:** `--configuration=dev`
- **Firebase Config:** Uses `environment.ts` (DEV database)
- **Auto-Deploy:** Pusht du auf `main`, wird automatisch auf DEV deployed

### PROD Environment
- **Branch:** `prod`
- **Firebase Projects:** `minimalcad-1a6dd`
- **Hosting URLs:** 
  - https://minimalcad-1a6dd.web.app
  - https://min-cad.web.app
- **Build Config:** `--configuration=production`
- **Firebase Config:** Uses `environment.prod.ts` (PROD database)
- **Auto-Deploy:** Pusht du auf `prod`, wird automatisch auf PROD deployed

## Manuelles Deployment

### DEV Deployment
```bash
cd Minimal-CAD
ng build --configuration=dev
firebase deploy --only hosting,firestore:rules --project minimalcad-dev
```

### PROD Deployment
```bash
cd Minimal-CAD
ng build --configuration=production
firebase deploy --only hosting,firestore:rules --config firebase.prod.json --project minimalcad-1a6dd
```

## Wichtig

- **Niemals** direkt auf `prod` pushen ohne zu testen!
- Workflow: Entwickle auf `main` → Teste auf DEV → Merge nach `prod` wenn alles funktioniert
- Firestore Rules werden bei jedem Deployment mit deployed
