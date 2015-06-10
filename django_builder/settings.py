"""
Django settings for project_name project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
from os.path import dirname, abspath, join
from configurations import Configuration


class Base(Configuration):

    PROJECT_DIR = abspath(dirname(__file__))

    DEBUG = True

    # Quick-start development settings - unsuitable for production
    # See https://docs.djangoproject.com/en/1.6/howto/deployment/checklist/

    ADMINS = (
        # ('Your Name', 'your_email@example.com'),
    )

    MANAGERS = ADMINS

    TEMPLATE_DEBUG = True

    SITE_ID = 1

    ALLOWED_HOSTS = []

    # Absolute filesystem path to the directory that will
    # hold user-uploaded files.
    # Example: "/var/www/example.com/media/"
    MEDIA_ROOT = abspath(join(PROJECT_DIR, '..', 'media_root'))

    # URL that handles the media served from MEDIA_ROOT. Make sure to use a
    # trailing slash.
    # Examples: "http://example.com/media/", "http://media.example.com/"
    MEDIA_URL = '/site_media/media/'

    # Absolute path to the directory static files should be collected to.
    # Don't put anything in this directory yourself; store your static files
    # in apps' "static/" subdirectories and in STATICFILES_DIRS.
    # Example: "/var/www/example.com/static/"
    STATIC_ROOT = abspath(join(PROJECT_DIR, '..', 'static_root'))

    # URL prefix for static files.
    # Example: "http://example.com/static/", "http://static.example.com/"
    STATIC_URL = '/site_media/static/'

    # Additional locations of static files
    STATICFILES_DIRS = (
        # Put strings here, like "/home/html/static" or "C:/www/django/static".
        # Always use forward slashes, even on Windows.
        # Don't forget to use absolute paths, not relative paths.
        abspath(join(PROJECT_DIR, 'static')),
        abspath(join(PROJECT_DIR, '..', 'angular', 'app')),
    )

    # List of finder classes that know how to find static files in
    # various locations.
    STATICFILES_FINDERS = (
        'django.contrib.staticfiles.finders.FileSystemFinder',
        'django.contrib.staticfiles.finders.AppDirectoriesFinder',
        'compressor.finders.CompressorFinder',
    )

    # Make this unique, and don't share it with anybody.
    SECRET_KEY = '2(n=3ojff0m(5a)g(g5uslf4e+b=vxjulz%iid+%=s%&uuhcys'

    # List of callables that know how to import templates from various sources.
    TEMPLATE_LOADERS = (
        'django.template.loaders.filesystem.Loader',
        'django.template.loaders.app_directories.Loader',
    )

    TEMPLATE_DIRS = (
        # Put strings here, like "/home/html/django_templates"
        # or "C:/www/django/templates".
        # Always use forward slashes, even on Windows.
        # Don't forget to use absolute paths, not relative paths.
        join(PROJECT_DIR, 'templates'),
    )

    # Application definition

    INSTALLED_APPS = (
        'admin_tools',
        'admin_tools.theming',
        'admin_tools.menu',
        'admin_tools.dashboard',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.sites',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        # Uncomment the next line to enable the admin:
        'django.contrib.admin',
        # Uncomment the next line to enable admin documentation:
        'django.contrib.admindocs',

        # Apps
        'django_extensions',
        'south',
        'crispy_forms',
        'django_static',
        'compressor',

        'builder'
    )

    MIDDLEWARE_CLASSES = (
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
    )

    TEMPLATE_CONTEXT_PROCESSORS = (
        # default template context processors
        'django.contrib.auth.context_processors.auth',
        'django.core.context_processors.debug',
        'django.core.context_processors.i18n',
        'django.core.context_processors.media',
        'django.core.context_processors.static',
        # required by django-admin-tools
        'django.core.context_processors.request',
        'django_builder.context.build_context'
    )

    ROOT_URLCONF = 'django_builder.urls'

    WSGI_APPLICATION = 'django_builder.wsgi.application'

    # Configure App - django_static
    DJANGO_STATIC = True
    DJANGO_STATIC_MEDIA_ROOTS = [PROJECT_DIR]

    # Database
    # https://docs.djangoproject.com/en/1.6/ref/settings/#databases

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': join(PROJECT_DIR, 'django_builder.sqlite3'),
        }
    }

    # Configure Crispy
    CRISPY_TEMPLATE_PACK = 'bootstrap3'

    # Internationalization
    # https://docs.djangoproject.com/en/1.6/topics/i18n/

    LANGUAGE_CODE = 'en-us'

    TIME_ZONE = 'UTC'

    USE_I18N = True

    USE_L10N = True

    USE_TZ = True

    # A sample logging configuration. The only tangible logging
    # performed by this configuration is to send an email to
    # the site admins on every HTTP 500 error when DEBUG=False.
    # See http://docs.djangoproject.com/en/dev/topics/logging for
    # more details on how to customize your logging configuration.
    '''
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'filters': {
            'require_debug_false': {
                '()': 'django.utils.log.RequireDebugFalse'
            }
        },
        'handlers': {
            'mail_admins': {
                'level': 'ERROR',
                'filters': ['require_debug_false'],
                'class': 'django.utils.log.AdminEmailHandler'
            }
        },
        'loggers': {
            'django.request': {
                'handlers': ['mail_admins'],
                'level': 'ERROR',
                'propagate': True,
            },
        }
    }
    '''


class Dev(Base):

    DEBUG = True
    DJANGO_STATIC = not DEBUG

    INSTALLED_APPS = Base.INSTALLED_APPS + (
        "debug_toolbar",
    )

    MIDDLEWARE_CLASSES = Base.MIDDLEWARE_CLASSES + (
        'debug_toolbar.middleware.DebugToolbarMiddleware',
    )

    DEBUG_TOOLBAR_PANELS = [
        'debug_toolbar.panels.versions.VersionsPanel',
        'debug_toolbar.panels.timer.TimerPanel',
        'debug_toolbar.panels.settings.SettingsPanel',
        'debug_toolbar.panels.headers.HeadersPanel',
        'debug_toolbar.panels.request.RequestPanel',
        'debug_toolbar.panels.sql.SQLPanel',
        'debug_toolbar.panels.staticfiles.StaticFilesPanel',
        'debug_toolbar.panels.templates.TemplatesPanel',
        'debug_toolbar.panels.cache.CachePanel',
        'debug_toolbar.panels.signals.SignalsPanel',
        'debug_toolbar.panels.logging.LoggingPanel',
        'debug_toolbar.panels.redirects.RedirectsPanel',
    ]

    DATABASES = {
        'default': {
            # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
            'ENGINE': 'django.db.backends.sqlite3',
            # Or path to database file if using sqlite3.
            'NAME': 'django_builder.sqlite3',
        }
    }


class Prod(Base):
    DEBUG = False
    ALLOWED_HOSTS = ['builder.mmcardle.webfactional.com']