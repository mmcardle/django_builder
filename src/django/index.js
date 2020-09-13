
class Django {

  slug_type = 'django.db.models.SlugField'
  auto_types = [
      'django.db.models.AutoField',
      'django.db.models.BigAutoField'
  ]

  constructor() {
    this._metaParams = [
      'abstract'
    ]
    this._fieldTypes = {
      'django.db.models.EmailField': {},
      'django.db.models.TextField': {default_args: 'max_length=100'},
      'django.db.models.CharField': {default_args: 'max_length=30'},
      'django.db.models.SlugField': {},
      'django.db.models.URLField': {},
      'django.db.models.UUIDField': {},
      'django.db.models.DateField': {},
      'django.db.models.DateTimeField': {},
      'django.db.models.AutoField': {default_args: 'primary_key=True'},
      'django.db.models.CommaSeparatedIntegerField': {},
      'django.db.models.BigAutoField': {default_args: 'primary_key=True'},
      'django.db.models.BigIntegerField': {},
      'django.db.models.BooleanField': {},
      'django.db.models.DecimalField': {default_args: 'max_digits=10, decimal_places=2'},
      'django.db.models.DurationField': {},
      'django.db.models.FileField': {default_args: 'upload_to="upload/files/"'},
      'django.db.models.ImageField': {default_args: 'upload_to="upload/images/"'},
      'django.db.models.FilePathField': {},
      'django.db.models.FloatField': {},
      'django.db.models.IntegerField': {},
      'django.db.models.PositiveIntegerField': {},
      'django.db.models.PositiveSmallIntegerField': {},
      'django.db.models.IPAddressField': {},
      'django.db.models.GenericIPAddressField': {},
      'django.db.models.NullBooleanField': {},
      'django.db.models.TimeField': {},
      'django.db.models.BinaryField': {},
      'django.db.models.SmallIntegerField': {},
      'django.contrib.contenttypes.fields.GenericForeignKey': {default_args: '"content_type", "object_id"'},
      'django.contrib.postgres.fields.ArrayField': {default_args: 'models.CharField(max_length=100)'},
      'django.contrib.postgres.fields.CICharField': {default_args: 'max_length=30'},
      'django.contrib.postgres.fields.CIEmailField': {},
      'django.contrib.postgres.fields.CITextField': {},
      'django.contrib.postgres.fields.HStoreField': {},
      'django.contrib.postgres.fields.JSONField': {default_args: 'default=dict'},
      'django.contrib.postgres.fields.ranges.IntegerRangeField': {},
      'django.contrib.postgres.fields.ranges.BigIntegerRangeField': {},
      'django.contrib.postgres.fields.ranges.FloatRangeField': {},
      'django.contrib.postgres.fields.ranges.DateTimeRangeField': {},
      'django.contrib.postgres.fields.ranges.DateRangeField': {},
    }
    this._fieldDefaults = {
      'django.db.models.TextField': '"text"',
      'django.db.models.CharField': '"text"',
      'django.contrib.contenttypes.fields.GenericForeignKey': '',
      'django.contrib.postgres.fields.ArrayField': '[]',
      'django.contrib.postgres.fields.CICharField': '"text"',
      'django.contrib.postgres.fields.CIEmailField': '"user@tempurl.com"',
      'django.contrib.postgres.fields.CITextField': '"text"',
      'django.contrib.postgres.fields.HStoreField': '{}',
      'django.contrib.postgres.fields.JSONField': '{}',
      'django.contrib.postgres.fields.ranges.IntegerRangeField': '1',
      'django.contrib.postgres.fields.ranges.BigIntegerRangeField': '1',
      'django.contrib.postgres.fields.ranges.FloatRangeField': '1.0',
      'django.contrib.postgres.fields.ranges.DateTimeRangeField': '0',
      'django.contrib.postgres.fields.ranges.DateRangeField': '0',
      'django.db.models.CommaSeparatedIntegerField': '1,2,3',
      'django.db.models.BigAutoField': '"sometext"',
      'django.db.models.BigIntegerField': '1',
      'django.db.models.BooleanField': 'true',
      'django.db.models.DateField': 'datetime.now()',
      'django.db.models.DateTimeField': 'datetime.now()',
      'django.db.models.DecimalField': '1.0',
      'django.db.models.DurationField': '1.0',
      'django.db.models.FileField': '"aFile"',
      'django.db.models.ImageField': '"anImage"',
      'django.db.models.FilePathField': '"aFile"',
      'django.db.models.FloatField': '1.0f',
      'django.db.models.IntegerField': '1',
      'django.db.models.PositiveIntegerField': '1',
      'django.db.models.PositiveSmallIntegerField': '1',
      'django.db.models.SlugField': '"slug"',
      'django.db.models.IPAddressField': '"127.0.0.1"',
      'django.db.models.GenericIPAddressField': '"127.0.0.1"',
      'django.db.models.NullBooleanField': 'true',
      'django.db.models.TimeField': '100',
      'django.db.models.BinaryField': "b'bytes'",
      'django.db.models.AutoField': '"auto"',
      'django.db.models.SmallIntegerField': '1',
      'django.db.models.URLField': 'http://127.0.0.1',
      'django.db.models.UUIDField': '"b297a243-b621-4907-8581-e9b3ac146a07"',
      'django.db.models.EmailField': '"user@tempurl.com"'
    }
    this._relationshipTypes = {
      'django.db.models.ForeignKey': {
        default_args: 'on_delete=models.CASCADE'
      },
      'django.db.models.OneToOneField': {},
      'django.db.models.ManyToManyField': {}
    }
    this._relationshipMatches = [
      'ForeignKey',
      'models.ForeignKey',
      'db.models.ForeignKey',
      'OneToOneField',
      'models.OneToOneField',
      'db.models.OneToOneField',
      'ManyToManyField',
      'models.ManyToManyField',
      'db.models.ManyToManyField',
    ]
    this._parentModelTypes = {
      'django.contrib.auth.models.AbstractUser': {
        type: 'django',
        class: 'django.contrib.auth.models.AbstractUser',
      },
      'django.contrib.auth.models.AbstractBaseUser': {
        type: 'django',
        class: 'django.contrib.auth.models.AbstractBaseUser',
      },
    }
    this._builtInModels = {
      'django.contrib.auth.models.User': {
        app: 'auth.User',
        fields: {
          'username': {default:'username'},
          'email': {default:'username@tempurl.com'}
        }
      },
      'django.contrib.auth.models.AbstractUser': {
        app: 'auth.AbstractUser',
        fields: {
          'username': {default:'username'},
          'email': {default:'username@tempurl.com'}
        }
      },
      'django.contrib.auth.models.AbstractBaseUser': {
        app: 'auth.AbstractBaseUser',
        fields: {
          'username': {default:'username'},
          'email': {default:'username@tempurl.com'}
        }
      },
      'django.contrib.auth.models.Group': {
        app: 'auth.Group',
        fields: {
          'name': {default:'group'}
        }
      },
      'django.contrib.contenttypes.models.ContentType': {
        app: 'contenttypes.ContentType',
        fields: {}
      }
    }
  }

  fieldDefault(typ) {
    return this._fieldDefaults[typ]
  }

  builtInModel(kls) {
    return this._builtInModels[kls]
  }

  get fieldTypes() {
    return this._fieldTypes
  }

  get metaParams() {
    return this._metaParams
  }

  get relationshipTypes() {
    return this._relationshipTypes
  }

  get relationshipMatches() {
    return this._relationshipMatches
  }

  get builtInModels() {
    return this._builtInModels
  }

  get parentModelTypes() {
    return this._parentModelTypes
  }

}

const DEFAULT_DJANGO_VERSION = 3;

export { DEFAULT_DJANGO_VERSION }

export default Django
