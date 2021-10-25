# igo-qc

## Contents
* [Description](#description)
* [Development Steps](#development-notes)
* [Deployment Steps](#deployment-steps)

## Description
Site displaying run statistics of sequencing projects (E.g. GATK Picard, Cell Ranger, etc.). 

### Features
* Pulls data from LIMS and ngs-stats to visualize in grid and graphs
* Allows users to reset qc-status of runs

## Development Notes
After setting up `Frontend`, `Backend`, & `Mongo`, the igo-qc app should be available at `localhost:3000`

### Frontend
```
cd static/seq-qc/
npm install && npm run start
```

### Backend
1. Update `lims_user_config_prod` with what is available on dev/prod. We need the values for `username`, `password`, & `secret_key`. Note - This is copied into `lims_user_config` on `make run-prod`. On the host, see `/srv/www/new-igo-qc/app/lims_user_config`. 

    ```
    scp igo.mskcc.org:/srv/www/new-igo-qc/app/lims_user_config lims_user_config_prod
    ```

2. Install virtual environment

    *Python 2*
    ```
    # pip install virtualenv	# If not already installed
    $ virtualenv venv
    ```
    *Python 3*
    ```
    # pip3 install virtualenv	# If not already installed
    python3 -m venv venv
    ```

3. Install Dependencies
    ```
    $ source venv/bin/activate
    (venv) $ pip install -r requirements.txt
    (venv) $ make run
    ```

    Note - `make run-prod` is a `Makefile` command. If there are issues w/ this step, please review the `run-prod` step of the [Makefile](https://github.com/mskcc/igo-qc/blob/master/Makefile) 

### Mongo
```
WRITE_DATA_HERE=...
mognod --dbpath=${WRITE_DATA_HERE}
```

### Troubleshooting
#### Mongo
* Is mongo running? i.e. The `mongo` command allows you to connect to your mongo instance. If mongo is running, you should see something like below -
```
$ ps -ef | grep mongo
1774903000 39995 39879   0 12:40PM ttys001    0:00.75 /Users/streidd/data/mongodb-macos-x86_64-4.2.1/bin/mongod --dbpath=/Users/streidd/data/db
```

* Do you have write access to the directory specified in `--dbpath=`?
```
$ ls -ltr /Users/streidd/data | grep db
drwxr-xr-x     73 streidd  MSKCC\Domain Users      2336 Oct 25 12:40 db
```

## Deployment Steps
```
HOST=igo.mskcc.org      # for development, HOST=dlviigoweb1
make HOST=${HOST} deploy
```

Notes:
* This creates and copies a `dist` directory to the `deployments` directory in your home on the `HOST` specified. Make sure your `~/deployments` exists on that `HOST`!
* `make deploy` is a `Makefile` command. If there are issues w/ this step, please review the `deploy` step of the [Makefile](https://github.com/mskcc/igo-qc/blob/master/Makefile)
* This *DELETES* the existing application ON THE HOST SPECIFIED. It then copies the packaged application created locally to the new location.
* Expect to enter your password four times - once to `scp` the packaged application, once to remotely send the install command, and twice to run `dzdo` remotely (`dzdo` allows for root access on our VM's and is needed so you can re-deploy if another user was the last to deploy) 
