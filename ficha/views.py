import logging
import time

from django.core.cache import cache
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import redirect, render

from .models import FichaIdentificacao

# Configurar logger de segurança
security_logger = logging.getLogger('security')

# Configurar logger para segurança
security_logger = logging.getLogger('security')


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
            livre_cultura=request.POST.get('livre_cultura', 'Não'),
            laudo=request.POST.get('laudo'),
        )
        # Salva o arquivo PDF enviado em 'observacao', se houver e for PDF
        file_observacao = request.FILES.get('observacao')
        if file_observacao:
            if file_observacao.content_type == 'application/pdf':
                ficha.observacao = file_observacao
            else:
                pass  # Ignora arquivos que não são PDF
        ficha.save()
        print('Ficha salva com sucesso!')
        # Crie uma URL para página de sucesso
        return redirect('ficha_sucesso_view')
    return render(request, 'ficha/pages/ficha.html')


def ficha_sucesso_view(request):
    """
    Renderizando a página de sucesso após o envio da ficha.
    """
    return render(request, 'ficha/pages/sucesso.html')


def obter_csrf_token(request):
    """
    Endpoint para obter um novo token CSRF de forma segura
    Apenas para requisições AJAX autenticadas com rate limiting
    """
    client_ip = request.META.get('REMOTE_ADDR')

    # Rate limiting: máximo 10 requisições por IP por minuto
    cache_key = f"csrf_token_requests_{client_ip}"
    requests_count = cache.get(cache_key, 0)

    if requests_count >= 10:
        security_logger.warning(
            f"Rate limit excedido para IP: {client_ip}. "
            f"Tentativas: {requests_count}"
        )
        return JsonResponse({
            'error': 'Muitas tentativas. Tente novamente em 1 minuto.'
        }, status=429)

    # Incrementar contador de requisições
    cache.set(cache_key, requests_count + 1, 60)  # Expira em 60 segundos

    # Verificar se é uma requisição AJAX
    if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        security_logger.warning(
            f"Tentativa de acesso não-AJAX ao endpoint CSRF de IP: {client_ip}"
        )
        return JsonResponse({'error': 'Acesso negado'}, status=403)

    # Verificar se é um método GET
    if request.method != 'GET':
        security_logger.warning(
            f"Método {request.method} não permitido para CSRF token de IP: "
            f"{client_ip}"
        )
        return JsonResponse({'error': 'Método não permitido'}, status=405)

    # Log da requisição para monitoramento
    user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
    security_logger.info(
        f"Token CSRF solicitado de IP: {client_ip}, "
        f"User-Agent: {user_agent[:100]}, "
        f"Tentativa: {requests_count + 1}"
    )

    # Gerar novo token CSRF
    token = get_token(request)

    return JsonResponse({
        'csrf_token': token,
        'status': 'success',
        'timestamp': int(time.time())
    })
