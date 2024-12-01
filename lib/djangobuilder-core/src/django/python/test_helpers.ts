export const template = `
import random
import string
import uuid

from datetime import timedelta, time
from django.contrib.auth.models import User
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import AbstractBaseUser
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from datetime import datetime
from psycopg2.extras import NumericRange, DateTimeTZRange, DateRange

{{#project.apps}}
from {{name}} import models as {{name}}_models
{{/project.apps}}


def random_string(length=10):
    # Create a random string of length length
    letters = string.ascii_lowercase
    return "".join(random.choice(letters) for i in range(length))


def create_User(**kwargs):
    defaults = {
        "username": "%s_username" % random_string(5),
        "email": "%s_username@tempurl.com" % random_string(5),
    }
    defaults.update(**kwargs)
    return User.objects.create(**defaults)


def create_AbstractUser(**kwargs):
    defaults = {
        "username": "%s_username" % random_string(5),
        "email": "%s_username@tempurl.com" % random_string(5),
    }
    defaults.update(**kwargs)
    return AbstractUser.objects.create(**defaults)


def create_AbstractBaseUser(**kwargs):
    defaults = {
        "username": "%s_username" % random_string(5),
        "email": "%s_username@tempurl.com" % random_string(5),
    }
    defaults.update(**kwargs)
    return AbstractBaseUser.objects.create(**defaults)


def create_Group(**kwargs):
    defaults = {
        "name": "%s_group" % random_string(5),
    }
    defaults.update(**kwargs)
    return Group.objects.create(**defaults)


def create_ContentType(**kwargs):
    defaults = {
    }
    defaults.update(**kwargs)
    return ContentType.objects.create(**defaults)

{{#project.apps}}
{{#models}}

def create_{{app.name}}_{{name}}(**kwargs):
    defaults = {
        {{#fields}}
        {{{ testHelperCreateDefaultField . 0 }}}
        {{/fields}}
        {{#relationships}}
        {{#isNotManyToMany .}}
        "{{name}}": create_{{{ testHelperCreateDefaultRelationship . }}},
        {{/isNotManyToMany}}
        {{/relationships}}
    }
    defaults.update(**kwargs)
    result = {{app.name}}_models.{{name}}.objects.create(**defaults)
    {{#relationships}}
    {{#isManyToMany .}}
    result.{{name}}.add(create_{{{ testHelperCreateDefaultRelationship . }}})
    {{/isManyToMany}}
    {{/relationships}}
    return result

{{/models}}
{{/project.apps}}
  
`