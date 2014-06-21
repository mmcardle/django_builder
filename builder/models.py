from django.db import models
from django.core.urlresolvers import reverse
from django_extensions.db.fields import AutoSlugField


class AModel(models.Model):
    name = models.CharField(max_length=255)
    slug = AutoSlugField(
        populate_from='name',
        blank=True,
        editable=True,
        )

    created = models.DateTimeField(auto_now_add=True, editable=False)
    last_updated = models.DateTimeField(auto_now=True, editable=False)

    class Meta:
        ordering = ('-created', )

    def __unicode__(self):
        return self.slug

    def get_absolute_url(self):
        return reverse('builder_amodel_detail', args=(self.slug, ))

    def get_update_url(self):
        return reverse('builder_amodel_update', args=(self.slug, ))

