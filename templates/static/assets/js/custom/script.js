// Variáveis globais
let etapaAtual = 1;
const totalEtapas = 6;
let dadosFormulario = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Se está na página de sucesso, limpa localStorage
    if (window.location.pathname === '/sucesso/') {
        localStorage.removeItem('formulario-cras-dados');
    }
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
            // Não tentar preencher campos do tipo file
            if (elemento.type === 'file') return;
            elemento.value = dadosFormulario[campo];
        }
    });
}

// Configurar event listeners
function configurarEventListeners() {
    // Botões de navegação
    const btnAnterior = document.getElementById('btn-anterior');
    if (btnAnterior) btnAnterior.addEventListener('click', etapaAnterior);
    const btnProximo = document.getElementById('btn-proximo');
    if (btnProximo) btnProximo.addEventListener('click', proximaEtapa);
    
    // Botão limpar formulário
    const btnLimpar = document.getElementById('btn-limpar');
    if (btnLimpar) btnLimpar.addEventListener('click', limparFormulario);
    
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
    const campoCPF = document.getElementById('cpf');
    if (campoCPF) {
        campoCPF.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/\D/g, '');
            if (valor.length <= 11) {
                valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                e.target.value = valor;
            }
        });
    }

    // Formatação do RG
    const campoRG = document.getElementById('rg');
    if (campoRG) {
        campoRG.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/\D/g, '');
            if (valor.length <= 11) {
                // Formato novo: 000.000.000-00 (11 dígitos)
                if (valor.length >= 9) {
                    valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
                } 
                // Formato antigo: 0.000.000 (7 dígitos)
                else if (valor.length >= 4 && valor.length <= 7) {
                    valor = valor.replace(/(\d{1})(\d{3})(\d{0,3})/, '$1.$2.$3');
                }
                // Formatação parcial
                else if (valor.length >= 1 && valor.length <= 3) {
                    // Deixa sem formatação até ter mais dígitos
                }
                e.target.value = valor;
            }
        });
    }

    // Formatação do telefone
    const campoTelefone = document.getElementById('telefone');
    if (campoTelefone) {
        campoTelefone.addEventListener('input', function(e) {
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

    // Formatação da renda mensal
    const campoRenda = document.getElementById('renda');
    if (campoRenda) {
        campoRenda.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/\D/g, '');
            if (valor.length === 0) {
                e.target.value = '';
                return;
            }
            // Garante pelo menos dois dígitos para centavos
            while (valor.length < 3) {
                valor = '0' + valor;
            }
            let valorNumerico = (parseInt(valor, 10) / 100).toFixed(2);
            e.target.value = parseFloat(valorNumerico).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        });
        campoRenda.addEventListener('focus', function(e) {
            // Remove a formatação para facilitar edição
            let valor = e.target.value.replace(/[^\d]/g, '');
            if (valor.length > 0) {
                e.target.value = (parseInt(valor, 10) / 100).toFixed(2);
            }
        });
        campoRenda.addEventListener('blur', function(e) {
            let valor = e.target.value.replace(/\D/g, '');
            if (valor.length === 0) {
                e.target.value = '';
                return;
            }
            while (valor.length < 3) {
                valor = '0' + valor;
            }
            let valorNumerico = (parseInt(valor, 10) / 100).toFixed(2);
            e.target.value = parseFloat(valorNumerico).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        });
    }
}

