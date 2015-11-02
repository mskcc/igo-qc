from flask import Flask, render_template
import requests
import json
app = Flask(__name__)

@app.route('/')
def data_table():
    r = requests.get("https://toro.cbio.mskcc.org:8443/LimsRest/getProjectQc?project=06159", auth=("user","81892f87-8730-405b-a220-e64455482c4b"), verify=False)
    samples = json.loads(r.content)
    samples = samples['samples']
    print samples
    return render_template("data_table.html", **locals())

if __name__ == '__main__':
        app.run(debug=True, host="haystack.mskcc.org", port=5600)
