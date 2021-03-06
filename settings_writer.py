import os
import sys

if __name__ == "__main__":
    if(len(sys.argv) < 2):
        print("Specify environment (prod/dev), e.g. 'python3 settings_writer.py prod'")
        sys.exit()

    use_prod_config = (sys.argv[1] == "prod")
    if use_prod_config:
        print("Configuration: PROD")
        # The old seq-qc has *.html files written to its static/html & static/pdf directories. We need to take from here
        APP_ROOT = "'/srv/www/sequencing-qc' # We grab from the files written to the old site's directory"
        URL_PREFIX = "'/run-qc/'"
        TEMPLATE_FOLDER = "'./app/view'"
        STATIC_FOLDER = "'./app/view/static'"
    else:
        print("Configuration: DEV")
        APP_ROOT = "os.path.dirname(os.path.abspath(os.path.dirname( __file__ )))"
        URL_PREFIX = "'http://localhost:9009/'"
        TEMPLATE_FOLDER = "'./templates'"
        STATIC_FOLDER = "'./templates'"

    settings = "import os\n"
    settings += "APP_ROOT=%s\n" % APP_ROOT
    settings += "APP_STATIC=os.path.join(APP_ROOT, 'static')\n"
    settings += "FASTQ_PATH=os.path.join(APP_STATIC, 'html/FASTQ/')\n"
    settings += "LIMS_version='igo'\n"
    settings += "URL_PREFIX=%s\n" % URL_PREFIX
    settings += "STATIC_FOLDER=%s\n" % STATIC_FOLDER
    settings += "TEMPLATE_FOLDER=%s\n" % TEMPLATE_FOLDER

    # Write file
    f = open("./app/settings.py", "w+")
    f.truncate(0)           # Delete file contents
    f.write(settings)
    f.close