// Configurar campos condicionais
function configurarCamposCondicionais() {
    // Campo deficiência
    const campoDeficiente = document.getElementById('deficiente');
    if (campoDeficiente) {
        campoDeficiente.addEventListener('change', function() {
            const campoDeficiencia = document.getElementById('deficiencia');
            if (campoDeficiencia) {
                if (this.value === 'Sim') {
                    campoDeficiencia.disabled = false;
                    campoDeficiencia.required = true;
                } else {
                    campoDeficiencia.disabled = true;
                    campoDeficiencia.required = false;
                    campoDeficiencia.value = '';
                }
            }
        });
    }
    
    // Campo observação do laudo
    const campoLaudo = document.getElementById('laudo');
    if (campoLaudo) {
        campoLaudo.addEventListener('change', function() {
            const campoObservacao = document.getElementById('observacao');
            if (campoObservacao) {
                if (this.value === 'Sim') {
                    campoObservacao.disabled = false;
                    campoObservacao.required = true;
                } else {
                    campoObservacao.disabled = true;
                    campoObservacao.required = false;
                    campoObservacao.value = '';
                }
            }
        });
    }

    // Verificação de PDF no campo observacao
    const campoObservacao = document.getElementById('observacao');
    if (campoObservacao) {
        campoObservacao.addEventListener('change', function() {
            // Remove mensagem de erro anterior
            let msg = campoObservacao.parentElement.querySelector('.custom-error-msg-pdf');
            if (msg) msg.remove();
            let isPdf = true;
            if (campoObservacao.files && campoObservacao.files.length > 0) {
                const file = campoObservacao.files[0];
                if (file.type !== 'application/pdf') {
                    isPdf = false;
                }
            }
            if (!isPdf) {
                campoObservacao.value = '';
                const msg = document.createElement('div');
                msg.className = 'custom-error-msg-pdf text-danger mt-1';
                msg.innerText = 'Só é permitido enviar arquivos PDF.';
                campoObservacao.parentElement.appendChild(msg);
            }
            checarEnvioPermitido();
        });
    }
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
            checarEnvioPermitido();
        });
        campo.addEventListener('input', checarEnvioPermitido);
        campo.addEventListener('change', checarEnvioPermitido);
    });
    checarEnvioPermitido();
}

// Validar campo individual
function validarCampo(campo) {
    const valor = campo.value.trim();
    let valido = true;
    
    // Validações específicas
    if (campo.id === 'cpf') {
        valido = validarCPF(valor);
    } else if (campo.id === 'rg') {
        valido = validarRG(valor);
    } else if (campo.id === 'telefone') {
        valido = validarTelefone(valor);
    } else if (campo.id === 'renda') {
        // Aceitar valor formatado como moeda (ex: 'R$ 1.000,00')
        let valorRenda = valor.replace(/[^\d,\.]/g, ''); // remove tudo exceto dígitos, vírgula e ponto
        valorRenda = valorRenda.replace('.', '').replace(',', '.'); // remove separador de milhar, troca vírgula por ponto
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
        // Remove mensagem customizada se existir
        let msg = campo.parentElement.querySelector('.custom-error-msg');
        if (msg) msg.remove();
    } else {
        campo.classList.remove('is-valid');
        campo.classList.add('is-invalid');
        // Adiciona mensagem customizada se não existir
        let msg = campo.parentElement.querySelector('.custom-error-msg');
        if (!msg) {
            msg = document.createElement('div');
            msg.className = 'custom-error-msg text-danger mt-1';
            msg.innerText = 'Preencha este campo corretamente.';
            campo.parentElement.appendChild(msg);
        }
    }
    return valido;
}

