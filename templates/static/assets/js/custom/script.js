// Variáveis globais
let etapaAtual = 1;
const totalEtapas = 6;
let dadosFormulario = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    carregarDadosSalvos();
    configurarEventListeners();
    atualizarInterface();
    configurarValidacaoTempo();
});

// Carregar dados salvos do localStorage
function carregarDadosSalvos() {
    const dadosSalvos = localStorage.getItem('formulario-cras-dados');
    if (dadosSalvos) {
        dadosFormulario = JSON.parse(dadosSalvos);
        preencherFormulario();
    }
}

// Preencher formulário com dados salvos
function preencherFormulario() {
    Object.keys(dadosFormulario).forEach(campo => {
        const elemento = document.getElementById(campo) || document.querySelector(`[name="${campo}"]`);
        if (elemento) {
            elemento.value = dadosFormulario[campo];
        }
    });
}

// Configurar event listeners
function configurarEventListeners() {
    // Botões de navegação
    document.getElementById('btn-anterior').addEventListener('click', etapaAnterior);
    document.getElementById('btn-proximo').addEventListener('click', proximaEtapa);
    
    // Botões de etapa
    document.querySelectorAll('.btn-etapa').forEach(btn => {
        btn.addEventListener('click', function() {
            const etapa = parseInt(this.dataset.etapa);
            irParaEtapa(etapa);
        });
    });
    
    // Campos do formulário
    document.querySelectorAll('input, select, textarea').forEach(campo => {
        campo.addEventListener('input', salvarDados);
        campo.addEventListener('change', salvarDados);
    });
    
    // Formatação de campos específicos
    configurarFormatacao();
    
    // Campos condicionais
    configurarCamposCondicionais();
}

// Configurar formatação de campos
function configurarFormatacao() {
    // Formatação do CPF
    document.getElementById('cpf').addEventListener('input', function(e) {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor.length <= 11) {
            valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            e.target.value = valor;
        }
    });
    
    // Formatação do telefone
    document.getElementById('telefone').addEventListener('input', function(e) {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor.length <= 11) {
            if (valor.length === 11) {
                valor = valor.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (valor.length === 10) {
                valor = valor.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            }
            e.target.value = valor;
        }
    });
}

// Configurar campos condicionais
function configurarCamposCondicionais() {
    // Campo deficiência
    document.getElementById('deficiente').addEventListener('change', function() {
        const campoDeficiencia = document.getElementById('deficiencia');
        if (this.value === 'def-sim') {
            campoDeficiencia.disabled = false;
            campoDeficiencia.required = true;
        } else {
            campoDeficiencia.disabled = true;
            campoDeficiencia.required = false;
            campoDeficiencia.value = '';
        }
    });
    
    // Campo observação do laudo
    document.getElementById('laudo').addEventListener('change', function() {
        const campoObservacao = document.getElementById('observacao');
        if (this.value === 'laudo-sim') {
            campoObservacao.disabled = false;
            campoObservacao.required = true;
        } else {
            campoObservacao.disabled = true;
            campoObservacao.required = false;
            campoObservacao.value = '';
        }
    });
}

// Salvar dados no localStorage
function salvarDados() {
    const formData = new FormData(document.getElementById('formulario-cras'));
    dadosFormulario = {};
    
    for (let [key, value] of formData.entries()) {
        dadosFormulario[key] = value;
    }
    
    localStorage.setItem('formulario-cras-dados', JSON.stringify(dadosFormulario));
}

// Validação em tempo real
function configurarValidacaoTempo() {
    document.querySelectorAll('input[required], select[required]').forEach(campo => {
        campo.addEventListener('blur', function() {
            validarCampo(this);
        });
    });
}

