import os
import sys

if __name__ == "__main__":
    if(len(sys.argv) < 2):
        print("Specify environment (prod/dev), e.g. 'python3 settings_writer.py prod'")
        sys.exit()

    use_prod_config = (sys.argv[1] == "prod")
    APP_ROOT = os.path.dirname(os.path.abspath(__file__))   # refers to application_top
    if use_prod_config:
        print("Configuration: PROD")
        # The old seq-qc has *.html files written to its static/html & static/pdf directories. We need to take from here
        APP_STATIC = "/srv/www/sequencing-qc/static"
    else:
        print("Configuration: DEV")
        APP_STATIC = os.path.join(APP_ROOT, 'static')
    FASTQ_PATH = os.path.join(APP_STATIC, 'html/FASTQ/')
    LIMS_version = 'igo'

    settings = "import os\nAPP_ROOT = '%s'\nAPP_STATIC = '%s'\nFASTQ_PATH = '%s'\nLIMS_version = '%s'" \
        % (APP_ROOT, APP_STATIC, FASTQ_PATH, LIMS_version)

    # Write file
    f = open("./settings.py", "r+")
    f.truncate(0)           # Delete file contents
    f.write(settings)
    f.close
