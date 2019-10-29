import os
APP_ROOT='/srv/www/sequencing-qc' # We grab from the files written to the old site's directory
APP_STATIC=os.path.join(APP_ROOT, 'static')
FASTQ_PATH=os.path.join(APP_STATIC, 'html/FASTQ/')
LIMS_version='igo'