// Validar campo individual
function validarCampo(campo) {
    const valor = campo.value.trim();
    let valido = true;
    
    // Validações específicas
    if (campo.id === 'cpf') {
        valido = validarCPF(valor);
    } else if (campo.id === 'telefone') {
        valido = validarTelefone(valor);
    } else if (campo.id === 'renda') {
        // Permitir vírgula ou ponto como separador decimal
        let valorRenda = valor.replace(',', '.');
        let rendaNum = parseFloat(valorRenda);
        valido = !isNaN(rendaNum) && rendaNum >= 0;
    } else if (campo.id === 'data-emissao') {
        // Validação de data de emissão do RG
        if (!valor) {
            valido = false;
        } else {
            const data = new Date(valor);
            const hoje = new Date();
            const minAno = 1880;
            valido = data.getFullYear() >= minAno && data <= hoje;
        }
    } else if (campo.id === 'observacao') {
        // Se o campo estiver habilitado (não disabled), ele é obrigatório
        if (!campo.disabled) {
            valido = valor !== '';
        } else {
            valido = true;
        }
    } else if (campo.hasAttribute('required')) {
        valido = valor !== '';
    }
    
    // Aplicar classes de validação
    if (valido) {
        campo.classList.remove('is-invalid');
        campo.classList.add('is-valid');
    } else {
        campo.classList.remove('is-valid');
        campo.classList.add('is-invalid');
    }
    
    return valido;
}

// Validar CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

// Validar telefone
function validarTelefone(telefone) {
    const apenasNumeros = telefone.replace(/\D/g, '');
    return apenasNumeros.length === 10 || apenasNumeros.length === 11;
}

// Validar etapa atual
function validarEtapaAtual() {
    const etapaElement = document.getElementById(`etapa-${etapaAtual}`);
    const camposObrigatorios = etapaElement.querySelectorAll('input[required], select[required]');
    let etapaValida = true;

    camposObrigatorios.forEach(campo => {
        if (!validarCampo(campo)) {
            etapaValida = false;
        }
    });

    // Só faz a validação extra se estiver na etapa 6
    if (etapaAtual === 6) {
        const campoLaudo = document.getElementById('laudo');
        const campoObservacao = document.getElementById('observacao');
        if (campoLaudo && campoLaudo.value === 'laudo-sim' && campoObservacao) {
            if (campoObservacao.value.trim() === '') {
                campoObservacao.classList.add('is-invalid');
                etapaValida = false;
            } else {
                campoObservacao.classList.remove('is-invalid');
                campoObservacao.classList.add('is-valid');
            }
        }
    }

    return etapaValida;
}

// Navegar para próxima etapa
function proximaEtapa() {
    if (etapaAtual < totalEtapas) {
        if (validarEtapaAtual()) {
            marcarEtapaCompleta(etapaAtual);
            etapaAtual++;
            atualizarInterface();
        } else {
            mostrarErrosValidacao();
        }
    } else {
        // Última etapa - mostrar resumo
        mostrarResumo();
    }
}

// Navegar para etapa anterior
function etapaAnterior() {
    if (etapaAtual > 1) {
        etapaAtual--;
        atualizarInterface();
    }
}

// Ir para etapa específica
function irParaEtapa(numeroEtapa) {
    if (numeroEtapa <= totalEtapas && numeroEtapa >= 1) {
        etapaAtual = numeroEtapa;
        atualizarInterface();
    }
}

// Marcar etapa como completa
function marcarEtapaCompleta(numeroEtapa) {
    const btnEtapa = document.querySelector(`[data-etapa="${numeroEtapa}"]`);
    if (btnEtapa) {
        btnEtapa.classList.add('completed');
    }
}

// Atualizar interface
function atualizarInterface() {
    // Ocultar todas as etapas
    document.querySelectorAll('.etapa-content').forEach(etapa => {
        etapa.classList.add('d-none');
    });
    
    // Mostrar etapa atual
    const etapaAtualElement = document.getElementById(`etapa-${etapaAtual}`);
    if (etapaAtualElement) {
        etapaAtualElement.classList.remove('d-none');
    }
    
    // Atualizar indicadores
    document.getElementById('etapa-atual').textContent = etapaAtual;
    document.getElementById('total-etapas').textContent = totalEtapas;
    
    // Atualizar barra de progresso
    const progresso = (etapaAtual / totalEtapas) * 100;
    document.getElementById('barra-progresso').style.width = `${progresso}%`;
    document.getElementById('progresso-percent').textContent = Math.round(progresso);
    
    // Atualizar botões de etapa
    document.querySelectorAll('.btn-etapa').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.etapa) === etapaAtual) {
            btn.classList.add('active');
        }
    });
    
    // Atualizar botões de navegação
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');
    
    btnAnterior.disabled = etapaAtual === 1;
    
    if (etapaAtual === totalEtapas) {
        btnProximo.innerHTML = 'Revisar Dados<i class="fas fa-clipboard-check ms-2"></i>';
    } else {
        btnProximo.innerHTML = 'Próximo<i class="fas fa-chevron-right ms-2"></i>';
    }
}

