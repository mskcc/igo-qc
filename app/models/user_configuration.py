from mongoengine import Document, StringField, DictField

class UserConfiguration(Document):
    user = StringField(max_length=16, required=True, unique=True)
    '''
    config: {
        "hs":   ["QC Status", "Sample",...],
        "rna":  ["Concentr.  (nM)", "Final Library Yield (fmol)",...],
        "wgs":  ["Mean Tgt Cvg", "Sum MTC", "Coverage Target",...],
        ...
    }
    '''
    config = DictField()

    def get_config(self):
        return self.config

    '''
    def __repr__(self):
        return "User: %s\tConfig: %s" % (self.user, str(self.config))
    '''


