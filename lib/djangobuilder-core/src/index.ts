import Renderer from "./rendering";
import DjangoProject, { DjangoApp, DjangoModel } from './api';
import { DjangoVersion } from "./types";

const DEFAULT_DJANGO_VERSION = 4;

export { DEFAULT_DJANGO_VERSION, DjangoProject,  DjangoApp, DjangoModel, DjangoVersion }

type ModelType = {
  type: string;
  class: string;
}

type BuiltInModelType = {
  app: string;
  fields: Record<string, Record<string, string>>;
}


class Django {
  slugType: string;
  autoTypes: Array<string>;
  metaParams: Array<string>;
  fieldTypes: Record<string, Record<string, string>>;
  fieldDefaults: Record<string, string>;
  relationshipTypes: Record<string, Record<string, string>>;
  relationshipMatches: Array<string>;
  parentModelTypes: Record<string, ModelType>;
  builtInModels: Record<string, BuiltInModelType>;

  constructor() {
    this.slugType = 'django.db.models.SlugField'
    this.autoTypes = [
        'django.db.models.AutoField',
        'django.db.models.BigAutoField'
    ]
    this.metaParams = ['abstract']
    this.relationshipTypes = {
      'django.db.models.ForeignKey': {
        default_args: 'on_delete=models.CASCADE'
      },
      'django.db.models.OneToOneField': {
        default_args: 'on_delete=models.CASCADE'
      },
      'django.db.models.ManyToManyField': {}
    }
    this.relationshipMatches = [
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
    this.parentModelTypes = {
      'django.contrib.auth.models.AbstractUser': {
        type: 'django',
        class: 'django.contrib.auth.models.AbstractUser',
      },
      'django.contrib.auth.models.AbstractBaseUser': {
        type: 'django',
        class: 'django.contrib.auth.models.AbstractBaseUser',
      },
    }
    this.builtInModels = {
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
    this.fieldTypes = {
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
      'django.db.models.JSONField': {default_args: 'default=dict'},
      'django.contrib.contenttypes.fields.GenericForeignKey': {default_args: '"content_type", "object_id"'},
      'django.contrib.postgres.fields.ArrayField': {default_args: 'models.CharField(max_length=100)'},
      'django.contrib.postgres.fields.CICharField': {default_args: 'max_length=30'},
      'django.contrib.postgres.fields.CIEmailField': {},
      'django.contrib.postgres.fields.CITextField': {},
      'django.contrib.postgres.fields.HStoreField': {},
      'django.contrib.postgres.fields.ranges.IntegerRangeField': {},
      'django.contrib.postgres.fields.ranges.BigIntegerRangeField': {},
      'django.contrib.postgres.fields.ranges.FloatRangeField': {},
      'django.contrib.postgres.fields.ranges.DateTimeRangeField': {},
      'django.contrib.postgres.fields.ranges.DateRangeField': {},
      'django.contrib.gis.db.GeometryField': {},
      'django.contrib.gis.db.PointField': {},
      'django.contrib.gis.db.LineStringField': {},
      'django.contrib.gis.db.PolygonField': {},
      'django.contrib.gis.db.MultiPointField': {},
      'django.contrib.gis.db.MultiLineStringField': {},
      'django.contrib.gis.db.MultiPolygonField': {},
      'django.contrib.gis.db.GeometryCollectionField': {},
      'django.contrib.gis.db.RasterField': {},
    }
    this.fieldDefaults = {
      'TextField': '"text"',
      'CharField': '"text"',
      'JSONField': '{}',
      'GenericForeignKey': '',
      'ArrayField': '[]',
      'CICharField': '"text"',
      'CIEmailField': '"user@tempurl.com"',
      'CITextField': '"text"',
      'HStoreField': '{}',
      'IntegerRangeField': '1',
      'BigIntegerRangeField': '1',
      'FloatRangeField': '1.0',
      'DateTimeRangeField': '0',
      'DateRangeField': '0',
      'CommaSeparatedIntegerField': '1,2,3',
      'BigAutoField': '"sometext"',
      'BigIntegerField': '1',
      'BooleanField': 'True',
      'DateField': 'datetime.now()',
      'DateTimeField': 'datetime.now()',
      'DecimalField': '1.0',
      'DurationField': '1.0',
      'FileField': '"aFile"',
      'ImageField': '"anImage"',
      'FilePathField': '"aFile"',
      'FloatField': '1.0f',
      'IntegerField': '1',
      'PositiveIntegerField': '1',
      'PositiveSmallIntegerField': '1',
      'SlugField': '"slug"',
      'IPAddressField': '"127.0.0.1"',
      'GenericIPAddressField': '"127.0.0.1"',
      'NullBooleanField': 'True',
      'TimeField': '100',
      'BinaryField': "b'bytes'",
      'AutoField': '"auto"',
      'SmallIntegerField': '1',
      'URLField': 'http://127.0.0.1',
      'UUIDField': '"b297a243-b621-4907-8581-e9b3ac146a07"',
      'EmailField': '"user@tempurl.com"'
    }
  }

  fieldDefault(type: string) {
    return this.fieldDefaults[type]
  }

  builtInModel(klass: string) {
    return this.builtInModels[klass]
  }

}

export { Renderer }

export default Django