// Mostrar erros de validação
function mostrarErrosValidacao() {
    const etapaElement = document.getElementById(`etapa-${etapaAtual}`);
    etapaElement.classList.add('was-validated');
    
    // Focar no primeiro campo inválido
    const primeiroInvalido = etapaElement.querySelector('.is-invalid, :invalid');
    if (primeiroInvalido) {
        primeiroInvalido.focus();
        primeiroInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Mostrar resumo dos dados
function mostrarResumo() {
    if (!validarEtapaAtual()) {
        mostrarErrosValidacao();
        return;
    }
    
    salvarDados();
    const conteudoResumo = document.getElementById('conteudo-resumo');
    
    // Mapear valores para labels legíveis
    const mapeamentos = {
        sexo: { 'masculino': 'Masculino', 'feminino': 'Feminino', 'outro': 'Outro' },
        'estado-civil': {
            'solteiro': 'Solteiro(a)', 'casado': 'Casado(a)', 'separado': 'Separado(a)',
            'divorciado': 'Divorciado(a)', 'uniao-estavel': 'União Estável', 'viuvo': 'Viúvo(a)'
        },
        'nivel-formacao': {
            'sem-formacao': 'Não Alfabetizado', 'ef-incompleto': 'Fundamental Incompleto',
            'ef-completo': 'Fundamental Completo', 'em-incompleto': 'Ensino Médio Incompleto',
            'em-completo': 'Ensino Médio Completo', 'es-incompleto': 'Ensino Superior Incompleto',
            'es-completo': 'Ensino Superior Completo'
        },
        'beneficio-social': {
            'nao-recebe': 'Nenhum', 'bolsafamilia': 'Bolsa Família', 'bpc': 'BPC',
            'aux-incapacidade-temp': 'Auxílio por Incapacidade Temporária',
            'aux-incapacidade-perm': 'Auxílio por Incapacidade Permanente'
        }
    };
    
    // Gerar HTML do resumo
    let html = `
        <div class="row">
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0"><i class="fas fa-user me-2"></i>Dados Pessoais</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Nome:</strong> ${dadosFormulario.nome || 'Não informado'}</p>
                        <p><strong>Telefone:</strong> ${dadosFormulario.telefone || 'Não informado'}</p>
                        <p><strong>Data de Nascimento:</strong> ${formatarData(dadosFormulario['data-nascimento'])}</p>
                        <p><strong>Sexo:</strong> ${mapeamentos.sexo[dadosFormulario.sexo] || 'Não informado'}</p>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="fas fa-id-card me-2"></i>Documentação</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>CPF:</strong> ${dadosFormulario.cpf || 'Não informado'}</p>
                        <p><strong>Data Emissão RG:</strong> ${formatarData(dadosFormulario['data-emissao'])}</p>
                        <p><strong>Órgão Emissor:</strong> ${dadosFormulario['orgao-emissor'] || 'Não informado'}</p>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header bg-warning text-dark">
                        <h6 class="mb-0"><i class="fas fa-map-marker-alt me-2"></i>Endereço</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Endereço:</strong> ${dadosFormulario.endereco || 'Não informado'}</p>
                        <p><strong>Bairro:</strong> ${dadosFormulario.bairro || 'Não informado'}</p>
                        <p><strong>Referência:</strong> ${dadosFormulario.referencia || 'Não informado'}</p>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0"><i class="fas fa-users me-2"></i>Informações Familiares</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Estado Civil:</strong> ${mapeamentos['estado-civil'][dadosFormulario['estado-civil']] || 'Não informado'}</p>
                        <p><strong>Nome da Mãe:</strong> ${dadosFormulario.mae || 'Não informado'}</p>
                        <p><strong>Nome do Pai:</strong> ${dadosFormulario.pai || 'Não informado'}</p>
                        <p><strong>Nível de Formação:</strong> ${mapeamentos['nivel-formacao'][dadosFormulario['nivel-formacao']] || 'Não informado'}</p>
                        <p><strong>Profissão:</strong> ${dadosFormulario.profissao || 'Não informado'}</p>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header bg-secondary text-white">
                        <h6 class="mb-0"><i class="fas fa-chart-line me-2"></i>Situação Socioeconômica</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Renda:</strong> ${formatarRenda(dadosFormulario.renda)}</p>
                        <p><strong>Possui Deficiência:</strong> ${dadosFormulario.deficiente === 'def-sim' ? 'Sim' : 'Não'}</p>
                        <p><strong>Qual Deficiência:</strong> ${dadosFormulario.deficiencia || 'Não informado'}</p>
                        <p><strong>CAD ÚNICO:</strong> ${dadosFormulario['familia-cad-unico'] === 'fam-sim' ? 'Sim' : 'Não'}</p>
                        <p><strong>Benefício Social:</strong> ${mapeamentos['beneficio-social'][dadosFormulario['beneficio-social']] || 'Não informado'}</p>
                        <p><strong>Aposentado:</strong> ${dadosFormulario.aposentadoria === 'aposentado' ? 'Sim' : 'Não'}</p>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header bg-dark text-white">
                        <h6 class="mb-0"><i class="fas fa-certificate me-2"></i>Benefícios e Documentos</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Passe Inter-municipal:</strong> ${dadosFormulario['passe-intermunicipal'] === 'pim-sim' ? 'Sim' : 'Não'}</p>
                        <p><strong>Passe Inter-estadual:</strong> ${dadosFormulario['passe-interestadual'] === 'pie-sim' ? 'Sim' : 'Não'}</p>
                        <p><strong>Carteira de Autista:</strong> ${dadosFormulario['carteira-autista'] === 'carteira-autista-sim' ? 'Sim' : 'Não'}</p>
                        <p><strong>Laudo Médico:</strong> ${dadosFormulario.laudo === 'laudo-sim' ? 'Sim' : 'Não'}</p>
                        <p><strong>Observações do Laudo:</strong> ${dadosFormulario.observacao || 'Não informado'}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Atenção:</strong> Após enviar o formulário, você não poderá mais editar as informações. 
            Certifique-se de que todos os dados estão corretos antes de prosseguir.
        </div>
    `;
    
    conteudoResumo.innerHTML = html;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalResumo'));
    modal.show();
}

// Formatar data
function formatarData(data) {
    if (!data) return 'Não informado';
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
}

// Formatar renda
function formatarRenda(renda) {
    if (!renda) return 'R$ 0,00';
    return `R$ ${parseFloat(renda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// Baixar dados
function baixarDados() {
    const dadosFormatados = {
        ...dadosFormulario,
        dataPreenchimento: new Date().toISOString(),
        versaoFormulario: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(dadosFormatados, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ficha-cras-${dadosFormulario.nome?.replace(/\s+/g, '-').toLowerCase() || 'dados'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Enviar formulário
function enviarFormulario() {
    // Simular envio
    const btnEnviar = document.querySelector('[onclick="enviarFormulario()"]');
    const textoOriginal = btnEnviar.innerHTML;
    
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
    
    setTimeout(() => {
        // Fechar modal de resumo
        const modalResumo = bootstrap.Modal.getInstance(document.getElementById('modalResumo'));
        modalResumo.hide();
        
        // Mostrar modal de sucesso
        const modalSucesso = new bootstrap.Modal(document.getElementById('modalSucesso'));
        modalSucesso.show();
        
        // Limpar dados salvos
        localStorage.removeItem('formulario-cras-dados');
        
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginal;
    }, 2000);
}

