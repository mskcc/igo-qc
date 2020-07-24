from flask import jsonify

def create_resp(success, status, data):
    resp = { 'success': success }
    if status:
        resp['status'] = status
    if data:
        resp['data'] = data
    return jsonify(resp)
