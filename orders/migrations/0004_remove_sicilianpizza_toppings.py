# Generated by Django 2.0.3 on 2019-02-24 02:07

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_remove_regularpizza_toppings'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='sicilianpizza',
            name='toppings',
        ),
    ]
