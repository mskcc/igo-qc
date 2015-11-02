from flask import Flask, render_template
import requests
import json
app = Flask(__name__)
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.poolmanager import PoolManager
import ssl

class MyAdapter(HTTPAdapter):
    def init_poolmanager(self, connections, maxsize, block=False):
        self.poolmanager = PoolManager(num_pools=connections,
                maxsize=maxsize,
                block=block,
                ssl_version=ssl.PROTOCOL_SSLv3)

s = requests.Session()
s.mount('https://', MyAdapter())

@app.route('/')
def data_table():
    #get the content, turning off SSL_VERIFY_CERTIFICATE and supplying username/pass
    r = s.get("https://toro.cbio.mskcc.org:8443/LimsRest/getProjectQc?project=06159", auth=("user","81892f87-8730-405b-a220-e64455482c4b"), verify=False)
    #turn the json content (the body of the html reply) into a python dictionary/list object
    samples = json.loads(r.content)
    #select the subset of the python dictionary that corresponds to what we want to display
    samples = samples['samples']
    #print samples
    #pass it to templates/data_table.html to render with jinja templates
    return render_template("data_table.html", **locals())

if __name__ == '__main__':
    app.run(debug=True, host="localhost", port=5600)
