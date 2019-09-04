#settings.py
import os

# __file__ refers to the file settings.py
APP_ROOT = os.path.dirname(os.path.abspath(__file__))   # refers to application_top
APP_STATIC = os.path.join(APP_ROOT, 'static')
FASTQ_PATH = os.path.join(APP_ROOT, 'static/html/FASTQ/')
URL_PREFIX = 'https://igo.mskcc.org/delivery-qc'
LDAP_URL = "ldaps://ldapha.mskcc.root.mskcc.org/"

#LIMS version
#LIMS_version = 'toro' #development: 'toro' / production: 'igo'
LIMS_version = 'igo'

