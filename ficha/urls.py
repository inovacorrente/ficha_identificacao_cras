from django.urls import path

from . import views

urlpatterns = [
    path('', views.ficha_view, name='ficha_view'),
]
