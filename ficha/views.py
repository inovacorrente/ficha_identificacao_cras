from django.shortcuts import redirect, render

from .models import FichaIdentificacao


def ficha_view(request):
    """
    Renderizando e salvando a ficha de identificação do CRAS.
    """
    if request.method == 'POST':
        # print('POST recebido! Dados:', request.POST)
        ficha = FichaIdentificacao(
            nome=request.POST.get('nome'),
            email=request.POST.get('email', ''),
            telefone=request.POST.get('telefone'),
            data_nascimento=request.POST.get('data-nascimento'),
            sexo=request.POST.get('sexo'),
            cpf=request.POST.get('cpf'),
            rg=request.POST.get('rg', ''),
            data_emissao=request.POST.get('data-emissao'),
            orgao_emissor=request.POST.get('orgao-emissor'),
            endereco=request.POST.get('endereco'),
            bairro=request.POST.get('bairro'),
            referencia=request.POST.get('referencia', ''),
            estado_civil=request.POST.get('estado-civil'),
            mae=request.POST.get('mae'),
            pai=request.POST.get('pai', ''),
            nivel_formacao=request.POST.get('nivel-formacao'),
            profissao=request.POST.get('profissao', ''),
            renda=request.POST.get('renda'),
            deficiente=request.POST.get('deficiente'),
            deficiencia=request.POST.get('deficiencia', ''),
            familia_cad_unico=request.POST.get('familia-cad-unico'),
            beneficio_social=request.POST.get('beneficio-social'),
            aposentadoria=request.POST.get('aposentadoria'),
            passe_intermunicipal=request.POST.get('passe-intermunicipal'),
            passe_interestadual=request.POST.get('passe-interestadual'),
            carteira_autista=request.POST.get('carteira-autista'),
            laudo=request.POST.get('laudo'),
            observacao=request.POST.get('observacao', '')
        )
        ficha.save()
        print('Ficha salva com sucesso!')
        # Crie uma URL para página de sucesso
        return redirect('ficha_sucesso_view')
    return render(request, 'ficha/pages/ficha.html')


def ficha_sucesso_view(request):
    """
    """
    return render(request, 'ficha/pages/sucesso.html')
