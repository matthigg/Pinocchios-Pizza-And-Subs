# Generated by Django 2.0.3 on 2019-02-24 01:04

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Salads',
            new_name='Salad',
        ),
        migrations.RenameModel(
            old_name='Subs',
            new_name='Sub',
        ),
    ]
