# Deployment Guide

## Automatisches Deployment via GitHub Actions

### DEV Environment
- **Branch:** `main`
- **Firebase Project:** `minimalcad-dev`
- **Cloud Run Service:** `minimalcad-stl-step-api-dev` (Region: `europe-west1`)
- **Hosting URLs:** 
  - https://minimalcad-dev.web.app
  - https://mincad-dev.web.app
- **Build Config:** `--configuration=dev`
- **Firebase Config:** Uses `environment.ts` (DEV database)
- **Auto-Deploy:** Pusht du auf `main`, wird automatisch Frontend + Cloud-Run-API auf DEV deployed

### PROD Environment
- **Branch:** `prod`
- **Firebase Projects:** `minimalcad-1a6dd`
- **Cloud Run Service:** `minimalcad-stl-step-api-prod` (Region: `europe-west1`)
- **Hosting URLs:** 
  - https://minimalcad-1a6dd.web.app
  - https://min-cad.web.app
- **Build Config:** `--configuration=production`
- **Firebase Config:** Uses `environment.prod.ts` (PROD database)
- **Auto-Deploy:** Pusht du auf `prod`, wird automatisch Frontend + Cloud-Run-API auf PROD deployed

## Cloud Run API (STL -> STEP)

- API source: `Minimal-CAD/src/app/shared/stl-to-step_api/`
- Container build: via `gcloud builds submit`
- Deploy target:
  - DEV: `minimalcad-stl-step-api-dev` in project `minimalcad-dev`
  - PROD: `minimalcad-stl-step-api-prod` in project `minimalcad-1a6dd`
- Firebase Hosting rewrites route `/uploadStlToServer`, `/convert`, `/download` to the respective Cloud-Run service.
- Frontend uses relative API paths (no `localhost:5000` hardcoding anymore).

### Required GitHub Secrets

- `FIREBASE_TOKEN`
- `GCP_SA_KEY_DEV` (Service Account JSON for project `minimalcad-dev`)
- `GCP_SA_KEY_PROD` (Service Account JSON for project `minimalcad-1a6dd`)

Recommended IAM roles for both service accounts:
- `roles/run.admin`
- `roles/cloudbuild.builds.editor`
- `roles/storage.admin`
- `roles/iam.serviceAccountUser`

## Manuelles Deployment

### DEV Deployment
```bash
cd Minimal-CAD
ng build --configuration=dev
# Optional: API separat deployen
# gcloud builds submit src/app/shared/stl-to-step_api --tag gcr.io/minimalcad-dev/minimalcad-stl-step-api-dev:manual
# gcloud run deploy minimalcad-stl-step-api-dev --image gcr.io/minimalcad-dev/minimalcad-stl-step-api-dev:manual --region europe-west1 --allow-unauthenticated --concurrency 1 --timeout 300 --cpu 2 --memory 2Gi
# Deploy zu beiden Dev-URLs:
firebase deploy --only hosting,firestore:rules --project minimalcad-dev
# Oder nur zu einer spezifischen Site:
# firebase deploy --only hosting:minimalcad-dev --project minimalcad-dev
# firebase deploy --only hosting:mincad-dev --project minimalcad-dev
```

### PROD Deployment
```bash
cd Minimal-CAD
ng build --configuration=production
# Optional: API separat deployen
# gcloud builds submit src/app/shared/stl-to-step_api --tag gcr.io/minimalcad-1a6dd/minimalcad-stl-step-api-prod:manual
# gcloud run deploy minimalcad-stl-step-api-prod --image gcr.io/minimalcad-1a6dd/minimalcad-stl-step-api-prod:manual --region europe-west1 --allow-unauthenticated --concurrency 1 --timeout 300 --cpu 2 --memory 2Gi
firebase deploy --only hosting,firestore:rules --config firebase.prod.json --project minimalcad-1a6dd
```

## Wichtig

- **Niemals** direkt auf `prod` pushen ohne zu testen!
- Workflow: Entwickle auf `main` → Teste auf DEV → Merge nach `prod` wenn alles funktioniert
- Firestore Rules werden bei jedem Deployment mit deployed
