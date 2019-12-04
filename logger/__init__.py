from app import app
import inspect

def info(msg):
    app.logger.info(format(msg))

def error(msg):
    app.logger.error(format(msg))

def format(msg):
    '''
        inspect.stack(): stack trace
            2: Module - 2 is the index of the module that calls the logger module
                3: Name of Function
    '''
    return ("%s\t(Function: %s)\n" % (str(msg), inspect.stack()[2][3]))
