export const template = `
import uuid
import pytest
import test_helpers
from psycopg2.extras import NumericRange, DateTimeTZRange, DateRange
from datetime import timedelta, time
from django.urls import reverse


pytestmark = [pytest.mark.django_db]


{{#app.models}}
{{^abstract}}

def tests_{{name}}_list_view(client):
    instance1 = test_helpers.create_{{app.name}}_{{name}}()
    instance2 = test_helpers.create_{{app.name}}_{{name}}()
    url = reverse("{{app.name}}_{{name}}_list")
    response = client.get(url)
    assert response.status_code == 200
    assert str(instance1) in response.content.decode("utf-8")
    assert str(instance2) in response.content.decode("utf-8")


def tests_{{name}}_create_view(client):
    url = reverse("{{app.name}}_{{name}}_create")
    data = {
      {{#fields}}
      {{{ testViewsCreateDefaultField . }}}
      {{/fields}}
      {{#relationships}}
      "{{name}}": test_helpers.create_{{{ testHelperCreateDefaultRelationship . }}}.pk,
      {{/relationships}}
    }
    response = client.post(url, data)
    assert response.status_code == 302


def tests_{{name}}_detail_view(client):
    instance = test_helpers.create_{{app.name}}_{{name}}()
    url = reverse("{{app.name}}_{{name}}_detail", args=[instance.pk, ])
    response = client.get(url)
    assert response.status_code == 200
    assert str(instance) in response.content.decode("utf-8")

    
def tests_{{name}}_update_view(client):
    instance = test_helpers.create_{{app.name}}_{{name}}()
    url = reverse("{{app.name}}_{{name}}_update", args=[instance.pk, ])
    data = {
      {{#fields}}
      {{{ testViewsCreateDefaultField . }}}
      {{/fields}}
      {{#relationships}}
      "{{name}}": test_helpers.create_{{{ testHelperCreateDefaultRelationship . }}}.pk,
      {{/relationships}}
    }
    response = client.post(url, data)
    assert response.status_code == 302
{{/abstract}}
{{/app.models}}
`