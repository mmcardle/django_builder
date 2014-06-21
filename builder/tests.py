import unittest
from django.core.urlresolvers import reverse
from django.test import Client
from .models import AModel


class AModelViewTest(unittest.TestCase):
    """
    Tests for model AModel"
    """
    def setUp(self):
        self.client = Client()

    def test_list_amodel(self):
        url = reverse('builder_amodel_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_create_amodel(self):
        data = {'name': 'name'}
        url = reverse('builder_amodel_create')
        response = self.client.post(url, data=data)
        self.assertEqual(response.status_code, 302)

    def test_detail_amodel(self):
        amodel = AModel()
        amodel.save()
        url = reverse('builder_amodel_detail',
                      args=[amodel.slug,])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_update_amodel(self):
        amodel = AModel()
        amodel.save()
        data = {'name': 'new_name'}
        url = reverse('builder_amodel_update',
                      args=[amodel.slug,])
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 302)
