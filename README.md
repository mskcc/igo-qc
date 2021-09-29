# igo-qc

## Description
Site displaying run statistics of sequencing projects (E.g. GATK Picard, Cell Ranger, etc.). 

## Features
* Pulls data from LIMS and ngs-stats to visualize in grid and graphs
* Allows users to reset qc-status of runs

## Dev
### Frontend
```
cd static/seq-qc/
npm install && npm run start
```

### Backend
```
make run-prod
```
