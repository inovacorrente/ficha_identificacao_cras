

import uuid

from django.db import models

OPTIONS_SEXO = [
    ('Masculino', 'Masculino'),
    ('Feminino', 'Feminino'),
    ('Outro', 'Outro'),
]

OPTIONS_ESTADO_CIVIL = [
    ('Solteiro(a)', 'Solteiro(a)'),
    ('Casado(a)', 'Casado(a)'),
    ('Divorciado(a)', 'Divorciado(a)'),
    ('Viúvo(a)', 'Viúvo(a)'),
    ('União Estável', 'União Estável'),
]

OPTIONS_FORMACAO = [
    ('Ensino Fundamental Incompleto', 'Ensino Fundamental Incompleto'),
    ('Ensino Fundamental Completo', 'Ensino Fundamental Completo'),
    ('Ensino Médio Incompleto', 'Ensino Médio Incompleto'),
    ('Ensino Médio Completo', 'Ensino Médio Completo'),
    ('Ensino Superior Incompleto', 'Ensino Superior Incompleto'),
    ('Ensino Superior Completo', 'Ensino Superior Completo'),
    ('Pós-Graduação Incompleta', 'Pós-Graduação Incompleta'),
    ('Pós-Graduação Completa', 'Pós-Graduação Completa'),
    ('Mestrado Incompleto', 'Mestrado Incompleto'),
    ('Mestrado Completo', 'Mestrado Completo'),
    ('Doutorado Incompleto', 'Doutorado Incompleto'),
    ('Doutorado Completo', 'Doutorado Completo'),
    ('Nenhum', 'Nenhum'),
]

BENEFICIO_SOCIAL_CHOICES = [
    ('Bolsa Família', 'Bolsa Família'),
    ('Auxílio Brasil', 'Auxílio Brasil'),
    ('BPC - Benefício de Prestação Continuada',
     'BPC - Benefício de Prestação Continuada'),
    ('Auxilio por Incapacidade Temporária',
     'Auxilio por Incapacidade Temporária'),

    ('Auxilio por Incapacidade Permanente',
     'Auxilio por Incapacidade Permanente'),
    ('Outro', 'Outro'),
    ('Nenhum', 'Nenhum'),
]

OPTION = [
    ('Sim', 'Sim'),
    ('Não', 'Não'),
]


def laudo_upload_path(instance, filename):
    # Salva o arquivo em laudos/<codigo>/<filename>
    return f"laudos/{instance.codigo}/{filename}"


class FichaIdentificacao(models.Model):

    codigo = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True,
        help_text='Código único da ficha', verbose_name='Código'
    )
    # Etapa 1: Dados Pessoais
    nome = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, blank=True, null=True)
    telefone = models.CharField(max_length=20)
    data_nascimento = models.DateField()
    sexo = models.CharField(max_length=10, choices=OPTIONS_SEXO)

    # Etapa 2: Documentação
    cpf = models.CharField(max_length=14)
    rg = models.CharField(max_length=14, blank=True, null=True)
    data_emissao = models.DateField()
    orgao_emissor = models.CharField(max_length=2)

    # Etapa 3: Endereço
    endereco = models.CharField(max_length=255)
    bairro = models.CharField(max_length=100)
    referencia = models.CharField(max_length=255, blank=True, null=True)

    # Etapa 4: Informações Familiares
    estado_civil = models.CharField(
        max_length=20, choices=OPTIONS_ESTADO_CIVIL)
    mae = models.CharField(max_length=255)
    pai = models.CharField(max_length=255, blank=True, null=True)
    nivel_formacao = models.CharField(
        max_length=50, choices=OPTIONS_FORMACAO, blank=True, null=True)
    profissao = models.CharField(max_length=100, blank=True, null=True)

    # Etapa 5: Situação Socioeconômica
    renda = models.DecimalField(max_digits=10, decimal_places=2)
    deficiente = models.CharField(max_length=10, choices=OPTION)
    deficiencia = models.CharField(max_length=255, blank=True, null=True)
    familia_cad_unico = models.CharField(max_length=10, choices=OPTION)
    beneficio_social = models.CharField(
        max_length=39, choices=BENEFICIO_SOCIAL_CHOICES, blank=True,)
    aposentadoria = models.CharField(max_length=20, choices=OPTION)

    # Etapa 6: Benefícios e Documentos
    passe_intermunicipal = models.CharField(max_length=10, choices=OPTION)
    passe_interestadual = models.CharField(max_length=10, choices=OPTION)
    carteira_autista = models.CharField(max_length=20, choices=OPTION)
    livre_cultura = models.CharField(
        max_length=10, choices=OPTION, default='Não')
    laudo = models.CharField(max_length=10, choices=OPTION)
    observacao = models.FileField(
        upload_to=laudo_upload_path,
        blank=True,
        null=True,
        verbose_name='Observações do Laudo (PDF)'
    )

    def __str__(self):
        return self.nome
