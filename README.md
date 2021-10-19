# igo-qc

## Description
Site displaying run statistics of sequencing projects (E.g. GATK Picard, Cell Ranger, etc.). 

## Features
* Pulls data from LIMS and ngs-stats to visualize in grid and graphs
* Allows users to reset qc-status of runs

## Dev
After setting up `Frontend`, `Backend`, & `Mongo`, the igo-qc app should be available at `localhost:3000`

### Frontend
```
cd static/seq-qc/
npm install && npm run start
```

### Backend
1. Update `lims_user_config_prod` with what is available on dev/prod
  * `username`
  * `password`
  * `secret_key` 
* See `/srv/www/new-igo-qc/app/lims_user_config`

2. Install Dependencies
```
# pip install virtualenv	# If not already installed
$ virtualenv venv
$ source venv/bin/activate
(venv) $ pip install -r requirements.txt
(venv) $ make run-prod
```

### Mongo
```
mognod
```

### Troubleshooting
* Is mongo running? i.e. The `mongo` command allows you to connect to your mongo instance
