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

    // Formatação da renda mensal
    const campoRenda = document.getElementById('renda');
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

// Configurar campos condicionais
function configurarCamposCondicionais() {
    // Campo deficiência
    document.getElementById('deficiente').addEventListener('change', function() {
        const campoDeficiencia = document.getElementById('deficiencia');
        if (this.value === 'Sim') {
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
        if (this.value === 'Sim') {
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
    // Envio real do formulário
    document.getElementById('formulario-cras').submit();
}

