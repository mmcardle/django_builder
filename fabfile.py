from __future__ import with_statement
from fabric.context_managers import shell_env
from fabric.api import run, env, cd

__author__ = 'mm'

env.hosts = ['mmcardle@mmcardle.webfactional.com']
code_dir = '/home/mmcardle/webapps/django_builder/builder'
apache_bin = '/home/mmcardle/webapps/django_builder/apache2/bin/restart'


def git_pull():
    run("git pull")


def django_command(command):
    run("python2.7 ./manage.py %s --noinput" % command)


def apache_restart():
    run(apache_bin)


def deploy():
    with cd(code_dir), shell_env(DJANGO_CONFIGURATION='Prod'):
        git_pull()
        django_command('collectstatic')
        django_command('syncdb')
        django_command('migrate')
    apache_restart()

