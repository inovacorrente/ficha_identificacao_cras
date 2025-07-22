from django.shortcuts import render

# Create your views here.


def ficha_view(request):
    """
    Redenrizando a pagina de ficha de identificação do CRAS.
    """
    return render(request, 'ficha/pages/ficha.html')
