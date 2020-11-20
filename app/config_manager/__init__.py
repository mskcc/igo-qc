import sys
from flask import request, session

from constants import USER_ID
from app import app
from utils import create_resp
from models import UserConfiguration
import headers
import logger

@app.route('/saveConfig', methods=['POST'])
def save_config():
    try:
        type = request.json['type']
        value = request.json['value']
    except KeyError:
        return create_resp(False, "Requests should contain 'type' and 'value'", None)
    if not is_valid_config(type,value):
        return create_resp(False, "Invalid update format", None)
    user = None if USER_ID not in session else session[USER_ID]
    if not user:
        return create_resp(False, "Error updating config", None)
    existing_configuration = get_user_configuration_object(user)
    if existing_configuration:
        config = existing_configuration.get_config()
        logger.info('Updating config for %s: %s. Update: %s:%s' % (user, str(config), type, str(value)))
        config[type] = value
        existing_configuration.update(config=config)
        logger.info("Updated: %s" % (existing_configuration.get_config()))
    else:
        config = { type: value }
        logger.info('Creating config for %s: %s' % (user, str(config)))
        new_configuration = UserConfiguration(user=user, config=config).save()
        logger.info("Saved: %s" % (new_configuration.get_config()))
    return create_resp(True, 'Saved Configuration', 'Successfully saved configurations' )

def is_valid_config(type, value):
    if type and type in ["wgs", "hs", "rna", "md", "default"]:
        if isinstance(value, list):
            return True
    return False

def get_user_configuration_object(user):
    query = UserConfiguration.objects(user=user)
    if query.count() == 1:
        # user should be unique and only one document should be returned
        return query.first()
    elif query.count() > 1:
        logger.error("Query of UserConfiguration on user: %s returned more than one entry" % user)
        return None
    else:
        return None