// Habilita/desabilita o botão de envio conforme a validação dos campos obrigatórios
function checarEnvioPermitido() {
    const btnProximo = document.getElementById('btn-proximo');
    let podeEnviar = true;
    if (etapaAtual === totalEtapas) {
        const etapaElement = document.getElementById(`etapa-${etapaAtual}`);
        const camposObrigatorios = etapaElement.querySelectorAll('input[required], select[required]');
        camposObrigatorios.forEach(campo => {
            if (campo.disabled) return;
            if (campo.tagName === 'SELECT') {
                if (!campo.value || campo.value === '' || campo.selectedIndex === 0 || campo.options[campo.selectedIndex].disabled) {
                    podeEnviar = false;
                }
            } else if (campo.type === 'file') {
                if (!campo.files || campo.files.length === 0) {
                    podeEnviar = false;
                }
            } else {
                if (!campo.value || campo.value.trim() === '' || campo.classList.contains('is-invalid')) {
                    podeEnviar = false;
                }
            }
        });
    }
    if (btnProximo) btnProximo.disabled = !podeEnviar;
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

// Validar RG
function validarRG(rg) {
    // Remove caracteres não numéricos
    const apenasNumeros = rg.replace(/\D/g, '');
    
    // Formato antigo: 7 dígitos (0.000.000)
    if (apenasNumeros.length === 7) {
        // Verifica se não são todos os dígitos iguais
        if (/^(\d)\1{6}$/.test(apenasNumeros)) return false;
        return true;
    }
    
    // Formato novo: 11 dígitos (000.000.000-00)
    if (apenasNumeros.length === 11) {
        // Verifica se não são todos os dígitos iguais
        if (/^(\d)\1{10}$/.test(apenasNumeros)) return false;
        return true;
    }
    
    // Se não tem 7 nem 11 dígitos, é inválido
    return false;
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
        if (campoLaudo && campoLaudo.value === 'Sim' && campoObservacao) {
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
        // Última etapa - preparar campo renda para envio
        const campoRenda = document.getElementById('renda');
        if (campoRenda) {
            let valor = campoRenda.value.replace(/[^\d,\.]/g, '');
            valor = valor.replace('.', '').replace(',', '.');
            campoRenda.value = valor;
        }
        // Checagem final antes de enviar
        checarEnvioPermitido();
        const btnProximo = document.getElementById('btn-proximo');
        if (btnProximo && btnProximo.disabled) {
            mostrarErrosValidacao();
            return;
        }
        document.getElementById('formulario-cras').submit();
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
    const elEtapaAtual = document.getElementById('etapa-atual');
    if (elEtapaAtual) elEtapaAtual.textContent = etapaAtual;
    const elTotalEtapas = document.getElementById('total-etapas');
    if (elTotalEtapas) elTotalEtapas.textContent = totalEtapas;

    // Atualizar barra de progresso
    const progresso = (etapaAtual / totalEtapas) * 100;
    const elBarraProgresso = document.getElementById('barra-progresso');
    if (elBarraProgresso) elBarraProgresso.style.width = `${progresso}%`;
    const elProgressoPercent = document.getElementById('progresso-percent');
    if (elProgressoPercent) elProgressoPercent.textContent = Math.round(progresso);
    
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
    
    if (btnAnterior) btnAnterior.disabled = etapaAtual === 1;
    
    if (btnProximo) {
        if (etapaAtual === totalEtapas) {
            btnProximo.innerHTML = '<span class="d-none d-sm-inline">Enviar Informações</span><span class="d-sm-none">Enviar</span><i class="fas fa-clipboard-check ms-2"></i>';
        } else {
            btnProximo.innerHTML = '<span class="d-none d-sm-inline">Próximo</span><span class="d-sm-none">OK</span><i class="fas fa-chevron-right ms-2"></i>';
        }
        checarEnvioPermitido();
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
async function enviarFormulario() {
    // Verificar e renovar token CSRF se necessário
    const tokenValido = await verificarTokenCSRF();
    
    if (!tokenValido) {
        // Se não conseguiu obter token válido, mostrar erro
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            <strong>Erro de segurança!</strong> Não foi possível validar o token de segurança. Por favor, recarregue a página e tente novamente.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container');
        const firstCard = container.querySelector('.card');
        if (firstCard) {
            firstCard.parentNode.insertBefore(alertDiv, firstCard);
            
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 8000);
        }
        return;
    }
    
    // Envio real do formulário
    document.getElementById('formulario-cras').submit();
}

// Função para obter um novo token CSRF
async function obterNovoTokenCSRF() {
    try {
        // Tentar usar o endpoint específico primeiro
        const response = await fetch('/csrf-token/', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.csrf_token) {
                return data.csrf_token;
            }
        } else if (response.status === 429) {
            // Rate limit excedido
            const data = await response.json();
            console.warn('Rate limit excedido:', data.error);
            throw new Error('Muitas tentativas. Aguarde um momento.');
        } else if (response.status === 403) {
            console.warn('Acesso negado ao endpoint CSRF');
            throw new Error('Acesso negado');
        }
        
        // Fallback: obter token da página atual
        const pageResponse = await fetch(window.location.href, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (pageResponse.ok) {
            const text = await pageResponse.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const tokenElement = doc.querySelector('[name=csrfmiddlewaretoken]');
            return tokenElement ? tokenElement.value : null;
        }
    } catch (error) {
        console.warn('Erro ao obter novo token CSRF:', error);
        throw error;
    }
    return null;
}

// Atualizar token CSRF no formulário
async function atualizarTokenCSRF() {
    const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
    if (tokenElement) {
        try {
            const novoToken = await obterNovoTokenCSRF();
            if (novoToken) {
                tokenElement.value = novoToken;
                return { success: true, message: 'Token atualizado com sucesso' };
            }
            return { success: false, message: 'Não foi possível obter novo token' };
        } catch (error) {
            return { 
                success: false, 
                message: error.message || 'Erro ao atualizar token' 
            };
        }
    }
    return { success: false, message: 'Token CSRF não encontrado' };
}

// Limpar formulário e cache com renovação de token CSRF
async function limparFormulario() {
    // Confirmar ação com o usuário
    if (confirm('Tem certeza de que deseja limpar todos os dados do formulário? Esta ação não pode ser desfeita.')) {
        try {
            // Mostrar indicador de carregamento
            const btnLimpar = document.getElementById('btn-limpar');
            const textoOriginal = btnLimpar.innerHTML;
            btnLimpar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i><span class="d-none d-sm-inline">Limpando...</span><span class="d-sm-none">...</span>';
            btnLimpar.disabled = true;
            
            // Limpar localStorage
            localStorage.removeItem('formulario-cras-dados');
            dadosFormulario = {};
            
            // Limpar todos os campos do formulário
            const formulario = document.getElementById('formulario-cras');
            if (formulario) {
                formulario.reset();
            }
            
            // Limpar campos específicos que podem não ser resetados automaticamente
            document.querySelectorAll('input, select, textarea').forEach(campo => {
                // Não limpar o campo CSRF
                if (campo.name === 'csrfmiddlewaretoken') {
                    return;
                }
                
                if (campo.type === 'file') {
                    campo.value = '';
                } else if (campo.type === 'checkbox' || campo.type === 'radio') {
                    campo.checked = false;
                } else {
                    campo.value = '';
                }
                
                // Remover classes de validação
                campo.classList.remove('is-valid', 'is-invalid');
            });
            
            // Desabilitar campos condicionais novamente
            const observacaoField = document.getElementById('observacao');
            const deficienciaField = document.getElementById('deficiencia');
            if (observacaoField) observacaoField.disabled = true;
            if (deficienciaField) deficienciaField.disabled = true;
            
            // Atualizar token CSRF para evitar problema de expiração
            const tokenResult = await atualizarTokenCSRF();
            
            // Voltar para a primeira etapa
            etapaAtual = 1;
            irParaEtapa(1);
            
            // Atualizar interface
            atualizarInterface();
            
            // Restaurar botão
            btnLimpar.innerHTML = textoOriginal;
            btnLimpar.disabled = false;
            
            // Mostrar mensagem de sucesso
            const alertDiv = document.createElement('div');
            if (tokenResult.success) {
                alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
                alertDiv.innerHTML = `
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>Formulário limpo!</strong> Todos os dados foram removidos e o token de segurança foi renovado.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
            } else {
                alertDiv.className = 'alert alert-warning alert-dismissible fade show mt-3';
                alertDiv.innerHTML = `
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Formulário limpo!</strong> Dados removidos, mas ${tokenResult.message}. Recarregue a página se tiver problemas ao enviar.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
            }
            
            // Inserir alerta no início do formulário
            const container = document.querySelector('.container');
            const firstCard = container.querySelector('.card');
            if (firstCard) {
                firstCard.parentNode.insertBefore(alertDiv, firstCard);
                
                // Remover alerta automaticamente após 5 segundos
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.remove();
                    }
                }, 5000);
            }
            
        } catch (error) {
            console.error('Erro ao limpar formulário:', error);
            
            // Restaurar botão em caso de erro
            const btnLimpar = document.getElementById('btn-limpar');
            btnLimpar.innerHTML = '<i class="fas fa-trash-alt me-2"></i><span class="d-none d-sm-inline">Limpar Formulário</span><span class="d-sm-none">Limpar</span>';
            btnLimpar.disabled = false;
            
            // Mostrar mensagem de erro
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-warning alert-dismissible fade show mt-3';
            alertDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Atenção!</strong> O formulário foi limpo, mas houve um problema ao renovar o token de segurança. Recarregue a página se tiver problemas ao enviar.
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            const container = document.querySelector('.container');
            const firstCard = container.querySelector('.card');
            if (firstCard) {
                firstCard.parentNode.insertBefore(alertDiv, firstCard);
                
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.remove();
                    }
                }, 8000);
            }
        }
    }
}

// Verificar e renovar token CSRF se necessário antes do envio
async function verificarTokenCSRF() {
    const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
    if (!tokenElement || !tokenElement.value) {
        // Se não há token ou está vazio, tentar obter um novo
        return await atualizarTokenCSRF();
    }
    return true;
}
